// utils/levelUtils.js

export const BADGES = {
  Java: ['Variables', 'Data Types', 'Operators', 'Conditional', 'Loop', 'Functions', 'Input & Output', 'Error Handling'],
  Python: ['Variables', 'Data Types', 'Operators', 'Conditional', 'Loop', 'Functions', 'Input & Output', 'Error Handling'],
  JavaScript: ['Variables', 'Data Types', 'Operators', 'Conditional', 'Loop', 'Functions', 'Input & Output', 'Error Handling']
};


export const calculateLanguageProgress = (language, progress = {}) => {
  const badges = BADGES[language] || [];
  const langProgress = progress[language] || {};
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  badges.forEach(badge => {
    const badgeData = langProgress[badge];
    const tasks = badgeData?.tasksCompleted || 0;
    const total = badgeData?.totalTasks || 3;
    
    totalTasks += total;
    completedTasks += tasks;
  });
  
  const percentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  return {
    completedTasks,
    totalTasks,
    percentage,
    badgesCompleted: badges.filter(
      badge => langProgress[badge]?.tasksCompleted >= 3
    ).length,
    totalBadges: badges.length
  };
};




// ✅ Get overall level per language
export const getLanguageLevel = (language, progress = {}) => {
  const percent = calculateLanguageProgress(language, progress).percentage;

  if (percent >= 80) {
    return { label: "Advanced", color: "#22c55e" };
  }

  if (percent >= 50) {
    return { label: "Intermediate", color: "#facc15" };
  }

  return { label: "Beginner", color: "#ef4444" };
};


// ✅ Concept-level classification (used in ProfilePage)
export const getConceptLevel = (data) => {
  const completion = (data.tasksCompleted / data.totalTasks) * 100;
  const success = data.successRate || 0;

  const score = (completion * 0.6) + (success * 0.4);

  if (score >= 80) return { label: "Adv", color: "#22c55e" };
  if (score >= 50) return { label: "Int", color: "#facc15" };
  return { label: "Beg", color: "#ef4444" };
};