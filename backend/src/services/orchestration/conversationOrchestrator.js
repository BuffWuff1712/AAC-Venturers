import { decideNextAction } from "./decisionEngine.js";
import {
  loadChildMemory,
  loadScenarioContext,
  loadSession,
} from "./contextBuilder.js";
import { generateScenarioReply } from "./llmService.js";
import { validateResponse } from "./responseValidator.js";
import {
  appendTranscript,
  createSession,
  updateSessionAfterTurn,
} from "./sessionTracker.js";

export async function startConversation({ scenarioId, childName }) {
  const sessionId = createSession({ scenarioId, childName });
  const context = loadScenarioContext(scenarioId);
  const session = loadSession(sessionId);
  const childMemory = loadChildMemory(
    scenarioId,
    childName,
    context.scenario.memoryEnabled,
  );

  const decision = decideNextAction({
    userInput: "",
    context,
    session,
    childMemory,
  });

  const llmResponse = await generateScenarioReply({
    context,
    childMemory,
    action: decision.action,
    userInput: "",
    session,
    selectedMenu: decision.selectedMenu,
    customizations: decision.statePatch.selectedCustomizations || [],
  });

  const fallbackResponse = {
    action: decision.action,
    message: "Hi there! What would you like from the western stall today?",
    hintUsed: false,
    orderSummary: { item: "", customizations: [] },
    source: "fallback",
  };

  const validated = validateResponse({
    llmResponse,
    expectedAction: decision.action,
    expectedItem: decision.selectedMenu?.name || decision.statePatch.selectedItem || "",
    menu: context.menu,
    fallbackResponse,
  });


  appendTranscript({
    sessionId,
    speaker: "assistant",
    action: validated.action,
    message: validated.message,
    metadata: { source: validated.source },
  });

  updateSessionAfterTurn({
    sessionId,
    action: validated.action,
    userInput: "",
    statePatch: decision.statePatch,
    responseTimeMs: 0,
    objectiveCompleted: false,
    clarificationIncrement: 0,
    hintIncrement: 0,
  });

  return {
    sessionId,
    scenario: context.scenario,
    messages: [
      {
        speaker: "assistant",
        action: validated.action,
        message: validated.message,
      },
    ],
  };
}

export async function handleConversationTurn({ sessionId, userInput }) {
  const startedAt = Date.now();
  const session = loadSession(sessionId);
  const context = loadScenarioContext(session.scenario_id);
  const childMemory = loadChildMemory(
    session.scenario_id,
    session.child_name,
    context.scenario.memoryEnabled,
  );

  appendTranscript({
    sessionId,
    speaker: "child",
    message: userInput,
    metadata: { type: "user_input" },
  });

  const decision = decideNextAction({
    userInput,
    context,
    session,
    childMemory,
  });

  const llmResponse = await generateScenarioReply({
    context,
    childMemory,
    action: decision.action,
    userInput,
    session,
    selectedMenu: decision.selectedMenu,
    customizations: decision.statePatch.selectedCustomizations || [],
  });

  const fallbackResponse = {
    action: decision.action,
    message: "Please tell me your order one more time.",
    hintUsed: decision.action === "hint",
    orderSummary: {
      item: decision.selectedMenu?.name || "",
      customizations: decision.statePatch.selectedCustomizations || [],
    },
    source: "fallback",
  };

  const validated = validateResponse({
    llmResponse,
    expectedAction: decision.action,
    expectedItem: decision.selectedMenu?.name || decision.statePatch.selectedItem || "",
    menu: context.menu,
    fallbackResponse,
  });


  const responseTimeMs = Date.now() - startedAt;

  appendTranscript({
    sessionId,
    speaker: "assistant",
    action: validated.action,
    message: validated.message,
    responseTimeMs,
    metadata: { source: validated.source },
  });

  updateSessionAfterTurn({
    sessionId,
    action: validated.action,
    userInput,
    statePatch: decision.statePatch,
    responseTimeMs,
    objectiveCompleted: decision.signals.objectiveCompleted,
    clarificationIncrement: decision.signals.needsClarification ? 1 : 0,
    hintIncrement: validated.hintUsed ? 1 : 0,
  });

  return {
    status: decision.signals.objectiveCompleted ? "completed" : "active",
    action: validated.action,
    message: validated.message,
    objectiveCompleted: decision.signals.objectiveCompleted,
    orderSummary: validated.orderSummary,
  };
}
