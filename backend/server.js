// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db'); // ✅ use db.js

const app = express();
app.use(cors());
app.use(express.json());

// simple request logger for debugging
app.use((req, res, next) => {
  console.log('REQ', req.method, req.path);
  next();
});

/* ============================
   API 1: GET PROBLEMS
============================ */
app.get('/api/problems/:language/:concept/:difficulty', async (req, res) => {
  try {
    const { language, concept, difficulty } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM problems WHERE language=? AND concept=? AND difficulty=?',
      [language, concept, difficulty]
    );

    const formatted = rows.map(r => {
      let hints = r.hints;

      if (Buffer.isBuffer(hints)) {
        hints = hints.toString('utf8');
      }

      if (typeof hints === 'string') {
        try {
          hints = JSON.parse(hints);
        } catch (e) {
          console.log('❌ JSON parse error:', e.message);
          hints = null;
        }
      }

      return {
        ...r,
        hints: hints || {
          level1: 'No hint available',
          level2: 'No hint available',
          level3: 'No hint available'
        }
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ GET PROBLEMS ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


/* ============================
   API 2: SUBMIT CODE
============================ */
app.post('/api/submit', async (req, res) => {
  try {
    const {
      userId,
      problemId,
      language,
      concept,
      code,
      attempts,
      timeSpent,
      isCorrect
    } = req.body;

    const successValue = isCorrect ? 1 : 0;

    // 1. SAVE SUBMISSION
    await db.query(
      `INSERT INTO submissions 
      (user_id, problem_id, language, concept, submitted_code, attempts, time_spent, is_correct) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, problemId, language, concept, code, attempts, timeSpent, isCorrect]
    );

    // 2. CHECK IF PROFILE EXISTS
    const [existing] = await db.query(
      `SELECT * FROM user_profiles 
       WHERE user_id=? AND language=? AND concept=?`,
      [userId, language, concept]
    );

    if (existing.length === 0) {
      // 👉 CREATE NEW PROFILE
      await db.query(
        `INSERT INTO user_profiles 
        (user_id, language, concept, total_attempts, success_rate, avg_time_spent, performance_level)
        VALUES (?, ?, ?, 1, ?, ?, 'Beginner')`,
        [userId, language, concept, successValue, timeSpent]
      );
    } else {
      // 👉 UPDATE EXISTING PROFILE
      await db.query(
        `UPDATE user_profiles SET
          total_attempts = total_attempts + 1,
          success_rate = (
            (success_rate * total_attempts + ?) / (total_attempts + 1)
          ),
          avg_time_spent = (
            (avg_time_spent * total_attempts + ?) / (total_attempts + 1)
          )
        WHERE user_id=? AND language=? AND concept=?`,
        [successValue, timeSpent, userId, language, concept]
      );
    }

    // 3. GET UPDATED PROFILE
    const [rows] = await db.query(
      `SELECT success_rate, avg_time_spent 
       FROM user_profiles 
       WHERE user_id=? AND language=? AND concept=?`,
      [userId, language, concept]
    );

    const profile = rows[0];

    // 4. CLASSIFY USER
    let level = "Beginner";

    if (profile.success_rate >= 0.8 && profile.avg_time_spent < 60) {
      level = "Advanced";
    } else if (profile.success_rate >= 0.5) {
      level = "Intermediate";
    }

    // 5. SAVE LEVEL
    await db.query(
      `UPDATE user_profiles 
       SET performance_level=? 
       WHERE user_id=? AND language=? AND concept=?`,
      [level, userId, language, concept]
    );

    // 6. SEND RESPONSE
    res.json({
      success: true,
      level: level
    });

  } catch (err) {
    console.error('❌ SUBMIT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


/* ============================
   API 3: USER PROFILE
============================ */
app.get('/api/profile/:userId/:language/:concept', async (req, res) => {
  try {
    const { userId, language, concept } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM user_profiles 
       WHERE user_id=? AND language=? AND concept=?`,
      [userId, language, concept]
    );

    res.json(rows[0] || {});
  } catch (err) {
    console.error('❌ PROFILE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


/* ============================
   API 4: REGISTER
   Create a new user with bcrypt-hashed password.
============================ */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username, name } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [existing] = await db.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();

    const [result] = await db.query(
      `INSERT INTO users (email, password_hash, username, name, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'student', 'active', ?, ?)`,
      [email, password_hash, username, name || username, now, now]
    );

    const newUser = {
      id: result.insertId,
      name: name || username,
      username,
      email,
      photo: null,
      isAdmin: false
    };

    return res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('❌ REGISTER ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ============================
   API 5: LOGIN
   Checks credentials against the `users` table.
============================ */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

    const identifier = email.trim();
    console.log('LOGIN ATTEMPT:', identifier);
    const [rows] = await db.query(
      `SELECT id, name, username, email, password_hash, role, status FROM users WHERE email = ? OR username = ? LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      console.log('LOGIN FAILED: no matching user for', identifier);
      return res.status(401).json({ success: false, message: 'Invalid email/username or password' });
    }

    const user = rows[0];

    const hash = user.password_hash || '';
    let ok = false;
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      ok = await bcrypt.compare(password, hash);
    } else {
      // legacy/plaintext
      ok = password === hash;
    }

    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || user.username || '',
        username: user.username || user.email.split('@')[0],
        email: user.email,
        photo: null,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (err) {
    console.error('❌ LOGIN ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ============================
   HEALTH ROUTES
============================ */
app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global error handler so all errors return JSON rather than HTML
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err?.message || 'Unexpected error'
  });
});

/* ============================
   START SERVER
============================ */
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
  console.log('✅ Backend process is alive. Press Ctrl+C to stop.');
});

// Keep the process alive explicitly in environments where the terminal may otherwise
// treat a long-running Node server as if it has ended.
process.stdin.resume();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION', reason);
});