import bcryptjs from "bcryptjs";
import {
  DEFAULT_AVATAR_IMAGE_URL,
  DEFAULT_AVATAR_TYPE,
  DEFAULT_BACKGROUND_NOISE,
  DEFAULT_CONTINGENCIES,
  DEFAULT_HINT_DELAY_SECONDS,
  DEFAULT_LOCATION_IMAGE_URL,
  DEFAULT_LOCATION_NAME,
  DEFAULT_AI_PERSONALITY_PROMPT,
  DEFAULT_OBJECTIVES,
} from "./scenarioDefaults.js";

// Stable IDs for seed data - using strings instead of randomUUID for reproducibility
export const caregiverId = "caregiver-001";
export const caregiverUserId = "user-caregiver-001";
export const childId = "child-001";
export const childUserId = "user-child-001";
export const scenarioId = "scenario-001";
export const settingsId = "settings-001";
export const objective1Id = "objective-001";
export const objective2Id = "objective-002";

// Hash password "demo123"
const hashedPassword = bcryptjs.hashSync("demo123", 10);

export const caregiverUserSeed = {
  user_id: caregiverUserId,
  role: "caregiver",
};

export const caregiverSeed = {
  caregiver_id: caregiverId,
  user_id: caregiverUserId,
  email: "teacher@example.com",
  password_hash: hashedPassword,
};

export const childUserSeed = {
  user_id: childUserId,
  role: "child",
};

export const childSeed = {
  child_id: childId,
  user_id: childUserId,
  caregiver_id: caregiverId,
  name: "Sample Child",
  xp: 0,
};

export const scenarioSeed = {
  scenario_id: scenarioId,
  title: "Western Stall at School Canteen",
  created_by: caregiverId,
  is_active: 1,
};

export const scenarioSettingsSeed = {
  settings_id: settingsId,
  scenario_id: scenarioId,
  location_name: DEFAULT_LOCATION_NAME,
  location_image_url: DEFAULT_LOCATION_IMAGE_URL,
  avatar_type: DEFAULT_AVATAR_TYPE,
  avatar_image_url: DEFAULT_AVATAR_IMAGE_URL,
  background_noise: DEFAULT_BACKGROUND_NOISE,
  hint_delay_seconds: DEFAULT_HINT_DELAY_SECONDS,
  ai_personality_prompt: DEFAULT_AI_PERSONALITY_PROMPT,
  contingencies: DEFAULT_CONTINGENCIES,
};

export const objectivesSeed = [
  {
    objective_id: objective1Id,
    scenario_id: scenarioId,
    description: DEFAULT_OBJECTIVES[0].description,
    objective_rule: DEFAULT_OBJECTIVES[0].objective_rule,
    position: 1,
    is_required: 1,
  },
  {
    objective_id: objective2Id,
    scenario_id: scenarioId,
    description: DEFAULT_OBJECTIVES[1].description,
    objective_rule: DEFAULT_OBJECTIVES[1].objective_rule,
    position: 2,
    is_required: 1,
  },
];
