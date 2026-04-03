import {
  caregiverSeed,
  caregiverUserSeed,
  childSeed,
  childUserSeed,
  scenarioSeed,
  scenarioSettingsSeed,
  objectivesSeed,
} from "../data/seedData.js";

export function seedDatabase(db) {
  // Insert users
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (user_id, role)
    VALUES (@user_id, @role)
  `);

  insertUser.run(caregiverUserSeed);
  insertUser.run(childUserSeed);

  // Insert caregivers
  const insertCaregiver = db.prepare(`
    INSERT OR IGNORE INTO caregivers (caregiver_id, user_id, email, password_hash)
    VALUES (@caregiver_id, @user_id, @email, @password_hash)
  `);

  insertCaregiver.run(caregiverSeed);

  // Insert children
  const insertChild = db.prepare(`
    INSERT OR IGNORE INTO children (child_id, user_id, caregiver_id, name, xp)
    VALUES (@child_id, @user_id, @caregiver_id, @name, @xp)
  `);

  insertChild.run(childSeed);

  // Insert scenarios
  const insertScenario = db.prepare(`
    INSERT OR IGNORE INTO scenarios (scenario_id, title, created_by, is_active)
    VALUES (@scenario_id, @title, @created_by, @is_active)
  `);

  insertScenario.run(scenarioSeed);

  // Insert scenario settings
  const insertSettings = db.prepare(`
    INSERT OR IGNORE INTO scenario_settings (
      settings_id, scenario_id, location_name, location_image_url,
      background_noise, ai_personality_prompt, contingencies
    )
    VALUES (@settings_id, @scenario_id, @location_name, @location_image_url,
            @background_noise, @ai_personality_prompt, @contingencies)
  `);

  insertSettings.run(scenarioSettingsSeed);

  // Insert objectives
  const insertObjective = db.prepare(`
    INSERT OR IGNORE INTO objectives (objective_id, scenario_id, description, position, is_required)
    VALUES (@objective_id, @scenario_id, @description, @position, @is_required)
  `);

  objectivesSeed.forEach((objective) => {
    insertObjective.run(objective);
  });
}
