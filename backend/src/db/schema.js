/**
 * Creates the SQLite tables required for users, scenarios, sessions, transcripts, and analytics.
 */
export function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      role TEXT CHECK (role IN ('caregiver', 'child')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS caregivers (
      caregiver_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS children (
      child_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      caregiver_id TEXT,
      name TEXT,
      xp INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (caregiver_id) REFERENCES caregivers(caregiver_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      scenario_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_by TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES caregivers(caregiver_id)
    );

    CREATE TABLE IF NOT EXISTS scenario_settings (
      settings_id TEXT PRIMARY KEY,
      scenario_id TEXT UNIQUE,
      location_name TEXT,
      location_image_url TEXT,
      avatar_type TEXT DEFAULT 'store_owner',
      avatar_label TEXT DEFAULT 'Store Owner',
      avatar_image_url TEXT,
      background_noise INTEGER DEFAULT 20,
      hint_delay_seconds INTEGER DEFAULT 5,
      ai_personality_prompt TEXT,
      contingencies TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS objectives (
      objective_id TEXT PRIMARY KEY,
      scenario_id TEXT,
      description TEXT NOT NULL,
      objective_rule TEXT DEFAULT 'selected_item',
      position INTEGER,
      is_required BOOLEAN DEFAULT 1,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      child_id TEXT,
      scenario_id TEXT,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      total_questions INTEGER DEFAULT 0,
      successful_first_attempts INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id)
    );

    CREATE TABLE IF NOT EXISTS interactions (
      interaction_id TEXT PRIMARY KEY,
      session_id TEXT,
      question_text TEXT,
      asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responses (
      response_id TEXT PRIMARY KEY,
      interaction_id TEXT,
      response_text TEXT,
      input_mode TEXT CHECK (input_mode IN ('voice', 'text', 'aac')),
      response_time_seconds FLOAT,
      used_prompt BOOLEAN DEFAULT 0,
      is_successful BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interaction_id) REFERENCES interactions(interaction_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_analytics (
      session_id TEXT PRIMARY KEY,
      avg_response_time FLOAT,
      longest_response_time FLOAT,
      shortest_response_time FLOAT,
      success_rate FLOAT,
      longest_question_id TEXT,
      shortest_question_id TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS objective_completion (
      completion_id TEXT PRIMARY KEY,
      session_id TEXT,
      objective_id TEXT,
      is_checked BOOLEAN DEFAULT 0,
      UNIQUE (session_id, objective_id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
      FOREIGN KEY (objective_id) REFERENCES objectives(objective_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_recordings (
      recording_id TEXT PRIMARY KEY,
      session_id TEXT UNIQUE,
      audio_url TEXT,
      transcript TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);
}
