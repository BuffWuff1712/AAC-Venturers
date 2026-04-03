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
  appendTranscript,
  createSession,
  updateSessionAfterTurn,
} from "./sessionTracker.js";
import {
  buildConversationState,
  buildSessionStatePatch,
  buildStatePatch,
} from "./stateUpdater.js";

/**
 * Builds a safe fallback reply when the generated response is invalid or unavailable.
 */
function buildFallbackResponse(action, selectedMenu, customizations, context) {
  const fullMenuList = context.menu.map((item) => item.name).join(", ");
  const fallbackMessages = {
    greet: "Hi there! What would you like from the western stall today?",
    list_menu: `We have ${fullMenuList}. What would you like?`,
    clarify: "Please tell me which food item you want.",
    ask_customization: "Any changes for that item?",
    offer_add_on: "Would you like a drink or fries with that?",
    confirm_order: "Okay! Let me confirm your order.",
    request_payment: "Please make payment at the counter.",
    end: "Great job ordering! Enjoy your food.",
    suggest_usual: "Do you want your usual order?",
    recall_preference: "Do you want it the usual way?",
    provide_options: "You can choose from the menu items here.",
    prompt_choice: "Would you like Chicken Chop or Spaghetti?",
    model_response: "You can say: I want Chicken Chop please.",
    encourage: "It is okay, take your time.",
    hint: "You can say your order one item at a time.",
    repeat: "Sure, I can repeat that.",
    rephrase: "Let me say that in a simpler way.",
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

/**
 * Runs one complete backend turn: interpret input, decide policy, generate wording, validate, and persist.
 */
async function processTurn({ sessionId, userInput, includeChildMessage }) {
  const startedAt = Date.now();
  const session = loadSession(sessionId);
  const context = loadScenarioContext(session.scenario_id);
  const childMemory = loadChildMemory(
    session.scenario_id,
    session.child_name,
    context.scenario.memoryEnabled,
  );

  if (includeChildMessage) {
    appendTranscript({
      sessionId,
      speaker: "child",
      message: userInput,
      metadata: { type: "user_input" },
    });
  }

  const interpretation = await interpretInput({
    childInput: userInput,
    context,
    session,
    childMemory,
    history: session.transcripts,
  });

  const state = buildConversationState({
    session,
    interpretation,
    childMemory,
  });

  const policy = decidePolicy({
    context,
    session,
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
    session,
    selectedMenu: policy.selectedMenu,
    customizations: statePatch.selectedCustomizations || [],
    interpretation,
  });

  const fallbackResponse = buildFallbackResponse(
    policy.action,
    policy.selectedMenu,
    statePatch.selectedCustomizations,
    context,
  );

  const validated = validateResponse({
    llmResponse,
    expectedAction: policy.action,
    expectedItem: policy.selectedMenu?.name || statePatch.selectedItem || "",
    menu: context.menu,
    fallbackResponse,
  });

  const responseTimeMs = includeChildMessage ? Date.now() - startedAt : 0;

  appendTranscript({
    sessionId,
    speaker: "assistant",
    action: validated.action,
    message: validated.message,
    responseTimeMs,
    metadata: {
      source: validated.source,
      interpretation,
    },
  });

  updateSessionAfterTurn({
    sessionId,
    action: validated.action,
    userInput,
    statePatch,
    sessionStatePatch: buildSessionStatePatch(state, interpretation, validated.action),
    responseTimeMs,
    objectiveCompleted: policy.signals.objectiveCompleted,
    clarificationIncrement: policy.signals.needsClarification ? 1 : 0,
    hintIncrement: validated.hintUsed ? 1 : 0,
  });

  return {
    status: policy.signals.objectiveCompleted ? "completed" : "active",
    action: validated.action,
    message: validated.message,
    objectiveCompleted: policy.signals.objectiveCompleted,
    orderSummary: validated.orderSummary,
    interpretation,
  };
}

/**
 * Creates a new child session and returns the opening assistant message for the scenario.
 */
export async function startConversation({ scenarioId, childName }) {
  const sessionId = createSession({ scenarioId, childName });
  const context = loadScenarioContext(scenarioId);

  const result = await processTurn({
    sessionId,
    userInput: "",
    includeChildMessage: false,
  });

  return {
    sessionId,
    scenario: context.scenario,
    messages: [
      {
        speaker: "assistant",
        action: result.action,
        message: result.message,
      },
    ],
  };
}

/**
 * Handles a child message for an existing session and returns the next assistant turn.
 */
export async function handleConversationTurn({ sessionId, userInput }) {
  return processTurn({
    sessionId,
    userInput,
    includeChildMessage: true,
  });
}
