import { generateScenarioReply, getCharacterVoice } from "./llmService.js";

/**
 * Returns a deterministic reply for fast, factual actions where LLM creativity is not needed.
 */
function buildDeterministicResponse({
  context,
  childMemory,
  action,
  selectedMenu,
  customizations = [],
  interpretation,
}) {
  const itemName = selectedMenu?.name || "";
  const visibleCustomizations = customizations.filter((value) => value !== "no customisations");
  const customizationText = visibleCustomizations.length
    ? ` with ${visibleCustomizations.join(", ")}`
    : "";
  const availableOptions = (selectedMenu?.customizations || [])
    .filter(Boolean)
    .join(", ");
  const characterVoice = getCharacterVoice(context.scenario);

  const deterministicMessages = {
    list_menu: `${characterVoice.menuLead}! We have ${context.menu.map((item) => item.name).join(", ")}. What would you like?`,
    confirm_order: `Okay! ${itemName || "Your order"}${customizationText}. Is that correct?`,
    request_payment: interpretation?.asksPaymentOptions
      ? `${characterVoice.paymentLead}, you can pay by cash or card for ${itemName || "your order"}${customizationText}.`
      : `${characterVoice.paymentLead}, please pay for ${itemName || "your order"}${customizationText}. Cash or card is okay.`,
    end: `${characterVoice.endLead} ordering ${itemName || "your food"}! Here it is. Enjoy!`,
    ask_customization: interpretation?.asksCustomizationOptions
      ? `For ${itemName || "that"}, you can choose ${availableOptions || "no customisations"}.`
      : `Anything else for ${itemName || "that"}?`,
    suggest_usual: `Welcome back! Do you want your usual ${childMemory?.favouriteOrder || itemName || "order"}?`,
    follow_up: `${characterVoice.followUpLead}. What would you like to change?`,
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
    interpretation,
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
