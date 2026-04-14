import {
  caregiverSeed,
  caregiverUserSeed,
  childSeed,
  childUserSeed,
  scenarioSeed,
  scenarioSettingsSeed,
  objectivesSeed,
} from "../data/seedData.js";

/**
 * Inserts or updates the prototype's default caregiver, scenario, menu, and memory data.
 */
export function seedDatabase(db) {
  // Insert users
  const upsertUser = db.prepare(`
    INSERT INTO users (user_id, role)
    VALUES (@user_id, @role)
    ON CONFLICT(user_id) DO UPDATE SET
      role = excluded.role
  `);

  upsertUser.run(caregiverUserSeed);
  upsertUser.run(childUserSeed);

  // Insert caregivers
  const upsertCaregiver = db.prepare(`
    INSERT INTO caregivers (caregiver_id, user_id, email, password_hash)
    VALUES (@caregiver_id, @user_id, @email, @password_hash)
    ON CONFLICT(caregiver_id) DO UPDATE SET
      user_id = excluded.user_id,
      email = excluded.email,
      password_hash = excluded.password_hash
  `);

  upsertCaregiver.run(caregiverSeed);

  // Insert children
  const upsertChild = db.prepare(`
    INSERT INTO children (child_id, user_id, caregiver_id, name, xp)
    VALUES (@child_id, @user_id, @caregiver_id, @name, @xp)
    ON CONFLICT(child_id) DO UPDATE SET
      user_id = excluded.user_id,
      caregiver_id = excluded.caregiver_id,
      name = excluded.name,
      xp = excluded.xp
  `);

  upsertChild.run(childSeed);

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
      avatar_type, avatar_image_url, background_noise, hint_delay_seconds, ai_personality_prompt, contingencies
    )
    VALUES (@settings_id, @scenario_id, @location_name, @location_image_url,
            @avatar_type, @avatar_image_url, @background_noise, @hint_delay_seconds, @ai_personality_prompt, @contingencies)
  `);

  insertSettings.run(scenarioSettingsSeed);

  // Insert objectives
  const insertObjective = db.prepare(`
    INSERT OR IGNORE INTO objectives (objective_id, scenario_id, description, objective_rule, position, is_required)
    VALUES (@objective_id, @scenario_id, @description, @objective_rule, @position, @is_required)
  `);

  objectivesSeed.forEach((objective) => {
    insertObjective.run(objective);
  });
}
