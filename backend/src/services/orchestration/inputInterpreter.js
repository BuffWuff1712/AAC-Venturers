import { interpretChildInput } from "./llmService.js";

const ITEM_ALIASES = {
  "chicken chop": "Chicken Chop",
  chicken: "Chicken Chop",
  "grilled chicken": "Chicken Chop",
  "fish and chips": "Fish and Chips",
  fish: "Fish and Chips",
  "fried fish": "Fish and Chips",
  spaghetti: "Spaghetti",
  pasta: "Spaghetti",
  "tomato pasta": "Spaghetti",
  "chicken cutlet": "Chicken Cutlet",
  cutlet: "Chicken Cutlet",
  burger: "Burger",
  fries: "Fries",
  nuggets: "Nuggets",
  sausage: "Sausage Set",
  steak: "Steak",
  "mixed grill": "Mixed Grill",
  "mac and cheese": "Mac & Cheese",
  "mac n cheese": "Mac & Cheese",
  "baked rice": "Baked Rice",
  "mashed potato": "Mashed Potato",
  coleslaw: "Coleslaw",
  water: "Water",
  drink: "Drink",
  coke: "Coke",
  juice: "Juice",
};

const PREFERENCE_ALIASES = {
  "no customisations": "no customisations",
  "no customization": "no customisations",
  "no changes": "no customisations",
  "no coleslaw": "no coleslaw",
  "without coleslaw": "no coleslaw",
  "no fries": "no fries",
  "without fries": "no fries",
  "no sauce": "no sauce",
  "no gravy": "no sauce",
  chilli: "chilli on the side",
  chili: "chilli on the side",
  "chilli on the side": "chilli on the side",
  "chili on the side": "chilli on the side",
  "less spicy": "less spicy",
  "not spicy": "no spice",
  "extra fries": "extra fries",
  "more fries": "extra fries",
  "less fries": "less fries",
  "extra sauce": "extra sauce",
  "less sauce": "less sauce",
  "add egg": "add egg",
  "add cheese": "add cheese",
  "extra cheese": "extra cheese",
  "no chicken skin": "no chicken skin",
  "well done": "well done",
};

/**
 * Lowercases and compresses whitespace so intent and alias checks stay consistent.
 */
function normalizeText(text = "") {
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Maps free-form child text onto the closest known menu item alias.
 */
function detectItem(text = "") {
  const normalized = normalizeText(text);
  const sortedAliases = Object.entries(ITEM_ALIASES).sort((a, b) => b[0].length - a[0].length);

  for (const [alias, item] of sortedAliases) {
    if (normalized.includes(alias)) {
      return item;
    }
  }

  return "";
}

function hasExplicitOrderPhrase(text = "") {
  return /\b(i want|i would like|i'd like|can i have|i will have|i'll have|order|change to|instead|make it|actually)\b/.test(
    normalizeText(text),
  );
}

function refersToCurrentOrder(text = "") {
  return /\b(it|that|this|same one|my order)\b/.test(normalizeText(text));
}

function isCorrectionPhrase(text = "") {
  return /\b(change|instead|actually|different|not that|wrong order|wrong one|go back)\b/.test(
    normalizeText(text),
  );
}

function asksCustomizationOptions(text = "") {
  return /\b(customisations|customizations|changes|options)\b/.test(normalizeText(text));
}

/**
 * Pulls customization preferences out of the child input using normalized alias matching.
 */
function detectPreferences(text = "") {
  const normalized = normalizeText(text);
  const exactAliases = new Set(["no customisations", "no customization", "no changes"]);
  const sortedAliases = Object.entries(PREFERENCE_ALIASES).sort((a, b) => b[0].length - a[0].length);
  const found = new Set();

  for (const [alias, preference] of sortedAliases) {
    const matches = exactAliases.has(alias) ? normalized === alias : normalized.includes(alias);
    if (matches) {
      found.add(preference);
    }
  }

  return [...found];
}

/**
 * Uses lightweight heuristics to classify the child's high-level intent before any LLM help.
 */
function inferIntent(text = "") {
  const normalized = normalizeText(text);

  if (!normalized) return "silence";
  if (/(what do you have|what can i order|show me the menu|menu|what items|which items|what food|what foods)/.test(normalized)) return "ask_menu";
  if (/(usual|same as last time|same order|my favourite|my favorite)/.test(normalized)) return "ask_usual";
  if (/(i paid|paid|cash|card|payment done|done paying|paynow|paylah)/.test(normalized)) return "pay";
  if (/(repeat|say again|again please)/.test(normalized)) return "repeat";
  if (/(what should i say|what can i say|say for me)/.test(normalized)) return "model_phrase";
  if (/(help|i don't know|not sure|can you help me)/.test(normalized)) return "ask_help";
  if (/(yes|yep|yeah|ya|ok|okay|sure|can do)/.test(normalized)) return "affirm";
  if (/(no|nope|nothing|no changes|no customisations|no customization)/.test(normalized)) return "decline_customization";
  if (/(pizza|sushi|rice bowl|ice cream)/.test(normalized)) return "unavailable_request";
  if (detectItem(normalized)) return "place_order";
  if (detectPreferences(normalized).length) return "modify_order";
  if (/(uh|um|idk|anything|whatever)/.test(normalized)) return "confused";
  return "unknown";
}

/**
 * Produces a deterministic structured interpretation when the LLM is unavailable or uncertain.
 */
function buildFallbackInterpretation(childInput, history = [], session = {}) {
  const normalized = normalizeText(childInput);
  const preferences = detectPreferences(childInput);
  const currentSelectedItem = session.selected_item || session.selectedItem || "";
  const lastAction = session.last_action || session.lastAction || "";
  const candidateItem = detectItem(childInput);
  const customizationContext = lastAction === "ask_customization";
  const confirmationContext = ["confirm_order", "request_payment"].includes(lastAction);
  const correctionRequested =
    isCorrectionPhrase(normalized) ||
    (confirmationContext && /^(no|nope|nah|wrong)$/i.test(normalized));
  const customizationOptionsRequested =
    currentSelectedItem &&
    asksCustomizationOptions(normalized) &&
    !preferences.length;
  const item =
    currentSelectedItem &&
    preferences.length &&
    (
      customizationContext ||
      refersToCurrentOrder(normalized) ||
      !hasExplicitOrderPhrase(normalized)
    )
      ? ""
      : candidateItem;

  let intent = inferIntent(childInput);

  if (currentSelectedItem && preferences.length && !item) {
    intent = "modify_order";
  }

  if (correctionRequested) {
    intent = "change_order";
  }

  if (customizationOptionsRequested) {
    intent = "ask_customization_options";
  }

  return {
    intent,
    item,
    preferences,
    confidence: item || preferences.length || intent !== "unknown" ? 0.8 : 0.45,
    asksMenu: intent === "ask_menu",
    asksUsual: intent === "ask_usual",
    asksHelp: intent === "ask_help",
    confused: ["confused", "unknown"].includes(intent),
    paymentDone: intent === "pay",
    repeatRequested: intent === "repeat",
    modelPhraseRequested: intent === "model_phrase",
    unavailableRequest: intent === "unavailable_request",
    affirmative: intent === "affirm",
    declineCustomization: intent === "decline_customization",
    changeOrderRequested: correctionRequested,
    asksCustomizationOptions: customizationOptionsRequested,
    historyLength: history.length,
  };
}

/**
 * Identifies high-confidence cases that do not need a second LLM interpretation pass.
 */
function shouldUseFallbackOnly(interpretation) {
  if (!interpretation) {
    return true;
  }

  const deterministicIntents = new Set([
    "silence",
    "ask_menu",
    "ask_usual",
    "pay",
    "repeat",
    "model_phrase",
    "ask_help",
    "affirm",
    "decline_customization",
    "change_order",
    "ask_customization_options",
    "unavailable_request",
    "place_order",
    "modify_order",
  ]);

  return (
    deterministicIntents.has(interpretation.intent) &&
    Number(interpretation.confidence || 0) >= 0.8
  );
}

/**
 * Combines heuristic parsing with LLM extraction to produce structured meaning for the policy engine.
 */
export async function interpretInput({ childInput, context, session, childMemory, history }) {
  const fallback = buildFallbackInterpretation(childInput, history, session);

  if (shouldUseFallbackOnly(fallback)) {
    return fallback;
  }

  const llmInterpretation = await interpretChildInput({
    childInput,
    context,
    session,
    childMemory,
    history,
    fallbackInterpretation: fallback,
  });

  return {
    ...fallback,
    ...(llmInterpretation || {}),
    item: llmInterpretation?.item || fallback.item,
    preferences: Array.isArray(llmInterpretation?.preferences)
      ? llmInterpretation.preferences
      : fallback.preferences,
  };
}
