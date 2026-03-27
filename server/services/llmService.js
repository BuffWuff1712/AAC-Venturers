import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

const envPath = path.resolve(process.cwd(), "backend/.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function extractAction(metadata = {}, systemPrompt = "") {
  if (metadata?.action) {
    return metadata.action;
  }

  const match = systemPrompt.match(/Action selected by system:\s*([a-z_]+)/i);
  return match?.[1] || "clarify";
}

function buildMockResponse(action, metadata = {}) {
  const orderItem = metadata?.orderItem || "your food";
  const preferences = Array.isArray(metadata?.preferences) ? metadata.preferences : [];
  const preferenceText = preferences.length ? ` with ${preferences.join(", ")}` : "";

  const templates = {
    greet: "Hello! What would you like to order?",
    list_menu: "We have chicken chop, fish and chips, and spaghetti.",
    clarify: "Can you tell me what food you want?",
    follow_up: `Okay, ${orderItem}. Any changes like no coleslaw or extra fries?`,
    suggest_usual: `Do you want your usual ${metadata?.favouriteOrder || "Chicken Chop"}?`,
    confirm_order: `Okay, ${orderItem}${preferenceText}.`,
    request_payment: "Please make payment at the counter.",
    hint: "You can say, I want chicken chop with chilli on the side.",
    end: "Thank you. Your order is complete.",
  };

  return {
    replyText: templates[action] || "Can you tell me what food you want?",
    replyType: action,
    objectiveTags: action === "end" ? ["objective_complete"] : [],
    shouldEndSession: action === "end",
  };
}

export async function generateReply({ systemPrompt, userPrompt, metadata = {} }) {
  const action = extractAction(metadata, systemPrompt);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildMockResponse(action, metadata);
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    return buildMockResponse(action, metadata);
  }
}
