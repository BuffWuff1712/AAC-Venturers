import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSchema } from "./schema.js";
import { seedDatabase } from "./seed.js";
import {
  buildCustomAvatarPrompt,
  DEFAULT_AI_PERSONALITY_PROMPT,
  DEFAULT_HINT_DELAY_SECONDS,
  DEFAULT_SCENARIO_DESCRIPTION,
  getAvatarDefaults,
  inferObjectiveRule,
} from "../data/scenarioDefaults.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../../data/aac_venturers.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function tableHasColumn(database, tableName, columnName) {
  try {
    const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
  } catch {
    return false;
  }
}

function shouldRebuildDatabase(database) {
  const scenariosOk = tableHasColumn(database, "scenarios", "scenario_id");
  const sessionsOk = tableHasColumn(database, "sessions", "session_id");
  return !scenariosOk || !sessionsOk;
}

function ensureColumn(database, tableName, columnName, columnSql) {
  if (!tableHasColumn(database, tableName, columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSql}`);
  }
}

function runMigrations(database) {
  ensureColumn(database, "objectives", "objective_rule", "TEXT DEFAULT 'selected_item'");
  ensureColumn(database, "scenario_settings", "avatar_type", "TEXT DEFAULT 'store_owner'");
  ensureColumn(database, "scenario_settings", "avatar_label", "TEXT DEFAULT 'Store Owner'");
  ensureColumn(database, "scenario_settings", "avatar_image_url", "TEXT");
  ensureColumn(database, "scenario_settings", "scenario_description", "TEXT");
  ensureColumn(
    database,
    "scenario_settings",
    "hint_delay_seconds",
    `INTEGER DEFAULT ${DEFAULT_HINT_DELAY_SECONDS}`
  );

  const objectives = database
    .prepare("SELECT objective_id, description, objective_rule FROM objectives")
    .all();

  const updateObjectiveRule = database.prepare(`
    UPDATE objectives
    SET objective_rule = ?
    WHERE objective_id = ?
  `);

  objectives.forEach((objective) => {
    if (objective.objective_rule) {
      return;
    }

    updateObjectiveRule.run(inferObjectiveRule(objective.description), objective.objective_id);
  });

  const settingsRows = database
    .prepare(`
      SELECT settings_id, avatar_type, avatar_label, avatar_image_url, hint_delay_seconds, ai_personality_prompt, scenario_description
      FROM scenario_settings
    `)
    .all();

  const updateSettings = database.prepare(`
    UPDATE scenario_settings
    SET avatar_type = ?, avatar_label = ?, avatar_image_url = ?, hint_delay_seconds = ?, ai_personality_prompt = ?, scenario_description = ?
    WHERE settings_id = ?
  `);

  settingsRows.forEach((settings) => {
    const avatarDefaults = getAvatarDefaults(settings.avatar_type, settings.avatar_label);
    const normalizedAvatarType = avatarDefaults.avatarType;
    const normalizedAvatarLabel = avatarDefaults.avatarLabel;
    const normalizedAvatarImageUrl = settings.avatar_image_url || avatarDefaults.avatarImageUrl;
    const normalizedPrompt = settings.ai_personality_prompt
      || (normalizedAvatarType === "custom"
        ? buildCustomAvatarPrompt(normalizedAvatarLabel)
        : avatarDefaults.aiPersonalityPrompt)
      || DEFAULT_AI_PERSONALITY_PROMPT;
    const normalizedHintDelaySeconds = Number.isFinite(Number(settings.hint_delay_seconds))
      ? Number(settings.hint_delay_seconds)
      : DEFAULT_HINT_DELAY_SECONDS;
    const normalizedScenarioDescription =
      String(settings.scenario_description || "").trim() || DEFAULT_SCENARIO_DESCRIPTION;

    updateSettings.run(
      normalizedAvatarType,
      normalizedAvatarLabel,
      normalizedAvatarImageUrl,
      normalizedHintDelaySeconds,
      normalizedPrompt,
      normalizedScenarioDescription,
      settings.settings_id,
    );
  });
}

let db = new Database(dbPath);

if (shouldRebuildDatabase(db)) {
  db.close();

  const backupPath = `${dbPath}.legacy-${Date.now()}.bak`;
  fs.renameSync(dbPath, backupPath);

  const shmPath = `${dbPath}-shm`;
  const walPath = `${dbPath}-wal`;

  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }

  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }

  db = new Database(dbPath);
}

db.pragma("journal_mode = WAL");

createSchema(db);
runMigrations(db);
seedDatabase(db);

export { db };
