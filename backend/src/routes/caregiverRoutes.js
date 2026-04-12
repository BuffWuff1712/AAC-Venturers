import { Router } from "express";
import { db } from "../db/database.js";
import { getAnalyticsSummary } from "../services/orchestration/sessionTracker.js";
import {
  buildDefaultScenarioSettings,
  mergeObjectives,
  mergeScenarioSettings,
  normalizeObjectives,
} from "../data/scenarioDefaults.js";

export const caregiverRoutes = Router();

function mapScenarioSettings(settings) {
  return {
    settingsId: settings.settings_id,
    scenarioId: settings.scenario_id,
    locationName: settings.location_name,
    locationImageUrl: settings.location_image_url,
    backgroundNoise: settings.background_noise,
    aiPersonalityPrompt: settings.ai_personality_prompt,
    contingencies: settings.contingencies,
    updatedAt: settings.updated_at,
  };
}

function mapObjective(objective) {
  return {
    objectiveId: objective.objective_id,
    scenarioId: objective.scenario_id,
    description: objective.description,
    objectiveRule: objective.objective_rule,
    position: objective.position,
    isRequired: Boolean(objective.is_required),
  };
}

function loadScenarioSettingsWithDefaults(scenario) {
  const storedSettings =
    db.prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?").get(scenario.scenario_id) || {};

  return mergeScenarioSettings(
    storedSettings,
    buildDefaultScenarioSettings({
      scenarioId: scenario.scenario_id,
      title: scenario.title,
    }),
  );
}

function loadScenarioObjectivesWithDefaults(scenarioId) {
  const storedObjectives = db
    .prepare("SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position")
    .all(scenarioId);

  return mergeObjectives(storedObjectives, scenarioId);
}

function mapScenarioHistorySession(session) {
  return {
    sessionId: session.session_id,
    childId: session.child_id,
    childName: session.child_name || "Sample Child",
    startTime: session.start_time,
    endTime: session.end_time,
    totalQuestions: session.total_questions,
    successfulFirstAttempts: session.successful_first_attempts,
    xpEarned: session.xp_earned,
    status: session.end_time ? "completed" : "in_progress",
  };
}

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
      scenarios.map((scenario) => {
        const settings = mergeScenarioSettings(
          {
            scenario_id: scenario.scenario_id,
            location_name: scenario.location_name,
          },
          buildDefaultScenarioSettings({
            scenarioId: scenario.scenario_id,
            title: scenario.title,
          }),
        );

        return {
          scenarioId: scenario.scenario_id,
          title: scenario.title,
          locationName: settings.location_name,
          isActive: Boolean(scenario.is_active),
        };
      }),
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

    const settings = loadScenarioSettingsWithDefaults(scenario);
    const objectives = loadScenarioObjectivesWithDefaults(req.params.scenarioId);

    res.json({
      scenario: {
        scenarioId: scenario.scenario_id,
        title: scenario.title,
        isActive: Boolean(scenario.is_active),
      },
      settings: mapScenarioSettings(settings),
      objectives: (objectives || []).map(mapObjective),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scenario", error: error.message });
  }
});

// Update scenario settings
caregiverRoutes.put("/scenarios/:scenarioId/settings", (req, res) => {
  try {
    const {
      locationName,
      locationImageUrl,
      backgroundNoise,
      aiPersonalityPrompt,
      contingencies,
      objectives = [],
    } = req.body;
    const scenarioId = req.params.scenarioId;

    const scenario = db
      .prepare("SELECT scenario_id, title FROM scenarios WHERE scenario_id = ?")
      .get(scenarioId);

    if (!scenario) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const normalizedObjectives = normalizeObjectives(objectives);

    const saveScenarioSettings = db.transaction(() => {
      const existingSettings = db
        .prepare("SELECT settings_id FROM scenario_settings WHERE scenario_id = ?")
        .get(scenarioId);

      if (existingSettings) {
        db.prepare(`
          UPDATE scenario_settings
          SET location_name = ?, location_image_url = ?, background_noise = ?,
              ai_personality_prompt = ?, contingencies = ?, updated_at = CURRENT_TIMESTAMP
          WHERE scenario_id = ?
        `).run(
          locationName,
          locationImageUrl,
          backgroundNoise,
          aiPersonalityPrompt,
          contingencies,
          scenarioId,
        );
      } else {
        const settingsId = `settings-${scenarioId}`;
        db.prepare(`
          INSERT INTO scenario_settings (
            settings_id, scenario_id, location_name, location_image_url,
            background_noise, ai_personality_prompt, contingencies
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          settingsId,
          scenarioId,
          locationName,
          locationImageUrl,
          backgroundNoise,
          aiPersonalityPrompt,
          contingencies,
        );
      }

      db.prepare("DELETE FROM objectives WHERE scenario_id = ?").run(scenarioId);

      if (normalizedObjectives.length) {
        const insertObjective = db.prepare(`
          INSERT INTO objectives (objective_id, scenario_id, description, objective_rule, position, is_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        normalizedObjectives.forEach((objective, index) => {
          insertObjective.run(
            `${scenarioId}-objective-${index + 1}`,
            scenarioId,
            objective.description,
            objective.objectiveRule,
            index + 1,
            1,
          );
        });
      }
    });

    saveScenarioSettings();

    const savedSettings = mergeScenarioSettings(
      db.prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?").get(scenarioId) || {},
      buildDefaultScenarioSettings({
        scenarioId,
        title: scenario.title,
      }),
    );
    const savedObjectives = loadScenarioObjectivesWithDefaults(scenarioId);

    res.json({
      message: "Settings updated successfully",
      settings: mapScenarioSettings(savedSettings),
      objectives: savedObjectives.map(mapObjective),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
});

// Get session history for a scenario
caregiverRoutes.get("/scenarios/:scenarioId/history", (req, res) => {
  try {
    const sessions = db
      .prepare(`
        SELECT s.session_id, s.child_id, c.name AS child_name, s.start_time, s.end_time,
               s.total_questions, s.successful_first_attempts, s.xp_earned
        FROM sessions s
        LEFT JOIN children c ON c.child_id = s.child_id
        WHERE s.scenario_id = ?
        ORDER BY s.start_time DESC
      `)
      .all(req.params.scenarioId);

    res.json(sessions.map(mapScenarioHistorySession));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
});

// Get analytics for a specific session
caregiverRoutes.get("/sessions/:sessionId/analytics", (req, res) => {
  try {
    const session = db
      .prepare(`
        SELECT session_id, child_id, scenario_id, start_time, end_time,
               total_questions, successful_first_attempts, xp_earned
        FROM sessions
        WHERE session_id = ?
      `)
      .get(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const analytics = db
      .prepare("SELECT * FROM session_analytics WHERE session_id = ?")
      .get(req.params.sessionId);

    if (!analytics) {
      return res.json({
        sessionId: session.session_id,
        childId: session.child_id,
        scenarioId: session.scenario_id,
        startTime: session.start_time,
        endTime: session.end_time,
        totalQuestions: session.total_questions || 0,
        successfulFirstAttempts: session.successful_first_attempts || 0,
        xpEarned: session.xp_earned || 0,
        avgResponseTime: 0,
        longestResponseTime: 0,
        shortestResponseTime: 0,
        successRate: 0,
      });
    }

    res.json({
      sessionId: session.session_id,
      childId: session.child_id,
      scenarioId: session.scenario_id,
      startTime: session.start_time,
      endTime: session.end_time,
      totalQuestions: session.total_questions || 0,
      successfulFirstAttempts: session.successful_first_attempts || 0,
      xpEarned: session.xp_earned || 0,
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
