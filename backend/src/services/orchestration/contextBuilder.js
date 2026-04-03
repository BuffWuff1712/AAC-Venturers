import { db } from "../../db/database.js";

/**
 * Loads the caregiver-configured scenario together with the live menu items for the chat turn.
 */
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
      id: scenario.id,
      key: scenario.key,
      name: scenario.name,
      description: scenario.description,
      objective: scenario.objective,
      personality: scenario.personality,
      memoryEnabled: Boolean(scenario.memory_enabled),
    },
    menu,
  };
}

/**
 * Resolves child memory, preferring the most frequent historical completed order over the seeded default.
 */
export function loadChildMemory(scenarioId, childName, enabled) {
  if (!enabled) {
    return null;
  }

  const historicalUsual = db
    .prepare(`
      SELECT
        selected_item AS item,
        selected_customizations_json AS customizationsJson,
        COUNT(*) AS orderCount,
        MAX(completed_at) AS lastCompletedAt
      FROM sessions
      WHERE scenario_id = ?
        AND lower(child_name) = lower(?)
        AND objective_completed = 1
        AND selected_item IS NOT NULL
        AND selected_item != ''
      GROUP BY selected_item, selected_customizations_json
      ORDER BY orderCount DESC, lastCompletedAt DESC
      LIMIT 1
    `)
    .get(scenarioId, childName);

  const memory = db
    .prepare(
      "SELECT child_name, favourite_order FROM child_memory WHERE scenario_id = ? AND lower(child_name) = lower(?)",
    )
    .get(scenarioId, childName);

  if (historicalUsual) {
    const customizations = JSON.parse(historicalUsual.customizationsJson || "[]").filter(
      (value) => value && value !== "no customisations",
    );

    return {
      childName,
      favouriteOrder: customizations.length
        ? `${historicalUsual.item}, ${customizations.join(", ")}`
        : historicalUsual.item,
      source: "history",
      orderCount: historicalUsual.orderCount,
    };
  }

  return memory
    ? {
        childName: memory.child_name,
        favouriteOrder: memory.favourite_order,
        source: "seed",
        orderCount: 0,
      }
    : null;
}

/**
 * Loads a session row and expands its stored JSON fields into convenient runtime objects.
 */
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
