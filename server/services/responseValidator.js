function buildFallback() {
  return {
    replyText: "Can you tell me what food you want?",
    replyType: "clarify",
    objectiveTags: [],
    shouldEndSession: false,
    valid: false,
    fallbackUsed: true,
  };
}

export function validateResponse(response, action) {
  if (!response || typeof response !== "object") {
    return buildFallback();
  }

  if (!response.replyText || typeof response.replyText !== "string") {
    return buildFallback();
  }

  if (response.replyType !== action) {
    return buildFallback();
  }

  if (!Array.isArray(response.objectiveTags)) {
    return buildFallback();
  }

  if (typeof response.shouldEndSession !== "boolean") {
    return buildFallback();
  }

  return {
    ...response,
    valid: true,
    fallbackUsed: false,
  };
}
