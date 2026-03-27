import OpenAI from "openai";
import { env } from "../../config/env.js";

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

function personalityGuide(personality) {
  const map = {
    impatient: "Short, brisk, still kind, sounds busy during recess.",
    hard_of_hearing:
      "Often asks the child to repeat or speak clearly, but stays supportive.",
    personable_familiar:
      "Warm and familiar, may mention the child's usual order if memory exists.",
  };
  return map[personality] || map.personable_familiar;
}

function actionGuide(action) {
  const map = {
    greet: "Welcome the child and invite them to order.",
    list_menu: "Briefly list a few menu items and ask what they want.",
    clarify: "Ask the child to clearly state which food item they want.",
    follow_up: "Ask a natural next-step question to continue the order.",
    confirm_order: "Repeat the order clearly and confirm it back.",
    request_payment: "Ask the child to make payment politely.",
    end: "Close the interaction warmly after payment/order completion.",

    ask_quantity: "Ask how many portions they want.",
    ask_customization:
      "Ask if they want any changes, sides, sauces, or preferences.",
    offer_add_on: "Suggest a side or drink to go with the main dish.",
    handle_unavailable:
      "Politely say that item is unavailable and suggest similar menu items.",
    handle_invalid:
      "Politely explain that the request does not match the menu and guide them back.",

    suggest_usual:
      "Suggest the child's usual order if memory exists and it fits naturally.",
    recall_preference:
      "Mention a remembered preference naturally, like no coleslaw or chilli on the side.",

    provide_options:
      "Give the child a few simple choices to make ordering easier.",
    prompt_choice:
      "Offer a short either-or choice, like Chicken Chop or Spaghetti.",
    model_response:
      "Model a simple sentence the child can copy, like 'I want Chicken Chop please.'",
    encourage: "Encourage the child kindly and supportively.",
    hint: "Give a short hint or example phrase the child can use.",

    small_talk: "Add a short friendly social remark while staying on task.",
    repeat: "Repeat the order or question clearly and simply.",
    rephrase: "Say the same thing again in simpler words.",

    handle_silence:
      "Gently support the child if they stay silent for too long.",
    handle_confusion:
      "Respond supportively if the child seems confused or unsure.",
  };

  return map[action] || "Respond naturally and helpfully as a stall owner.";
}

function normalizeSession(session = {}) {
  return {
    ...session,
    selectedItem: session.selectedItem || session.selected_item || "",
    selectedCustomizations:
      session.selectedCustomizations || session.selected_customizations || [],
    pendingPayment:
      session.pendingPayment ??
      session.pending_payment ??
      0,
  };
}

export function buildPrompt({
  context,
  childMemory,
  action,
  userInput,
  session,
  selectedMenu,
  customizations = [],
}) {
  const normalizedSession = normalizeSession(session);

  const menuText = context.menu
    .map(
      (item) =>
        `${item.name} ($${item.price.toFixed(2)}): ${item.customizations.join(", ")}`
    )
    .join("; ");

  return `
You are a western stall owner in a school canteen.
Stay in character.
Keep replies short, child-friendly, natural, and under 30 words.
Do not narrate actions.
Do not explain your reasoning.
Only talk about this menu: ${menuText}.

Personality: ${personalityGuide(context.scenario.personality)}
Current action: ${action}
Action instruction: ${actionGuide(action)}
Scenario objective: ${context.scenario.objective}

Current selected item: ${selectedMenu?.name || normalizedSession.selectedItem || "none"}
Current customizations: ${(customizations.length ? customizations : normalizedSession.selectedCustomizations).join(", ") || "none"}
Pending payment: ${normalizedSession.pendingPayment ? "yes" : "no"}
Child memory: ${childMemory?.favouriteOrder || "none"}
Last user input: ${userInput || "none"}

Rules:
- Stay aligned with the current action.
- If action is "list_menu", mention at most 3-4 items.
- If action is "prompt_choice", give only 2 simple choices.
- If action is "model_response" or "hint", provide a phrase the child can copy.
- If action is "confirm_order", clearly restate item and customizations.
- If action is "offer_add_on", suggest only one relevant add-on.
- If action is "handle_unavailable", apologize briefly and suggest alternatives from the menu.
- If action is "request_payment", ask for payment clearly and simply.
- If action is "end", sound warm and positive.

Return valid JSON with this shape only:
{
  "action": "${action}",
  "message": "string",
  "hintUsed": false,
  "orderSummary": {
    "item": "string or empty",
    "customizations": ["string"]
  }
}
`;
}

function fallbackMessage(action, selectedMenu, customizations = [], childMemory) {
  const itemName = selectedMenu?.name || "";
  const joinedCustomizations = customizations.length
    ? ` with ${customizations.join(", ")}`
    : "";

  const templates = {
    greet: "Hi there! What would you like from the western stall today?",
    list_menu:
      "We have Chicken Chop, Fish and Chips, Spaghetti, and Burger. What would you like?",
    clarify:
      "Sure. Please tell me which food you want from the menu.",
    follow_up:
      `Okay, ${itemName || "that"}. Any changes or anything else?`,
    confirm_order:
      `Okay! ${itemName || "Your order"}${joinedCustomizations}. Is that correct?`,
    request_payment:
      "Please make payment at the counter. Cash or card is okay.",
    end:
      "Great job ordering! Here is your food. Enjoy your recess!",

    ask_quantity:
      `How many would you like for ${itemName || "that item"}?`,
    ask_customization:
      `Any changes for ${itemName || "that"}? You can say no coleslaw, chilli on the side, or extra fries.`,
    offer_add_on:
      `Would you like a drink or fries with your ${itemName || "order"}?`,
    handle_unavailable:
      "Sorry, we do not have that today. You can choose Chicken Chop, Fish and Chips, or Spaghetti.",
    handle_invalid:
      "I did not catch that order. Please choose a food item from the menu.",

    suggest_usual:
      `Welcome back! Do you want your usual ${childMemory?.favouriteOrder || "Chicken Chop"}?`,
    recall_preference:
      "Do you want it the usual way, like no coleslaw or chilli on the side?",

    provide_options:
      "You can choose Chicken Chop, Fish and Chips, or Spaghetti.",
    prompt_choice:
      "Would you like Chicken Chop or Spaghetti?",
    model_response:
      "You can say: I want Chicken Chop please.",
    encourage:
      "It is okay, take your time. You are doing well.",
    hint:
      "You can say: I want Fish and Chips please.",

    small_talk:
      "Hi! Hungry today? What would you like to eat?",
    repeat:
      `Let me say it again: ${itemName || "please tell me your order clearly"}.`,
    rephrase:
      "Sure, tell me the food item you want in a simple sentence.",

    handle_silence:
      "That is okay. Take your time. You can point or say the food name.",
    handle_confusion:
      "No problem. I can help you choose from the menu.",
  };

  return {
    action,
    message: templates[action] || "Can you tell me your order again?",
    hintUsed: ["hint", "model_response"].includes(action),
    orderSummary: {
      item: itemName,
      customizations,
    },
    source: "fallback",
  };
}

export async function generateScenarioReply({
  context,
  childMemory,
  action,
  userInput,
  session,
  selectedMenu,
  customizations = [],
}) {
  if (!client) {
    return fallbackMessage(action, selectedMenu, customizations, childMemory);
  }

  try {
    const prompt = buildPrompt({
      context,
      childMemory,
      action,
      userInput,
      session,
      selectedMenu,
      customizations,
    });

    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate short natural language for a guided AAC role-play. Output valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      action: parsed.action || action,
      message: parsed.message || fallbackMessage(action, selectedMenu, customizations, childMemory).message,
      hintUsed: Boolean(parsed.hintUsed),
      orderSummary: {
        item: parsed.orderSummary?.item || selectedMenu?.name || "",
        customizations:
          parsed.orderSummary?.customizations || customizations || [],
      },
    };
  } catch (error) {
    return {
      ...fallbackMessage(action, selectedMenu, customizations, childMemory),
      error: error.message,
    };
  }
}