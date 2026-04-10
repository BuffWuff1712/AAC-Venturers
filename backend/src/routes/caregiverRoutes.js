import { Router } from "express";
import { db } from "../db/database.js";
import { getAnalyticsSummary } from "../services/orchestration/sessionTracker.js";

export const caregiverRoutes = Router();

// Get all scenarios for caregiver
caregiverRoutes.get("/scenarios", (req, res) => {
  try {
    const scenarios = db
      .prepare(`
        SELECT s.scenario_id, s.title, s.is_active, ss.location_name
        FROM scenarios s
        LEFT JOIN scenario_settings ss ON s.scenario_id = ss.scenario_id
        ORDER BY s.created_at DESC
      `)
      .all();

    res.json(
      scenarios.map((scenario) => ({
        scenarioId: scenario.scenario_id,
        title: scenario.title,
        locationName: scenario.location_name,
        isActive: Boolean(scenario.is_active),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scenarios", error: error.message });
  }
});

// Get specific scenario with settings
caregiverRoutes.get("/scenarios/:scenarioId", (req, res) => {
  try {
    const scenario = db
      .prepare("SELECT * FROM scenarios WHERE scenario_id = ?")
      .get(req.params.scenarioId);

    if (!scenario) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const settings = db
      .prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?")
      .get(req.params.scenarioId);

    const objectives = db
      .prepare("SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position")
      .all(req.params.scenarioId);

    res.json({
      scenario: {
        scenarioId: scenario.scenario_id,
        title: scenario.title,
        isActive: Boolean(scenario.is_active),
      },
      settings: settings || {},
      objectives: objectives || [],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scenario", error: error.message });
  }
});

// Update scenario settings
caregiverRoutes.put("/scenarios/:scenarioId/settings", (req, res) => {
  try {
    const { locationName, locationImageUrl, backgroundNoise, aiPersonalityPrompt, contingencies } = req.body;

    db.prepare(`
      UPDATE scenario_settings
      SET location_name = ?, location_image_url = ?, background_noise = ?,
          ai_personality_prompt = ?, contingencies = ?
      WHERE scenario_id = ?
    `).run(locationName, locationImageUrl, backgroundNoise, aiPersonalityPrompt, contingencies, req.params.scenarioId);

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
});

// Get session history for a scenario
caregiverRoutes.get("/scenarios/:scenarioId/history", (req, res) => {
  try {
    const sessions = db
      .prepare(`
        SELECT s.session_id, s.child_id, s.start_time, s.end_time, 
               s.total_questions, s.successful_first_attempts, s.xp_earned
        FROM sessions s
        WHERE s.scenario_id = ?
        ORDER BY s.start_time DESC
      `)
      .all(req.params.scenarioId);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
});

// Get analytics for a specific session
caregiverRoutes.get("/sessions/:sessionId/analytics", (req, res) => {
  try {
    const analytics = db
      .prepare("SELECT * FROM session_analytics WHERE session_id = ?")
      .get(req.params.sessionId);

    if (!analytics) {
      return res.json({
        avgResponseTime: 0,
        successRate: 0,
        totalQuestions: 0,
      });
    }

    res.json({
      avgResponseTime: analytics.avg_response_time || 0,
      longestResponseTime: analytics.longest_response_time || 0,
      shortestResponseTime: analytics.shortest_response_time || 0,
      successRate: analytics.success_rate || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
});

// Get overall analytics summary
caregiverRoutes.get("/analytics", (req, res) => {
  try {
    const summary = getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
});
