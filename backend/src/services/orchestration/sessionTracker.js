import { db } from "../../db/database.js";
import { randomUUID } from "crypto";

/**
 * Creates a new session row to track one child practice run from start to finish.
 */
export function createSession({ scenarioId, childId }) {
  const sessionId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (session_id, child_id, scenario_id, start_time)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, childId, scenarioId, now);

  return sessionId;
}

/**
 * Appends a transcript entry for either the child or the stall owner.
 */
export function appendTranscript({
  sessionId,
  questionText,
}) {
  const interactionId = randomUUID();

  db.prepare(`
    INSERT INTO interactions (interaction_id, session_id, question_text, asked_at)
    VALUES (?, ?, ?, ?)
  `).run(interactionId, sessionId, questionText, new Date().toISOString());

  return interactionId;
}

export function recordResponse({
  interactionId,
  responseText,
  inputMode,
  responseTimeSeconds,
  usedPrompt,
  isSuccessful,
}) {
  const responseId = randomUUID();

  db.prepare(`
    INSERT INTO responses (
      response_id, interaction_id, response_text, input_mode,
      response_time_seconds, used_prompt, is_successful, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    responseId,
    interactionId,
    responseText,
    inputMode,
    responseTimeSeconds,
    usedPrompt ? 1 : 0,
    isSuccessful ? 1 : 0,
    new Date().toISOString(),
  );

  return responseId;
}

/**
 * Persists the results of a turn, including session status, analytics counters, and structured state.
 */
export function updateSessionAfterTurn({
  sessionId,
  action,
  userInput,
  statePatch,
  sessionStatePatch = {},
  responseTimeMs,
  objectiveCompleted,
  clarificationIncrement,
  hintIncrement,
}) {
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  const previousAverage = session.average_response_time_ms || 0;
  const previousTurns = session.total_turns || 0;
  const nextTurns = previousTurns + 1;
  const averageResponseTime =
    previousTurns === 0
      ? responseTimeMs
      : (previousAverage * previousTurns + responseTimeMs) / nextTurns;

  const nextState = {
    ...(JSON.parse(session.session_state_json || "{}")),
    phase: objectiveCompleted ? "completed" : "in_progress",
    lastAction: action,
    ...sessionStatePatch,
  };

  db.prepare(`
    UPDATE sessions
    SET
      status = ?,
      completed_at = ?,
      objective_completed = ?,
      selected_item = ?,
      selected_customizations_json = ?,
      clarification_count = clarification_count + ?,
      hints_used = hints_used + ?,
      average_response_time_ms = ?,
      total_turns = ?,
      last_action = ?,
      last_user_input = ?,
      pending_payment = ?,
      session_state_json = ?
    WHERE id = ?
  `).run(
    objectiveCompleted ? "completed" : "active",
    objectiveCompleted ? new Date().toISOString() : null,
    objectiveCompleted ? 1 : session.objective_completed,
    statePatch.selectedItem || session.selected_item,
    JSON.stringify(statePatch.selectedCustomizations || JSON.parse(session.selected_customizations_json || "[]")),
    clarificationIncrement,
    hintIncrement,
    averageResponseTime,
    nextTurns,
    action,
    userInput,
    statePatch.pendingPayment ?? session.pending_payment,
    JSON.stringify(nextState),
    sessionId,
  );
}

/**
 * Aggregates top-level caregiver analytics and recent session history from SQLite.
 */
export function getAnalyticsSummary() {
  const aggregate = db
    .prepare(`
      SELECT
        COUNT(*) AS totalSessions,
        ROUND(AVG(avg_response_time), 2) AS averageResponseTime,
        ROUND(AVG(success_rate), 2) AS averageSuccessRate
      FROM session_analytics
    `)
    .get();

  const recentSessions = db
    .prepare(`
      SELECT
        s.session_id, s.child_id, s.start_time, s.end_time, s.xp_earned,
        sa.success_rate, sa.avg_response_time
      FROM sessions s
      LEFT JOIN session_analytics sa ON s.session_id = sa.session_id
      ORDER BY s.start_time DESC
      LIMIT 10
    `)
    .all();

  return {
    summary: {
      totalSessions: aggregate.totalSessions || 0,
      averageResponseTime: aggregate.averageResponseTime || 0,
      averageSuccessRate: aggregate.averageSuccessRate || 0,
    },
    recentSessions,
  };
}
