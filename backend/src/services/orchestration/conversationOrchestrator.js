import {
  loadChildMemory,
  loadScenarioContext,
  loadSession,
} from "./contextBuilder.js";
import { interpretInput } from "./inputInterpreter.js";
import { decidePolicy } from "./policyEngine.js";
import { generateResponse } from "./responseGenerator.js";
import { validateResponse } from "./responseValidator.js";
import {
  addInteraction,
  createSession,
  endSession,
  recordResponse,
  updateSessionAfterTurn,
} from "./sessionTracker.js";
import {
  buildConversationState,
  buildStatePatch,
} from "./stateUpdater.js";

function buildFallbackResponse(action, selectedMenu, customizations, context) {
  const fullMenuList = context.menu.map((item) => item.name).join(", ");
  const joinedCustomizations = customizations?.length
    ? ` with ${customizations.join(", ")}`
    : "";
  const fallbackMessages = {
    greet: "Hi there! What would you like from the western stall today?",
    list_menu: `We have ${fullMenuList}. What would you like?`,
    clarify: "Please tell me which food item you want.",
    ask_customization: "Any changes for that item? You can also say no customisations.",
    offer_add_on: "Would you like a drink or fries with that?",
    confirm_order: `Okay! ${selectedMenu?.name || "Your order"}${joinedCustomizations}. Is that correct?`,
    request_payment: `Please pay when ready for ${selectedMenu?.name || "your order"}${joinedCustomizations}. You can say "I paid" after that.`,
    end: `Great job ordering ${selectedMenu?.name || "your food"}! Here is your food. Enjoy your recess!`,
    suggest_usual: "Do you want your usual order?",
    recall_preference: "Do you want it the usual way?",
    provide_options: "You can choose from the menu items here.",
    prompt_choice: "Would you like Chicken Chop or Spaghetti?",
    model_response: "You can say: I want Chicken Chop please.",
    encourage: "It is okay, take your time.",
    hint: "You can say your order one item at a time.",
    repeat: "Sure, I can repeat that.",
    rephrase: "Let me say that in a simpler way.",
    free_response: "Okay, tell me a bit more and I will help you with your order.",
    handle_silence: "That is okay. Take your time.",
    handle_unavailable: "Sorry, we do not have that item today.",
    handle_invalid: "Please choose something from the menu.",
    follow_up: "Okay, what would you like next?",
  };

  return {
    action,
    message: fallbackMessages[action] || "Can you tell me your order again?",
    hintUsed: ["hint", "model_response"].includes(action),
    orderSummary: {
      item: selectedMenu?.name || "",
      customizations: customizations || [],
    },
    source: "fallback",
  };
}

function findLatestInteractionId(session) {
  const latestInteraction = [...(session.interactions || [])]
    .sort((a, b) => new Date(b.askedAt) - new Date(a.askedAt))[0];
  return latestInteraction?.interactionId || null;
}

function buildSessionStatePatch(state, interpretation, action, metrics = {}) {
  return {
    selectedItem: state.selectedItem,
    selectedCustomizations: state.selectedCustomizations,
    pendingPayment:
      action === "confirm_order" || action === "request_payment"
        ? true
        : action === "end"
          ? false
          : state.awaitingPayment,
    lastAction: action,
    objectiveCompleted: metrics.objectiveCompleted || false,
    hintsUsed: metrics.hintsUsed,
    clarificationCount: metrics.clarificationCount,
    interpretation: {
      intent: interpretation.intent,
      confidence: interpretation.confidence,
      asksMenu: interpretation.asksMenu,
      asksUsual: interpretation.asksUsual,
      paymentDone: interpretation.paymentDone,
    },
  };
}

async function processTurn({
  sessionId,
  userInput = "",
  inputMode = "text",
  includeChildMessage,
  responseTimeMs = 0,
}) {
  const session = loadSession(sessionId);
  const context = loadScenarioContext(session.scenario_id);
  const childMemory = loadChildMemory(
    session.scenario_id,
    session.child_id,
    context.scenario.memoryEnabled,
  );

  if (includeChildMessage) {
    const latestInteractionId = findLatestInteractionId(session);
    if (latestInteractionId) {
      recordResponse({
        interactionId: latestInteractionId,
        responseText: userInput,
        inputMode,
        responseTimeSeconds: Number(responseTimeMs || 0) / 1000,
        usedPrompt: false,
        isSuccessful: false,
      });
    }
  }

  const refreshedSession = includeChildMessage ? loadSession(sessionId) : session;

  const interpretation = await interpretInput({
    childInput: userInput,
    context,
    session: refreshedSession,
    childMemory,
    history: refreshedSession.transcripts,
  });

  const state = buildConversationState({
    session: refreshedSession,
    interpretation,
    childMemory,
  });

  const policy = decidePolicy({
    context,
    session: refreshedSession,
    interpretation,
    state,
    childMemory,
  });

  const statePatch = {
    ...buildStatePatch(state),
    pendingPayment:
      policy.action === "confirm_order" || policy.action === "request_payment"
        ? 1
        : policy.action === "end"
          ? 0
          : state.awaitingPayment
            ? 1
            : 0,
  };

  const llmResponse = await generateResponse({
    context,
    childMemory,
    action: policy.action,
    userInput,
    session: refreshedSession,
    selectedMenu: policy.selectedMenu,
    customizations: statePatch.selectedCustomizations || [],
    interpretation,
  });

  const validated = validateResponse({
    llmResponse,
    expectedAction: policy.action,
    expectedItem: policy.selectedMenu?.name || statePatch.selectedItem || "",
    menu: context.menu,
    fallbackResponse: buildFallbackResponse(
      policy.action,
      policy.selectedMenu,
      statePatch.selectedCustomizations,
      context,
    ),
  });

  const measuredResponseTimeMs = includeChildMessage ? Number(responseTimeMs || 0) : 0;
  const assistantInteractionId = addInteraction({
    sessionId,
    questionText: validated.message,
    action: validated.action,
    metadata: {
      source: validated.source,
      orderSummary: validated.orderSummary,
      interpretation,
      responseTimeMs: measuredResponseTimeMs,
    },
  });

  const successfulFirstAttempt =
    includeChildMessage && !policy.signals.needsClarification && validated.action !== "clarify";
  const objectiveCompleted = Boolean(policy.signals.objectiveCompleted);
  const hintsUsed = (refreshedSession.hints_used || 0) + (validated.hintUsed ? 1 : 0);
  const clarificationCount =
    (refreshedSession.clarification_count || 0) + (policy.signals.needsClarification ? 1 : 0);

  updateSessionAfterTurn({
    sessionId,
    action: validated.action,
    statePatch: buildSessionStatePatch(state, interpretation, validated.action, {
      objectiveCompleted,
      hintsUsed,
      clarificationCount,
    }),
    responseTimeMs: measuredResponseTimeMs,
    objectiveCompleted,
    clarificationIncrement: policy.signals.needsClarification ? 1 : 0,
    hintIncrement: validated.hintUsed ? 1 : 0,
    successfulFirstAttempt,
  });

  if (objectiveCompleted) {
    endSession({ sessionId, xpEarned: 120 });
  }

  const updatedSession = loadSession(sessionId);

  return {
    sessionId,
    interactionId: assistantInteractionId,
    status: objectiveCompleted ? "completed" : "active",
    action: validated.action,
    message: validated.message,
    objectiveCompleted,
    completedObjectiveCount: updatedSession.completedObjectiveCount || 0,
    objectiveProgress: updatedSession.objectiveProgress || [],
    orderSummary: validated.orderSummary,
  };
}

export async function startConversation({ scenarioId, childId, childName }) {
  const sessionId = createSession({ scenarioId, childId, childName });
  const context = loadScenarioContext(scenarioId);
  const result = await processTurn({
    sessionId,
    includeChildMessage: false,
  });

  return {
    sessionId,
    scenario: {
      scenarioId: context.scenario.scenarioId,
      title: context.scenario.title,
      locationName: context.scenario.locationName,
      avatarType: context.scenario.avatarType,
      avatarLabel: context.scenario.avatarLabel,
      avatarImageUrl: context.scenario.avatarImageUrl,
      hintDelaySeconds: context.scenario.hintDelaySeconds,
      objective: context.scenario.objective,
      objectives: context.scenario.objectives || [],
    },
    completedObjectiveCount: 0,
    objectiveProgress: (context.scenario.objectives || []).map((objective) => ({
      objectiveId: objective.objectiveId,
      description: objective.description,
      position: objective.position,
      isChecked: false,
    })),
    messages: [
      {
        speaker: "assistant",
        action: result.action,
        message: result.message,
      },
    ],
  };
}

export async function handleConversationTurn({
  sessionId,
  userInput,
  inputMode = "text",
  responseTimeMs = 0,
}) {
  return processTurn({
    sessionId,
    userInput,
    inputMode,
    includeChildMessage: true,
    responseTimeMs,
  });
}
