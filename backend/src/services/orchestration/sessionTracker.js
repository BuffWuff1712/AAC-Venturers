import { db } from "../../db/database.js";
import { randomUUID } from "crypto";

export function createSession({ scenarioId, childId }) {
  const sessionId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (session_id, child_id, scenario_id, start_time)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, childId, scenarioId, now);

  return sessionId;
}

export function addInteraction({
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

export function endSession(sessionId, xpEarned) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE sessions
    SET end_time = ?, xp_earned = ?
    WHERE session_id = ?
  `).run(now, xpEarned, sessionId);

  // Calculate and store analytics
  const session = db.prepare("SELECT * FROM sessions WHERE session_id = ?").get(sessionId);
  const interactions = db
    .prepare("SELECT * FROM interactions WHERE session_id = ?")
    .all(sessionId);

  if (interactions.length > 0) {
    let totalResponseTime = 0;
    let longestTime = 0;
    let shortestTime = Infinity;
    let successCount = 0;

    for (const interaction of interactions) {
      const responses = db
        .prepare("SELECT * FROM responses WHERE interaction_id = ?")
        .all(interaction.interaction_id);

      for (const response of responses) {
        const time = response.response_time_seconds || 0;
        totalResponseTime += time;
        longestTime = Math.max(longestTime, time);
        shortestTime = Math.min(shortestTime, time);

        if (response.is_successful) {
          successCount++;
        }
      }
    }

    const avgResponseTime = totalResponseTime / interactions.length;
    const successRate = successCount / interactions.length;

    db.prepare(`
      INSERT INTO session_analytics (
        session_id, avg_response_time, longest_response_time,
        shortest_response_time, success_rate
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        avg_response_time = excluded.avg_response_time,
        longest_response_time = excluded.longest_response_time,
        shortest_response_time = excluded.shortest_response_time,
        success_rate = excluded.success_rate
    `).run(sessionId, avgResponseTime, longestTime, shortestTime || 0, successRate);
  }
}

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
