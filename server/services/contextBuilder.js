function formatMenu(menu = []) {
  return menu
    .map(
      (item) =>
        `${item.name} ($${Number(item.price || 0).toFixed(2)}) options: ${(item.customizations || []).join(", ")}`,
    )
    .join("; ");
}

export function buildContext({ action, scenario, menu, memory, history, childInput }) {
  const systemPrompt = [
    "You are a constrained western stall owner for an AAC practice scenario.",
    `Action selected by system: ${action}.`,
    `Scenario: ${scenario?.name || "Western Stall at school canteen"}.`,
    `Goal: ${scenario?.objective || "Complete one food purchase interaction."}`,
    `Menu: ${formatMenu(menu)}.`,
    memory?.favouriteOrder
      ? `Child memory available: favourite order is ${memory.favouriteOrder}.`
      : "No child memory available.",
    "Keep replies under 20 words.",
    "Stay in character as the western stall owner.",
    "Follow the selected action exactly and do not change conversation flow.",
    "Use only the provided menu data.",
    "Only use child memory if it is provided.",
    'Return JSON only with keys: replyText, replyType, objectiveTags, shouldEndSession.',
  ].join(" ");

  const userPrompt = [
    `Child input: ${childInput || "(no child input this turn)"}.`,
    `Recent history count: ${(history || []).length}.`,
    `Generate wording for action "${action}".`,
    `replyType must be "${action}".`,
    `objectiveTags must be an array.`,
    `shouldEndSession must be true only when the action is "end".`,
  ].join(" ");

  return {
    systemPrompt,
    userPrompt,
    metadata: { action },
  };
}
