'use strict';

const assert = require('node:assert/strict');
const { selectAdaptiveTask } = require('./adaptiveTaskRecommender');

const source = {
  id: 10,
  language: 'Python',
  concept: 'Variables',
  problem_tier: 'Intermediate',
  difficulty: 'Intermediate'
};

const candidates = [
  { id: 11, language: 'Python', concept: 'Variables', problem_tier: 'Beginner', difficulty: 'Easy' },
  { id: 12, language: 'Python', concept: 'Variables', problem_tier: 'Beginner', difficulty: 'Easy' },
  { id: 13, language: 'Python', concept: 'Variables', problem_tier: 'Intermediate', difficulty: 'Intermediate' },
  { id: 14, language: 'Python', concept: 'Loops', problem_tier: 'Beginner', difficulty: 'Easy' },
  { id: 15, language: 'Java', concept: 'Variables', problem_tier: 'Beginner', difficulty: 'Easy' }
];

assert.equal(
  selectAdaptiveTask({
    source,
    candidates,
    random: () => 0.99
  }).id,
  11,
  'cold start chooses an easier task in the same concept'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates,
    attemptedTaskIds: new Set(['11']),
    recommendedTaskIds: new Set(['12']),
    random: () => 0.99
  }).id,
  13,
  'falls back to a different unsolved same-level task after easier tasks are unavailable'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates: [
      ...candidates,
      { id: 16, language: 'Python', concept: 'Variables', problem_tier: 'Advanced', difficulty: 'Hard' }
    ],
    attemptedTaskIds: new Set(['11', '12', '13']),
    random: () => 0.99
  }).id,
  16,
  'falls back to another unattempted task in the same concept even when it is harder'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates,
    attemptedTaskIds: new Set(['11', '12', '13']),
    recommendedTaskIds: new Set(['11', '12', '13']),
    meanRewards: new Map([['11', 0.3], ['12', 0.9]]),
    random: () => 0.99
  }).id,
  12,
  'when every other task has been tried, the bandit recommends the best-performing task other than the current one'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates: [source],
    attemptedTaskIds: new Set([String(source.id)]),
    recommendedTaskIds: new Set([String(source.id)]),
    random: () => 0.99
  }),
  null,
  'returns no recommendation only when the concept has no other predefined task'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates,
    meanRewards: new Map([['11', 0.3], ['12', 0.9]]),
    random: () => 0.99
  }).id,
  12,
  'exploitation favors the task with stronger observed learner outcomes among fresh tasks'
);

assert.equal(
  selectAdaptiveTask({
    source,
    candidates,
    random: (() => {
      let calls = 0;
      return () => calls++ === 0 ? 0 : 0.99;
    })()
  }).id,
  12,
  'exploration can sample another eligible task from the same concept'
);

console.log('PASS adaptive task recommendation tests');
