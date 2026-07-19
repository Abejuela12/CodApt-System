const DEFAULT_CONCEPTS = ['Variables','Data Types','Operators','Conditional','Loops','Functions','Input & Output','Error Handling'];
const DEFAULT_LANGUAGES = ['Java', 'Python', 'JavaScript'];

function getLanguageCapability(language, progress = {}, concepts = DEFAULT_CONCEPTS) {
  const langData = progress[language] || {};
  const attempted = concepts.filter(c => langData[c] && (langData[c]?.tasksCompleted ?? 0) > 0);
  if (attempted.length === 0) return { label: 'Beginner', color: '#ef4444' };

  const mastered = attempted.filter(c => (langData[c]?.successRate ?? 0) >= 80);
  const avgSuccess = attempted.reduce((sum, c) => sum + (langData[c]?.successRate ?? 0), 0) / attempted.length;

  if (mastered.length >= 4 && avgSuccess >= 80) return { label: 'Advanced', color: '#22c55e' };
  if (attempted.length >= 2 && avgSuccess >= 50) return { label: 'Intermediate', color: '#facc15' };
  return { label: 'Beginner', color: '#ef4444' };
}

function calcMasteryProgress(language, progress = {}, concepts = DEFAULT_CONCEPTS) {
  const langData = progress[language] || {};
  const attempted = concepts.filter(c => langData[c] && (langData[c]?.tasksCompleted ?? 0) > 0);
  if (attempted.length === 0) return { masteredConcepts: 0, totalConcepts: concepts.length, percentage: 0, avgSuccess: 0 };

  const avgSuccess = attempted.reduce((sum, c) => sum + (langData[c]?.successRate ?? 0), 0) / attempted.length;
  const masteredConcepts = attempted.filter(c => (langData[c]?.successRate ?? 0) >= 80).length;

  return { masteredConcepts, totalConcepts: concepts.length, percentage: Math.round(avgSuccess), avgSuccess };
}

function buildPerformanceChartData(rows = [], progress = {}) {
  if (Array.isArray(rows) && rows.length > 0) {
    const byDate = {};
    const langsInDB = new Set();

    rows.forEach(row => {
      const date = new Date(row.progress_date);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[label]) byDate[label] = { name: label };
      const langKey = row.language?.toLowerCase();
      byDate[label][langKey] = row.score ?? 0;
      if (row.language) langsInDB.add(row.language);
    });

    const chartData = Object.values(byDate)
      .sort((a, b) => new Date(a.name) - new Date(b.name))
      .slice(-7);

    return { chartData, activeChartLangs: [...langsInDB] };
  }

  const langsInProgress = Object.keys(progress || {}).filter(Boolean);

  if (langsInProgress.length === 0) {
    return { chartData: [], activeChartLangs: [] };
  }

  const fallbackData = [
    { name: 'Start', java: 0, python: 0, javascript: 0 },
    { name: 'Warmup', java: 0, python: 0, javascript: 0 },
    { name: 'Practice', java: 0, python: 0, javascript: 0 },
    { name: 'Current', java: 0, python: 0, javascript: 0 }
  ];

  langsInProgress.forEach(lang => {
    const langProgress = progress[lang] || {};
    const concepts = Object.values(langProgress || {});

    const avgSuccess = concepts.length > 0
      ? Math.round(concepts.reduce((sum, data) => sum + (data.successRate ?? 0), 0) / concepts.length)
      : 0;

    const langKey = lang.toLowerCase();
    fallbackData[0][langKey] = 0;
    fallbackData[1][langKey] = Math.max(0, Math.round(avgSuccess * 0.35));
    fallbackData[2][langKey] = Math.max(0, Math.round(avgSuccess * 0.7));
    fallbackData[3][langKey] = avgSuccess;
  });

  return { chartData: fallbackData, activeChartLangs: langsInProgress };
}

function buildOverallStats(progress = {}, languages = DEFAULT_LANGUAGES, concepts = DEFAULT_CONCEPTS) {
  let totalMastered = 0;
  let successSum = 0;
  let langCount = 0;

  const langStats = {};
  languages.forEach(lang => {
    const m = calcMasteryProgress(lang, progress, concepts);
    totalMastered += m.masteredConcepts;
    if (m.avgSuccess > 0) {
      successSum += m.avgSuccess;
      langCount += 1;
    }
    langStats[lang] = m;
  });

  const avgSuccess = langCount > 0 ? Math.round(successSum / langCount) : 0;
  const rank = avgSuccess > 80 ? 'Gold' : avgSuccess > 50 ? 'Silver' : 'Bronze';

  let rec = '';
  let actions = [];
  if (avgSuccess < 20) {
    rec = '🚀 Start Your Journey!';
    actions = ['Complete Variables first', 'Practice regularly'];
  } else if (avgSuccess < 50) {
    rec = '📈 Building Momentum!';
    actions = ['Review incomplete concepts', 'Aim for 50% success rate'];
  } else if (avgSuccess < 80) {
    rec = '⭐ Almost There!';
    actions = ['Push for higher success rates', 'Try harder problems'];
  } else {
    rec = '🎉 Coding Master!';
    actions = ['Explore Advanced topics', 'Build real projects'];
  }

  const trend = avgSuccess > 70 ? 'consistently rising' : avgSuccess > 40 ? 'showing improvement' : 'just beginning';
  const cons = avgSuccess > 80 ? 'rock-solid consistency' : avgSuccess > 60 ? 'good consistency' : 'some ups and downs';
  const interp = `Your graph shows a ${trend} pattern with ${cons}. You're ${avgSuccess > 70 ? 'mastering concepts quickly' : avgSuccess > 40 ? 'building momentum' : 'gaining valuable experience'}!`;

  return { totalMastered, avgSuccess, rank, langStats, rec, actions, interp };
}

export { DEFAULT_CONCEPTS, DEFAULT_LANGUAGES, getLanguageCapability, calcMasteryProgress, buildOverallStats, buildPerformanceChartData };
