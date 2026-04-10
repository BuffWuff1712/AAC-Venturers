export const DEFAULT_BACKGROUND_NOISE = 20;
export const DEFAULT_LOCATION_IMAGE_URL = "/images/western-stall.jpg";
export const DEFAULT_LOCATION_NAME = "Western Stall at School Canteen";
export const DEFAULT_SCENARIO_DESCRIPTION =
  "Child practises ordering from a western food stall during recess.";
export const DEFAULT_AI_PERSONALITY_PROMPT =
  "You are a friendly and patient western food stall owner at a school canteen. Be personable and familiar with the children.";
export const DEFAULT_CONTINGENCIES =
  "If the child struggles, offer to show them a menu or ask them to point to what they want.";
export const DEFAULT_OBJECTIVE_DESCRIPTIONS = [
  "Order at least one menu item clearly",
  "Complete the purchase interaction",
];

export function normalizeObjectiveDescriptions(objectives = []) {
  return objectives
    .map((objective) =>
      typeof objective === "string" ? objective : objective?.description || "",
    )
    .map((description) =>
      String(description)
        .replace(/^\s*\d+\.\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

export function buildDefaultScenarioSettings({ scenarioId, title } = {}) {
  return {
    settings_id: `settings-${scenarioId || "default"}`,
    scenario_id: scenarioId || "",
    location_name: title || DEFAULT_LOCATION_NAME,
    location_image_url: DEFAULT_LOCATION_IMAGE_URL,
    background_noise: DEFAULT_BACKGROUND_NOISE,
    ai_personality_prompt: DEFAULT_AI_PERSONALITY_PROMPT,
    contingencies: DEFAULT_CONTINGENCIES,
  };
}

export function buildDefaultObjectives(scenarioId) {
  return DEFAULT_OBJECTIVE_DESCRIPTIONS.map((description, index) => ({
    objective_id: `${scenarioId || "scenario"}-objective-${index + 1}`,
    scenario_id: scenarioId || "",
    description,
    position: index + 1,
    is_required: 1,
  }));
}

export function mergeScenarioSettings(settings = {}, fallbackSettings = {}) {
  return {
    ...fallbackSettings,
    ...settings,
    location_name:
      settings.location_name?.trim() || fallbackSettings.location_name || DEFAULT_LOCATION_NAME,
    location_image_url:
      settings.location_image_url?.trim() ||
      fallbackSettings.location_image_url ||
      DEFAULT_LOCATION_IMAGE_URL,
    background_noise:
      typeof settings.background_noise === "number"
        ? settings.background_noise
        : fallbackSettings.background_noise ?? DEFAULT_BACKGROUND_NOISE,
    ai_personality_prompt:
      settings.ai_personality_prompt?.trim() ||
      fallbackSettings.ai_personality_prompt ||
      DEFAULT_AI_PERSONALITY_PROMPT,
    contingencies:
      settings.contingencies?.trim() ||
      fallbackSettings.contingencies ||
      DEFAULT_CONTINGENCIES,
  };
}

export function mergeObjectives(objectives = [], scenarioId) {
  const normalized = normalizeObjectiveDescriptions(objectives);
  const source = normalized.length
    ? normalized.map((description, index) => ({
        objective_id:
          typeof objectives[index] === "object" && objectives[index]?.objective_id
            ? objectives[index].objective_id
            : `${scenarioId}-objective-${index + 1}`,
        scenario_id: scenarioId,
        description,
        position: index + 1,
        is_required:
          typeof objectives[index] === "object"
            ? Number(objectives[index]?.is_required ?? objectives[index]?.isRequired ?? 1)
            : 1,
      }))
    : buildDefaultObjectives(scenarioId);

  return source.map((objective, index) => ({
    ...objective,
    position: objective.position ?? index + 1,
    is_required: Number(objective.is_required ?? 1),
  }));
}

export function buildObjectiveText(objectives = []) {
  const descriptions = normalizeObjectiveDescriptions(objectives);
  if (!descriptions.length) {
    return "Order food and complete the purchase interaction.";
  }

  return descriptions.join(" Then ");
}
