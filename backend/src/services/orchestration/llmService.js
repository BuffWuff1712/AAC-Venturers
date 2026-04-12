import OpenAI from "openai";
import { env } from "../../config/env.js";

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

/**
 * Converts the caregiver personality setting into short prompt guidance for reply style.
 */
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

/**
 * Tells the response generator what each backend-selected action should sound like.
 */
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
    free_response:
      "Reply naturally to the child's last message while gently keeping the conversation in the ordering scenario.",

    handle_silence:
      "Gently support the child if they stay silent for too long.",
    handle_confusion:
      "Respond supportively if the child seems confused or unsure.",
  };

  return map[action] || "Respond naturally and helpfully as a stall owner.";
}

/**
 * Normalizes snake_case database session fields into a friendlier prompt payload shape.
 */
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

/**
 * Uses the LLM as a structured extractor that interprets the child's message without choosing policy.
 */
export async function interpretChildInput({
  childInput,
  context,
  session,
  childMemory,
  history = [],
  fallbackInterpretation,
}) {
  if (!client) {
    return fallbackInterpretation;
  }

  const normalizedSession = normalizeSession(session);
  const menuNames = context.menu.map((item) => item.name).join(", ");
  const scenarioObjectives = (context.scenario.objectives || [])
    .map((objective) => objective.description)
    .join(" | ");
  const recentHistory = history
    .slice(-4)
    .map((entry) => `${entry.speaker}: ${entry.message}`)
    .join(" | ");

  const prompt = `
Interpret the child's latest canteen-ordering message for a guided AAC scenario.
Return JSON only with this shape:
{
  "intent": "ask_menu|ask_usual|place_order|modify_order|pay|ask_help|repeat|model_phrase|affirm|decline_customization|unavailable_request|confused|unknown|silence",
  "item": "string or empty",
  "preferences": ["string"],
  "confidence": 0.0,
  "asksMenu": false,
  "asksUsual": false,
  "asksHelp": false,
  "confused": false,
  "paymentDone": false,
  "asksPaymentOptions": false,
  "addOnRequested": false,
  "repeatRequested": false,
  "modelPhraseRequested": false,
  "unavailableRequest": false,
  "affirmative": false,
  "declineCustomization": false
}

Menu items: ${menuNames}
Scenario objectives: ${scenarioObjectives || context.scenario.objective || "none"}
Scenario AI personality guidance: ${context.scenario.aiPersonalityPrompt || "none"}
Scenario contingencies: ${context.scenario.contingencies || "none"}
Current selected item: ${normalizedSession.selectedItem || "none"}
Current customizations: ${(normalizedSession.selectedCustomizations || []).join(", ") || "none"}
Pending payment: ${normalizedSession.pendingPayment ? "yes" : "no"}
Child memory: ${childMemory?.favouriteOrder || "none"}
Recent history: ${recentHistory || "none"}
Child input: ${childInput || "none"}

Rules:
- Prefer semantic understanding over exact words.
- Only use menu items from the menu list.
- If the child is just saying yes after a suggested usual order, set affirmative=true.
- If the child is declining customisations, set declineCustomization=true.
- If payment is pending and the child is asking which payment methods are accepted, set asksPaymentOptions=true.
- If the child is asking to add another item onto an existing order, set addOnRequested=true and set item to the added item.
`;

  try {
    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You extract structured meaning from AAC ordering messages. Output valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    return {
      ...fallbackInterpretation,
      ...JSON.parse(content),
    };
  } catch (error) {
    return fallbackInterpretation;
  }
}

/**
 * Builds the constrained response-generation prompt from state, action, memory, and menu context.
 */
export function buildPrompt({
  context,
  childMemory,
  action,
  userInput,
  session,
  selectedMenu,
  customizations = [],
  interpretation,
}) {
  const normalizedSession = normalizeSession(session);

  const menuText = context.menu
    .map(
      (item) =>
        `${item.name} ($${item.price.toFixed(2)}): ${item.customizations.join(", ")}`
    )
    .join("; ");
  const scenarioObjectives = (context.scenario.objectives || [])
    .map((objective, index) => `${index + 1}. ${objective.description}`)
    .join(" ");

  return `
You are a western stall owner in a school canteen.
Stay in character.
Keep replies short, child-friendly, natural, and under 30 words.
Do not narrate actions.
Do not explain your reasoning.
Only talk about this menu: ${menuText}.

Personality: ${personalityGuide(context.scenario.personality)}
Configured AI personality prompt: ${context.scenario.aiPersonalityPrompt || "none"}
Current action: ${action}
Action instruction: ${actionGuide(action)}
Scenario objective: ${context.scenario.objective}
Scenario objective list: ${scenarioObjectives || "none"}
Scenario contingencies: ${context.scenario.contingencies || "none"}

Current selected item: ${selectedMenu?.name || normalizedSession.selectedItem || "none"}
Current customizations: ${(customizations.length ? customizations : normalizedSession.selectedCustomizations).join(", ") || "none"}
Pending payment: ${normalizedSession.pendingPayment ? "yes" : "no"}
Child memory: ${
  action === "suggest_usual" && childMemory?.favouriteOrder
    ? childMemory.favouriteOrder
    : "ignore memory for this action"
}
Last user input: ${userInput || "none"}
Interpreted intent: ${interpretation?.intent || "unknown"}
Interpreted confidence: ${interpretation?.confidence ?? "unknown"}
Asked about payment modes: ${interpretation?.asksPaymentOptions ? "yes" : "no"}

Rules:
- Stay aligned with the current action.
- Follow the configured AI personality prompt and contingencies when they fit the current action.
- Keep the response supportive of the scenario objectives without explicitly listing the objectives to the child.
- If action is "list_menu", list all available menu item names and do not mention any customisations.
- If action is "prompt_choice", give only 2 simple choices.
- If action is "model_response" or "hint", provide a phrase the child can copy.
- If action is "confirm_order", clearly restate item and customizations.
- If action is "offer_add_on", suggest only one relevant add-on.
- If action is "free_response", answer naturally, briefly, and stay in the canteen ordering context.
- If action is "handle_unavailable", apologize briefly and suggest alternatives from the menu.
- If action is "request_payment" and the child asked about payment modes, answer with the accepted payment methods clearly.
- If action is "request_payment", otherwise ask for payment clearly and simply.
- If action is "request_payment", include the current customizations or add-ons in the payable order summary when any exist.
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
Rules:
- If Current selected item is not "none", orderSummary.item must match it exactly.
- Do not use the child's favourite order unless action is "suggest_usual".
- For confirm_order, request_payment, and end, the message must stay consistent with the selected item.
`;
}

/**
 * Returns deterministic wording when OpenAI is unavailable or a generated response is rejected.
 */
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
      `Please make payment for ${itemName|| "your order"}${joinedCustomizations}. Cash or card is okay.`,
    end: 
        `Great job ordering ${itemName || "your food"}! Here is your food. Enjoy your recess!`,


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
    free_response:
      "Okay, tell me a bit more and I will help you with your order.",

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

/**
 * Generates wording for the backend-selected action while keeping the order facts grounded in state.
 */
export async function generateScenarioReply({
  context,
  childMemory,
  action,
  userInput,
  session,
  selectedMenu,
  customizations = [],
  interpretation,
}) {
  if (!client) {
    const fallback = fallbackMessage(action, selectedMenu, customizations, childMemory);
    if (action === "list_menu") {
      return {
        ...fallback,
        message: `We have ${context.menu.map((item) => item.name).join(", ")}. What would you like?`,
      };
    }
    return fallback;
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
      interpretation,
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
    const fallback = fallbackMessage(action, selectedMenu, customizations, childMemory);
    return {
      ...(action === "list_menu"
        ? {
            ...fallback,
            message: `We have ${context.menu.map((item) => item.name).join(", ")}. What would you like?`,
          }
        : fallback),
      error: error.message,
    };
  }
}
