import { Router } from "express";
import { db } from "../db/database.js";
import {
  handleConversationTurn,
  startConversation,
} from "../services/orchestration/conversationOrchestrator.js";
import { loadSession } from "../services/orchestration/contextBuilder.js";

export const childRoutes = Router();

childRoutes.get("/scenarios", (req, res) => {
  try {
    const scenarios = db
      .prepare(`
        SELECT s.scenario_id, s.title, s.is_active, ss.location_name, ss.location_image_url
        FROM scenarios s
        LEFT JOIN scenario_settings ss ON s.scenario_id = ss.scenario_id
        WHERE s.is_active = 1
        ORDER BY s.created_at
      `)
      .all();

    res.json(
      scenarios.map((scenario) => ({
        scenarioId: scenario.scenario_id,
        title: scenario.title,
        locationName: scenario.location_name,
        locationImage: scenario.location_image_url,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scenarios", error: error.message });
  }
});

childRoutes.post("/sessions", async (req, res, next) => {
  try {
    const { scenarioId, childId } = req.body;
    const session = await startConversation({ scenarioId, childId: childId || "unknown" });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

childRoutes.get("/sessions/:sessionId", (req, res, next) => {
  try {
    const session = loadSession(req.params.sessionId);
    res.json({
      sessionId: session.session_id,
      childId: session.child_id,
      scenarioId: session.scenario_id,
      startTime: session.start_time,
      endTime: session.end_time,
      totalQuestions: session.total_questions,
      successfulFirstAttempts: session.successful_first_attempts,
      xpEarned: session.xp_earned,
      interactions: session.interactions || [],
    });
  } catch (error) {
    next(error);
  }
});

childRoutes.post("/sessions/:sessionId/respond", async (req, res, next) => {
  try {
    const result = await handleConversationTurn({
      sessionId: req.params.sessionId,
      userInput: req.body.input || "",
      inputMode: req.body.inputMode || "text",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
