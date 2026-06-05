// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // ✅ use db.js

const app = express();
app.use(cors());
app.use(express.json());

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
   START SERVER
============================ */
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});