import assert from 'node:assert/strict';
import { calcMasteryProgress, buildOverallStats, getLanguageCapability, buildPerformanceChartData, isConceptMastered } from './profileLogic.js';

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

  console.log('PASS profileLogic unit tests');
}

run();
