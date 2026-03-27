import OpenAI from "openai";
import { env } from "../../config/env.js";

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

function personalityGuide(personality) {
  const map = {
    impatient: "Short, brisk, still kind, sounds busy during recess.",
    hard_of_hearing: "Often asks the child to repeat or speak clearly, but stays supportive.",
    personable_familiar: "Warm and familiar, may mention the child's usual order if memory exists.",
  };
  return map[personality] || map.personable_familiar;
}

export function buildPrompt({ context, childMemory, action, userInput, session, selectedMenu }) {
  const menuText = context.menu
    .map((item) => `${item.name} ($${item.price.toFixed(2)}): ${item.customizations.join(", ")}`)
    .join("; ");

  return `
You are a western stall owner in a school canteen.
Stay in character. Keep replies short, child-friendly, and under 30 words.
Only talk about this menu: ${menuText}.
Personality: ${personalityGuide(context.scenario.personality)}
Current action: ${action}
Scenario objective: ${context.scenario.objective}
Current selected item: ${selectedMenu?.name || session.selected_item || "none"}
Current customizations: ${(session.selectedCustomizations || []).join(", ") || "none"}
Child memory: ${childMemory?.favouriteOrder || "none"}
Last user input: ${userInput || "none"}

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

function fallbackMessage(action, selectedMenu, customizations, childMemory) {
  const joinedCustomizations = customizations.length ? ` with ${customizations.join(", ")}` : "";

  const templates = {
    greet: "Hi there! What would you like from the western stall today?",
    list_menu:
      "We have Chicken Chop for $5.50, Fish and Chips for $5.80, and Spaghetti for $4.80. What would you like?",
    clarify: "I can help. Please tell me which food you want: Chicken Chop, Fish and Chips, or Spaghetti.",
    follow_up: `Okay, ${selectedMenu?.name || "that"}${joinedCustomizations}. Any changes like no coleslaw, chilli on the side, or extra fries?`,
    suggest_usual: `Welcome back! Do you want your usual ${childMemory?.favouriteOrder || "Chicken Chop"}?`,
    confirm_order: `Okay! ${selectedMenu?.name || "Your order"}${joinedCustomizations}. That will be ready soon.`,
    request_payment: "Please make payment at the counter. Cash or card is okay.",
    hint: "You can say: I want Chicken Chop with chilli on the side.",
    end: "Great job ordering! Here is your food. Enjoy your recess!",
  };

  return {
    action,
    message: templates[action] || "Can you tell me your order again?",
    hintUsed: action === "hint",
    orderSummary: {
      item: selectedMenu?.name || "",
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
  customizations,
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
    });

    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You generate natural language for a guided AAC role-play. Output JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    return {
      ...fallbackMessage(action, selectedMenu, customizations, childMemory),
      error: error.message,
    };
  }
}
