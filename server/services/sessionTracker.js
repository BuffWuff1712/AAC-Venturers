const MENU_ALIASES = {
  "chicken chop": "Chicken Chop",
  chicken: "Chicken Chop",
  "fish and chips": "Fish and Chips",
  fish: "Fish and Chips",
  spaghetti: "Spaghetti",
};

const PREFERENCE_ALIASES = {
  "no coleslaw": "no coleslaw",
  "without coleslaw": "no coleslaw",
  chilli: "chilli on the side",
  chili: "chilli on the side",
  "chilli on the side": "chilli on the side",
  "extra fries": "extra fries",
};

function normalizeText(text = "") {
  return text.trim().toLowerCase();
}

function extractOrderItem(text = "", currentOrderItem = "") {
  const normalized = normalizeText(text);

  for (const [alias, item] of Object.entries(MENU_ALIASES)) {
    if (normalized.includes(alias)) {
      return item;
    }
  }

  return currentOrderItem || "";
}

function extractPreferences(text = "", existingPreferences = []) {
  const normalized = normalizeText(text);
  const nextPreferences = new Set(existingPreferences);

  Object.entries(PREFERENCE_ALIASES).forEach(([alias, preference]) => {
    if (normalized.includes(alias)) {
      nextPreferences.add(preference);
    }
  });

  return [...nextPreferences];
}

function computeObjectiveProgress(state) {
  if (state.paymentDone) {
    return "completed";
  }

  if (state.orderItem && state.preferences.length) {
    return "ready_for_payment";
  }

  if (state.orderItem) {
    return "item_selected";
  }

  return "starting";
}

export function updateSessionState(session = {}, action, childInput = "", response = {}) {
  const nextState = {
    ...session,
    history: [...(session.history || [])],
  };

  nextState.hasGreeted = session.hasGreeted || action === "greet";
  nextState.orderItem = extractOrderItem(childInput, session.orderItem);
  nextState.preferences = extractPreferences(childInput, session.preferences || []);
  nextState.hintCount = (session.hintCount || 0) + (action === "hint" ? 1 : 0);
  nextState.clarificationCount =
    (session.clarificationCount || 0) + (action === "clarify" ? 1 : 0);

  if (action === "suggest_usual" && !nextState.orderItem && session.memory?.favouriteOrder) {
    nextState.suggestedUsual = session.memory.favouriteOrder;
  }

  if (action === "confirm_order") {
    nextState.readyToConfirm = true;
    nextState.awaitingPayment = true;
  }

  if (action === "request_payment") {
    nextState.awaitingPayment = true;
  }

  if (/paid|pay|here is the money|cash|card|done/i.test(normalizeText(childInput))) {
    nextState.paymentDone = true;
    nextState.awaitingPayment = false;
  }

  if (action === "end") {
    nextState.paymentDone = true;
    nextState.awaitingPayment = false;
  }

  nextState.objectiveProgress = computeObjectiveProgress(nextState);
  nextState.lastAction = action;
  nextState.lastReply = response.replyText || "";
  nextState.silenceSec = 0;
  nextState.history.push(
    { speaker: "child", text: childInput || "" },
    { speaker: "assistant", text: response.replyText || "", action },
  );

  return nextState;
}
