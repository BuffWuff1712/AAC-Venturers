import { generateScenarioReply } from "./llmService.js";

/**
 * Returns a deterministic reply for fast, factual actions where LLM creativity is not needed.
 */
function buildDeterministicResponse({ context, childMemory, action, selectedMenu, customizations = [] }) {
  const itemName = selectedMenu?.name || "";
  const visibleCustomizations = customizations.filter((value) => value !== "no customisations");
  const customizationText = visibleCustomizations.length
    ? ` with ${visibleCustomizations.join(", ")}`
    : "";

  const deterministicMessages = {
    list_menu: `We have ${context.menu.map((item) => item.name).join(", ")}. What would you like?`,
    confirm_order: `Okay! ${itemName || "Your order"}${customizationText}. Is that correct?`,
    request_payment: `Please pay when ready for ${itemName || "your order"}. You can say "I paid" after that.`,
    end: `Great job ordering ${itemName || "your food"}! Here is your food. Enjoy your recess!`,
    ask_customization: `Any changes for ${itemName || "that"}? You can also say no customisations.`,
    suggest_usual: `Welcome back! Do you want your usual ${childMemory?.favouriteOrder || itemName || "order"}?`,
  };

  if (!deterministicMessages[action]) {
    return null;
  }

  return {
    action,
    message: deterministicMessages[action],
    hintUsed: false,
    orderSummary: {
      item: itemName,
      customizations,
    },
    source: "deterministic",
  };
}

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
  const deterministicResponse = buildDeterministicResponse({
    context,
    childMemory,
    action,
    selectedMenu,
    customizations,
  });

  if (deterministicResponse) {
    return deterministicResponse;
  }

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
