const ACTIONS = [
  "greet",
  "list_menu",
  "clarify",
  "follow_up",
  "suggest_usual",
  "confirm_order",
  "request_payment",
  "hint",
  "end",
];

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

function detectOrderItem(text = "", currentOrderItem = "") {
  const normalized = normalizeText(text);

  for (const [alias, item] of Object.entries(MENU_ALIASES)) {
    if (normalized.includes(alias)) {
      return item;
    }
  }

  return currentOrderItem || "";
}

function detectPreferences(text = "", existingPreferences = []) {
  const normalized = normalizeText(text);
  const nextPreferences = new Set(existingPreferences);

  Object.entries(PREFERENCE_ALIASES).forEach(([alias, preference]) => {
    if (normalized.includes(alias)) {
      nextPreferences.add(preference);
    }
  });

  return [...nextPreferences];
}

function asksForMenu(text = "") {
  return /(what do you have|what can i order|show me the menu|menu)/i.test(text);
}

function mentionsUsual(text = "") {
  return /(usual|same as last time|my favourite|favorite)/i.test(text);
}

function mentionsPaymentDone(text = "") {
  return /(i paid|paid|cash|card|here is the money|payment done|done paying)/i.test(text);
}

export function deriveDecisionState(state = {}, childInput = "") {
  const orderItem = detectOrderItem(childInput, state.orderItem);
  const preferences = detectPreferences(childInput, state.preferences || []);
  const readyToConfirm =
    Boolean(orderItem) &&
    (state.readyToConfirm === true || preferences.length > 0);

  return {
    ...state,
    orderItem,
    preferences,
    readyToConfirm,
    paymentDone: Boolean(state.paymentDone) || mentionsPaymentDone(childInput),
    asksForMenu: asksForMenu(childInput),
    asksForUsual: mentionsUsual(childInput),
  };
}

export function decideAction(state = {}, childInput = "") {
  const derivedState = deriveDecisionState(state, childInput);

  // The first turn is always a greeting so the flow starts from a known state.
  if (!derivedState.hasGreeted) {
    return "greet";
  }

  if ((derivedState.silenceSec || 0) > 20) {
    return "hint";
  }

  if (derivedState.paymentDone) {
    return "end";
  }

  if (derivedState.asksForMenu) {
    return "list_menu";
  }

  if (!derivedState.orderItem && derivedState.memory?.favouriteOrder && derivedState.asksForUsual) {
    return "suggest_usual";
  }

  if (!derivedState.orderItem) {
    return "clarify";
  }

  if (!derivedState.preferences.length) {
    return "follow_up";
  }

  if (derivedState.awaitingPayment) {
    return "request_payment";
  }

  if (derivedState.readyToConfirm) {
    return "confirm_order";
  }

  return "clarify";
}

export function getAllowedActions() {
  return [...ACTIONS];
}
