import assert from 'node:assert/strict';
import { calcMasteryProgress, buildOverallStats, getLanguageCapability } from './profileLogic.js';

function run() {
  const progress = {
    Python: {
      Variables: { tasksCompleted: 3, successRate: 90 },
      'Data Types': { tasksCompleted: 2, successRate: 85 },
      Operators: { tasksCompleted: 2, successRate: 82 },
      Conditional: { tasksCompleted: 2, successRate: 81 },
      Loops: { tasksCompleted: 3, successRate: 80 },
      Functions: { tasksCompleted: 1, successRate: 60 },
    },
    Java: {
      Variables: { tasksCompleted: 1, successRate: 70 },
    },
  };

  const mastery = calcMasteryProgress('Python', progress);
  assert.equal(mastery.masteredConcepts, 5, 'Python should count 5 mastered concepts');
  assert.equal(mastery.totalConcepts, 8, 'The concept list should contain 8 concepts');
  assert.equal(mastery.percentage, 80, 'Average percentage should be rounded correctly');

  const overall = buildOverallStats(progress);
  assert.equal(overall.totalMastered, 5, 'Overall mastered count should reflect the mastered concepts');
  assert.equal(overall.rank, 'Silver', 'Performance should map to a Silver rank for this sample');

  const capability = getLanguageCapability('Python', progress);
  assert.equal(capability.label, 'Intermediate', 'Python should be Intermediate for this sample');

  console.log('PASS profileLogic unit tests');
}

run();
