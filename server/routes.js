// ═══════════════════════════════════════════════════════════════
// FitOptim AI — API Routes
// ═══════════════════════════════════════════════════════════════
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOptimalPlan } from './optimizer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fitoptim_secret_key_change_in_production';

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function registerRoutes(app, db) {

  // ── AUTH ────────────────────────────────────────────────────
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
      const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET, { expiresIn: '30d' });

      res.json({ token, user: { id: result.lastInsertRowid, name, email, profile: null } });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return res.status(404).json({ error: 'No account found with this email' });
      if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' });

      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

      const parsed = profile ? parseProfile(profile) : null;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile: parsed } });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/auth/me', auth, (req, res) => {
    try {
      const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
      res.json({ user: { ...user, profile: profile ? parseProfile(profile) : null } });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ── PROFILE ─────────────────────────────────────────────────
  app.put('/api/profile', auth, (req, res) => {
    try {
      const p = req.body;
      const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(req.user.id);

      const data = {
        user_id: req.user.id,
        age: p.age || null,
        gender: p.gender || null,
        weight: p.weight || null,
        height: p.height || null,
        body_type: p.bodyType || null,
        goal: p.goal || null,
        activity: p.activity || null,
        diet: p.diet || null,
        budget: p.budget || null,
        currency: p.currency || 'INR',
        unit_system: p.unitSystem || 'metric',
        region: p.region || 'indian',
        target_weight: p.targetWeight || null,
        target_weeks: p.targetWeeks || null,
        weekly_workout_days: p.weeklyWorkoutDays || 4,
        sleep_hours: p.sleepHours || null,
        stress_level: p.stressLevel || null,
        water_intake: p.waterIntake || null,
        equipment: JSON.stringify(p.equipment || []),
        allergies: JSON.stringify(p.allergies || []),
        medical_conditions: JSON.stringify(p.medicalConditions || []),
        blood_work: JSON.stringify(p.bloodWork || {}),
        fitness_scores: JSON.stringify(p.fitnessScores || {}),
        tdee: p.tdee || null,
        bmr: p.bmr || null,
        bmi: p.bmi || null,
      };

      if (existing) {
        const sets = Object.keys(data).filter(k => k !== 'user_id').map(k => `${k} = @${k}`).join(', ');
        db.prepare(`UPDATE profiles SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE user_id = @user_id`).run(data);
      } else {
        const keys = Object.keys(data);
        const placeholders = keys.map(k => `@${k}`).join(', ');
        db.prepare(`INSERT INTO profiles (${keys.join(', ')}) VALUES (${placeholders})`).run(data);
      }

      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
      res.json({ profile: parseProfile(profile) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/profile', auth, (req, res) => {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    res.json({ profile: profile ? parseProfile(profile) : null });
  });

  // ── PLANS ───────────────────────────────────────────────────
  app.get('/api/plans', auth, (req, res) => {
    const plans = db.prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ plans: plans.map(parsePlan) });
  });

  app.post('/api/plans', auth, (req, res) => {
    try {
      const p = req.body;
      const result = db.prepare(
        'INSERT INTO plans (user_id, title, goal, stats, meals, exercises, tips, grocery_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        req.user.id, p.title || 'Optimized Plan', p.goal || '',
        JSON.stringify(p.stats || {}),
        JSON.stringify(p.meals || []),
        JSON.stringify(p.exercises || []),
        p.tips || '',
        JSON.stringify(p.groceryList || [])
      );
      // Award XP for saving a plan
      db.prepare('INSERT INTO xp_logs (user_id, amount, source) VALUES (?, ?, ?)').run(req.user.id, 50, 'plan_saved');
      const planId = result.lastInsertRowid;
      if (planId) {
        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
        res.json({ plan: parsePlan(plan) });
      } else {
        // Fallback: return the saved data directly
        res.json({ plan: { id: 0, user_id: req.user.id, title: p.title || 'Optimized Plan', goal: p.goal, stats: p.stats || {}, meals: p.meals || [], exercises: p.exercises || [], tips: p.tips || '', grocery_list: p.groceryList || [], created_at: new Date().toISOString() } });
      }
    } catch (e) {
      console.error('Plan save error:', e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/plans/:id', auth, (req, res) => {
    db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // ── GENERATE ────────────────────────────────────────────────
  app.post('/api/generate', auth, (req, res) => {
    try {
      const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
      if (!profile) return res.status(400).json({ error: 'Complete your profile first' });
      const parsed = parseProfile(profile);
      const plan = generateOptimalPlan(parsed, req.body);
      res.json({ plan });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Plan generation failed' });
    }
  });

  // ── PROGRESS ────────────────────────────────────────────────
  app.get('/api/progress', auth, (req, res) => {
    const logs = db.prepare('SELECT * FROM progress_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60').all(req.user.id);
    res.json({ logs });
  });

  app.post('/api/progress', auth, (req, res) => {
    try {
      const { weight, chest, waist, hips, arms, thighs, notes } = req.body;
      const result = db.prepare(
        'INSERT INTO progress_logs (user_id, weight, chest, waist, hips, arms, thighs, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(req.user.id, weight || null, chest || null, waist || null, hips || null, arms || null, thighs || null, notes || null);

      // Award XP
      db.prepare('INSERT INTO xp_logs (user_id, amount, source) VALUES (?, ?, ?)').run(req.user.id, 10, 'weight_logged');

      // Update profile weight if provided
      if (weight) {
        db.prepare('UPDATE profiles SET weight = ? WHERE user_id = ?').run(weight, req.user.id);
      }

      const log = db.prepare('SELECT * FROM progress_logs WHERE id = ?').get(result.lastInsertRowid);
      res.json({ log });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ── CHALLENGES ──────────────────────────────────────────────
  app.get('/api/challenges', auth, (req, res) => {
    const challenges = db.prepare('SELECT * FROM challenges WHERE user_id = ? ORDER BY started_at DESC').all(req.user.id);
    res.json({ challenges: challenges.map(c => ({ ...c, days_completed: JSON.parse(c.days_completed) })) });
  });

  app.post('/api/challenges/start', auth, (req, res) => {
    try {
      const { challengeId } = req.body;
      // Check if already active
      const active = db.prepare('SELECT id FROM challenges WHERE user_id = ? AND challenge_id = ? AND status = ?').get(req.user.id, challengeId, 'active');
      if (active) return res.status(409).json({ error: 'Challenge already active' });

      const result = db.prepare('INSERT INTO challenges (user_id, challenge_id) VALUES (?, ?)').run(req.user.id, challengeId);
      db.prepare('INSERT INTO xp_logs (user_id, amount, source) VALUES (?, ?, ?)').run(req.user.id, 20, 'challenge_started');

      const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(result.lastInsertRowid);
      res.json({ challenge: { ...challenge, days_completed: JSON.parse(challenge.days_completed) } });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/challenges/:id/checkin', auth, (req, res) => {
    try {
      const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
      if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

      const days = JSON.parse(challenge.days_completed);
      const today = new Date().toISOString().split('T')[0];
      if (!days.includes(today)) {
        days.push(today);
        db.prepare('UPDATE challenges SET days_completed = ? WHERE id = ?').run(JSON.stringify(days), challenge.id);
        db.prepare('INSERT INTO xp_logs (user_id, amount, source) VALUES (?, ?, ?)').run(req.user.id, 15, 'challenge_checkin');
      }

      const updated = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge.id);
      res.json({ challenge: { ...updated, days_completed: JSON.parse(updated.days_completed) } });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/challenges/:id/complete', auth, (req, res) => {
    try {
      db.prepare('UPDATE challenges SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
        .run('completed', req.params.id, req.user.id);
      db.prepare('INSERT INTO xp_logs (user_id, amount, source) VALUES (?, ?, ?)').run(req.user.id, 100, 'challenge_completed');
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/challenges/:id/abandon', auth, (req, res) => {
    db.prepare('UPDATE challenges SET status = ? WHERE id = ? AND user_id = ?').run('abandoned', req.params.id, req.user.id);
    res.json({ success: true });
  });

  // ── XP & LEVEL ─────────────────────────────────────────────
  app.get('/api/xp', auth, (req, res) => {
    const result = db.prepare('SELECT COALESCE(SUM(amount), 0) as total_xp FROM xp_logs WHERE user_id = ?').get(req.user.id);
    const totalXP = result.total_xp;
    const level = Math.floor(totalXP / 200) + 1;
    const currentLevelXP = totalXP % 200;
    res.json({ totalXP, level, currentLevelXP, xpToNext: 200 });
  });

  // ── DATA EXPORT ─────────────────────────────────────────────
  app.get('/api/export', auth, (req, res) => {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const plans = db.prepare('SELECT * FROM plans WHERE user_id = ?').all(req.user.id);
    const logs = db.prepare('SELECT * FROM progress_logs WHERE user_id = ?').all(req.user.id);
    const challenges = db.prepare('SELECT * FROM challenges WHERE user_id = ?').all(req.user.id);

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      profile: profile ? parseProfile(profile) : null,
      plans: plans.map(parsePlan),
      progressLogs: logs,
      challenges: challenges.map(c => ({ ...c, days_completed: JSON.parse(c.days_completed) }))
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────
function parseProfile(p) {
  if (!p) return null;
  return {
    ...p,
    equipment: tryParse(p.equipment, []),
    allergies: tryParse(p.allergies, []),
    medical_conditions: tryParse(p.medical_conditions, []),
    blood_work: tryParse(p.blood_work, {}),
    fitness_scores: tryParse(p.fitness_scores, {}),
  };
}

function parsePlan(p) {
  if (!p) return { id: 0, stats: {}, meals: [], exercises: [], grocery_list: [] };
  return {
    ...p,
    stats: tryParse(p.stats, {}),
    meals: tryParse(p.meals, []),
    exercises: tryParse(p.exercises, []),
    grocery_list: tryParse(p.grocery_list, []),
  };
}

function tryParse(val, fallback) {
  if (val === undefined || val === null) return fallback;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}
