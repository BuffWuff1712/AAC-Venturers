import { db } from "../../db/database.js";

/**
 * Loads the caregiver-configured scenario together with the live menu items for the chat turn.
 */
export function loadScenarioContext(scenarioId) {
  const scenario = db.prepare("SELECT * FROM scenarios WHERE id = ?").get(scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  const menu = db
    .prepare("SELECT * FROM menu_items WHERE scenario_id = ? ORDER BY id")
    .all(scenarioId)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      customizations: JSON.parse(item.customizations_json),
    }));

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
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const transcripts = db
    .prepare("SELECT * FROM transcripts WHERE session_id = ? ORDER BY id")
    .all(sessionId)
    .map((row) => ({
      id: row.id,
      speaker: row.speaker,
      action: row.action,
      message: row.message,
      createdAt: row.created_at,
      responseTimeMs: row.response_time_ms,
      metadata: JSON.parse(row.metadata_json),
    }));

  return {
    ...session,
    selectedCustomizations: JSON.parse(session.selected_customizations_json || "[]"),
    sessionState: JSON.parse(session.session_state_json || "{}"),
    transcripts,
  };
}
