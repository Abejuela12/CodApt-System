import assert from 'node:assert/strict';
import { calcMasteryProgress, buildOverallStats, getLanguageCapability, buildPerformanceChartData, isConceptMastered, getConceptProgress } from './profileLogic.js';
import { getFallbackProblems } from '../../../../backend/utils/problemCatalog.js';

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
  assert.equal(mastery.masteredConcepts, 2, 'Python should count only fully completed mastered concepts');
  assert.equal(mastery.totalConcepts, 8, 'The concept list should contain 8 concepts');
  assert.equal(mastery.percentage, 80, 'Average percentage should be rounded correctly');

  const overall = buildOverallStats(progress);
  assert.equal(overall.totalMastered, 2, 'Overall mastered count should reflect only fully completed mastered concepts');
  assert.equal(overall.rank, 'Bronze', 'Mastery percentage should map to a Bronze rank for this sample');

  const capability = getLanguageCapability('Python', progress);
  assert.equal(capability.label, 'Intermediate', 'Python should be Intermediate for this sample');

  const fromDailyRows = buildPerformanceChartData([
    { progress_date: '2026-07-19', language: 'Java', score: 80 },
    { progress_date: '2026-07-20', language: 'Python', score: 60 }
  ], {});
  assert.equal(fromDailyRows.chartData.length, 2, 'Daily-row chart data should preserve the rows');
  assert.deepEqual(fromDailyRows.activeChartLangs, ['Java', 'Python'], 'Daily rows should register both languages');

  const fallback = buildPerformanceChartData([], {
    Java: {
      Variables: { tasksCompleted: 3, totalTasks: 3, successRate: 90 }
    },
    Python: {
      Loops: { tasksCompleted: 1, totalTasks: 3, successRate: 70 }
    }
  });
  assert.equal(fallback.chartData.length, 4, 'Fallback chart data should create a multi-step progression for the user');
  assert.deepEqual(fallback.activeChartLangs, ['Java', 'Python'], 'Fallback chart data should include both languages');
  assert.equal(fallback.chartData[0].java, 0, 'Fallback chart should start from zero for Java');
  assert.equal(fallback.chartData[3].java, 90, 'Fallback Java score should come from progress data');
  assert.equal(fallback.chartData[3].python, 70, 'Fallback Python score should come from progress data');
  assert.ok(fallback.chartData[3].java > fallback.chartData[1].java, 'Fallback chart should show a rising progression');

  const completedConceptProgress = {
    Python: {
      'Input & Output': { tasksCompleted: 3, totalTasks: 3, successRate: 60 }
    }
  };
  const completedConceptMastery = calcMasteryProgress('Python', completedConceptProgress);
  assert.equal(completedConceptMastery.masteredConcepts, 1, 'A concept completed with the mastery threshold should count as mastered');
  assert.equal(completedConceptMastery.percentage, 60, 'The mastery percentage should reflect the completed concept score');

  const alternateNameProgress = {
    Python: {
      Conditionals: { tasksCompleted: 3, totalTasks: 3, successRate: 60 }
    }
  };
  const alternateNameMastery = calcMasteryProgress('Python', alternateNameProgress);
  assert.equal(alternateNameMastery.masteredConcepts, 1, 'A concept should still count as mastered when the progress uses an alternate spelling');

  const ioProgress = {
    JavaScript: {
      'Input & Output': { tasksCompleted: 3, totalTasks: 3, successRate: 60 }
    }
  };
  assert.ok(isConceptMastered(ioProgress, 'JavaScript', 'Input & Output'), 'Input & Output should be mastered when completed at the threshold');

  // ── BUG #2 MASTERY RECOGNITION REGRESSION TESTS (CASES A-F) ──

  // CASE A — Variables: 1/1 task completed at 100% -> mastered = true
  const caseA = { Python: { Variables: { tasksCompleted: 1, totalTasks: 1, successRate: 100 } } };
  assert.ok(isConceptMastered(caseA, 'Python', 'Variables'), 'CASE A: Variables 1/1 task completed must be mastered');

  // CASE B — Data Types 1-task concept: 1/1 task completed at 100% -> mastered = true
  const caseB = { Python: { 'Data Types': { tasksCompleted: 1, totalTasks: 1, successRate: 100 } } };
  assert.ok(isConceptMastered(caseB, 'Python', 'Data Types'), 'CASE B: Data Types 1/1 task completed must be mastered');

  // CASE C — Incomplete multi-task concept: 1/3 tasks completed at 33% -> mastered = false
  const caseC = { Python: { Loops: { tasksCompleted: 1, totalTasks: 3, successRate: 33 } } };
  assert.equal(isConceptMastered(caseC, 'Python', 'Loops'), false, 'CASE C: Incomplete multi-task concept (1/3) MUST NOT be mastered');

  // CASE D — Fully completed multi-task concept: 3/3 tasks completed at 100% -> mastered = true
  const caseD = { Python: { Loops: { tasksCompleted: 3, totalTasks: 3, successRate: 100 } } };
  assert.ok(isConceptMastered(caseD, 'Python', 'Loops'), 'CASE D: Fully completed multi-task concept (3/3) must be mastered');

  // CASE E — Conditionals catalog lookup: requesting Intermediate Conditionals returns tasks (not [])
  const caseEProblems = getFallbackProblems({ language: 'Python', concept: 'Conditionals', difficulty: 'Intermediate' });
  assert.ok(caseEProblems.length > 0, 'CASE E: Conditionals catalog lookup for Intermediate must return task(s), not []');

  // CASE F — Banner/Card Consistency: unmastered progress MUST NOT evaluate as mastered
  assert.equal(isConceptMastered(caseC, 'Python', 'Loops'), false, 'CASE F: Banner/card consistency — unmastered progress returns false');

  console.log('PASS profileLogic unit tests');
}

run();
