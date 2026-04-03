import { decideNextAction } from "./decisionEngine.js";
import {
  loadScenarioContext,
  loadSession,
} from "./contextBuilder.js";
import { generateScenarioReply } from "./llmService.js";
import { validateResponse } from "./responseValidator.js";
import {
  createSession,
  addInteraction,
  recordResponse,
  endSession,
} from "./sessionTracker.js";

export async function startConversation({ scenarioId, childId }) {
  const sessionId = createSession({ scenarioId, childId });
  const context = loadScenarioContext(scenarioId);

  const decision = decideNextAction({
    userInput: "",
    context,
    session: null,
  });

  const llmResponse = await generateScenarioReply({
    context,
    action: decision.action,
    userInput: "",
  });

  const fallbackResponse = {
    action: decision.action,
    message: context.settings?.aiPersonalityPrompt || "Hello, how can I help you?",
    source: "fallback",
  };

  const validated = validateResponse({
    llmResponse,
    expectedAction: decision.action,
    fallbackResponse,
  });

  const interactionId = addInteraction({
    sessionId,
    questionText: "",
    aiResponseText: validated.message,
  });

  return {
    sessionId,
    scenario: context.scenario,
    messages: [
      {
        speaker: "assistant",
        message: validated.message,
      },
    ],
  };
}

export async function handleConversationTurn({ sessionId, userInput, inputMode }) {
  const startedAt = Date.now();
  const session = loadSession(sessionId);
  const context = loadScenarioContext(session.scenarioId);

  const decision = decideNextAction({
    userInput,
    context,
    session,
  });

  const llmResponse = await generateScenarioReply({
    context,
    action: decision.action,
    userInput,
    session,
  });

  const fallbackResponse = {
    action: decision.action,
    message: "I didn't quite understand that. Could you try again?",
    source: "fallback",
  };

  const validated = validateResponse({
    llmResponse,
    expectedAction: decision.action,
    fallbackResponse,
  });

  const responseTimeSeconds = (Date.now() - startedAt) / 1000;

  // Record the interaction
  const interactionId = addInteraction({
    sessionId,
    questionText: validated.message,
  });

  // Record the response
  recordResponse({
    interactionId,
    responseText: userInput,
    inputMode: inputMode || "text",
    responseTimeSeconds,
    usedPrompt: decision.signals?.usedPrompt || false,
    isSuccessful: validated.success || false,
  });

  // Check if session is complete
  if (decision.signals?.sessionComplete) {
    endSession(sessionId, decision.signals?.xpEarned || 0);
  }

  return {
    sessionId,
    status: decision.signals?.sessionComplete ? "completed" : "active",
    message: validated.message,
    sessionComplete: decision.signals?.sessionComplete || false,
    xpEarned: decision.signals?.xpEarned || 0,
  };
}
