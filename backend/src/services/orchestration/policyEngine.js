const MAIN_DISHES = new Set([
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

/**
 * Checks whether memory contains a true preference trail for the currently selected item.
 */
function hasRememberedPreferences(favouriteOrder = "", selectedItem = "") {
  if (!favouriteOrder || !selectedItem) {
    return false;
  }

  const [rememberedItem, ...rememberedPreferences] = favouriteOrder
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    rememberedItem.toLowerCase() === selectedItem.toLowerCase() &&
    rememberedPreferences.length > 0
  );
}

/**
 * Detects whether the current customization list already includes an add-on style choice.
 */
function hasAddOn(customizations = []) {
  return customizations.some((preference) =>
    ["extra fries", "add egg", "add cheese", "extra cheese"].includes(preference),
  );
}

/**
 * Chooses the next allowed backend action from interpreted meaning plus the current session state.
 */
export function decidePolicy({ context, session, interpretation, state, childMemory }) {
  const hasGreeting = session.total_turns > 0;
  const selectedMenu = context.menu.find((item) => item.name === state.selectedItem);

  if (!hasGreeting) {
    return { action: "greet", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if ((session.sessionState?.silenceSec || 0) > 20 || interpretation.intent === "silence") {
    return { action: "handle_silence", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (state.orderCompleted) {
    return { action: "end", selectedMenu, signals: { needsClarification: false, objectiveCompleted: true } };
  }

  if (interpretation.repeatRequested) {
    return { action: "repeat", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (interpretation.modelPhraseRequested) {
    return { action: "model_response", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (interpretation.asksHelp) {
    return { action: "provide_options", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (interpretation.asksMenu) {
    return { action: "list_menu", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (interpretation.asksCustomizationOptions && selectedMenu) {
    return {
      action: "ask_customization",
      selectedMenu,
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (interpretation.asksPaymentOptions && state.selectedItem) {
    return {
      action: "request_payment",
      selectedMenu,
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (interpretation.changeOrderRequested) {
    if (interpretation.item) {
      const changedMenu = context.menu.find((item) => item.name === interpretation.item);
      return {
        action: "ask_customization",
        selectedMenu: changedMenu,
        signals: { needsClarification: false, objectiveCompleted: false },
      };
    }

    return {
      action: "follow_up",
      selectedMenu,
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if ((interpretation.addOnRequested || state.addOnRequested) && selectedMenu) {
    return {
      action: "confirm_order",
      selectedMenu,
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if ((interpretation.removedAddOnItem || (interpretation.removedPreferences || []).length) && selectedMenu) {
    return {
      action: "confirm_order",
      selectedMenu,
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (!state.selectedItem && interpretation.unavailableRequest) {
    return { action: "handle_unavailable", selectedMenu, signals: { needsClarification: true, objectiveCompleted: false } };
  }

  if (!state.selectedItem && interpretation.asksUsual && childMemory?.favouriteOrder) {
    return { action: "suggest_usual", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (!state.selectedItem && interpretation.confused) {
    return { action: "prompt_choice", selectedMenu, signals: { needsClarification: true, objectiveCompleted: false } };
  }

  if (interpretation.intent === "unknown") {
    return { action: "free_response", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (!state.selectedItem) {
    return { action: "clarify", selectedMenu, signals: { needsClarification: true, objectiveCompleted: false } };
  }

  if (
    context.scenario.personality === "personable_familiar" &&
    childMemory?.favouriteOrder &&
    state.selectedItem &&
    hasRememberedPreferences(childMemory.favouriteOrder, state.selectedItem) &&
    !state.selectedCustomizations.length &&
    state.lastAction !== "recall_preference"
  ) {
    return { action: "recall_preference", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (!state.selectedCustomizations.length && state.lastAction !== "ask_customization") {
    return { action: "ask_customization", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (interpretation.confused && state.selectedItem) {
    return { action: "rephrase", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (
    !session.pending_payment &&
    MAIN_DISHES.has(state.selectedItem) &&
    !hasAddOn(state.selectedCustomizations) &&
    !state.noCustomizations &&
    !["offer_add_on", "confirm_order", "request_payment"].includes(state.lastAction)
  ) {
    return { action: "offer_add_on", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  if (!session.pending_payment) {
    return { action: "confirm_order", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
  }

  return { action: "request_payment", selectedMenu, signals: { needsClarification: false, objectiveCompleted: false } };
}
