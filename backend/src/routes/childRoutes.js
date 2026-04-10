import { Router } from "express";
import { db } from "../db/database.js";
import {
  buildDefaultScenarioSettings,
  mergeScenarioSettings,
} from "../data/scenarioDefaults.js";
import {
  handleConversationTurn,
  startConversation,
} from "../services/orchestration/conversationOrchestrator.js";
import {
  loadScenarioContext,
  loadSession,
} from "../services/orchestration/contextBuilder.js";

export const childRoutes = Router();

function mapTranscriptEntry(entry) {
  return {
    speaker: entry.speaker,
    action: entry.action,
    message: entry.message,
    createdAt: entry.createdAt,
    metadata: entry.metadata || {},
  };
}

function buildSessionState(session) {
  return {
    sessionId: session.sessionId,
    status: session.status,
    objectiveCompleted: Boolean(session.objective_completed),
    selectedItem: session.selected_item,
    selectedCustomizations: session.selectedCustomizations || [],
    hintsUsed: session.hints_used || 0,
    clarificationCount: session.clarification_count || 0,
    averageResponseTimeMs: session.average_response_time_ms || 0,
  };
}

function buildFallbackHint(session, context) {
  if (session.objective_completed) {
    return {
      action: "encourage",
      hint: "You already finished the order. Great job!",
      source: "fallback",
    };
  }

  if (!session.selected_item) {
    return {
      action: "hint",
      hint: `You can start by saying one food item, like ${context.menu[0]?.name || "Chicken Chop"}.`,
      source: "fallback",
    };
  }

  if (!session.pending_payment && !(session.selectedCustomizations || []).length) {
    return {
      action: "hint",
      hint: `You can add changes for ${session.selected_item} or say "no customisations".`,
      source: "fallback",
    };
  }

  if (session.pending_payment) {
    return {
      action: "hint",
      hint: 'You can say "I paid" when you are ready.',
      source: "fallback",
    };
  }

  return {
    action: "encourage",
    hint: "Take your time. You can answer one short phrase at a time.",
    source: "fallback",
  };
}

// Lists the child-playable scenarios available in the prototype.
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
      scenarios.map((scenario) => {
        const settings = mergeScenarioSettings(
          {
            scenario_id: scenario.scenario_id,
            location_name: scenario.location_name,
            location_image_url: scenario.location_image_url,
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
          locationImage: settings.location_image_url,
        };
      }),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch scenarios", error: error.message });
  }
});

// Creates a new practice session and returns the opening assistant message.
childRoutes.post("/sessions", async (req, res, next) => {
  try {
    const { scenarioId, childId } = req.body;
    const session = await startConversation({ scenarioId, childId: childId || "unknown" });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Returns the current session state together with its transcript history.
childRoutes.get("/sessions/:sessionId", (req, res, next) => {
  try {
    const session = loadSession(req.params.sessionId);
    const context = loadScenarioContext(session.scenario_id);

    res.json({
      sessionId: session.session_id,
      childId: session.child_id,
      childName: session.child_name,
      scenarioId: session.scenario_id,
      startTime: session.start_time,
      endTime: session.end_time,
      status: session.status,
      objectiveCompleted: Boolean(session.objective_completed),
      totalQuestions: session.total_questions,
      successfulFirstAttempts: session.successful_first_attempts,
      xpEarned: session.xp_earned,
      selectedItem: session.selected_item,
      selectedCustomizations: session.selectedCustomizations || [],
      hintsUsed: session.hints_used || 0,
      clarificationCount: session.clarification_count || 0,
      averageResponseTimeMs: session.average_response_time_ms || 0,
      scenario: {
        scenarioId: context.scenario.scenarioId,
        title: context.scenario.title,
        locationName: context.scenario.locationName,
        locationImageUrl: context.scenario.locationImageUrl,
        objective: context.scenario.objective,
      },
      interactions: session.interactions || [],
      transcripts: (session.transcripts || []).map(mapTranscriptEntry),
      state: buildSessionState(session),
    });
  } catch (error) {
    next(error);
  }
});

// Convenience chat endpoint that posts a child message into an existing session.
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

// Returns caregiver-configured contingency guidance for a stuck moment, with a simple fallback.
childRoutes.post("/sessions/:sessionId/hint", (req, res, next) => {
  try {
    const session = loadSession(req.params.sessionId);
    const context = loadScenarioContext(session.scenario_id);
    const configuredContingency = String(context.scenario.contingencies || "").trim();

    const hintPayload = configuredContingency
      ? {
          action: "hint",
          hint: configuredContingency,
          source: "scenario_contingency",
        }
      : buildFallbackHint(session, context);

    res.json({
      sessionId: session.session_id,
      ...hintPayload,
      state: buildSessionState(session),
    });
  } catch (error) {
    next(error);
  }
});
