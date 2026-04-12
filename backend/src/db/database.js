import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSchema } from "./schema.js";
import { seedDatabase } from "./seed.js";
import { inferObjectiveRule } from "../data/scenarioDefaults.js";

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
