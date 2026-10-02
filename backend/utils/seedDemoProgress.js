'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'train_data.csv');
const LANGUAGES = ['Python', 'JavaScript', 'Java'];
const CONCEPTS = [
  'Variables',
  'Data Types',
  'Operators',
  'Conditionals',
  'Loops',
  'Functions',
  'Input & Output',
  'Error Handling',
];
const HEADERS = [
  'success_rate',
  'avg_attempts',
  'avg_time_spent',
  'syntax_errors',
  'structural_errors',
  'label',
];
const LABELS = new Set(['Easy', 'Intermediate', 'Hard']);

function loadTrainingData(filePath = DATA_PATH) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  if (headers.join(',') !== HEADERS.join(',')) {
    throw new Error('Training CSV headers do not match the expected feature schema.');
  }

  return lines.map((line, index) => {
    const values = line.split(',');
    if (values.length !== HEADERS.length) {
      throw new Error(`Invalid training CSV row ${index + 2}: expected ${HEADERS.length} columns.`);
    }

    const [successRate, avgAttempts, avgTimeSpent, syntaxErrors, structuralErrors] = values;
    const row = {
      success_rate: Number(successRate),
      avg_attempts: Number(avgAttempts),
      avg_time_spent: Number(avgTimeSpent),
      syntax_errors: Number(syntaxErrors),
      structural_errors: Number(structuralErrors),
      label: values[5],
    };

    if (
      !Object.values(row).slice(0, 5).every(Number.isFinite) ||
      row.success_rate < 0 || row.success_rate > 1 ||
      row.avg_attempts < 1 || row.avg_time_spent < 0 ||
      row.syntax_errors < 0 || row.structural_errors < 0 ||
      !LABELS.has(row.label)
    ) {
      throw new Error(`Invalid training CSV values on row ${index + 2}.`);
    }
    return row;
  });
}

function makeAssignments(rows, users, problemCounts) {
  if (users.length < 2) {
    throw new Error('At least two empty student accounts are required; no data was changed.');
  }

  const assignments = users.map(user => ({ user, profiles: [], dailyScores: new Map() }));
  rows.forEach((row, rowIndex) => {
    const assignment = assignments[rowIndex % assignments.length];
    const localIndex = assignment.profiles.length;
    const language = LANGUAGES[localIndex % LANGUAGES.length];
    const concept = CONCEPTS[Math.floor(localIndex / LANGUAGES.length) % CONCEPTS.length];
    const totalTasks = Number(problemCounts.get(`${language}::${concept}`) || 0);
    if (totalTasks < 1) {
      throw new Error(`No catalog problems found for ${language} / ${concept}; no data was changed.`);
    }

    assignment.profiles.push({
      ...row,
      language,
      concept,
      total_tasks: totalTasks,
      tasks_completed: Math.round(row.success_rate * totalTasks),
      total_attempts: Math.max(1, Math.round(row.avg_attempts)),
    });
    const scoreSamples = assignment.dailyScores.get(language) || [];
    scoreSamples.push(row.success_rate * 100);
    assignment.dailyScores.set(language, scoreSamples);
  });

  return assignments;
}

async function seedDemoProgress({ apply = false } = {}) {
  const rows = loadTrainingData();
  const db = require('../db');
  const client = await db.connect();

  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const { rows: eligibleUsers } = await client.query(
      `SELECT u.id, u.username
       FROM users u
       WHERE u.role = 'student'
         AND NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM daily_progress dp WHERE dp.user_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id)
       ORDER BY u.created_at, u.id
       LIMIT $1
       FOR UPDATE OF u`,
      [rows.length]
    );

    const { rows: counts } = await client.query(
      `SELECT language, concept, COUNT(*) AS total
       FROM problems
       GROUP BY language, concept`
    );
    const problemCounts = new Map(counts.map(row => [
      `${row.language}::${row.concept}`,
      Number(row.total),
    ]));
    const assignments = makeAssignments(rows, eligibleUsers, problemCounts);
    const plannedProfiles = assignments.reduce((total, item) => total + item.profiles.length, 0);
    const plannedDailyScores = assignments.reduce((total, item) => total + item.dailyScores.size, 0);
    if (plannedProfiles !== rows.length) {
      throw new Error('Not all training rows have an insert planned; no data was changed.');
    }

    console.log(`Validated ${rows.length} training samples.`);
    console.log(`Eligible empty student accounts selected: ${eligibleUsers.map(user => user.username).join(', ')}`);
    console.log(`Planned inserts: ${plannedProfiles} profile rows and ${plannedDailyScores} daily score rows.`);

    if (!apply) {
      await client.query('ROLLBACK');
      console.log('Dry run only. No database rows were changed. Re-run with --apply to insert.');
      return;
    }

    for (const assignment of assignments) {
      for (const profile of assignment.profiles) {
        const result = await client.query(
          `INSERT INTO user_profiles
             (user_id, language, concept, total_attempts, tasks_completed,
              total_tasks, success_rate, avg_time_spent, avg_attempts,
              syntax_errors, structural_errors, performance_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT DO NOTHING`,
          [
            assignment.user.id,
            profile.language,
            profile.concept,
            profile.total_attempts,
            profile.tasks_completed,
            profile.total_tasks,
            profile.success_rate,
            profile.avg_time_spent,
            profile.avg_attempts,
            profile.syntax_errors,
            profile.structural_errors,
            profile.label,
          ]
        );
        if (result.rowCount !== 1) {
          throw new Error(`Concurrent profile change detected for ${assignment.user.username}; rolling back.`);
        }
      }

      for (const [language, scores] of assignment.dailyScores) {
        const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
        const result = await client.query(
          `INSERT INTO daily_progress (user_id, language, progress_date, score)
           VALUES ($1, $2, CURRENT_DATE, $3)
           ON CONFLICT DO NOTHING`,
          [assignment.user.id, language, score]
        );
        if (result.rowCount !== 1) {
          throw new Error(`Concurrent daily progress change detected for ${assignment.user.username}; rolling back.`);
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Inserted all ${plannedProfiles} CSV-backed profiles. Existing learner records and submissions were not modified.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  seedDemoProgress({ apply: process.argv.includes('--apply') })
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { loadTrainingData, makeAssignments };