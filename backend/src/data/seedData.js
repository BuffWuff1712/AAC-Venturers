import bcryptjs from "bcryptjs";

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
  location_name: "Western Stall at School Canteen",
  location_image_url: "/images/western-stall.jpg",
  background_noise: 20,
  ai_personality_prompt: "You are a friendly and patient western food stall owner at a school canteen. Be personable and familiar with the children.",
  contingencies: "If the child struggles, offer to show them a menu or ask them to point to what they want.",
};

export const objectivesSeed = [
  {
    objective_id: objective1Id,
    scenario_id: scenarioId,
    description: "Order at least one menu item clearly",
    position: 1,
    is_required: 1,
  },
  {
    objective_id: objective2Id,
    scenario_id: scenarioId,
    description: "Complete the purchase interaction",
    position: 2,
    is_required: 1,
  },
];
