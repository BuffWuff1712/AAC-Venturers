const allowedActions = new Set([
  // Core flow
  "greet",
  "list_menu",
  "clarify",
  "follow_up",
  "confirm_order",
  "request_payment",
  "end",

  // Ordering enhancements
  "ask_quantity",
  "ask_customization",
  "offer_add_on",
  "handle_unavailable",
  "handle_invalid",

  // Personalization
  "suggest_usual",
  "recall_preference",

  // AAC / learning support
  "provide_options",
  "prompt_choice",
  "model_response",
  "encourage",
  "hint",

  // Conversation
  "small_talk",
  "repeat",
  "rephrase",

  // Edge cases
  "handle_silence",
  "handle_confusion",
]);

/**
 * Ensures the generated reply matches the backend-selected action and grounded order facts.
 */
export function validateResponse({ llmResponse, expectedAction, expectedItem, menu, fallbackResponse }) {
  if (!llmResponse || typeof llmResponse !== "object") {
    return fallbackResponse;
  }

  const action = llmResponse.action;
  const message = typeof llmResponse.message === "string" ? llmResponse.message.trim() : "";
  const responseItem = llmResponse.orderSummary?.item || "";
  const requiresItemConsistency = new Set([
    "confirm_order",
    "request_payment",
    "end",
  ]);


  const menuNames = new Set(menu.map((item) => item.name.toLowerCase()));
  const mentionsUnknownMenu =
    /burger|pizza|rice/i.test(message) && ![...menuNames].some((item) => message.toLowerCase().includes(item));

  if (
    !allowedActions.has(action) ||
    action !== expectedAction && action !== "encourage" && action !== "hint" ||
    !message ||
    message.length > 220 ||
    mentionsUnknownMenu
  ) {
    return fallbackResponse;
  }

  if (
    expectedItem &&
    requiresItemConsistency.has(expectedAction) &&
    responseItem &&
    responseItem !== expectedItem
  ) {
    return fallbackResponse;
  }

  if (
    expectedItem &&
    requiresItemConsistency.has(expectedAction) &&
    message &&
    !message.toLowerCase().includes(expectedItem.toLowerCase())
  ) {
    return fallbackResponse;
  }


  return {
    action,
    message,
    hintUsed: Boolean(llmResponse.hintUsed),
    orderSummary: {
      item: llmResponse.orderSummary?.item || "",
      customizations: Array.isArray(llmResponse.orderSummary?.customizations)
        ? llmResponse.orderSummary.customizations
        : [],
    },
    source: "llm",
  };
}
