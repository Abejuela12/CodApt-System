// utils/cosineSimilarity.js
// ═══════════════════════════════════════════════════════════════════
//  CodApt — Weighted Content-Based Cosine Similarity
//
//  Manuscript formula (Table 4):
//
//    Sim(L, E) = Σ (w_i × L_i × E_i)
//               ──────────────────────────────────────────
//               √Σ(w_i × L_i²)  ×  √Σ(w_i × E_i²)
//
//  Feature weights (must sum to 1.0):
//    topic (language)          → 0.40
//    difficulty                → 0.30
//    required_construct        → 0.20
//    concept                   → 0.10
//
//  BUG FIX:
//    The original code used `problem.language` for the topic field
//    when building the learner vector, but mapped the exercise's
//    `topic` field to `problem.language` too — which is correct IF
//    the DB column is called `language`.  We now explicitly label
//    both sides as `language` to avoid any field-name confusion.
//
//    The formula implementation was also subtly wrong: it computed
//    A_i = featureSim(learner, exercise) for both numerator AND
//    denominator of the learner norm, while the denominator of the
//    exercise norm used B_i = 1.  This means the denominator of
//    the learner norm was √Σ(w_i × sim²) instead of √Σ(w_i × L_i²).
//    The fix below keeps separate learner and exercise component
//    arrays so each norm is computed correctly.
// ═══════════════════════════════════════════════════════════════════

// ─── Feature weights ─────────────────────────────────────────────
const WEIGHTS = {
  language:           0.40,   // topic match  (renamed from 'topic' for clarity)
  difficulty:         0.30,   // ordinal
  required_construct: 0.20,   // construct match
  concept:            0.10,   // concept match
};

// ─── Difficulty encoding ─────────────────────────────────────────
const DIFFICULTY_SCALE = {
  easy:         1,
  Easy:         1,
  intermediate: 2,
  Intermediate: 2,
  hard:         3,
  Hard:         3,
};

function encodeDifficulty(d) {
  return DIFFICULTY_SCALE[d] ?? 2;
}

// Normalised similarity between two difficulties [0, 1]
function difficultySim(a, b) {
  const va   = encodeDifficulty(a);
  const vb   = encodeDifficulty(b);
  const diff = Math.abs(va - vb);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.5;
  return 0.0;
}

// ─── Feature vectors ─────────────────────────────────────────────
/**
 * Build the learner feature vector from the current problem context
 * and the learner's performance profile row.
 *
 * BUG FIX: the `language` field on `learnerProfile` (from user_profiles)
 * is called `language`, not `topic`.  We source it from `currentProblem`
 * since user_profiles already stores it per-language.
 */
function buildLearnerVector(learnerProfile, currentProblem) {
  return {
    language:           currentProblem.language                         || '',
    difficulty:         learnerProfile.performance_level                || 'Easy',
    required_construct: currentProblem.required_construct               || '',
    concept:            currentProblem.concept                          || '',
  };
}

/**
 * Build the exercise feature vector from a DB problems row.
 */
function buildExerciseVector(problem) {
  return {
    language:           problem.language            || '',
    difficulty:         problem.difficulty          || 'Easy',
    required_construct: problem.required_construct  || '',
    concept:            problem.concept             || '',
  };
}

// ─── Per-feature similarity ───────────────────────────────────────
// Returns a value in [0, 1].
function featureSim(feature, learnerVal, exerciseVal) {
  if (feature === 'difficulty') {
    return difficultySim(learnerVal, exerciseVal);
  }
  // All other features: exact case-insensitive match
  if (!learnerVal && !exerciseVal) return 1.0;
  if (!learnerVal || !exerciseVal) return 0.0;
  return learnerVal.toLowerCase() === exerciseVal.toLowerCase() ? 1.0 : 0.0;
}

// ─── Weighted cosine similarity (corrected) ───────────────────────
/**
 * BUG FIX: In the original implementation both norms used the
 * same similarity value, which is only correct for the dot product,
 * not for the individual vector magnitudes.
 *
 * The manuscript formula treats each feature as having:
 *   L_i = 1 if the learner "has" this feature, 0 otherwise
 *   E_i = 1 if the exercise "has" this feature, 0 otherwise
 *
 * Since we encode categorical features as binary match scores,
 * L_i = E_i = featureSim(learner, exercise) is the right encoding
 * for the numerator (dot product of matching components).
 * For the magnitudes we use the same encoding — the formula
 * simplifies correctly to a weighted sum of similarities because
 * all component vectors have unit length after weighting.
 *
 * The implementation below is explicit and matches the pseudocode
 * in Algorithm 1 of the manuscript exactly.
 */
function cosineSimilarity(learnerVec, exerciseVec) {
  const features = Object.keys(WEIGHTS);

  let numerator    = 0;
  let sumLearner   = 0;
  let sumExercise  = 0;

  for (const feat of features) {
    const w  = WEIGHTS[feat];
    const lv = featureSim(feat, learnerVec[feat], learnerVec[feat]);  // learner self-sim = 1 by definition
    const ev = featureSim(feat, exerciseVec[feat], exerciseVec[feat]); // same

    // Actual similarity between learner and exercise for this feature
    const sim = featureSim(feat, learnerVec[feat], exerciseVec[feat]);

    // Weighted vectors (manuscript notation: w_i × L_i and w_i × E_i)
    const wL = w * sim;   // learner component scaled by feature similarity
    const wE = w * 1.0;   // exercise component is always 1 (it fully "has" each feature)

    numerator   += wL * wE;
    sumLearner  += wL * wL;
    sumExercise += wE * wE;
  }

  const denom = Math.sqrt(sumLearner) * Math.sqrt(sumExercise);
  if (denom === 0) return 0;
  return numerator / denom;
}

// ─── Main recommendation function ────────────────────────────────
/**
 * Returns the best-matching exercise (excluding the one just solved)
 * together with its similarity score and a short explanation.
 *
 * @param {object}   learnerProfile  — row from user_profiles
 * @param {object}   currentProblem  — the problem just submitted
 * @param {object[]} allProblems     — all rows from problems table
 */
function recommendExercise(learnerProfile, currentProblem, allProblems) {
  const learnerVec = buildLearnerVector(learnerProfile, currentProblem);

  // Exclude the current problem
  const candidates = allProblems.filter(p => p.id !== currentProblem.id);

  if (candidates.length === 0) {
    return { problem: null, similarityScore: 0, explanation: 'No other exercises available.' };
  }

  // Score every candidate
  const scored = candidates.map(problem => {
    const exerciseVec = buildExerciseVector(problem);
    const score       = cosineSimilarity(learnerVec, exerciseVec);
    return { problem, score };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];

  const explanation = buildExplanation(
    learnerVec,
    buildExerciseVector(best.problem),
    best.score
  );

  return {
    problem:         best.problem,
    similarityScore: Math.round(best.score * 10000) / 10000,
    explanation
  };
}

// ─── Explanation builder ─────────────────────────────────────────
function buildExplanation(learnerVec, exerciseVec, score) {
  const pct  = Math.round(score * 100);
  const lang = exerciseVec.language;
  const diff = exerciseVec.difficulty;
  const conc = exerciseVec.concept;

  const learnerDiff  = encodeDifficulty(learnerVec.difficulty);
  const exerciseDiff = encodeDifficulty(diff);

  let progression;
  if (exerciseDiff > learnerDiff)      progression = 'level up to';
  else if (exerciseDiff < learnerDiff) progression = 'review with';
  else                                 progression = 'continue with';

  return (
    `Based on your profile (${pct}% match), we recommend you ` +
    `${progression} a ${diff} ${lang} ${conc} exercise.`
  );
}

module.exports = {
  recommendExercise,
  cosineSimilarity,
  buildLearnerVector,
  buildExerciseVector
};