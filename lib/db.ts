import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

export const getDb = (): Database.Database => {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'gujgyani.db'))
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        pretest_done INTEGER DEFAULT 0,
        pretest_mode TEXT,
        current_level INTEGER DEFAULT 0,
        skill_theory INTEGER DEFAULT 50,
        skill_pronunciation INTEGER DEFAULT 50,
        skill_sentence INTEGER DEFAULT 50,
        skill_translation INTEGER DEFAULT 50,
        skill_blanks INTEGER DEFAULT 50
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        ended_at TEXT,
        start_level INTEGER NOT NULL,
        end_level INTEGER,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        question_type TEXT NOT NULL,
        level_number INTEGER NOT NULL,
        correct INTEGER NOT NULL,
        score_before INTEGER NOT NULL,
        score_after INTEGER NOT NULL,
        skill_score_before INTEGER NOT NULL,
        skill_score_after INTEGER NOT NULL,
        answered_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `)
  }
  return db
}
