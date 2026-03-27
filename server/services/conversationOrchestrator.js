import { buildContext } from "./contextBuilder.js";
import { decideAction, deriveDecisionState } from "./decisionEngine.js";
import { generateReply } from "./llmService.js";
import { validateResponse } from "./responseValidator.js";
import { updateSessionState } from "./sessionTracker.js";

function loadContext(session = {}, childInput = "") {
  return {
    scenario: session.scenario || {
      name: "Western Stall at school canteen",
      objective: "Order at least one menu item clearly and complete the purchase interaction.",
    },
    menu: session.menu || [],
    memory: session.memory || null,
    history: session.history || [],
    childInput,
  };
}

export async function handleTurn(session = {}, childInput = "") {
  // Step 1: load context from the current session snapshot.
  const loaded = loadContext(session, childInput);

  // Step 2: choose exactly one action in code.
  const decisionState = deriveDecisionState(
    {
      ...session,
      memory: loaded.memory,
    },
    childInput,
  );

  const action = decideAction(decisionState, childInput);

  // Step 3: build prompt context for a future model call.
  const promptContext = buildContext({
    action,
    scenario: loaded.scenario,
    menu: loaded.menu,
    memory: loaded.memory,
    history: loaded.history,
    childInput,
  });

  // Step 4: generate wording from OpenAI, or a mock reply if no API key exists.
  const llmResponse = await generateReply({
    ...promptContext,
    metadata: {
      ...promptContext.metadata,
      orderItem: decisionState.orderItem,
      preferences: decisionState.preferences,
      favouriteOrder: loaded.memory?.favouriteOrder,
    },
  });

  // Step 5: validate the generated payload and apply fallback if needed.
  const validatedResponse = validateResponse(llmResponse, action);

  // Step 6: update the tracked session state.
  const updatedSession = updateSessionState(session, action, childInput, validatedResponse);

  return {
    action,
    context: promptContext,
    response: validatedResponse,
    session: updatedSession,
  };
}
