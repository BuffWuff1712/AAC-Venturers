import { generateScenarioReply } from "./llmService.js";

/**
 * Thin wrapper that keeps response wording generation separate from policy and state logic.
 */
export async function generateResponse({
  context,
  childMemory,
  action,
  userInput,
  session,
  selectedMenu,
  customizations,
  interpretation,
}) {
  return generateScenarioReply({
    context,
    childMemory,
    action,
    userInput,
    session,
    selectedMenu,
    customizations,
    interpretation,
  });
}
