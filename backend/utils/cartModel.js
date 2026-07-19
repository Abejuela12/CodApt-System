

'use strict';

// ─── Gini impurity ────────────────────────────────────────────────
function gini(labels) {
  const n = labels.length;
  if (n === 0) return 0;

  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;

  let impurity = 1;
  for (const c of Object.values(counts)) {
    const p = c / n;
    impurity -= p * p;
  }
  return impurity;
}

// Weighted gini after a split
function giniSplit(leftLabels, rightLabels) {
  const n = leftLabels.length + rightLabels.length;
  if (n === 0) return 0;
  return (
    (leftLabels.length  / n) * gini(leftLabels)  +
    (rightLabels.length / n) * gini(rightLabels)
  );
}

// ─── Majority-class label ─────────────────────────────────────────
function majorityClass(labels) {
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Best split search ────────────────────────────────────────────
function bestSplit(X, y, features) {
  let bestGini   = Infinity;
  let bestFeature = null;
  let bestThreshold = null;

  for (const feat of features) {
    // Collect all unique values for this feature, sorted
    const values = [...new Set(X.map(x => x[feat]))].sort((a, b) => a - b);

    for (let i = 0; i < values.length - 1; i++) {
      // Try threshold midway between consecutive distinct values
      const threshold = (values[i] + values[i + 1]) / 2;

      const leftLabels  = [];
      const rightLabels = [];
      for (let j = 0; j < X.length; j++) {
        if (X[j][feat] <= threshold) leftLabels.push(y[j]);
        else rightLabels.push(y[j]);
      }

      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const g = giniSplit(leftLabels, rightLabels);
      if (g < bestGini) {
        bestGini      = g;
        bestFeature   = feat;
        bestThreshold = threshold;
      }
    }
  }

  return { feature: bestFeature, threshold: bestThreshold, gini: bestGini };
}

// ─── Recursive tree builder ───────────────────────────────────────
function buildTree(X, y, features, depth, params) {
  const { max_depth, min_samples_split, min_samples_leaf } = params;

  // Stopping conditions
  const uniqueLabels = [...new Set(y)];
  if (
    uniqueLabels.length === 1 ||
    y.length < min_samples_split ||
    depth >= max_depth
  ) {
    return { leaf: true, label: majorityClass(y), samples: y.length, distribution: countDistribution(y) };
  }

  const { feature, threshold, gini: splitGini } = bestSplit(X, y, features);

  // No useful split found
  if (feature === null) {
    return { leaf: true, label: majorityClass(y), samples: y.length, distribution: countDistribution(y) };
  }

  const leftX  = [], leftY  = [];
  const rightX = [], rightY = [];
  for (let i = 0; i < X.length; i++) {
    if (X[i][feature] <= threshold) { leftX.push(X[i]); leftY.push(y[i]); }
    else                            { rightX.push(X[i]); rightY.push(y[i]); }
  }

  // Enforce min_samples_leaf
  if (leftY.length < min_samples_leaf || rightY.length < min_samples_leaf) {
    return { leaf: true, label: majorityClass(y), samples: y.length, distribution: countDistribution(y) };
  }

  return {
    leaf:      false,
    feature,
    threshold,
    gini:      splitGini,
    samples:   y.length,
    left:      buildTree(leftX,  leftY,  features, depth + 1, params),
    right:     buildTree(rightX, rightY, features, depth + 1, params),
  };
}

function countDistribution(labels) {
  const d = {};
  for (const l of labels) d[l] = (d[l] || 0) + 1;
  return d;
}

// ─── Predict ─────────────────────────────────────────────────────
function predictOne(node, x) {
  if (node.leaf) return node.label;
  if (x[node.feature] <= node.threshold) return predictOne(node.left, x);
  return predictOne(node.right, x);
}

// ─── Text printer ────────────────────────────────────────────────
function printNode(node, prefix, isLeft) {
  const connector = isLeft ? '├── ' : '└── ';
  const childPfx  = isLeft ? '│   ' : '    ';

  if (node.leaf) {
    console.log(`${prefix}${connector}[LEAF] → ${node.label}  (n=${node.samples}, dist=${JSON.stringify(node.distribution)})`);
    return;
  }

  const thresh = node.threshold.toFixed(4);
  console.log(`${prefix}${connector}${node.feature} ≤ ${thresh}  (gini=${node.gini.toFixed(4)}, n=${node.samples})`);
  printNode(node.left,  prefix + childPfx, true);
  printNode(node.right, prefix + childPfx, false);
}

// ─── CARTClassifier class ─────────────────────────────────────────
class CARTClassifier {
  /**
   * @param {object} opts
   * @param {number} [opts.max_depth=5]
   * @param {number} [opts.min_samples_split=5]
   * @param {number} [opts.min_samples_leaf=2]
   */
  constructor(opts = {}) {
    this.max_depth         = opts.max_depth         ?? 5;
    this.min_samples_split = opts.min_samples_split ?? 5;
    this.min_samples_leaf  = opts.min_samples_leaf  ?? 2;
    this._tree             = null;
    this._features         = opts.features ?? [
      'success_rate',
      'avg_attempts',
      'avg_time_spent',
      'syntax_errors',
      'structural_errors',
    ];
  }

  /**
   * Train the CART on labeled data.
   * @param {object[]} X  — array of feature objects
   * @param {string[]} y  — array of label strings (same length as X)
   */
  fit(X, y) {
    if (X.length === 0) throw new Error('CARTClassifier.fit: empty training set');
    if (X.length !== y.length) throw new Error('CARTClassifier.fit: X and y length mismatch');

    this._tree = buildTree(X, y, this._features, 0, {
      max_depth:         this.max_depth,
      min_samples_split: this.min_samples_split,
      min_samples_leaf:  this.min_samples_leaf,
    });

    console.log(`✅ CART trained on ${X.length} samples.`);
    return this;
  }

  /**
   * Predict the difficulty level for a single feature object.
   * @param {object} features
   * @returns {string} 'Easy' | 'Intermediate' | 'Hard'
   */
  predict(features) {
    if (!this._tree) throw new Error('CARTClassifier: model not trained. Call fit() first.');
    return predictOne(this._tree, features);
  }

  /**
   * Export the trained tree as a plain serialisable object.
   * Save this to a JSON file so the server can reload without retraining.
   */
  exportTree() {
    if (!this._tree) throw new Error('CARTClassifier: model not trained.');
    return {
      meta: {
        max_depth:         this.max_depth,
        min_samples_split: this.min_samples_split,
        min_samples_leaf:  this.min_samples_leaf,
        features:          this._features,
        trained_at:        new Date().toISOString(),
      },
      tree: this._tree,
    };
  }

  /**
   * Import a previously exported tree (no retraining needed).
   * @param {object} exported — object returned by exportTree()
   */
  importTree(exported) {
    this._tree             = exported.tree;
    this._features         = exported.meta.features;
    this.max_depth         = exported.meta.max_depth;
    this.min_samples_split = exported.meta.min_samples_split;
    this.min_samples_leaf  = exported.meta.min_samples_leaf;
    return this;
  }

  /** Print a human-readable tree to stdout. */
  printTree() {
    if (!this._tree) { console.log('(no tree — call fit() first)'); return; }
    console.log('CART Decision Tree');
    console.log('──────────────────');
    printNode(this._tree, '', false);
  }

  /** Quick accuracy check on a held-out set. */
  evaluate(X, y) {
    let correct = 0;
    for (let i = 0; i < X.length; i++) {
      if (this.predict(X[i]) === y[i]) correct++;
    }
    const acc = correct / X.length;
    console.log(`Accuracy: ${correct}/${X.length} = ${(acc * 100).toFixed(1)}%`);
    return acc;
  }
}

module.exports = { CARTClassifier };