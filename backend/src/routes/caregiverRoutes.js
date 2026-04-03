import { Router } from "express";
import { db } from "../db/database.js";
import { getAnalyticsSummary } from "../services/orchestration/sessionTracker.js";

export const caregiverRoutes = Router();

// Returns the single editable caregiver scenario and its menu configuration.
caregiverRoutes.get("/scenario", (req, res) => {
  const scenario = db.prepare("SELECT * FROM scenarios WHERE id = 1").get();
  const menu = db.prepare("SELECT * FROM menu_items WHERE scenario_id = 1 ORDER BY id").all();

  res.json({
    scenario: {
      ...scenario,
      memoryEnabled: Boolean(scenario.memory_enabled),
    },
    menu: menu.map((item) => ({
      ...item,
      customizations: JSON.parse(item.customizations_json),
    })),
  });
});

// Updates the prototype scenario's personality and memory toggle settings.
caregiverRoutes.put("/scenario", (req, res) => {
  const { personality, memoryEnabled } = req.body;

  db.prepare(`
    UPDATE scenarios
    SET personality = ?, memory_enabled = ?
    WHERE id = 1
  `).run(personality, memoryEnabled ? 1 : 0);

  const updated = db.prepare("SELECT * FROM scenarios WHERE id = 1").get();
  res.json({
    scenario: {
      ...updated,
      memoryEnabled: Boolean(updated.memory_enabled),
    },
  });
});

// Returns aggregate analytics plus recent session history for the caregiver dashboard.
caregiverRoutes.get("/analytics", (req, res) => {
  res.json(getAnalyticsSummary());
});
