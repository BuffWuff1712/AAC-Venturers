import {
  caregiverSeed,
  childMemorySeed,
  menuSeed,
  scenarioSeed,
} from "../data/seedData.js";

export function seedDatabase(db) {
  const insertCaregiver = db.prepare(`
    INSERT INTO caregiver_users (email, password, name)
    VALUES (@email, @password, @name)
    ON CONFLICT(email) DO UPDATE SET
      password = excluded.password,
      name = excluded.name
  `);

  const insertScenario = db.prepare(`
    INSERT INTO scenarios (id, key, name, description, objective, personality, memory_enabled)
    VALUES (@id, @key, @name, @description, @objective, @personality, @memoryEnabled)
    ON CONFLICT(id) DO UPDATE SET
      key = excluded.key,
      name = excluded.name,
      description = excluded.description,
      objective = excluded.objective,
      personality = excluded.personality,
      memory_enabled = excluded.memory_enabled
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (id, scenario_id, name, price, description, customizations_json)
    VALUES (@id, @scenarioId, @name, @price, @description, @customizationsJson)
    ON CONFLICT(id) DO UPDATE SET
      scenario_id = excluded.scenario_id,
      name = excluded.name,
      price = excluded.price,
      description = excluded.description,
      customizations_json = excluded.customizations_json
  `);

  const upsertMemory = db.prepare(`
    INSERT INTO child_memory (scenario_id, child_name, favourite_order)
    VALUES (@scenarioId, @childName, @favouriteOrder)
  `);

  insertCaregiver.run(caregiverSeed);
  insertScenario.run(scenarioSeed);

  const memoryExists = db
    .prepare("SELECT id FROM child_memory WHERE scenario_id = ? AND child_name = ?")
    .get(scenarioSeed.id, childMemorySeed.childName);

  if (!memoryExists) {
    upsertMemory.run({
      scenarioId: scenarioSeed.id,
      childName: childMemorySeed.childName,
      favouriteOrder: childMemorySeed.favouriteOrder,
    });
  }

  menuSeed.forEach((item) => {
    insertMenuItem.run({
      id: item.id,
      scenarioId: scenarioSeed.id,
      name: item.name,
      price: item.price,
      description: item.description,
      customizationsJson: JSON.stringify(item.customizations),
    });
  });
}
