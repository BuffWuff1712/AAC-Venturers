import { Router } from "express";
import { handleConversationTurn } from "../services/orchestration/conversationOrchestrator.js";
import { loadSession } from "../services/orchestration/contextBuilder.js";

export const conversationRoutes = Router();

conversationRoutes.post("/respond", async (req, res, next) => {
  try {
    const { sessionId, childInput } = req.body;

    const result = await handleConversationTurn({
      sessionId: Number(sessionId),
      userInput: childInput || "",
    });

    const session = loadSession(Number(sessionId));

    res.json({
      replyText: result.message,
      replyType: result.action,
      state: {
        sessionId: session.id,
        status: session.status,
        objectiveCompleted: Boolean(session.objective_completed),
        selectedItem: session.selected_item,
        selectedCustomizations: session.selectedCustomizations,
        hintsUsed: session.hints_used,
        clarificationCount: session.clarification_count,
        averageResponseTimeMs: Math.round(session.average_response_time_ms || 0),
      },
      sessionComplete: result.objectiveCompleted,
    });
  } catch (error) {
    next(error);
  }
});
