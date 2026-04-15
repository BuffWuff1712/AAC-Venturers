import { randomUUID } from "crypto";
import { db } from "../../db/database.js";
import { loadSession } from "./contextBuilder.js";

function parseState(rawTranscript = "") {
  if (!rawTranscript) {
    return {};
  }

  try {
    return JSON.parse(rawTranscript);
  } catch {
    return {};
  }
}

function loadStoredState(sessionId) {
  const row = db
    .prepare("SELECT transcript FROM session_recordings WHERE session_id = ?")
    .get(sessionId);

  return parseState(row?.transcript);
}

function saveStoredState(sessionId, state) {
  db.prepare(`
    INSERT INTO session_recordings (recording_id, session_id, audio_url, transcript)
    VALUES (?, ?, NULL, ?)
    ON CONFLICT(session_id) DO UPDATE SET transcript = excluded.transcript
  `).run(randomUUID(), sessionId, JSON.stringify(state));
}

function loadScenarioObjectives(scenarioId) {
  return db
    .prepare(`
      SELECT objective_id, description, objective_rule, position
      FROM objectives
      WHERE scenario_id = ?
      ORDER BY position, objective_id
    `)
    .all(scenarioId);
}

function objectiveMatchesState(objective, state, action) {
  switch (objective.objective_rule) {
    case "payment_completed":
      return action === "end" || state.lastAction === "end";
    case "customizations_added":
      return Array.isArray(state.selectedCustomizations) && state.selectedCustomizations.length > 0;
    case "clarification_requested":
      return Number(state.clarificationCount || 0) > 0;
    case "selected_item":
    default:
      return Boolean(state.selectedItem);
  }
}

function computeObjectiveChecks(objectives, state, action) {
  const checkedObjectiveIds = [];

  for (const objective of objectives) {
    if (objectiveMatchesState(objective, state, action)) {
      checkedObjectiveIds.push(objective.objective_id);
      continue;
    }

    break;
  }

  return checkedObjectiveIds;
}

function upsertSessionAnalytics({ sessionId, state, totalQuestions }) {
  const averageResponseTime = Number(state.averageResponseTimeSeconds || 0);
  const longestResponseTime = Number(state.longestResponseTimeSeconds || averageResponseTime);
  const shortestResponseTime = Number(
    state.shortestResponseTimeSeconds ||
      (averageResponseTime ? averageResponseTime : 0),
  );
  const successRate = totalQuestions
    ? Number((state.successfulFirstAttempts || 0) / totalQuestions)
    : 0;

  db.prepare(`
    INSERT INTO session_analytics (
      session_id, avg_response_time, longest_response_time, shortest_response_time,
      success_rate, longest_question_id, shortest_question_id
    )
    VALUES (?, ?, ?, ?, ?, NULL, NULL)
    ON CONFLICT(session_id) DO UPDATE SET
      avg_response_time = excluded.avg_response_time,
      longest_response_time = excluded.longest_response_time,
      shortest_response_time = excluded.shortest_response_time,
      success_rate = excluded.success_rate
  `).run(
    sessionId,
    averageResponseTime,
    longestResponseTime,
    shortestResponseTime,
    successRate,
  );
}

/**
 * Creates a new session row to track one child practice run from start to finish.
 */
export function createSession({ scenarioId, childId, childName = "" }) {
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const normalizedChildName = String(childName || "").trim();

  if (normalizedChildName) {
    db.prepare(`
      UPDATE children
      SET name = ?
      WHERE child_id = ?
    `).run(normalizedChildName, childId);
  }

  db.prepare(`
    INSERT INTO sessions (session_id, child_id, scenario_id, start_time)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, childId, scenarioId, now);

  const objectives = db
    .prepare("SELECT objective_id FROM objectives WHERE scenario_id = ? ORDER BY position")
    .all(scenarioId);

  const insertCompletion = db.prepare(`
    INSERT INTO objective_completion (completion_id, session_id, objective_id, is_checked)
    VALUES (?, ?, ?, 0)
  `);

  objectives.forEach((objective) => {
    insertCompletion.run(randomUUID(), sessionId, objective.objective_id);
  });

  saveStoredState(sessionId, {
    selectedItem: "",
    selectedCustomizations: [],
    pendingPayment: false,
    lastAction: "greet",
    objectiveCompleted: false,
    hintsUsed: 0,
    clarificationCount: 0,
    averageResponseTimeSeconds: 0,
    longestResponseTimeSeconds: 0,
    shortestResponseTimeSeconds: 0,
    successfulFirstAttempts: 0,
  });

  return sessionId;
}

/**
 * Appends an assistant turn as an interaction row and keeps the message metadata embedded for reconstruction.
 */
export function addInteraction({ sessionId, questionText, action, metadata = {} }) {
  const interactionId = randomUUID();

  db.prepare(`
    INSERT INTO interactions (interaction_id, session_id, question_text, asked_at)
    VALUES (?, ?, ?, ?)
  `).run(
    interactionId,
    sessionId,
    JSON.stringify({
      displayText: questionText,
      action,
      ...metadata,
    }),
    new Date().toISOString(),
  );

  return interactionId;
}

/**
 * Stores a child response against the current interaction with basic attempt metadata.
 */
export function recordResponse({
  interactionId,
  responseText,
  inputMode = "text",
  responseTimeSeconds = 0,
  usedPrompt = false,
  isSuccessful = false,
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
 * Persists the derived session state and syncs the summary columns used by caregiver history pages.
 */
export function updateSessionAfterTurn({
  sessionId,
  action,
  statePatch,
  responseTimeMs,
  objectiveCompleted,
  clarificationIncrement = 0,
  hintIncrement = 0,
  successfulFirstAttempt = false,
}) {
  const session = loadSession(sessionId);
  const currentState = loadStoredState(sessionId);
  const objectives = loadScenarioObjectives(session.scenario_id);
  const nextTotalQuestions = session.total_questions + (action === "greet" ? 0 : 1);
  const nextSuccessfulFirstAttempts =
    (currentState.successfulFirstAttempts || 0) + (successfulFirstAttempt ? 1 : 0);
  const responseTimeSeconds = Number((responseTimeMs || 0) / 1000);
  const measuredResponses = currentState.measuredResponses || 0;
  const nextMeasuredResponses = responseTimeMs ? measuredResponses + 1 : measuredResponses;

  const averageResponseTimeSeconds = nextMeasuredResponses
    ? (
        ((currentState.averageResponseTimeSeconds || 0) * measuredResponses + responseTimeSeconds) /
        nextMeasuredResponses
      )
    : currentState.averageResponseTimeSeconds || 0;

  const nextState = {
    ...currentState,
    ...statePatch,
    lastAction: action,
    objectiveCompleted: Boolean(objectiveCompleted),
    hintsUsed: (currentState.hintsUsed || 0) + hintIncrement,
    clarificationCount: (currentState.clarificationCount || 0) + clarificationIncrement,
    successfulFirstAttempts: nextSuccessfulFirstAttempts,
    averageResponseTimeSeconds,
    longestResponseTimeSeconds: Math.max(currentState.longestResponseTimeSeconds || 0, responseTimeSeconds),
    shortestResponseTimeSeconds:
      currentState.shortestResponseTimeSeconds == null || currentState.shortestResponseTimeSeconds === 0
        ? responseTimeSeconds
        : Math.min(currentState.shortestResponseTimeSeconds, responseTimeSeconds),
    measuredResponses: nextMeasuredResponses,
  };

  const checkedObjectiveIds = computeObjectiveChecks(objectives, nextState, action);
  nextState.completedObjectiveIds = checkedObjectiveIds;
  nextState.completedObjectiveCount = checkedObjectiveIds.length;
  nextState.objectiveCompleted = objectives.length
    ? checkedObjectiveIds.length >= objectives.length
    : Boolean(objectiveCompleted);

  saveStoredState(sessionId, nextState);

  db.prepare(`
    UPDATE sessions
    SET total_questions = ?, successful_first_attempts = ?, xp_earned = ?
    WHERE session_id = ?
  `).run(
    nextTotalQuestions,
    nextSuccessfulFirstAttempts,
    objectiveCompleted ? 120 : session.xp_earned,
    sessionId,
  );

  db.prepare(`
    UPDATE objective_completion
    SET is_checked = CASE
      WHEN objective_id IN (${checkedObjectiveIds.map(() => "?").join(", ") || "NULL"}) THEN 1
      ELSE 0
    END
    WHERE session_id = ?
  `).run(...checkedObjectiveIds, sessionId);

  upsertSessionAnalytics({
    sessionId,
    state: nextState,
    totalQuestions: nextTotalQuestions,
  });
}

/**
 * Marks a session as finished and awards the final XP used by the completion screen and caregiver history.
 */
export function endSession({ sessionId, xpEarned = 120 }) {
  db.prepare(`
    UPDATE sessions
    SET end_time = ?, xp_earned = ?
    WHERE session_id = ?
  `).run(new Date().toISOString(), xpEarned, sessionId);
}

/**
 * Aggregates top-level caregiver analytics and recent session history from the new schema tables.
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
        s.session_id,
        s.child_id,
        c.name AS child_name,
        s.start_time,
        s.end_time,
        s.xp_earned,
        sa.success_rate,
        sa.avg_response_time
      FROM sessions s
      LEFT JOIN children c ON c.child_id = s.child_id
      LEFT JOIN session_analytics sa ON s.session_id = sa.session_id
      ORDER BY s.start_time DESC
      LIMIT 10
    `)
    .all()
    .map((session) => {
      const runtime = loadSession(session.session_id);
      return {
        sessionId: session.session_id,
        childId: session.child_id,
        childName: session.child_name || "Sample Child",
        startTime: session.start_time,
        endTime: session.end_time,
        xpEarned: session.xp_earned || 0,
        successRate: session.success_rate || 0,
        avgResponseTime: session.avg_response_time || 0,
        objectiveCompleted: Boolean(runtime.objective_completed),
        selectedItem: runtime.selected_item || "",
        hintsUsed: runtime.hints_used || 0,
        clarificationCount: runtime.clarification_count || 0,
      };
    });

  return {
    summary: {
      totalSessions: aggregate.totalSessions || 0,
      averageResponseTime: aggregate.averageResponseTime || 0,
      averageSuccessRate: aggregate.averageSuccessRate || 0,
    },
    recentSessions,
  };
}
