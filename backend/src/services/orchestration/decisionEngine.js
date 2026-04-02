const ACTIONS = [
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
];

const MENU_ALIASES = {
  // Chicken Chop
  "chicken chop": "Chicken Chop",
  chicken: "Chicken Chop",
  "grilled chicken": "Chicken Chop",

  // Fish & Chips
  "fish and chips": "Fish and Chips",
  fish: "Fish and Chips",
  "fried fish": "Fish and Chips",

  // Spaghetti
  spaghetti: "Spaghetti",
  pasta: "Spaghetti",
  "tomato pasta": "Spaghetti",

  // Chicken Cutlet
  "chicken cutlet": "Chicken Cutlet",
  cutlet: "Chicken Cutlet",
  "fried chicken": "Chicken Cutlet",

  // Burger
  burger: "Burger",
  "chicken burger": "Burger",
  "beef burger": "Burger",

  // Fries
  fries: "Fries",
  "french fries": "Fries",
  chips: "Fries",

  // Nuggets
  nuggets: "Nuggets",
  "chicken nuggets": "Nuggets",

  // Sausage Set
  sausage: "Sausage Set",
  "hotdog": "Sausage Set",
  "hot dog": "Sausage Set",

  // Steak
  steak: "Steak",
  "beef steak": "Steak",

  // Mixed Grill
  "mixed grill": "Mixed Grill",
  "combo set": "Mixed Grill",

  // Mac & Cheese
  "mac and cheese": "Mac & Cheese",
  "mac n cheese": "Mac & Cheese",

  // Baked Rice
  "baked rice": "Baked Rice",
  "chicken baked rice": "Baked Rice",

  // Mashed Potato
  "mashed potato": "Mashed Potato",
  mash: "Mashed Potato",

  // Coleslaw
  coleslaw: "Coleslaw",
  salad: "Coleslaw",

  // Drinks (important for add-ons)
  water: "Water",
  drink: "Drink",
  coke: "Coke",
  "soft drink": "Drink",
  juice: "Juice",
};

const PREFERENCE_ALIASES = {

  //
  nope: "no changes",
  "I'm good": "no changes",

  // ❌ Remove items
  "no coleslaw": "no coleslaw",
  "without coleslaw": "no coleslaw",
  "no salad": "no coleslaw",
  "no veggies": "no coleslaw",

  "no fries": "no fries",
  "without fries": "no fries",

  "no sauce": "no sauce",
  "no gravy": "no sauce",

  // 🌶️ Sauce / spice preferences
  chilli: "chilli on the side",
  chili: "chilli on the side",
  "chilli on the side": "chilli on the side",
  "chili on the side": "chilli on the side",

  "less spicy": "less spicy",
  "not spicy": "no spice",
  "no spicy": "no spice",

  "more spicy": "extra spicy",
  "very spicy": "extra spicy",

  // 🍟 Portion changes
  "extra fries": "extra fries",
  "more fries": "extra fries",

  "less fries": "less fries",
  "small fries": "less fries",

  "extra sauce": "extra sauce",
  "more sauce": "extra sauce",

  "less sauce": "less sauce",
  "little sauce": "less sauce",

  // 🍳 Add-ons
  "add egg": "add egg",
  egg: "add egg",

  "add cheese": "add cheese",
  cheese: "add cheese",
  "extra cheese": "extra cheese",

  // 🍗 Meat preferences
  "no chicken skin": "no chicken skin",
  "remove skin": "no chicken skin",

  // 🍝 Cooking style (for pasta etc.)
  "more cooked": "well done",
  "well done": "well done",

  "less cooked": "less cooked",

  // 🧠 AAC-friendly simple phrases
  "no this": "remove item",
  "don't want": "remove item",
  "more": "increase portion",
  "less": "decrease portion",
};

function normalizeText(text = "") {
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
}

function includesAny(text = "", patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
}

function detectOrderItem(text = "", currentOrderItem = "") {
  const normalized = normalizeText(text);

  // Prefer longer aliases first so "fish and chips" beats "fish"
  const sortedAliases = Object.entries(MENU_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, item] of sortedAliases) {
    if (normalized.includes(alias)) {
      return item;
    }
  }

  return currentOrderItem || "";
}

function detectPreferences(text = "", existingPreferences = []) {
  const normalized = normalizeText(text);
  const nextPreferences = new Set(existingPreferences);

  const sortedAliases = Object.entries(PREFERENCE_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, preference] of sortedAliases) {
    if (normalized.includes(alias)) {
      nextPreferences.add(preference);
    }
  }

  return [...nextPreferences];
}

function asksForMenu(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, [
    /\bmenu\b/,
    /what do you have/,
    /what can i order/,
    /show me the menu/,
    /what food do you have/,
    /what are you selling/,
    /what can i eat/,
  ]);
}

function mentionsUsual(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, [
    /\busual\b/,
    /same as last time/,
    /my favourite/,
    /my favorite/,
    /the same one/,
    /same order/,
  ]);
}

function mentionsPaymentDone(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, [
    /\bi paid\b/,
    /payment done/,
    /done paying/,
    /here is the money/,
    /\bpaid cash\b/,
    /\bpaid by card\b/,
    /\bpaynow\b/,
    /\bpaylah\b/,
    /\bpaying now\b/,
  ]);
}

function asksForHelp(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, [
    /\bhelp\b/,
    /i don'?t know/,
    /not sure/,
    /can you help me/,
    /what should i say/,
  ]);
}

function isConfusedInput(text = "") {
  const normalized = normalizeText(text);

  if (!normalized) return false;

  return includesAny(normalized, [
    /\buh\b/,
    /\bum\b/,
    /\bidk\b/,
    /i don'?t know/,
    /anything/,
    /whatever/,
    /not sure/,
  ]);
}

function isUnavailableRequest(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, [
    /do you have pizza/,
    /do you have sushi/,
    /do you have rice bowl/,
    /do you have ice cream/,
  ]);
}

function needsCustomization(orderItem = "", preferences = []) {
  if (!orderItem) return false;
  return preferences.length === 0;
}

function shouldOfferAddOn(orderItem = "", preferences = [], hasAskedAddOn = false) {
  if (!orderItem || hasAskedAddOn) return false;

  const preferenceText = preferences.join(" ");
  const alreadyHasSideOrDrink =
    /fries|drink|coke|juice|water/.test(preferenceText);

  const mains = new Set([
    "Chicken Chop",
    "Fish and Chips",
    "Spaghetti",
    "Chicken Cutlet",
    "Burger",
    "Steak",
    "Mixed Grill",
    "Baked Rice",
    "Mac & Cheese",
    "Sausage Set",
  ]);

  return mains.has(orderItem) && !alreadyHasSideOrDrink;
}

function deriveProgressFlags(state = {}, childInput = "") {
  const normalized = normalizeText(childInput);
  const hasInput = normalized.length > 0;

  return {
    hasInput,
    isSilent: !hasInput,
    asksForHelp: asksForHelp(normalized),
    isConfused: isConfusedInput(normalized),
    asksForMenu: asksForMenu(normalized),
    asksForUsual: mentionsUsual(normalized),
    paymentDone: Boolean(state.paymentDone) || mentionsPaymentDone(normalized),
    unavailableRequest: isUnavailableRequest(normalized),
  };
}

export function deriveDecisionState(state = {}, childInput = "") {
  const baseState = {
    hasGreeted: false,
    orderItem: "",
    preferences: [],
    awaitingPayment: false,
    paymentDone: false,
    hasAskedAddOn: false,
    hasAskedCustomization: false,
    silenceSec: 0,
    memory: {},
    ...state,
  };

  const flags = deriveProgressFlags(baseState, childInput);
  const orderItem = detectOrderItem(childInput, baseState.orderItem);
  const preferences = detectPreferences(childInput, baseState.preferences);

  const readyToConfirm =
    Boolean(orderItem) &&
    (
      preferences.length > 0 ||
      baseState.hasAskedCustomization ||
      flags.asksForUsual
    );

  return {
    ...baseState,
    ...flags,
    orderItem,
    preferences,
    readyToConfirm,
    shouldAskCustomization: needsCustomization(orderItem, preferences),
    shouldOfferAddOn: shouldOfferAddOn(
      orderItem,
      preferences,
      baseState.hasAskedAddOn
    ),
    favouriteOrder: baseState.memory?.favouriteOrder || "",
  };
}

export function decideAction(state = {}, childInput = "") {
  const derivedState = deriveDecisionState(state, childInput);

  if (!derivedState.hasGreeted) {
    return "greet";
  }

  if ((derivedState.silenceSec || 0) > 20) {
    return "handle_silence";
  }

  if (derivedState.paymentDone) {
    return "end";
  }

  if (derivedState.asksForMenu) {
    return "list_menu";
  }

  if (derivedState.asksForHelp) {
    return "provide_options";
  }

  if (derivedState.unavailableRequest) {
    return "handle_unavailable";
  }

  if (
    !derivedState.orderItem &&
    derivedState.favouriteOrder &&
    derivedState.asksForUsual
  ) {
    return "suggest_usual";
  }

  if (!derivedState.orderItem && derivedState.isConfused) {
    return "prompt_choice";
  }

  if (!derivedState.orderItem) {
    return "clarify";
  }

  if (derivedState.shouldAskCustomization) {
    return "ask_customization";
  }

  if (derivedState.shouldOfferAddOn) {
    return "offer_add_on";
  }

  if (derivedState.readyToConfirm && !derivedState.awaitingPayment) {
    return "confirm_order";
  }

  if (derivedState.awaitingPayment) {
    return "request_payment";
  }

  if (derivedState.isConfused) {
    return "rephrase";
  }

  return "follow_up";
}

export function getAllowedActions() {
  return [...ACTIONS];
}

function extractPrototypeCustomizations(text = "", existingCustomizations = []) {
  const normalized = normalizeText(text);
  const nextCustomizations = new Set(existingCustomizations);

  if (normalized.includes("no coleslaw")) {
    nextCustomizations.add("no coleslaw");
  }

  if (normalized.includes("chilli") || normalized.includes("chili")) {
    nextCustomizations.add("chilli on the side");
  }

  if (normalized.includes("extra fries")) {
    nextCustomizations.add("extra fries");
  }

  return [...nextCustomizations];
}

function wantsMenuForPrototype(text = "") {
  const normalized = normalizeText(text);
  return (
    normalized.includes("what do you have") ||
    normalized.includes("what can i order") ||
    normalized.includes("menu")
  );
}

function soundsLikePayment(text = "") {
  const normalized = normalizeText(text);
  return (
    normalized.includes("pay") ||
    normalized.includes("paid") ||
    normalized.includes("cash") ||
    normalized.includes("card") ||
    normalized.includes("paynow") ||
    normalized.includes("paylah") ||
    normalized.includes("thank you")
  );
}

function soundsStuck(text = "") {
  const normalized = normalizeText(text);
  return !normalized || normalized.includes("help") || normalized.includes("don't know") || normalized.includes("idk");
}

export function decideNextAction({ userInput = "", context, session, childMemory }) {
  const selectedItem = detectOrderItem(userInput, session.selected_item || "");
  const selectedCustomizations = extractPrototypeCustomizations(
    userInput,
    session.selectedCustomizations || [],
  );
  const selectedMenu = context.menu.find((item) => item.name === selectedItem);
  const hasGreeting = session.total_turns > 0;

  if (!hasGreeting) {
    return {
      action: "greet",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if ((session.sessionState?.silenceSec || 0) > 20) {
    return {
      action: "hint",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (wantsMenuForPrototype(userInput)) {
    return {
      action: "list_menu",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (!selectedItem && context.scenario.personality === "personable_familiar" && childMemory) {
    const normalized = normalizeText(userInput);
    if (normalized.includes("usual") || normalized.includes("same")) {
      return {
        action: "suggest_usual",
        statePatch: {
          selectedItem,
          selectedCustomizations,
        },
        signals: {
          needsClarification: false,
          objectiveCompleted: false,
        },
        selectedMenu,
      };
    }
  }

  if (!selectedItem && soundsStuck(userInput)) {
    return {
      action: "hint",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (!selectedItem) {
    return {
      action: "clarify",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: true,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (!selectedCustomizations.length) {
    return {
      action: "follow_up",
      statePatch: {
        selectedItem,
        selectedCustomizations,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (!session.pending_payment) {
    return {
      action: "confirm_order",
      statePatch: {
        selectedItem,
        selectedCustomizations,
        pendingPayment: 1,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: false,
      },
      selectedMenu,
    };
  }

  if (soundsLikePayment(userInput)) {
    return {
      action: "end",
      statePatch: {
        selectedItem,
        selectedCustomizations,
        pendingPayment: 0,
      },
      signals: {
        needsClarification: false,
        objectiveCompleted: true,
      },
      selectedMenu,
    };
  }

  return {
    action: "request_payment",
    statePatch: {
      selectedItem,
      selectedCustomizations,
      pendingPayment: 1,
    },
    signals: {
      needsClarification: false,
      objectiveCompleted: false,
    },
    selectedMenu,
  };
}
