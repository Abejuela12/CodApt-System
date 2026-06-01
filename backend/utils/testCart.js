/**
 * utils/testCart.js
 * ─────────────────────────────────────────────────────────────────
 * CodApt — CART Decision Tree Test Suite
 *
 * Tests the trained cart_model.json against 60 labeled student
 * profiles that were NOT part of the training data.
 *
 * What this script produces:
 *   ✔ Overall accuracy
 *   ✔ Per-class precision, recall, F1-score
 *   ✔ Confusion matrix
 *   ✔ Boundary / edge-case analysis
 *   ✔ Per-student result table (pass/fail)
 *
 * Usage:
 *   node utils/testCart.js
 *
 * No database connection needed — reads cart_model.json only.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { CARTClassifier } = require('./cartModel');

// ─── Load model ──────────────────────────────────────────────────
const MODEL_PATH = path.join(__dirname, 'cart_model.json');
if (!fs.existsSync(MODEL_PATH)) {
  console.error('❌ cart_model.json not found. Run: node utils/trainCart.js first.');
  process.exit(1);
}
const exported = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
const cart = new CARTClassifier();
cart.importTree(exported);
console.log(`✅ Model loaded  (trained at ${exported.meta.trained_at})`);
console.log(`   Thresholds used by tree:`);
cart.printTree();
console.log('');

// ─── Test Dataset ────────────────────────────────────────────────
// 60 samples — 20 per class.
// These are NEW profiles, none overlapping with SEED_DATA in trainCart.js.
//
// Columns:
//   id             — test case number
//   desc           — who this student represents
//   success_rate   — fraction of tasks answered correctly (0–1)
//   avg_attempts   — average number of tries per task (≥1)
//   avg_time_spent — average seconds per task
//   syntax_errors  — cumulative syntax error count
//   structural_errors — cumulative structural error count
//   expected       — ground-truth label (Easy / Intermediate / Hard)

const TEST_DATA = [

  // ════════════════════════════════════════════════════════════════
  //  EASY — 20 samples
  //  These are learners who are clearly struggling.
  //  Expected classification: Easy (keep giving easier problems)
  // ════════════════════════════════════════════════════════════════

  // Clear Easy — very low success, many attempts
  { id:1,  desc:'Complete beginner, gets nothing right',
    success_rate:0.00, avg_attempts:8, avg_time_spent:300, syntax_errors:7, structural_errors:5, expected:'Easy' },

  { id:2,  desc:'Beginner, rare lucky guess',
    success_rate:0.10, avg_attempts:7, avg_time_spent:270, syntax_errors:6, structural_errors:4, expected:'Easy' },

  { id:3,  desc:'Tries hard but makes many errors',
    success_rate:0.20, avg_attempts:6, avg_time_spent:250, syntax_errors:5, structural_errors:4, expected:'Easy' },

  { id:4,  desc:'Getting 1 in 4 right, slow',
    success_rate:0.25, avg_attempts:5, avg_time_spent:210, syntax_errors:4, structural_errors:3, expected:'Easy' },

  { id:5,  desc:'Slightly improving but still Easy',
    success_rate:0.30, avg_attempts:5, avg_time_spent:190, syntax_errors:4, structural_errors:3, expected:'Easy' },

  { id:6,  desc:'1 in 3 right, below average time',
    success_rate:0.33, avg_attempts:4, avg_time_spent:160, syntax_errors:3, structural_errors:2, expected:'Easy' },

  { id:7,  desc:'Low success but quick (guessing)',
    success_rate:0.35, avg_attempts:3, avg_time_spent:50,  syntax_errors:0, structural_errors:3, expected:'Easy' },

  { id:8,  desc:'Moderate errors, low success',
    success_rate:0.38, avg_attempts:4, avg_time_spent:145, syntax_errors:3, structural_errors:2, expected:'Easy' },

  { id:9,  desc:'Many structural mistakes',
    success_rate:0.40, avg_attempts:5, avg_time_spent:200, syntax_errors:2, structural_errors:5, expected:'Easy' },

  { id:10, desc:'Almost at boundary but slow',
    success_rate:0.42, avg_attempts:4, avg_time_spent:185, syntax_errors:3, structural_errors:2, expected:'Easy' },

  { id:11, desc:'Right below Easy/Intermediate boundary',
    success_rate:0.44, avg_attempts:5, avg_time_spent:175, syntax_errors:3, structural_errors:3, expected:'Easy' },

  { id:12, desc:'Just below threshold with many attempts',
    success_rate:0.46, avg_attempts:6, avg_time_spent:220, syntax_errors:4, structural_errors:3, expected:'Easy' },

  // Boundary cases — just inside Easy (≤ 0.475)
  { id:13, desc:'Exactly at lower boundary',
    success_rate:0.47, avg_attempts:4, avg_time_spent:160, syntax_errors:2, structural_errors:2, expected:'Easy' },

  { id:14, desc:'At threshold (≤0.475)',
    success_rate:0.475, avg_attempts:4, avg_time_spent:155, syntax_errors:2, structural_errors:1, expected:'Easy' },

  // Easy but with low syntax errors (still low success rate)
  { id:15, desc:'Clean code but wrong logic',
    success_rate:0.20, avg_attempts:3, avg_time_spent:120, syntax_errors:0, structural_errors:4, expected:'Easy' },

  { id:16, desc:'Fast but consistently wrong',
    success_rate:0.15, avg_attempts:2, avg_time_spent:40,  syntax_errors:0, structural_errors:5, expected:'Easy' },

  { id:17, desc:'Slow and struggling',
    success_rate:0.10, avg_attempts:7, avg_time_spent:400, syntax_errors:8, structural_errors:6, expected:'Easy' },

  { id:18, desc:'Moderate time, poor success',
    success_rate:0.30, avg_attempts:4, avg_time_spent:100, syntax_errors:2, structural_errors:2, expected:'Easy' },

  { id:19, desc:'Zero success despite effort',
    success_rate:0.00, avg_attempts:5, avg_time_spent:350, syntax_errors:6, structural_errors:5, expected:'Easy' },

  { id:20, desc:'Low success with minimal errors (guessing)',
    success_rate:0.40, avg_attempts:2, avg_time_spent:30,  syntax_errors:0, structural_errors:1, expected:'Easy' },


  // ════════════════════════════════════════════════════════════════
  //  INTERMEDIATE — 20 samples
  //  Learners who are progressing but not yet advanced.
  //  success_rate: 0.476 – 0.79
  // ════════════════════════════════════════════════════════════════

  // Just above Easy boundary
  { id:21, desc:'Just crossed into Intermediate',
    success_rate:0.48, avg_attempts:3, avg_time_spent:95,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:22, desc:'Steady mid-level learner',
    success_rate:0.50, avg_attempts:3, avg_time_spent:90,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:23, desc:'Half correct, decent pace',
    success_rate:0.52, avg_attempts:3, avg_time_spent:85,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:24, desc:'More than half right',
    success_rate:0.55, avg_attempts:3, avg_time_spent:80,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:25, desc:'Comfortable mid-level',
    success_rate:0.58, avg_attempts:2, avg_time_spent:75,  syntax_errors:1, structural_errors:0, expected:'Intermediate' },

  { id:26, desc:'60% success, clean code',
    success_rate:0.60, avg_attempts:2, avg_time_spent:70,  syntax_errors:0, structural_errors:1, expected:'Intermediate' },

  { id:27, desc:'Consistent mid performer',
    success_rate:0.62, avg_attempts:3, avg_time_spent:88,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:28, desc:'Two-thirds correct',
    success_rate:0.65, avg_attempts:2, avg_time_spent:72,  syntax_errors:0, structural_errors:1, expected:'Intermediate' },

  { id:29, desc:'Above average, some errors',
    success_rate:0.67, avg_attempts:3, avg_time_spent:100, syntax_errors:2, structural_errors:1, expected:'Intermediate' },

  { id:30, desc:'68% — solidly Intermediate',
    success_rate:0.68, avg_attempts:2, avg_time_spent:65,  syntax_errors:0, structural_errors:0, expected:'Intermediate' },

  { id:31, desc:'70% success',
    success_rate:0.70, avg_attempts:2, avg_time_spent:68,  syntax_errors:0, structural_errors:1, expected:'Intermediate' },

  { id:32, desc:'72% with minor errors',
    success_rate:0.72, avg_attempts:3, avg_time_spent:82,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  { id:33, desc:'75% — near top of Intermediate',
    success_rate:0.75, avg_attempts:2, avg_time_spent:75,  syntax_errors:1, structural_errors:0, expected:'Intermediate' },

  { id:34, desc:'77% success, few attempts',
    success_rate:0.77, avg_attempts:2, avg_time_spent:60,  syntax_errors:0, structural_errors:0, expected:'Intermediate' },

  { id:35, desc:'78% — still Intermediate',
    success_rate:0.78, avg_attempts:3, avg_time_spent:90,  syntax_errors:1, structural_errors:1, expected:'Intermediate' },

  // Right at upper boundary
  { id:36, desc:'Just below Hard threshold (0.789)',
    success_rate:0.789, avg_attempts:2, avg_time_spent:65, syntax_errors:0, structural_errors:1, expected:'Intermediate' },

  { id:37, desc:'At 0.79 threshold exactly',
    success_rate:0.79, avg_attempts:2, avg_time_spent:62,  syntax_errors:0, structural_errors:0, expected:'Intermediate' },

  // Intermediate but with higher error counts
  { id:38, desc:'Good success but many attempts',
    success_rate:0.60, avg_attempts:5, avg_time_spent:150, syntax_errors:3, structural_errors:2, expected:'Intermediate' },

  { id:39, desc:'Mid success, slow coder',
    success_rate:0.55, avg_attempts:3, avg_time_spent:180, syntax_errors:2, structural_errors:2, expected:'Intermediate' },

  { id:40, desc:'Mid success, very fast (Intermediate confirmed)',
    success_rate:0.70, avg_attempts:1, avg_time_spent:30,  syntax_errors:0, structural_errors:0, expected:'Intermediate' },


  // ════════════════════════════════════════════════════════════════
  //  HARD — 20 samples
  //  Advanced learners who should be challenged.
  //  success_rate: > 0.79
  // ════════════════════════════════════════════════════════════════

  // Just above Intermediate boundary
  { id:41, desc:'Just entered Hard tier (0.80)',
    success_rate:0.80, avg_attempts:2, avg_time_spent:60,  syntax_errors:1, structural_errors:0, expected:'Hard' },

  { id:42, desc:'81% — solid Hard learner',
    success_rate:0.81, avg_attempts:2, avg_time_spent:55,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:43, desc:'82% with one mistake per task',
    success_rate:0.82, avg_attempts:2, avg_time_spent:58,  syntax_errors:1, structural_errors:0, expected:'Hard' },

  { id:44, desc:'83% consistent performer',
    success_rate:0.83, avg_attempts:1, avg_time_spent:50,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:45, desc:'85% — good Hard level',
    success_rate:0.85, avg_attempts:1, avg_time_spent:48,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:46, desc:'86% quick and accurate',
    success_rate:0.86, avg_attempts:1, avg_time_spent:44,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:47, desc:'87% above average',
    success_rate:0.87, avg_attempts:2, avg_time_spent:55,  syntax_errors:1, structural_errors:0, expected:'Hard' },

  { id:48, desc:'88% strong performer',
    success_rate:0.88, avg_attempts:1, avg_time_spent:42,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:49, desc:'90% excellent',
    success_rate:0.90, avg_attempts:1, avg_time_spent:40,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:50, desc:'91% rarely needs retry',
    success_rate:0.91, avg_attempts:1, avg_time_spent:38,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:51, desc:'92% very fast and accurate',
    success_rate:0.92, avg_attempts:1, avg_time_spent:36,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:52, desc:'93% — near mastery',
    success_rate:0.93, avg_attempts:1, avg_time_spent:35,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:53, desc:'95% almost perfect',
    success_rate:0.95, avg_attempts:1, avg_time_spent:32,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:54, desc:'97% expert level',
    success_rate:0.97, avg_attempts:1, avg_time_spent:28,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:55, desc:'100% perfect score',
    success_rate:1.00, avg_attempts:1, avg_time_spent:25,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  // Hard but with some quirks
  { id:56, desc:'High success but slow coder',
    success_rate:0.85, avg_attempts:2, avg_time_spent:180, syntax_errors:1, structural_errors:0, expected:'Hard' },

  { id:57, desc:'High success, many attempts (persistent)',
    success_rate:0.80, avg_attempts:4, avg_time_spent:120, syntax_errors:2, structural_errors:1, expected:'Hard' },

  { id:58, desc:'90% but takes their time',
    success_rate:0.90, avg_attempts:2, avg_time_spent:140, syntax_errors:1, structural_errors:0, expected:'Hard' },

  { id:59, desc:'95% speed demon',
    success_rate:0.95, avg_attempts:1, avg_time_spent:15,  syntax_errors:0, structural_errors:0, expected:'Hard' },

  { id:60, desc:'Just above boundary, minimal errors',
    success_rate:0.791, avg_attempts:2, avg_time_spent:62, syntax_errors:0, structural_errors:0, expected:'Hard' },
];

// ─── Run predictions ─────────────────────────────────────────────
const LABELS   = ['Easy', 'Intermediate', 'Hard'];
const FEATURES = ['success_rate', 'avg_attempts', 'avg_time_spent', 'syntax_errors', 'structural_errors'];

// Confusion matrix: rows = actual, cols = predicted
const confusion = {
  Easy:         { Easy: 0, Intermediate: 0, Hard: 0 },
  Intermediate: { Easy: 0, Intermediate: 0, Hard: 0 },
  Hard:         { Easy: 0, Intermediate: 0, Hard: 0 },
};

const results  = [];
let   correct  = 0;
const wrong    = [];

for (const sample of TEST_DATA) {
  const features = Object.fromEntries(FEATURES.map(f => [f, sample[f]]));
  const predicted = cart.predict(features);
  const isCorrect = predicted === sample.expected;

  results.push({ ...sample, predicted, correct: isCorrect });
  confusion[sample.expected][predicted]++;
  if (isCorrect) correct++;
  else wrong.push({ id: sample.id, desc: sample.desc, expected: sample.expected, predicted });
}

// ─── Print per-student results ───────────────────────────────────
console.log('═'.repeat(100));
console.log(' CART TEST RESULTS — Per Student');
console.log('═'.repeat(100));
console.log(
  ' ID  │ ' +
  'Rate  │' +
  'Atts │' +
  'Time  │' +
  'SynE │' +
  'StrE │' +
  'Expected      │' +
  'Predicted     │' +
  'Result'
);
console.log('─'.repeat(100));

for (const r of results) {
  const id       = String(r.id).padStart(3);
  const rate     = r.success_rate.toFixed(3).padStart(5);
  const atts     = String(r.avg_attempts).padStart(4);
  const time     = String(r.avg_time_spent).padStart(5);
  const synE     = String(r.syntax_errors).padStart(4);
  const strE     = String(r.structural_errors).padStart(4);
  const exp      = r.expected.padEnd(13);
  const pred     = r.predicted.padEnd(13);
  const mark     = r.correct ? '✓' : '✗ ← WRONG';
  console.log(` ${id} │ ${rate} │${atts} │${time} │${synE} │${strE} │ ${exp} │ ${pred} │ ${mark}`);
}

// ─── Print wrong predictions ─────────────────────────────────────
if (wrong.length > 0) {
  console.log('\n' + '─'.repeat(100));
  console.log(' MISCLASSIFICATIONS');
  console.log('─'.repeat(100));
  for (const w of wrong) {
    console.log(` #${w.id} "${w.desc}"`);
    console.log(`    Expected: ${w.expected}  →  Predicted: ${w.predicted}`);
  }
}

// ─── Confusion matrix ────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(' CONFUSION MATRIX  (rows = Actual, cols = Predicted)');
console.log('═'.repeat(60));
const colW = 16;
const header = '               │' + LABELS.map(l => l.padEnd(colW)).join('│');
console.log(header);
console.log('─'.repeat(header.length));
for (const actual of LABELS) {
  const row = actual.padEnd(14) + ' │' +
    LABELS.map(pred => {
      const n = confusion[actual][pred];
      const cell = n > 0 ? String(n) : '·';
      return cell.padEnd(colW);
    }).join('│');
  console.log(row);
}

// ─── Per-class metrics ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(' PER-CLASS METRICS');
console.log('═'.repeat(60));
console.log(' Class         │ Precision │  Recall  │    F1    │ Support');
console.log('─'.repeat(60));

const classMetrics = {};
for (const label of LABELS) {
  const tp = confusion[label][label];

  // False positives: other classes predicted as this label
  const fp = LABELS.filter(l => l !== label).reduce((s, l) => s + confusion[l][label], 0);

  // False negatives: this label predicted as another
  const fn = LABELS.filter(l => l !== label).reduce((s, l) => s + confusion[label][l], 0);

  const support  = tp + fn;
  const precision = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const recall    = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1        = (precision + recall) === 0 ? 0 : 2 * precision * recall / (precision + recall);

  classMetrics[label] = { precision, recall, f1, support };

  const pStr = (precision * 100).toFixed(1).padStart(8) + '%';
  const rStr = (recall    * 100).toFixed(1).padStart(8) + '%';
  const fStr = (f1        * 100).toFixed(1).padStart(8) + '%';
  console.log(` ${label.padEnd(14)} │ ${pStr}  │ ${rStr} │ ${fStr} │   ${support}`);
}

// Macro average
const macro = LABELS.reduce((acc, l) => {
  acc.precision += classMetrics[l].precision;
  acc.recall    += classMetrics[l].recall;
  acc.f1        += classMetrics[l].f1;
  return acc;
}, { precision: 0, recall: 0, f1: 0 });
const n = LABELS.length;
console.log('─'.repeat(60));
console.log(
  ` ${'Macro Avg'.padEnd(14)} │ ${((macro.precision/n)*100).toFixed(1).padStart(8)}%  │ ` +
  `${((macro.recall/n)*100).toFixed(1).padStart(8)}% │ ` +
  `${((macro.f1/n)*100).toFixed(1).padStart(8)}% │   ${TEST_DATA.length}`
);

// ─── Overall summary ─────────────────────────────────────────────
const accuracy = correct / TEST_DATA.length;
const byClass  = {
  Easy:         TEST_DATA.filter(s => s.expected === 'Easy').length,
  Intermediate: TEST_DATA.filter(s => s.expected === 'Intermediate').length,
  Hard:         TEST_DATA.filter(s => s.expected === 'Hard').length,
};

console.log('\n' + '═'.repeat(60));
console.log(' OVERALL SUMMARY');
console.log('═'.repeat(60));
console.log(` Total test samples  : ${TEST_DATA.length}`);
console.log(` Correctly classified: ${correct}`);
console.log(` Misclassified       : ${wrong.length}`);
console.log(` Overall Accuracy    : ${(accuracy * 100).toFixed(2)}%`);
console.log('');
console.log(` Samples per class:`);
console.log(`   Easy         : ${byClass.Easy}`);
console.log(`   Intermediate : ${byClass.Intermediate}`);
console.log(`   Hard         : ${byClass.Hard}`);
console.log('');

// ─── Boundary analysis ───────────────────────────────────────────
console.log('─'.repeat(60));
console.log(' BOUNDARY ANALYSIS (±0.02 of decision thresholds)');
console.log('─'.repeat(60));

// The tree has two thresholds: 0.475 and 0.79
const boundaries = [
  { thresh: 0.475, below: 'Easy',         above: 'Intermediate', name: 'Easy / Intermediate' },
  { thresh: 0.79,  below: 'Intermediate', above: 'Hard',         name: 'Intermediate / Hard'  },
];

for (const b of boundaries) {
  const nearBoundary = TEST_DATA.filter(
    s => Math.abs(s.success_rate - b.thresh) <= 0.02
  );
  if (nearBoundary.length === 0) { console.log(` ${b.name}: no samples within ±0.02`); continue; }

  const r = results.filter(r => nearBoundary.some(s => s.id === r.id));
  const correct_boundary = r.filter(r => r.correct).length;
  console.log(` ${b.name} boundary (threshold=${b.thresh}):`);
  for (const s of r) {
    const mark = s.correct ? '✓' : '✗';
    console.log(`   ${mark} #${s.id}  rate=${s.success_rate.toFixed(3)}  expected=${s.expected.padEnd(12)}  got=${s.predicted}`);
  }
  console.log(`   → Boundary accuracy: ${correct_boundary}/${r.length}`);
  console.log('');
}

// ─── Interpretation ──────────────────────────────────────────────
console.log('═'.repeat(60));
console.log(' INTERPRETATION');
console.log('═'.repeat(60));
if (accuracy >= 0.95) {
  console.log(' ✅ EXCELLENT — Model is highly accurate on unseen data.');
  console.log('    Your CART is generalising well and is ready for production.');
} else if (accuracy >= 0.85) {
  console.log(' ✅ GOOD — Model performs well. Acceptable for thesis use.');
  console.log('    Consider retraining with real respondent data to improve further.');
} else if (accuracy >= 0.70) {
  console.log(' ⚠  ACCEPTABLE — Model is functional but has room to improve.');
  console.log('    Retrain with real data after collecting respondent submissions.');
} else {
  console.log(' ❌ LOW ACCURACY — Model may be overfitting the synthetic data.');
  console.log('    Review SEED_DATA distribution or adjust tree hyperparameters.');
}

console.log('');
console.log(' Note: This model was trained on synthetic data. Accuracy will');
console.log(' change (likely improve) after retraining with your 36 respondents.');
console.log('═'.repeat(60));

process.exit(0);