const menuAliases = {
  "chicken chop": "Chicken Chop",
  chicken: "Chicken Chop",
  fish: "Fish and Chips",
  "fish and chips": "Fish and Chips",
  spaghetti: "Spaghetti",
};

const customizationAliases = {
  "no coleslaw": "no coleslaw",
  coleslaw: "no coleslaw",
  chilli: "chilli on the side",
  chili: "chilli on the side",
  fries: "extra fries",
  "extra fries": "extra fries",
};

function extractMenuItem(text) {
  const lower = text.toLowerCase();
  return Object.entries(menuAliases).find(([alias]) => lower.includes(alias))?.[1] || null;
}

function extractCustomizations(text) {
  const lower = text.toLowerCase();
  return [...new Set(Object.entries(customizationAliases)
    .filter(([alias]) => lower.includes(alias))
    .map(([, normalized]) => normalized))];
}

function wantsMenu(text) {
  return /(menu|what do you have|what can i order|food|sell)/i.test(text);
}

function seemsUnclear(text) {
  return text.trim().length < 3 || /(don't know|idk|help|umm|uh)/i.test(text);
}

function soundsLikePayment(text) {
  return /(pay|cash|card|here you go|done|thank you|thanks)/i.test(text);
}

export function decideNextAction({
  userInput,
  context,
  session,
  childMemory,
}) {
  const selectedItem = extractMenuItem(userInput) || session.selected_item || null;
  const customizations = [
    ...new Set([...(session.selectedCustomizations || []), ...extractCustomizations(userInput)]),
  ];
  const hadGreeting = session.total_turns > 0;

  if (!hadGreeting) {
    return {
      action: "greet",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
      },
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (wantsMenu(userInput)) {
    return {
      action: "list_menu",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
      },
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (seemsUnclear(userInput) && !selectedItem) {
    return {
      action: "hint",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
      },
      signals: { needsClarification: false, objectiveCompleted: false },
    };
  }

  if (!selectedItem) {
    if (context.scenario.personality === "personable_familiar" && childMemory) {
      return {
        action: "suggest_usual",
        statePatch: {
          selectedItem,
          selectedCustomizations: customizations,
        },
        signals: { needsClarification: false, objectiveCompleted: false },
      };
    }

    return {
      action: "clarify",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
      },
      signals: { needsClarification: true, objectiveCompleted: false },
    };
  }

  const selectedMenu = context.menu.find((item) => item.name === selectedItem);
  const hasRequiredFollowUp = customizations.length === 0;

  if (hasRequiredFollowUp) {
    return {
      action: "follow_up",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
      },
      signals: { needsClarification: false, objectiveCompleted: false },
      selectedMenu,
    };
  }

  if (!session.pending_payment) {
    return {
      action: "confirm_order",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
        pendingPayment: 1,
      },
      signals: { needsClarification: false, objectiveCompleted: false },
      selectedMenu,
    };
  }

  if (soundsLikePayment(userInput)) {
    return {
      action: "end",
      statePatch: {
        selectedItem,
        selectedCustomizations: customizations,
        pendingPayment: 0,
      },
      signals: { needsClarification: false, objectiveCompleted: true },
      selectedMenu,
    };
  }

  return {
    action: "request_payment",
    statePatch: {
      selectedItem,
      selectedCustomizations: customizations,
      pendingPayment: 1,
    },
    signals: { needsClarification: false, objectiveCompleted: false },
    selectedMenu,
  };
}
