import { db } from "../../db/database.js";

/**
 * Creates a new session row to track one child practice run from start to finish.
 */
export function createSession({ scenarioId, childName }) {
  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO sessions (scenario_id, child_name, started_at, session_state_json)
      VALUES (?, ?, ?, ?)
    `)
    .run(scenarioId, childName, now, JSON.stringify({ phase: "started" }));

  return result.lastInsertRowid;
}

/**
 * Appends a transcript entry for either the child or the stall owner.
 */
export function appendTranscript({
  sessionId,
  speaker,
  action = null,
  message,
  responseTimeMs = null,
  metadata = {},
}) {
  db.prepare(`
    INSERT INTO transcripts (session_id, speaker, action, message, created_at, response_time_ms, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    speaker,
    action,
    message,
    new Date().toISOString(),
    responseTimeMs,
    JSON.stringify(metadata),
  );
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
  const aggregate = db.prepare(`
    SELECT
      COUNT(*) AS totalSessions,
      ROUND(AVG(average_response_time_ms), 2) AS averageResponseTime,
      SUM(hints_used) AS totalHintsUsed,
      SUM(clarification_count) AS totalClarifications,
      SUM(objective_completed) AS completedSessions
    FROM sessions
  `).get();

  const history = db.prepare(`
    SELECT
      id,
      child_name AS childName,
      status,
      objective_completed AS objectiveCompleted,
      selected_item AS selectedItem,
      average_response_time_ms AS averageResponseTime,
      hints_used AS hintsUsed,
      clarification_count AS clarificationCount,
      started_at AS startedAt,
      completed_at AS completedAt
    FROM sessions
    ORDER BY id DESC
    LIMIT 12
  `).all();

  return {
    summary: {
      totalSessions: aggregate.totalSessions || 0,
      averageResponseTime: aggregate.averageResponseTime || 0,
      totalHintsUsed: aggregate.totalHintsUsed || 0,
      totalClarifications: aggregate.totalClarifications || 0,
      completedSessions: aggregate.completedSessions || 0,
    },
    history,
  };
}
