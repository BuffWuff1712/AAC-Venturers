/**
 * Creates the SQLite tables required for users, scenarios, sessions, transcripts, and analytics.
 */
export function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS caregiver_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      objective TEXT NOT NULL,
      personality TEXT NOT NULL,
      memory_enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY,
      scenario_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL,
      customizations_json TEXT NOT NULL,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS child_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      child_name TEXT NOT NULL,
      favourite_order TEXT NOT NULL,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      child_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      completed_at TEXT,
      objective_completed INTEGER NOT NULL DEFAULT 0,
      selected_item TEXT,
      selected_customizations_json TEXT NOT NULL DEFAULT '[]',
      clarification_count INTEGER NOT NULL DEFAULT 0,
      hints_used INTEGER NOT NULL DEFAULT 0,
      average_response_time_ms REAL NOT NULL DEFAULT 0,
      total_turns INTEGER NOT NULL DEFAULT 0,
      last_action TEXT NOT NULL DEFAULT 'greet',
      last_user_input TEXT,
      pending_payment INTEGER NOT NULL DEFAULT 0,
      session_state_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      speaker TEXT NOT NULL,
      action TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      response_time_ms REAL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);
}
