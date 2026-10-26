'use strict';

const assert = require('node:assert/strict');
const { getNextTaskIndex, selectNextTask } = require('./taskRecommender');

const source = {
  id: 10,
  language: 'Python',
  concept: 'Variables',
  problem_tier: 'Intermediate',
  difficulty: 'Intermediate'
};

const candidates = [
  source,
  { id: 11, language: 'Python', concept: 'Variables', problem_tier: 'Beginner', difficulty: 'Easy' },
  { id: 12, language: 'Python', concept: 'Variables', problem_tier: 'Intermediate', difficulty: 'Easy' },
  { id: 13, language: 'Python', concept: 'Variables', problem_tier: 'Intermediate', difficulty: 'Intermediate' },
  { id: 17, language: 'Python', concept: 'Variables', problem_tier: 'Intermediate', difficulty: 'Intermediate' },
  { id: 14, language: 'Python', concept: 'Variables', problem_tier: 'Advanced', difficulty: 'Hard' },
  { id: 18, language: 'Python', concept: 'Variables', problem_tier: 'Intermediate', difficulty: 'Hard' },
  { id: 15, language: 'Python', concept: 'Loops', problem_tier: 'Beginner', difficulty: 'Easy' },
  { id: 16, language: 'Java', concept: 'Variables', problem_tier: 'Beginner', difficulty: 'Easy' }
];

assert.equal(
  selectNextTask({ source, candidates }).task.id,
  13,
  'chooses a task with the exact same tier, difficulty, language, and concept'
);

assert.equal(
  selectNextTask({
    source,
    candidates,
    recommendedTaskIds: new Set(['13'])
  }).task.id,
  17,
  'recommends the next unissued task at the exact same tier and difficulty'
);

assert.deepEqual(
  selectNextTask({
    source,
    candidates,
    recommendedTaskIds: new Set(['10', '13', '17'])
  }).options.map(task => task.id),
  [13, 17],
  'offers previously issued but not mastered tasks after all new choices are exhausted'
);

assert.equal(
  selectNextTask({
    source,
    candidates,
    completedTaskIds: new Set(['13'])
  }).task.id,
  17,
  'never recommends a previously mastered task as a new recommendation'
);

assert.deepEqual(
  selectNextTask({
    source,
    candidates,
    recommendedTaskIds: new Set(['10', '13', '17']),
    completedTaskIds: new Set(['10', '13'])
  }).options.map(task => task.id),
  [17],
  'choice list excludes mastered tasks while unmastered same-level tasks remain'
);

const noExactAlternative = selectNextTask({
  source,
  candidates: [source, candidates[5], candidates[6]]
});
assert.equal(noExactAlternative.task, null);
assert.deepEqual(
  noExactAlternative.options.map(task => task.id),
  [10],
  'does not select easier or harder tiers/difficulties as a substitute for an exact-level task'
);

assert.deepEqual(
  selectNextTask({ source, candidates: [source] }),
  { task: null, options: [source] },
  'offers the current task as a repeat choice when it is the only predefined task at that level'
);

const orderedTaskGroup = [
  { id: 82 },
  { id: 83 },
  { id: 84 }
];
assert.equal(
  getNextTaskIndex(orderedTaskGroup, 2, new Set(['82', '83'])),
  'Complete!',
  'does not wrap to an earlier task or return an out-of-range index after the final task'
);
assert.equal(
  getNextTaskIndex(orderedTaskGroup, 1, new Set(['82'])),
  2,
  'returns the next available task after the selected task'
);

console.log('PASS task recommendation tests');
