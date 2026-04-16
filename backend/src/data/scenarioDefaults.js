export const DEFAULT_BACKGROUND_NOISE = 20;
export const DEFAULT_HINT_DELAY_SECONDS = 5;
export const DEFAULT_LOCATION_IMAGE_URL = "/images/western-stall.jpg";
export const DEFAULT_AVATAR_TYPE = "store_owner";
export const DEFAULT_AVATAR_IMAGE_URL = "/images/cook.png";
export const DEFAULT_AVATAR_LABEL = "Store Owner";
export const DEFAULT_LOCATION_NAME = "Western Stall at School Canteen";
export const DEFAULT_SCENARIO_DESCRIPTION =
  "Child practises ordering from a western food stall during recess.";
export const DEFAULT_AI_PERSONALITY_PROMPT =
  "You are a friendly and patient western food stall owner at a school canteen. Be personable and familiar with the children.";
export const STUDENT_AI_PERSONALITY_PROMPT =
  "You are a friendly student at the same school canteen. Speak simply, encourage the child gently, and wait patiently for their response.";
export const TEACHER_AI_PERSONALITY_PROMPT =
  "You are a kind and attentive teacher in a school setting. Speak clearly, support the child warmly, and guide the conversation patiently.";
export const DEFAULT_CONTINGENCIES =
  "If the child struggles, offer to show them a menu or ask them to point to what they want.";
export const DEFAULT_OBJECTIVE_DESCRIPTIONS = [
  "Order at least one menu item clearly",
  "Complete the purchase interaction",
];
export const OBJECTIVE_RULES = {
  selected_item: "selected_item",
  customizations_added: "customizations_added",
  clarification_requested: "clarification_requested",
  payment_completed: "payment_completed",
};
export const OBJECTIVE_RULE_OPTIONS = [
  { value: OBJECTIVE_RULES.selected_item, label: "Child selects an item" },
  { value: OBJECTIVE_RULES.customizations_added, label: "Child adds or changes extras" },
  { value: OBJECTIVE_RULES.clarification_requested, label: "Child asks for help or clarification" },
  { value: OBJECTIVE_RULES.payment_completed, label: "Child completes payment" },
];
export const DEFAULT_OBJECTIVES = [
  {
    description: DEFAULT_OBJECTIVE_DESCRIPTIONS[0],
    objective_rule: OBJECTIVE_RULES.selected_item,
  },
  {
    description: DEFAULT_OBJECTIVE_DESCRIPTIONS[1],
    objective_rule: OBJECTIVE_RULES.payment_completed,
  },
];

export const AVATAR_DEFAULTS = {
  store_owner: {
    type: "store_owner",
    label: "Store Owner",
    image: "/images/cook.png",
    prompt: DEFAULT_AI_PERSONALITY_PROMPT,
  },
  student: {
    type: "student",
    label: "Student",
    image: "/images/student.png",
    prompt: STUDENT_AI_PERSONALITY_PROMPT,
  },
  teacher: {
    type: "teacher",
    label: "Teacher",
    image: "/images/teacher.png",
    prompt: TEACHER_AI_PERSONALITY_PROMPT,
  },
  custom: {
    type: "custom",
    label: "Custom Character",
    image: DEFAULT_AVATAR_IMAGE_URL,
    prompt: DEFAULT_AI_PERSONALITY_PROMPT,
  },
};

export function getAvatarDefaults(avatarType = DEFAULT_AVATAR_TYPE, avatarLabel = "") {
  const normalizedType = AVATAR_DEFAULTS[avatarType] ? avatarType : DEFAULT_AVATAR_TYPE;
  const preset = AVATAR_DEFAULTS[normalizedType];
  const normalizedLabel = String(avatarLabel || "").trim() || preset.label;

  return {
    avatarType: normalizedType,
    avatarLabel: normalizedLabel,
    avatarImageUrl: preset.image,
    aiPersonalityPrompt:
      normalizedType === "custom"
        ? buildCustomAvatarPrompt(normalizedLabel)
        : preset.prompt,
  };
}

export function buildCustomAvatarPrompt(avatarLabel = "custom character") {
  const normalizedLabel = String(avatarLabel || "").trim() || "custom character";
  return `You are ${normalizedLabel}. Speak clearly, stay in character, and support the child with a warm and patient tone.`;
}

export function inferObjectiveRule(description = "") {
  const normalized = String(description || "").toLowerCase();

  if (/purchase|payment|pay|checkout/.test(normalized)) {
    return OBJECTIVE_RULES.payment_completed;
  }

  if (/custom|change|preference|add-on|addon|extra|side|sauce/.test(normalized)) {
    return OBJECTIVE_RULES.customizations_added;
  }

  if (/clarif|help|question|repeat|rephrase/.test(normalized)) {
    return OBJECTIVE_RULES.clarification_requested;
  }

  return OBJECTIVE_RULES.selected_item;
}

export function normalizeObjectives(objectives = []) {
  return objectives
    .map((objective) => {
      if (typeof objective === "string") {
        const description = objective.replace(/^\s*\d+\.\s*/, "").trim();
        return description
          ? {
              description,
              objectiveRule: inferObjectiveRule(description),
            }
          : null;
      }

      const description = String(objective?.description || "")
        .replace(/^\s*\d+\.\s*/, "")
        .trim();

      if (!description) {
        return null;
      }

      const objectiveRule = String(
        objective?.objective_rule || objective?.objectiveRule || inferObjectiveRule(description),
      ).trim();

      return {
        ...objective,
        description,
        objectiveRule:
          OBJECTIVE_RULE_OPTIONS.some((option) => option.value === objectiveRule)
            ? objectiveRule
            : inferObjectiveRule(description),
      };
    })
    .filter(Boolean);
}

export function normalizeObjectiveDescriptions(objectives = []) {
  return normalizeObjectives(objectives).map((objective) => objective.description);
}

export function buildDefaultScenarioSettings({ scenarioId, title } = {}) {
  const avatarDefaults = getAvatarDefaults();

  return {
    settings_id: `settings-${scenarioId || "default"}`,
    scenario_id: scenarioId || "",
    location_name: title || DEFAULT_LOCATION_NAME,
    scenario_description: DEFAULT_SCENARIO_DESCRIPTION,
    location_image_url: DEFAULT_LOCATION_IMAGE_URL,
    avatar_type: avatarDefaults.avatarType,
    avatar_label: avatarDefaults.avatarLabel,
    avatar_image_url: avatarDefaults.avatarImageUrl,
    background_noise: DEFAULT_BACKGROUND_NOISE,
    hint_delay_seconds: DEFAULT_HINT_DELAY_SECONDS,
    ai_personality_prompt: avatarDefaults.aiPersonalityPrompt,
    contingencies: DEFAULT_CONTINGENCIES,
  };
}

export function buildDefaultObjectives(scenarioId) {
  return DEFAULT_OBJECTIVES.map((objective, index) => ({
    objective_id: `${scenarioId || "scenario"}-objective-${index + 1}`,
    scenario_id: scenarioId || "",
    description: objective.description,
    objective_rule: objective.objective_rule,
    position: index + 1,
    is_required: 1,
  }));
}

export function mergeScenarioSettings(settings = {}, fallbackSettings = {}) {
  const fallbackAvatarDefaults = getAvatarDefaults(
    fallbackSettings.avatar_type,
    fallbackSettings.avatar_label,
  );
  const currentAvatarDefaults = getAvatarDefaults(
    settings.avatar_type || fallbackAvatarDefaults.avatarType,
    settings.avatar_label || fallbackAvatarDefaults.avatarLabel,
  );

  return {
    ...fallbackSettings,
    ...settings,
    location_name:
      settings.location_name?.trim() || fallbackSettings.location_name || DEFAULT_LOCATION_NAME,
    scenario_description:
      settings.scenario_description?.trim() ||
      fallbackSettings.scenario_description ||
      DEFAULT_SCENARIO_DESCRIPTION,
    location_image_url:
      settings.location_image_url?.trim() ||
      fallbackSettings.location_image_url ||
      DEFAULT_LOCATION_IMAGE_URL,
    avatar_type:
      currentAvatarDefaults.avatarType,
    avatar_label:
      settings.avatar_label?.trim() ||
      fallbackSettings.avatar_label ||
      currentAvatarDefaults.avatarLabel ||
      DEFAULT_AVATAR_LABEL,
    avatar_image_url:
      settings.avatar_image_url?.trim() ||
      fallbackSettings.avatar_image_url ||
      currentAvatarDefaults.avatarImageUrl,
    background_noise:
      typeof settings.background_noise === "number"
        ? settings.background_noise
        : fallbackSettings.background_noise ?? DEFAULT_BACKGROUND_NOISE,
    hint_delay_seconds:
      typeof settings.hint_delay_seconds === "number"
        ? settings.hint_delay_seconds
        : Number.isFinite(Number(settings.hint_delay_seconds))
          ? Number(settings.hint_delay_seconds)
          : fallbackSettings.hint_delay_seconds ?? DEFAULT_HINT_DELAY_SECONDS,
    ai_personality_prompt:
      settings.ai_personality_prompt?.trim() ||
      fallbackSettings.ai_personality_prompt ||
      currentAvatarDefaults.aiPersonalityPrompt,
    contingencies:
      settings.contingencies?.trim() ||
      fallbackSettings.contingencies ||
      DEFAULT_CONTINGENCIES,
  };
}

export function mergeObjectives(objectives = [], scenarioId) {
  const normalized = normalizeObjectives(objectives);
  const source = normalized.length
    ? normalized.map((objective, index) => ({
        objective_id:
          typeof objectives[index] === "object" && objectives[index]?.objective_id
            ? objectives[index].objective_id
            : `${scenarioId}-objective-${index + 1}`,
        scenario_id: scenarioId,
        description: objective.description,
        objective_rule:
          objective.objectiveRule ||
          inferObjectiveRule(objective.description),
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
    objective_rule: objective.objective_rule || inferObjectiveRule(objective.description),
  }));
}

export function buildObjectiveText(objectives = []) {
  const descriptions = normalizeObjectiveDescriptions(objectives);
  if (!descriptions.length) {
    return "Order food and complete the purchase interaction.";
  }

  return descriptions.join(" Then ");
}
