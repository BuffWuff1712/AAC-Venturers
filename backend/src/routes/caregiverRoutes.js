import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db/database.js";
import { getAnalyticsSummary } from "../services/orchestration/sessionTracker.js";

export const caregiverRoutes = Router();

/* =========================
   File Upload Setup
========================= */
const uploadsDir = path.resolve("public/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

/* =========================
   Mapping Helpers
========================= */
function mapScenarioSettings(settings) {
  if (!settings) return null;

  return {
    settingsId: settings.settings_id,
    scenarioId: settings.scenario_id,
    locationName: settings.location_name,
    locationImageUrl: settings.location_image_url,
    backgroundNoise: settings.background_noise,
    aiPersonalityPrompt: settings.ai_personality_prompt,
    contingencies: settings.contingencies,
    updatedAt: settings.updated_at,
  };
}

function mapObjective(objective) {
  return {
    objectiveId: objective.objective_id,
    scenarioId: objective.scenario_id,
    description: objective.description,
    position: objective.position,
    isRequired: Boolean(objective.is_required),
  };
}

function mapScenarioHistorySession(session) {
  return {
    sessionId: session.session_id,
    childId: session.child_id,
    childName: session.child_name || "Sample Child",
    startTime: session.start_time,
    endTime: session.end_time,
    totalQuestions: session.total_questions,
    successfulFirstAttempts: session.successful_first_attempts,
    xpEarned: session.xp_earned,
    status: session.end_time ? "completed" : "in_progress",
  };
}

/* =========================
   GET All Scenarios
========================= */
caregiverRoutes.get("/scenarios", (req, res) => {
  try {
    const scenarios = db
      .prepare(`
        SELECT s.scenario_id, s.title, s.is_active,
               ss.location_name, ss.location_image_url
        FROM scenarios s
        LEFT JOIN scenario_settings ss
        ON s.scenario_id = ss.scenario_id
        ORDER BY s.created_at DESC
      `)
      .all();

    res.json(
      scenarios.map((s) => ({
        scenarioId: s.scenario_id,
        title: s.title,
        locationName: s.location_name,
        locationImageUrl: s.location_image_url,
        isActive: Boolean(s.is_active),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch scenarios" });
  }
});

/* =========================
   CREATE Scenario
========================= */
caregiverRoutes.post(
  "/scenarios",
  upload.single("locationImage"),
  (req, res) => {
    try {
      const {
        title,
        locationName,
        backgroundNoise,
        aiPersonalityPrompt,
        contingencies,
      } = req.body;

      const rawObjectives = req.body["objectives[]"];
      const objectives = Array.isArray(rawObjectives)
        ? rawObjectives
        : rawObjectives
        ? [rawObjectives]
        : [];

      const scenarioId = `scenario-${Date.now()}`;
      const settingsId = `settings-${scenarioId}`;

      const finalTitle = (title || locationName || "New Scenario").trim();
      const finalLocationName = (locationName || finalTitle).trim();

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : "/images/canteen.jpg";

      db.prepare(`
        INSERT INTO scenarios (scenario_id, title, is_active)
        VALUES (?, ?, 1)
      `).run(scenarioId, finalTitle);

      db.prepare(`
        INSERT INTO scenario_settings (
          settings_id, scenario_id, location_name, location_image_url,
          background_noise, ai_personality_prompt, contingencies
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        settingsId,
        scenarioId,
        finalLocationName,
        imageUrl,
        Number(backgroundNoise ?? 20),
        aiPersonalityPrompt || "",
        contingencies || ""
      );

      const insertObj = db.prepare(`
        INSERT INTO objectives (
          objective_id, scenario_id, description, position, is_required
        )
        VALUES (?, ?, ?, ?, 1)
      `);

      objectives.forEach((obj, i) => {
        insertObj.run(
          `objective-${scenarioId}-${i + 1}`,
          scenarioId,
          obj,
          i + 1
        );
      });

      res.status(201).json({ message: "Scenario created successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to create scenario" });
    }
  }
);

/* =========================
   GET One Scenario
========================= */
caregiverRoutes.get("/scenarios/:scenarioId", (req, res) => {
  try {
    const scenario = db
      .prepare("SELECT * FROM scenarios WHERE scenario_id = ?")
      .get(req.params.scenarioId);

    if (!scenario) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const settings = db
      .prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?")
      .get(req.params.scenarioId);

    const objectives = db
      .prepare(
        "SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position"
      )
      .all(req.params.scenarioId);

    res.json({
      scenario: {
        scenarioId: scenario.scenario_id,
        title: scenario.title,
        isActive: Boolean(scenario.is_active),
      },
      settings: mapScenarioSettings(settings),
      objectives: objectives.map(mapObjective),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch scenario" });
  }
});

/* =========================
   UPDATE Scenario
   FIXED: Objectives now persist
========================= */
caregiverRoutes.put(
  "/scenarios/:scenarioId/settings",
  upload.single("locationImage"),
  (req, res) => {
    try {
      const {
        title,
        locationName,
        backgroundNoise,
        aiPersonalityPrompt,
        contingencies,
      } = req.body;

      const scenarioId = req.params.scenarioId;

      const scenario = db
        .prepare("SELECT scenario_id FROM scenarios WHERE scenario_id = ?")
        .get(scenarioId);

      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      const rawObjectives = req.body["objectives[]"];
      const objectives = Array.isArray(rawObjectives)
        ? rawObjectives
        : rawObjectives
        ? [rawObjectives]
        : [];

      db.prepare(`
        UPDATE scenarios
        SET title = ?
        WHERE scenario_id = ?
      `).run(title || locationName, scenarioId);

      const existingSettings = db
        .prepare(
          "SELECT settings_id, location_image_url FROM scenario_settings WHERE scenario_id = ?"
        )
        .get(scenarioId);

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : existingSettings?.location_image_url || "/images/canteen.jpg";

      if (existingSettings) {
        db.prepare(`
          UPDATE scenario_settings
          SET location_name = ?, location_image_url = ?, background_noise = ?,
              ai_personality_prompt = ?, contingencies = ?, updated_at = CURRENT_TIMESTAMP
          WHERE scenario_id = ?
        `).run(
          locationName,
          imageUrl,
          Number(backgroundNoise ?? 20),
          aiPersonalityPrompt || "",
          contingencies || "",
          scenarioId
        );
      } else {
        const settingsId = `settings-${scenarioId}`;
        db.prepare(`
          INSERT INTO scenario_settings (
            settings_id, scenario_id, location_name, location_image_url,
            background_noise, ai_personality_prompt, contingencies
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          settingsId,
          scenarioId,
          locationName,
          imageUrl,
          Number(backgroundNoise ?? 20),
          aiPersonalityPrompt || "",
          contingencies || ""
        );
      }

      // Critical fix: replace old objectives with new ones
      db.prepare("DELETE FROM objectives WHERE scenario_id = ?").run(
        scenarioId
      );

      const insertObj = db.prepare(`
        INSERT INTO objectives (
          objective_id, scenario_id, description, position, is_required
        )
        VALUES (?, ?, ?, ?, 1)
      `);

      objectives.forEach((obj, i) => {
        insertObj.run(
          `objective-${scenarioId}-${i + 1}`,
          scenarioId,
          obj,
          i + 1
        );
      });

      const savedScenario = db
        .prepare("SELECT * FROM scenarios WHERE scenario_id = ?")
        .get(scenarioId);

      const savedSettings = db
        .prepare("SELECT * FROM scenario_settings WHERE scenario_id = ?")
        .get(scenarioId);

      const savedObjectives = db
        .prepare(
          "SELECT * FROM objectives WHERE scenario_id = ? ORDER BY position"
        )
        .all(scenarioId);

      res.json({
        message: "Scenario updated successfully",
        scenario: {
          scenarioId: savedScenario.scenario_id,
          title: savedScenario.title,
          isActive: Boolean(savedScenario.is_active),
        },
        settings: mapScenarioSettings(savedSettings),
        objectives: savedObjectives.map(mapObjective),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to update scenario" });
    }
  }
);

/* =========================
   DELETE Scenario
========================= */
caregiverRoutes.delete("/scenarios/:scenarioId", (req, res) => {
  try {
    const scenarioId = req.params.scenarioId;

    db.prepare("DELETE FROM objectives WHERE scenario_id = ?").run(
      scenarioId
    );
    db.prepare("DELETE FROM scenario_settings WHERE scenario_id = ?").run(
      scenarioId
    );
    db.prepare("DELETE FROM scenarios WHERE scenario_id = ?").run(
      scenarioId
    );

    res.json({ message: "Scenario deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete scenario" });
  }
});

/* =========================
   Analytics
========================= */
caregiverRoutes.get("/analytics", (req, res) => {
  try {
    const summary = getAnalyticsSummary();
    res.json(summary);
  } catch {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});