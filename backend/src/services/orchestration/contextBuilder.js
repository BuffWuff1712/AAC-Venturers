import { db } from "../../db/database.js";
import { childId as seededChildId } from "../../data/seedData.js";
import { westernStallMenu } from "../../data/menuCatalog.js";
import {
  buildDefaultScenarioSettings,
  buildObjectiveText,
  mergeObjectives,
  mergeScenarioSettings,
} from "../../data/scenarioDefaults.js";

function inferPersonality(aiPrompt = "") {
  const normalized = String(aiPrompt || "").toLowerCase();
  if (normalized.includes("hard of hearing")) {
    return "hard_of_hearing";
  }
  if (normalized.includes("impatient") || normalized.includes("busy")) {
    return "impatient";
  }
  return "personable_familiar";
}

function inferMemoryEnabled(aiPrompt = "", contingencies = "") {
  const combined = `${aiPrompt} ${contingencies}`.toLowerCase();
  return combined.includes("usual") || combined.includes("familiar") || combined.includes("remember");
}

function parseStoredSessionState(rawTranscript = "") {
  if (!rawTranscript) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawTranscript);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function buildTranscripts(interactions = []) {
  const transcripts = [];

  for (const interaction of interactions) {
    transcripts.push({
      speaker: "assistant",
      action: interaction.action || "greet",
      message: interaction.questionText,
      createdAt: interaction.askedAt,
      metadata: interaction.metadata || {},
    });

    for (const response of interaction.responses || []) {
      transcripts.push({
        speaker: "child",
        action: null,
        message: response.responseText,
        createdAt: response.createdAt,
        metadata: {
          inputMode: response.inputMode,
          usedPrompt: response.usedPrompt,
          isSuccessful: response.isSuccessful,
        },
      });
    }
  }

  return transcripts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Loads the caregiver-configured scenario together with the fixed western-stall menu used by the role-play.
 */
export function loadScenarioContext(scenarioId) {
  const scenario = db.prepare("SELECT * FROM scenarios WHERE scenario_id = ?").get(scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  const storedSettings = db
    .prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?")
    .get(scenarioId) || {};

  const storedObjectives = db
    .prepare("SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position")
    .all(scenarioId);

  const settings = mergeScenarioSettings(
    storedSettings,
    buildDefaultScenarioSettings({ scenarioId, title: scenario.title }),
  );
  const objectives = mergeObjectives(storedObjectives, scenarioId);
  const objectiveText = buildObjectiveText(objectives);

  return {
    scenario: {
      id: scenario.scenario_id,
      scenarioId: scenario.scenario_id,
      key: scenario.scenario_id,
      name: scenario.title,
      title: scenario.title,
      description:
        settings.location_name || "Child practises ordering from a western food stall during recess.",
      objective: objectiveText,
      personality: inferPersonality(settings.ai_personality_prompt),
      memoryEnabled: inferMemoryEnabled(settings.ai_personality_prompt, settings.contingencies),
      locationName: settings.location_name || scenario.title,
      locationImageUrl: settings.location_image_url || "",
      backgroundNoise: settings.background_noise ?? 20,
      aiPersonalityPrompt: settings.ai_personality_prompt || "",
      contingencies: settings.contingencies || "",
      objectives: objectives.map((objective) => ({
        objectiveId: objective.objective_id,
        description: objective.description,
        objectiveRule: objective.objective_rule,
        position: objective.position,
        isRequired: Boolean(objective.is_required),
      })),
    },
    menu: westernStallMenu,
  };
}

/**
 * Resolves the child’s usual order from completed session state, falling back to the seeded demo order.
 */
export function loadChildMemory(scenarioId, childIdentifier, enabled) {
  if (!enabled) {
    return null;
  }

  const child = db
    .prepare(`
      SELECT child_id, name
      FROM children
      WHERE child_id = ? OR lower(name) = lower(?)
      LIMIT 1
    `)
    .get(childIdentifier, childIdentifier);

  const resolvedChildId = child?.child_id || seededChildId;
  const resolvedChildName = child?.name || "Sample Child";

  const completedSessionRows = db
    .prepare(`
      SELECT s.session_id, sr.transcript
      FROM sessions s
      LEFT JOIN session_recordings sr ON s.session_id = sr.session_id
      WHERE s.scenario_id = ? AND s.child_id = ? AND s.end_time IS NOT NULL
      ORDER BY s.end_time DESC
    `)
    .all(scenarioId, resolvedChildId);

  const frequency = new Map();

  for (const row of completedSessionRows) {
    const state = parseStoredSessionState(row.transcript);
    const item = state.selectedItem || "";
    const customizations = Array.isArray(state.selectedCustomizations)
      ? state.selectedCustomizations.filter((value) => value && value !== "no customisations")
      : [];

    if (!item) {
      continue;
    }

    const label = customizations.length ? `${item}, ${customizations.join(", ")}` : item;
    frequency.set(label, (frequency.get(label) || 0) + 1);
  }

  const [usualOrder = "Chicken Chop, no coleslaw, chilli on the side", orderCount = 0] =
    [...frequency.entries()].sort((a, b) => b[1] - a[1])[0] || [];

  return {
    childId: resolvedChildId,
    childName: resolvedChildName,
    favouriteOrder: usualOrder,
    source: orderCount ? "history" : "seed",
    orderCount,
  };
}

/**
 * Loads a session together with its interactions, child responses, and stored runtime state snapshot.
 */
export function loadSession(sessionId) {
  const session = db.prepare("SELECT * FROM sessions WHERE session_id = ?").get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const child = db
    .prepare("SELECT child_id, name FROM children WHERE child_id = ?")
    .get(session.child_id);

  const storedStateRow = db
    .prepare("SELECT transcript FROM session_recordings WHERE session_id = ?")
    .get(sessionId);

  const storedState = parseStoredSessionState(storedStateRow?.transcript);

  const interactions = db
    .prepare("SELECT * FROM interactions WHERE session_id = ? ORDER BY asked_at, interaction_id")
    .all(sessionId)
    .map((row) => {
      const metadata = parseStoredSessionState(row.question_text);
      const questionText =
        typeof metadata === "object" && metadata && metadata.displayText
          ? metadata.displayText
          : row.question_text;

      return {
        interactionId: row.interaction_id,
        questionText,
        action: metadata.action || "greet",
        askedAt: row.asked_at,
        metadata,
        responses: db
          .prepare("SELECT * FROM responses WHERE interaction_id = ? ORDER BY created_at, response_id")
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
      };
    });

  const objectiveProgress = db
    .prepare(`
      SELECT oc.objective_id, oc.is_checked, o.description, o.position
      FROM objective_completion oc
      INNER JOIN objectives o ON o.objective_id = oc.objective_id
      WHERE oc.session_id = ?
      ORDER BY o.position, o.objective_id
    `)
    .all(sessionId)
    .map((row) => ({
      objectiveId: row.objective_id,
      description: row.description,
      position: row.position,
      isChecked: Boolean(row.is_checked),
    }));

  const transcripts = buildTranscripts(interactions);
  const lastAssistantInteraction = [...interactions].reverse().find((interaction) => interaction.questionText);

  return {
    sessionId: session.session_id,
    session_id: session.session_id,
    childId: session.child_id,
    child_id: session.child_id,
    childName: child?.name || "Sample Child",
    child_name: child?.name || "Sample Child",
    scenarioId: session.scenario_id,
    scenario_id: session.scenario_id,
    startTime: session.start_time,
    start_time: session.start_time,
    endTime: session.end_time,
    end_time: session.end_time,
    totalQuestions: session.total_questions || interactions.length,
    total_questions: session.total_questions || interactions.length,
    successfulFirstAttempts: session.successful_first_attempts || 0,
    successful_first_attempts: session.successful_first_attempts || 0,
    xpEarned: session.xp_earned || 0,
    xp_earned: session.xp_earned || 0,
    status: session.end_time ? "completed" : "active",
    objective_completed: Boolean(storedState.objectiveCompleted),
    selected_item: storedState.selectedItem || "",
    selectedItem: storedState.selectedItem || "",
    selected_customizations_json: JSON.stringify(storedState.selectedCustomizations || []),
    selectedCustomizations: storedState.selectedCustomizations || [],
    pending_payment: storedState.pendingPayment ? 1 : 0,
    pendingPayment: storedState.pendingPayment ? 1 : 0,
    last_action: storedState.lastAction || lastAssistantInteraction?.action || "greet",
    lastAction: storedState.lastAction || lastAssistantInteraction?.action || "greet",
    total_turns: interactions.length + transcripts.filter((entry) => entry.speaker === "child").length,
    totalTurns: interactions.length + transcripts.filter((entry) => entry.speaker === "child").length,
    average_response_time_ms: Math.round((storedState.averageResponseTimeSeconds || 0) * 1000),
    averageResponseTimeMs: Math.round((storedState.averageResponseTimeSeconds || 0) * 1000),
    hints_used: storedState.hintsUsed || 0,
    clarification_count: storedState.clarificationCount || 0,
    objective_progress: objectiveProgress,
    objectiveProgress,
    completed_objective_count:
      storedState.completedObjectiveCount ||
      objectiveProgress.filter((objective) => objective.isChecked).length,
    completedObjectiveCount:
      storedState.completedObjectiveCount ||
      objectiveProgress.filter((objective) => objective.isChecked).length,
    sessionState: storedState,
    interactions,
    transcripts,
  };
}
