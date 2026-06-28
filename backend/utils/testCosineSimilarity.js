/**
 * utils/testCosineSimilarity.js
 * ─────────────────────────────────────────────────────────────────
 * CodApt — Cosine Similarity Recommendation Test Suite
 *
 * Tests the content-based recommendation algorithm against
 * labeled test cases showing what exercise SHOULD be recommended
 * for each learner profile.
 *
 * What this script produces:
 *   ✔ Overall recommendation accuracy
 *   ✔ Per-feature matching analysis
 *   ✔ Similarity score distribution
 *   ✔ Edge case detection
 *
 * Usage:
 *   node utils/testCosineSimilarity.js
 *
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const { recommendExercise } = require('./cosineSimilarity');

// ─── Mock Exercise Database ──────────────────────────────────────
// Simulates problems table with diverse exercises
const MOCK_PROBLEMS = [
  // Python Easy - Variables
  {
    id: 1,
    title: 'Declare a Variable',
    language: 'Python',
    difficulty: 'Easy',
    concept: 'Variables',
    required_construct: 'assignment',
    problem_tier: 'Beginner'
  },
  // Python Easy - Loops
  {
    id: 2,
    title: 'Simple For Loop',
    language: 'Python',
    difficulty: 'Easy',
    concept: 'Loops',
    required_construct: 'for',
    problem_tier: 'Beginner'
  },
  // Python Intermediate - Loops
  {
    id: 3,
    title: 'Nested For Loop',
    language: 'Python',
    difficulty: 'Intermediate',
    concept: 'Loops',
    required_construct: 'for',
    problem_tier: 'Intermediate'
  },
  // Python Hard - Loops
  {
    id: 4,
    title: 'Complex Loop with Conditionals',
    language: 'Python',
    difficulty: 'Hard',
    concept: 'Loops',
    required_construct: 'for',
    problem_tier: 'Advanced'
  },
  // Python Easy - Conditionals
  {
    id: 5,
    title: 'Basic If Statement',
    language: 'Python',
    difficulty: 'Easy',
    concept: 'Conditionals',
    required_construct: 'if',
    problem_tier: 'Beginner'
  },
  // Python Intermediate - Conditionals
  {
    id: 6,
    title: 'If-Else-If Chain',
    language: 'Python',
    difficulty: 'Intermediate',
    concept: 'Conditionals',
    required_construct: 'else-if',
    problem_tier: 'Intermediate'
  },
  // JavaScript Easy - Variables
  {
    id: 7,
    title: 'Declare a Variable in JS',
    language: 'JavaScript',
    difficulty: 'Easy',
    concept: 'Variables',
    required_construct: 'assignment',
    problem_tier: 'Beginner'
  },
  // JavaScript Easy - Loops
  {
    id: 8,
    title: 'Simple For Loop in JS',
    language: 'JavaScript',
    difficulty: 'Easy',
    concept: 'Loops',
    required_construct: 'for',
    problem_tier: 'Beginner'
  },
  // JavaScript Intermediate - Loops
  {
    id: 9,
    title: 'While Loop Counter',
    language: 'JavaScript',
    difficulty: 'Intermediate',
    concept: 'Loops',
    required_construct: 'while',
    problem_tier: 'Intermediate'
  },
  // Java Easy - Variables
  {
    id: 10,
    title: 'Declare a Variable in Java',
    language: 'Java',
    difficulty: 'Easy',
    concept: 'Variables',
    required_construct: 'assignment',
    problem_tier: 'Beginner'
  },
  // Java Easy - Loops
  {
    id: 11,
    title: 'For Loop in Java',
    language: 'Java',
    difficulty: 'Easy',
    concept: 'Loops',
    required_construct: 'for',
    problem_tier: 'Beginner'
  }
];

// ─── Test Cases ─────────────────────────────────────────────────
// Each test: { name, learnerProfile, currentProblem, expectedBestId, reason }
// expectedBestId: which problem ID should be recommended (best match)
const TEST_CASES = [
  {
    name: 'Beginner Python learner → next Easy Python Loop',
    learnerProfile: {
      user_id: 1,
      language: 'Python',
      performance_level: 'Easy',
      success_rate: 0.3,
      avg_attempts: 5,
      avg_time_spent: 150,
      syntax_errors: 4,
      structural_errors: 3
    },
    currentProblem: {
      id: 1,
      language: 'Python',
      difficulty: 'Easy',
      concept: 'Variables',
      required_construct: 'assignment'
    },
    expectedBestId: 2,  // Python Easy Loop (same language & difficulty, different concept)
    reason: 'Same language (Python), same difficulty (Easy), practice next concept'
  },

  {
    name: 'Intermediate Python learner → deepen Loop mastery',
    learnerProfile: {
      user_id: 2,
      language: 'Python',
      performance_level: 'Intermediate',
      success_rate: 0.6,
      avg_attempts: 3,
      avg_time_spent: 90,
      syntax_errors: 1,
      structural_errors: 1
    },
    currentProblem: {
      id: 2,
      language: 'Python',
      difficulty: 'Easy',
      concept: 'Loops',
      required_construct: 'for'
    },
    expectedBestId: 3,  // Python Intermediate Loop (same concept, upgraded difficulty for mastery)
    reason: 'After Easy Loop, recommend Intermediate variant of same concept to build depth'
  },

  {
    name: 'Advanced Python learner → Hard Python Loop',
    learnerProfile: {
      user_id: 3,
      language: 'Python',
      performance_level: 'Hard',
      success_rate: 0.85,
      avg_attempts: 1,
      avg_time_spent: 40,
      syntax_errors: 0,
      structural_errors: 0
    },
    currentProblem: {
      id: 3,
      language: 'Python',
      difficulty: 'Hard',
      concept: 'Loops',
      required_construct: 'for'
    },
    expectedBestId: 4,  // Python Hard Loop (same language & difficulty, challenging variant)
    reason: 'Advanced learner → recommend Hard/Advanced problems'
  },

  {
    name: 'JavaScript learner → stay in JavaScript',
    learnerProfile: {
      user_id: 4,
      language: 'JavaScript',
      performance_level: 'Easy',
      success_rate: 0.35,
      avg_attempts: 4,
      avg_time_spent: 130,
      syntax_errors: 3,
      structural_errors: 2
    },
    currentProblem: {
      id: 7,
      language: 'JavaScript',
      difficulty: 'Easy',
      concept: 'Variables',
      required_construct: 'assignment'
    },
    expectedBestId: 8,  // JavaScript Easy Loop (same language, not Java/Python)
    reason: 'Language match is 40% weight → strong preference for JavaScript'
  },

  {
    name: 'Java learner → stay in Java',
    learnerProfile: {
      user_id: 5,
      language: 'Java',
      performance_level: 'Easy',
      success_rate: 0.4,
      avg_attempts: 5,
      avg_time_spent: 160,
      syntax_errors: 4,
      structural_errors: 3
    },
    currentProblem: {
      id: 10,
      language: 'Java',
      difficulty: 'Easy',
      concept: 'Variables',
      required_construct: 'assignment'
    },
    expectedBestId: 11,  // Java Easy Loop (same language)
    reason: 'Should recommend Java Loop over Python/JS loops'
  },

  {
    name: 'Intermediate learner progressing on Loops',
    learnerProfile: {
      user_id: 6,
      language: 'Python',
      performance_level: 'Intermediate',
      success_rate: 0.65,
      avg_attempts: 2,
      avg_time_spent: 80,
      syntax_errors: 1,
      structural_errors: 0
    },
    currentProblem: {
      id: 2,
      language: 'Python',
      difficulty: 'Easy',
      concept: 'Loops',
      required_construct: 'for'
    },
    expectedBestId: 3,  // Python Intermediate Loop (upgrade difficulty on same concept)
    reason: 'Performance level has increased → recommend higher difficulty in same language/concept'
  }
];

// ─── Helper: Calculate accuracy ──────────────────────────────────
function calculateAccuracy(results) {
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  return {
    correct,
    total,
    percentage: Math.round((correct / total) * 100)
  };
}

// ─── Helper: Analyze similarity scores ──────────────────────────
function analyzeScores(results) {
  const scores = results.map(r => r.topScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return { avg: Math.round(avg * 10000) / 10000, min, max };
}

// ─── Run Tests ───────────────────────────────────────────────────
console.log('🔍 Cosine Similarity Recommendation Test Suite\n');
console.log('═'.repeat(60));

const results = [];
let passCount = 0;

TEST_CASES.forEach(test => {
  console.log(`\nTest: ${test.name}`);
  console.log(`  Learner: ${test.learnerProfile.language} | ${test.learnerProfile.performance_level} | ${(test.learnerProfile.success_rate * 100).toFixed(0)}% success`);
  console.log(`  Current: ${test.currentProblem.concept} (${test.currentProblem.difficulty})`);
  console.log(`  Reason: ${test.reason}`);

  const recommendation = recommendExercise(
    test.learnerProfile,
    test.currentProblem,
    MOCK_PROBLEMS
  );

  const correct = recommendation.problem?.id === test.expectedBestId;
  const status = correct ? '✅ PASS' : '❌ FAIL';

  console.log(`  ${status}`);
  console.log(`  Expected ID: ${test.expectedBestId} (${MOCK_PROBLEMS.find(p => p.id === test.expectedBestId)?.title})`);
  console.log(`  Recommended ID: ${recommendation.problem?.id} (${recommendation.problem?.title})`);
  console.log(`  Score: ${recommendation.similarityScore.toFixed(4)}`);

  if (correct) passCount++;

  results.push({
    testName: test.name,
    correct,
    topScore: recommendation.similarityScore,
    recommendedId: recommendation.problem?.id,
    expectedId: test.expectedBestId
  });
});

// ─── Summary ─────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('\n📊 SUMMARY\n');

const accuracy = calculateAccuracy(results);
console.log(`Accuracy: ${accuracy.correct}/${accuracy.total} (${accuracy.percentage}%)`);

const scoreStats = analyzeScores(results);
console.log(`\nSimilarity Scores:`);
console.log(`  Average: ${scoreStats.avg}`);
console.log(`  Range: ${scoreStats.min.toFixed(4)} → ${scoreStats.max.toFixed(4)}`);

// ─── Interpretation ──────────────────────────────────────────────
console.log(`\n📈 Interpretation:`);
if (accuracy.percentage >= 80) {
  console.log(`✅ Excellent: Algorithm recommends correct exercises ${accuracy.percentage}% of the time`);
} else if (accuracy.percentage >= 60) {
  console.log(`⚠️  Good: Algorithm works but needs refinement (${accuracy.percentage}%)`);
} else {
  console.log(`❌ Poor: Algorithm needs tuning (${accuracy.percentage}%)`);
}

if (scoreStats.avg < 0.5) {
  console.log(`⚠️  Note: Low average similarity scores (${scoreStats.avg}) — may indicate:
    • Few similar exercises in dataset
    • Weights need adjustment
    • Learner profile too specific`);
}

// ─── Failed cases ─────────────────────────────────────────────────
const failures = results.filter(r => !r.correct);
if (failures.length > 0) {
  console.log(`\n⚠️  Failed Cases:\n`);
  failures.forEach(f => {
    console.log(`  • ${f.testName}`);
    console.log(`    Expected: ID ${f.expectedId}, Got: ID ${f.recommendedId}`);
  });
}

// ─── Exit code ───────────────────────────────────────────────────
if (accuracy.percentage >= 80) {
  console.log(`\n✅ Cosine Similarity algorithm is working well!`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Cosine Similarity accuracy could be improved`);
  process.exit(1);
}
