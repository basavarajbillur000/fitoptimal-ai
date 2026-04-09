// ═══════════════════════════════════════════════════════════════
// FitOptim AI — SQLite Database (using sql.js — pure JS, no native deps)
// ═══════════════════════════════════════════════════════════════
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'fitoptim.db');

let _db = null;

// Wrapper to make sql.js look like better-sqlite3 API
class DBWrapper {
  constructor(db) {
    this._db = db;
  }

  prepare(sql) {
    return new Statement(this._db, sql, this);
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  pragma() {} // no-op for compatibility

  _save() {
    try {
      const data = this._db.export();
      writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error('DB save error:', e);
    }
  }
}

class Statement {
  constructor(db, sql, wrapper) {
    this._db = db;
    this._sql = sql;
    this._wrapper = wrapper;
  }

  run(...params) {
    const args = this._flattenParams(params);
    this._db.run(this._convertNamedParams(this._sql, args), this._getPositionalValues(this._sql, args));
    // Get last_insert_rowid BEFORE save to ensure it's captured
    let lastId = 0;
    try {
      const result = this._db.exec("SELECT last_insert_rowid() as id");
      lastId = result[0]?.values[0]?.[0] || 0;
    } catch(e) { /* ignore */ }
    this._wrapper._save();
    return { lastInsertRowid: lastId };
  }

  get(...params) {
    const args = this._flattenParams(params);
    const sql = this._convertNamedParams(this._sql, args);
    const values = this._getPositionalValues(this._sql, args);
    try {
      const stmt = this._db.prepare(sql);
      stmt.bind(values);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        return row;
      }
      stmt.free();
      return undefined;
    } catch { return undefined; }
  }

  all(...params) {
    const args = this._flattenParams(params);
    const sql = this._convertNamedParams(this._sql, args);
    const values = this._getPositionalValues(this._sql, args);
    try {
      const results = [];
      const stmt = this._db.prepare(sql);
      stmt.bind(values);
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        results.push(row);
      }
      stmt.free();
      return results;
    } catch { return []; }
  }

  _flattenParams(params) {
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      return params[0];
    }
    return params;
  }

  _convertNamedParams(sql, args) {
    if (typeof args === 'object' && !Array.isArray(args)) {
      // Replace @paramName with ? placeholders
      const keys = Object.keys(args);
      let converted = sql;
      keys.forEach(k => {
        converted = converted.replace(new RegExp(`@${k}\\b`, 'g'), '?');
      });
      return converted;
    }
    return sql;
  }

  _getPositionalValues(sql, args) {
    if (typeof args === 'object' && !Array.isArray(args)) {
      // Extract values in the order they appear as @params in SQL
      const matches = sql.match(/@\w+/g) || [];
      const seen = new Set();
      const ordered = [];
      matches.forEach(m => {
        const key = m.slice(1);
        if (!seen.has(m)) {
          seen.add(m);
          ordered.push(args[key] ?? null);
        }
      });
      return ordered;
    }
    return Array.isArray(args) ? args : [];
  }
}

export async function initDB() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  const wrapper = new DBWrapper(_db);

  // Create tables
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      age INTEGER,
      gender TEXT,
      weight REAL,
      height REAL,
      body_type TEXT,
      goal TEXT,
      activity TEXT,
      diet TEXT,
      budget REAL,
      currency TEXT DEFAULT 'INR',
      unit_system TEXT DEFAULT 'metric',
      region TEXT DEFAULT 'indian',
      target_weight REAL,
      target_weeks INTEGER,
      weekly_workout_days INTEGER DEFAULT 4,
      sleep_hours REAL,
      stress_level INTEGER,
      water_intake REAL,
      equipment TEXT DEFAULT '[]',
      allergies TEXT DEFAULT '[]',
      medical_conditions TEXT DEFAULT '[]',
      blood_work TEXT DEFAULT '{}',
      fitness_scores TEXT DEFAULT '{}',
      tdee REAL,
      bmr REAL,
      bmi REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      goal TEXT,
      stats TEXT DEFAULT '{}',
      meals TEXT DEFAULT '[]',
      exercises TEXT DEFAULT '[]',
      tips TEXT,
      grocery_list TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS progress_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weight REAL,
      chest REAL,
      waist REAL,
      hips REAL,
      arms REAL,
      thighs REAL,
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge_id TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      status TEXT DEFAULT 'active',
      days_completed TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS xp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return wrapper;
}
