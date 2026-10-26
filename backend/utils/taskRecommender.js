'use strict';

const TIER_ORDER = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_ORDER = ['Easy', 'Intermediate', 'Hard'];

function getNextTaskIndex(taskGroup, taskIndex, unavailableTaskIds) {
  const nextIndex = taskGroup.findIndex((task, index) =>
    index > taskIndex && !unavailableTaskIds.has(String(task.id))
  );
  return nextIndex >= 0 ? nextIndex : 'Complete!';
}

function selectNextTask({
  source,
  candidates,
  recommendedTaskIds = new Set(),
  completedTaskIds = new Set()
}) {
  const sourceTierRank = TIER_ORDER.indexOf(source.problem_tier);
  const sourceDifficultyRank = DIFFICULTY_ORDER.indexOf(source.difficulty);
  if (sourceTierRank < 0 || sourceDifficultyRank < 0) return null;

  const sameLevelTasks = candidates.filter(candidate =>
      String(candidate.language) === String(source.language) &&
      String(candidate.concept) === String(source.concept) &&
      TIER_ORDER.indexOf(candidate.problem_tier) === sourceTierRank &&
      DIFFICULTY_ORDER.indexOf(candidate.difficulty) === sourceDifficultyRank
  );
  if (sameLevelTasks.length === 0) return null;

  const sortById = (first, second) =>
    String(first.id).localeCompare(String(second.id), undefined, { numeric: true });

  const unissuedTasks = sameLevelTasks.filter(candidate =>
    String(candidate.id) !== String(source.id) &&
    !recommendedTaskIds.has(String(candidate.id)) &&
    !completedTaskIds.has(String(candidate.id))
  );
  if (unissuedTasks.length > 0) {
    return { task: [...unissuedTasks].sort(sortById)[0], options: null };
  }

  const uncompletedChoices = sameLevelTasks.filter(candidate =>
    String(candidate.id) !== String(source.id) &&
    !completedTaskIds.has(String(candidate.id))
  );
  const choices = uncompletedChoices.length > 0
    ? uncompletedChoices
    : sameLevelTasks.filter(candidate => String(candidate.id) !== String(source.id));
  return {
    task: null,
    options: [...(choices.length > 0 ? choices : sameLevelTasks)].sort(sortById)
  };
}

module.exports = { getNextTaskIndex, selectNextTask };
