import { db } from "../../db/database.js";

export function loadScenarioContext(scenarioId) {
  const scenario = db.prepare("SELECT * FROM scenarios WHERE scenario_id = ?").get(scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  const settings = db.prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?").get(scenarioId);

  const objectives = db
    .prepare("SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position")
    .all(scenarioId);

  return {
    scenario: {
      scenarioId: scenario.scenario_id,
      title: scenario.title,
      isActive: Boolean(scenario.is_active),
    },
    settings: settings || {
      locationName: "Unknown Location",
      aiPersonalityPrompt: "Be helpful and friendly.",
      contingencies: "Provide support if needed.",
      backgroundNoise: 20,
    },
    objectives: objectives.map((obj) => ({
      objectiveId: obj.objective_id,
      description: obj.description,
      position: obj.position,
      isRequired: Boolean(obj.is_required),
    })),
  };
}

export function loadSession(sessionId) {
  const session = db.prepare("SELECT * FROM sessions WHERE session_id = ?").get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const interactions = db
    .prepare("SELECT * FROM interactions WHERE session_id = ? ORDER BY asked_at")
    .all(sessionId)
    .map((row) => ({
      interactionId: row.interaction_id,
      questionText: row.question_text,
      aiResponseText: row.ai_response_text,
      askedAt: row.asked_at,
      responses: db
        .prepare("SELECT * FROM responses WHERE interaction_id = ? ORDER BY created_at")
        .all(row.interaction_id)
        .map((resp) => ({
          responseId: resp.response_id,
          responseText: resp.response_text,
          inputMode: resp.input_mode,
          responseTimeSeconds: resp.response_time_seconds,
          usedPrompt: Boolean(resp.used_prompt),
          isSuccessful: Boolean(resp.is_successful),
          createdAt: resp.created_at,
        })),
    }));

  return {
    sessionId: session.session_id,
    childId: session.child_id,
    scenarioId: session.scenario_id,
    startTime: session.start_time,
    endTime: session.end_time,
    totalQuestions: session.total_questions,
    successfulFirstAttempts: session.successful_first_attempts,
    xpEarned: session.xp_earned,
    interactions,
  };
}
