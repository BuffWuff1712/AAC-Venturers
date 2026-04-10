import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSchema } from "./schema.js";
import { seedDatabase } from "./seed.js";

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
seedDatabase(db);

export { db };
