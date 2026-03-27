const allowedActions = new Set([
  "greet",
  "list_menu",
  "clarify",
  "follow_up",
  "suggest_usual",
  "confirm_order",
  "request_payment",
  "hint",
  "end",
]);

export function validateResponse({ llmResponse, expectedAction, menu, fallbackResponse }) {
  if (!llmResponse || typeof llmResponse !== "object") {
    return fallbackResponse;
  }

  const action = llmResponse.action;
  const message = typeof llmResponse.message === "string" ? llmResponse.message.trim() : "";

  const menuNames = new Set(menu.map((item) => item.name.toLowerCase()));
  const mentionsUnknownMenu =
    /burger|pizza|rice/i.test(message) && ![...menuNames].some((item) => message.toLowerCase().includes(item));

  if (
    !allowedActions.has(action) ||
    action !== expectedAction ||
    !message ||
    message.length > 220 ||
    mentionsUnknownMenu
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
