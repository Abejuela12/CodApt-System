

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ─────────────────────────────────────────────────────
const TOTAL_SAMPLES = parseInt(process.argv[2], 10) || 900;   // 500–1000 recommended
const OUTLIER_RATE   = parseFloat(process.argv[3]) || 0.04;    // 4% noisy/edge-case rows
const SAMPLES_PER_CLASS = Math.floor(TOTAL_SAMPLES / 3);

// If you already exported real rows from user_profiles as JSON
// (same shape as below), point this at that file to merge them in.
const MERGE_REAL_DATA_PATH = null; // e.g. './real_user_profiles.json'

const OUT_DIR = __dirname;

// ─── Class definitions ──────────────────────────────────────────
// success_rate ranges match the thresholds already baked into your
// trained tree (cart_model.json: 0.475 and 0.79) so the synthetic
// data is consistent with what CodApt already predicts.
//
// For the correlated features we define a LOW anchor (worst-case
// learner in that band) and HIGH anchor (best-case learner in that
// band), then interpolate + add Gaussian noise based on where the
// sampled success_rate falls within its band.
const CLASSES = {
  Easy: {
    label: 'Easy',
    rateRange: [0.00, 0.475],
    anchors: {
      // [low-performer-in-band, high-performer-in-band]
      avg_attempts:       [7.5, 3.0],
      avg_time_spent:     [280, 90],
      syntax_errors:      [6.0, 1.0],
      structural_errors:  [5.0, 1.0],
    },
    noise: { attempts: 1.1, time: 35, syntax: 1.2, structural: 1.0 },
  },
  Intermediate: {
    label: 'Intermediate',
    rateRange: [0.476, 0.79],
    anchors: {
      avg_attempts:       [4.0, 1.5],
      avg_time_spent:     [130, 55],
      syntax_errors:      [2.0, 0.0],
      structural_errors:  [1.5, 0.0],
    },
    noise: { attempts: 0.8, time: 20, syntax: 0.8, structural: 0.7 },
  },
  Hard: {
    label: 'Hard',
    rateRange: [0.791, 1.00],
    anchors: {
      avg_attempts:       [2.2, 1.0],
      avg_time_spent:     [70, 20],
      syntax_errors:      [1.0, 0.0],
      structural_errors:  [0.6, 0.0],
    },
    noise: { attempts: 0.5, time: 15, syntax: 0.5, structural: 0.4 },
  },
};

// ─── Helpers ────────────────────────────────────────────────────
function gaussianNoise(std) {
  // Box-Muller transform, mean 0
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function round(v, decimals = 2) {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

// ─── Sample generation ──────────────────────────────────────────
function generateSample(classDef, forceOutlier = false) {
  const [lo, hi] = classDef.rateRange;
  let success_rate = lo + Math.random() * (hi - lo);

  // Boundary jitter: real-world labels are never perfectly separable by
  // success_rate alone (measurement noise, inconsistent grading of a task,
  // a lucky/unlucky attempt, etc.). Without this, a tree trained on this
  // data hits a suspicious 100% accuracy because success_rate alone fully
  // determines the label. Adding small Gaussian jitter — biggest near the
  // band edges — creates a small, honest amount of class overlap.
  const distToLowerEdge = success_rate - lo;
  const distToUpperEdge = hi - success_rate;
  const distToNearestEdge = Math.min(distToLowerEdge, distToUpperEdge);
  const edgeProximity = clamp(1 - distToNearestEdge / 0.05, 0, 1); // ramps up within 0.05 of an edge
  success_rate += gaussianNoise(0.015) * (0.4 + edgeProximity);    // baseline jitter + extra near edges
  success_rate = round(clamp(success_rate, 0, 1), 3);

  // t = 0 at the "struggling" edge of the band, 1 at the "strong" edge
  // (computed from the ORIGINAL band, before jitter, so correlated
  // features stay consistent with the sample's true intended class)
  const bandSpan = hi - lo || 1;
  const t = clamp((success_rate - lo) / bandSpan, 0, 1);

  const a = classDef.anchors;
  const n = classDef.noise;

  let avg_attempts      = lerp(a.avg_attempts[0], a.avg_attempts[1], t) + gaussianNoise(n.attempts);
  let avg_time_spent    = lerp(a.avg_time_spent[0], a.avg_time_spent[1], t) + gaussianNoise(n.time);
  let syntax_errors     = lerp(a.syntax_errors[0], a.syntax_errors[1], t) + gaussianNoise(n.syntax);
  let structural_errors = lerp(a.structural_errors[0], a.structural_errors[1], t) + gaussianNoise(n.structural);

  // Occasional outlier: a learner who breaks the usual correlation
  // (e.g., high success rate but still slow, or low success but lucky/fast).
  // This is what keeps the dataset from being perfectly, unrealistically
  // separable — real classifiers should show a small, honest error rate.
  if (forceOutlier) {
    if (Math.random() < 0.5) {
      avg_time_spent *= 1.8 + Math.random();      // unusually slow despite level
      avg_attempts   += 2 + Math.random() * 2;
    } else {
      syntax_errors     = Math.max(0, syntax_errors - 2);   // unusually clean despite level
      structural_errors = Math.max(0, structural_errors - 1);
    }
  }

  return {
    success_rate,
    avg_attempts:      round(clamp(avg_attempts, 1, 10), 2),
    avg_time_spent:    round(clamp(avg_time_spent, 10, 600), 0),
    syntax_errors:     round(clamp(syntax_errors, 0, 12), 0),
    structural_errors: round(clamp(structural_errors, 0, 10), 0),
    label: classDef.label,
  };
}

// ─── Build dataset ──────────────────────────────────────────────
function buildDataset() {
  const rows = [];
  Object.values(CLASSES).forEach(classDef => {
    for (let i = 0; i < SAMPLES_PER_CLASS; i++) {
      const isOutlier = Math.random() < OUTLIER_RATE;
      rows.push(generateSample(classDef, isOutlier));
    }
  });

  // Optionally merge in real rows exported from user_profiles
  if (MERGE_REAL_DATA_PATH && fs.existsSync(MERGE_REAL_DATA_PATH)) {
    const real = JSON.parse(fs.readFileSync(MERGE_REAL_DATA_PATH, 'utf8'));
    console.log(`✔ Merging ${real.length} real rows from ${MERGE_REAL_DATA_PATH}`);
    rows.push(...real);
  }

  // Shuffle (Fisher–Yates)
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

// ─── Stratified 80/20 split ──────────────────────────────────────
function stratifiedSplit(rows, trainFrac = 0.8) {
  const byClass = { Easy: [], Intermediate: [], Hard: [] };
  rows.forEach(r => byClass[r.label].push(r));

  const train = [], test = [];
  Object.values(byClass).forEach(classRows => {
    const cut = Math.floor(classRows.length * trainFrac);
    train.push(...classRows.slice(0, cut));
    test.push(...classRows.slice(cut));
  });
  return { train, test };
}

// ─── CSV writer ──────────────────────────────────────────────────
const CSV_HEADER = 'success_rate,avg_attempts,avg_time_spent,syntax_errors,structural_errors,label';
function toCSV(rows) {
  const lines = rows.map(r =>
    `${r.success_rate},${r.avg_attempts},${r.avg_time_spent},${r.syntax_errors},${r.structural_errors},${r.label}`
  );
  return [CSV_HEADER, ...lines].join('\n');
}

// ─── Summary stats (paste into your methodology section) ────────
function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(v => (v - m) ** 2)));
}

function printSummary(rows) {
  console.log('\n' + '═'.repeat(70));
  console.log(' SYNTHETIC DATASET SUMMARY');
  console.log('═'.repeat(70));
  console.log(` Total rows: ${rows.length}  |  Outlier rate target: ${(OUTLIER_RATE * 100).toFixed(1)}%\n`);

  const FEATURES = ['success_rate', 'avg_attempts', 'avg_time_spent', 'syntax_errors', 'structural_errors'];

  ['Easy', 'Intermediate', 'Hard'].forEach(label => {
    const subset = rows.filter(r => r.label === label);
    console.log(` ── ${label}  (n=${subset.length}) ──`);
    FEATURES.forEach(f => {
      const vals = subset.map(r => r[f]);
      console.log(`   ${f.padEnd(18)} mean=${mean(vals).toFixed(2).padStart(7)}  std=${std(vals).toFixed(2).padStart(6)}  min=${Math.min(...vals)}  max=${Math.max(...vals)}`);
    });
    console.log('');
  });
  console.log('═'.repeat(70));
}

// ─── Main ─────────────────────────────────────────────────────────
function main() {
  console.log(`Generating ${TOTAL_SAMPLES} synthetic rows (${SAMPLES_PER_CLASS} per class)...`);
  const rows = buildDataset();

  fs.writeFileSync(path.join(OUT_DIR, 'synthetic_cart_data.json'), JSON.stringify(rows, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'synthetic_cart_data.csv'), toCSV(rows));

  const { train, test } = stratifiedSplit(rows, 0.8);
  fs.writeFileSync(path.join(OUT_DIR, 'synthetic_cart_train.csv'), toCSV(train));
  fs.writeFileSync(path.join(OUT_DIR, 'synthetic_cart_test.csv'), toCSV(test));

  printSummary(rows);
  console.log(`\n Files written to: ${OUT_DIR}`);
  console.log('   synthetic_cart_data.json   (full dataset, drop-in for trainCart.js)');
  console.log('   synthetic_cart_data.csv    (full dataset, for MATLAB/Excel)');
  console.log(`   synthetic_cart_train.csv   (${train.length} rows, 80% stratified)`);
  console.log(`   synthetic_cart_test.csv    (${test.length} rows, 20% stratified, held-out)`);
}

main();