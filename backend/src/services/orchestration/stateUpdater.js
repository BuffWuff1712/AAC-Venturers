/**
 * Removes empty or duplicate values while preserving the first occurrence order.
 */
function dedupe(values = []) {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Splits a stored favourite-order string into its item and remembered customization parts.
 */
function parseFavouriteOrder(favouriteOrder = "") {
  if (!favouriteOrder) {
    return {
      item: "",
      preferences: [],
    };
  }

  const [item, ...rest] = favouriteOrder.split(",").map((value) => value.trim()).filter(Boolean);
  return {
    item: item || "",
    preferences: rest,
  };
}

/**
 * Merges the latest interpretation into a conversation state object the policy engine can reason about.
 */
export function buildConversationState({ session, interpretation, childMemory }) {
  const favourite = parseFavouriteOrder(childMemory?.favouriteOrder || "");
  const acceptingUsual =
    session.last_action === "suggest_usual" &&
    interpretation.affirmative &&
    favourite.item;

  const selectedItem =
    (acceptingUsual ? favourite.item : "") ||
    interpretation.item ||
    session.selected_item ||
    "";

  const selectedCustomizations = dedupe(
    acceptingUsual
      ? favourite.preferences
      : [...(session.selectedCustomizations || []), ...(interpretation.preferences || [])],
  );

  const noCustomizations = interpretation.declineCustomization || selectedCustomizations.includes("no customisations");
  const effectiveCustomizations = noCustomizations
    ? ["no customisations"]
    : selectedCustomizations.filter((value) => value !== "no customisations");

  const awaitingPayment = Boolean(session.pending_payment);
  const orderCompleted = interpretation.paymentDone && awaitingPayment;

  return {
    selectedItem,
    selectedCustomizations: effectiveCustomizations,
    awaitingPayment,
    orderCompleted,
    acceptingUsual,
    noCustomizations,
    favouriteOrder: childMemory?.favouriteOrder || "",
    lastAction: session.last_action || "",
  };
}

/**
 * Converts the derived conversation state into the session columns that should be updated this turn.
 */
export function buildStatePatch(state) {
  return {
    selectedItem: state.selectedItem,
    selectedCustomizations: state.selectedCustomizations,
    pendingPayment: state.awaitingPayment ? 1 : 0,
  };
}

/**
 * Builds the richer JSON state snapshot stored with the session for future turns and debugging.
 */
export function buildSessionStatePatch(state, interpretation, action) {
  return {
    phase: state.orderCompleted ? "completed" : action,
    slots: {
      item: state.selectedItem,
      customizations: state.selectedCustomizations,
      awaitingPayment: state.awaitingPayment,
    },
    interpretation: {
      intent: interpretation.intent,
      confidence: interpretation.confidence,
      affirmative: interpretation.affirmative,
      asksHelp: interpretation.asksHelp,
      paymentDone: interpretation.paymentDone,
    },
  };
}
