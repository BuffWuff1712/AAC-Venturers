import { Router } from "express";
import { db } from "../db/database.js";
import {
  handleConversationTurn,
  startConversation,
} from "../services/orchestration/conversationOrchestrator.js";
import { loadSession } from "../services/orchestration/contextBuilder.js";

export const childRoutes = Router();

childRoutes.get("/scenarios", (req, res) => {
  const scenarios = db.prepare("SELECT * FROM scenarios ORDER BY id").all();
  res.json(
    scenarios.map((scenario) => ({
      id: scenario.id,
      key: scenario.key,
      name: scenario.name,
      description: scenario.description,
      objective: scenario.objective,
      personality: scenario.personality,
      memoryEnabled: Boolean(scenario.memory_enabled),
    })),
  );
});

childRoutes.post("/sessions", async (req, res, next) => {
  try {
    const { scenarioId, childName } = req.body;
    const session = await startConversation({ scenarioId, childName: childName || "Ari" });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

childRoutes.get("/sessions/:sessionId", (req, res, next) => {
  try {
    const session = loadSession(Number(req.params.sessionId));
    res.json({
      id: session.id,
      status: session.status,
      childName: session.child_name,
      objectiveCompleted: Boolean(session.objective_completed),
      selectedItem: session.selected_item,
      selectedCustomizations: session.selectedCustomizations,
      transcripts: session.transcripts,
      averageResponseTimeMs: session.average_response_time_ms,
      hintsUsed: session.hints_used,
      clarificationCount: session.clarification_count,
    });
  } catch (error) {
    next(error);
  }
});

childRoutes.post("/sessions/:sessionId/messages", async (req, res, next) => {
  try {
    const result = await handleConversationTurn({
      sessionId: Number(req.params.sessionId),
      userInput: req.body.message || "",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
