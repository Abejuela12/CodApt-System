/**
 * utils/trainCart.js
 * ─────────────────────────────────────────────────────────────────
 * Standalone training script.
 *
 * Run once (or on a schedule) to re-train the CART from your
 * submissions database and write cart_model.json.
 *
 * Usage:
 *   node utils/trainCart.js
 *
 * What it does:
 *   1. Queries user_profiles for all rows that have a ground-truth
 *      performance_level (from previously approved labels or expert
 *      annotation).
 *   2. Falls back to generating synthetic bootstrap labels from the
 *      raw feature values when the table has fewer than MIN_ROWS rows
 *      — this ensures the server always has a model to load.
 *   3. Splits data 80/20 train/test, trains the CART, evaluates it,
 *      prints the learned tree, then saves cart_model.json.
 *
 * Output file: utils/cart_model.json  (loaded by server.js at startup)
 */

'use strict';

const path             = require('path');
const fs               = require('fs');
const db               = require('../db');
const { CARTClassifier } = require('./cartModel');

// Minimum rows required before we try to use DB labels.
// Below this we generate a synthetic seed dataset instead.
const MIN_ROWS = 10;

// ─── Synthetic seed dataset ───────────────────────────────────────
// These are realistic representative samples that encode the same
// decision logic as the previous hardcoded rules, but expressed as
// labeled examples rather than explicit thresholds.
// Once real data accumulates the tree will override these patterns.
const SEED_DATA = [
  // ── Easy (struggling learners) ────────────────────────────────
  { success_rate: 0.0,  avg_attempts: 6, avg_time_spent: 180, syntax_errors: 5, structural_errors: 4, label: 'Easy' },
  { success_rate: 0.1,  avg_attempts: 5, avg_time_spent: 160, syntax_errors: 4, structural_errors: 3, label: 'Easy' },
  { success_rate: 0.2,  avg_attempts: 5, avg_time_spent: 150, syntax_errors: 3, structural_errors: 3, label: 'Easy' },
  { success_rate: 0.25, avg_attempts: 4, avg_time_spent: 140, syntax_errors: 3, structural_errors: 2, label: 'Easy' },
  { success_rate: 0.3,  avg_attempts: 4, avg_time_spent: 130, syntax_errors: 2, structural_errors: 2, label: 'Easy' },
  { success_rate: 0.35, avg_attempts: 4, avg_time_spent: 120, syntax_errors: 2, structural_errors: 2, label: 'Easy' },
  { success_rate: 0.4,  avg_attempts: 5, avg_time_spent: 200, syntax_errors: 4, structural_errors: 3, label: 'Easy' },
  { success_rate: 0.45, avg_attempts: 4, avg_time_spent: 170, syntax_errors: 3, structural_errors: 2, label: 'Easy' },
  { success_rate: 0.2,  avg_attempts: 3, avg_time_spent: 90,  syntax_errors: 1, structural_errors: 3, label: 'Easy' },
  { success_rate: 0.3,  avg_attempts: 6, avg_time_spent: 250, syntax_errors: 5, structural_errors: 4, label: 'Easy' },
  { success_rate: 0.15, avg_attempts: 4, avg_time_spent: 100, syntax_errors: 2, structural_errors: 1, label: 'Easy' },
  { success_rate: 0.05, avg_attempts: 7, avg_time_spent: 300, syntax_errors: 6, structural_errors: 5, label: 'Easy' },

  // ── Intermediate (mid-range learners) ────────────────────────
  { success_rate: 0.5,  avg_attempts: 3, avg_time_spent: 90,  syntax_errors: 1, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.55, avg_attempts: 3, avg_time_spent: 80,  syntax_errors: 1, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.6,  avg_attempts: 2, avg_time_spent: 75,  syntax_errors: 1, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.65, avg_attempts: 3, avg_time_spent: 85,  syntax_errors: 1, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.7,  avg_attempts: 2, avg_time_spent: 70,  syntax_errors: 1, structural_errors: 0, label: 'Intermediate' },
  { success_rate: 0.75, avg_attempts: 3, avg_time_spent: 100, syntax_errors: 2, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.6,  avg_attempts: 4, avg_time_spent: 110, syntax_errors: 2, structural_errors: 2, label: 'Intermediate' },
  { success_rate: 0.5,  avg_attempts: 2, avg_time_spent: 60,  syntax_errors: 0, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.7,  avg_attempts: 4, avg_time_spent: 130, syntax_errors: 3, structural_errors: 2, label: 'Intermediate' },
  { success_rate: 0.55, avg_attempts: 3, avg_time_spent: 95,  syntax_errors: 1, structural_errors: 0, label: 'Intermediate' },
  { success_rate: 0.65, avg_attempts: 2, avg_time_spent: 65,  syntax_errors: 0, structural_errors: 1, label: 'Intermediate' },
  { success_rate: 0.78, avg_attempts: 3, avg_time_spent: 80,  syntax_errors: 2, structural_errors: 1, label: 'Intermediate' },

  // ── Hard (advanced learners) ──────────────────────────────────
  { success_rate: 0.8,  avg_attempts: 2, avg_time_spent: 60,  syntax_errors: 1, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.85, avg_attempts: 1, avg_time_spent: 45,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.9,  avg_attempts: 1, avg_time_spent: 40,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.95, avg_attempts: 1, avg_time_spent: 35,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 1.0,  avg_attempts: 1, avg_time_spent: 30,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.8,  avg_attempts: 2, avg_time_spent: 55,  syntax_errors: 1, structural_errors: 1, label: 'Hard' },
  { success_rate: 0.85, avg_attempts: 2, avg_time_spent: 65,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.9,  avg_attempts: 1, avg_time_spent: 50,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.82, avg_attempts: 2, avg_time_spent: 58,  syntax_errors: 1, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.88, avg_attempts: 1, avg_time_spent: 42,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.93, avg_attempts: 2, avg_time_spent: 52,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
  { success_rate: 0.97, avg_attempts: 1, avg_time_spent: 38,  syntax_errors: 0, structural_errors: 0, label: 'Hard' },
];

// ─── Shuffle helper ───────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  let rows = [];

  // 1. Try loading from DB
  try {
    const [dbRows] = await db.query(`
      SELECT
        success_rate,
        avg_attempts,
        avg_time_spent,
        syntax_errors,
        structural_errors,
        performance_level AS label
      FROM user_profiles
      WHERE performance_level IS NOT NULL
        AND total_attempts >= 2
    `);
    rows = dbRows;
    console.log(`📦 Loaded ${rows.length} rows from user_profiles.`);
  } catch (err) {
    console.warn(`⚠ Could not query DB: ${err.message}`);
  }

  // 2. Fall back to seed data if not enough real rows
  if (rows.length < MIN_ROWS) {
    console.log(`ℹ Not enough DB rows (${rows.length} < ${MIN_ROWS}). Using synthetic seed data.`);
    rows = SEED_DATA;
  } else {
    // Merge seed data as a minority-class anchor (prevents overfitting to current distribution)
    console.log(`✔ Merging ${SEED_DATA.length} seed samples with ${rows.length} real samples.`);
    rows = [...rows, ...SEED_DATA];
  }

  console.log(`📊 Total training samples: ${rows.length}`);

  // 3. Shuffle and split 80/20
  const shuffled   = shuffle(rows);
  const splitAt    = Math.floor(shuffled.length * 0.8);
  const trainRows  = shuffled.slice(0, splitAt);
  const testRows   = shuffled.slice(splitAt);

  const features = ['success_rate', 'avg_attempts', 'avg_time_spent', 'syntax_errors', 'structural_errors'];
  const trainX   = trainRows.map(r => Object.fromEntries(features.map(f => [f, r[f]])));
  const trainY   = trainRows.map(r => r.label);
  const testX    = testRows.map(r => Object.fromEntries(features.map(f => [f, r[f]])));
  const testY    = testRows.map(r => r.label);

  // 4. Train
  const cart = new CARTClassifier({
    max_depth:         5,
    min_samples_split: 4,
    min_samples_leaf:  2,
    features,
  });

  cart.fit(trainX, trainY);

  // 5. Print learned tree
  console.log('\n');
  cart.printTree();
  console.log('\n');

  // 6. Evaluate
  if (testX.length > 0) {
    cart.evaluate(testX, testY);
  } else {
    console.log('(no test rows to evaluate — all data used for training)');
  }

  // 7. Save model
  const outPath = path.join(__dirname, 'cart_model.json');
  const exported = cart.exportTree();
  fs.writeFileSync(outPath, JSON.stringify(exported, null, 2), 'utf8');
  console.log(`\n💾 Model saved → ${outPath}`);
  console.log(`   Trained at : ${exported.meta.trained_at}`);
  console.log(`   Max depth  : ${exported.meta.max_depth}`);
  console.log(`   Features   : ${exported.meta.features.join(', ')}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Training failed:', err);
  process.exit(1);
});