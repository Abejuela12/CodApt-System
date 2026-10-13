'use strict';

const TIER_ORDER = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_ORDER = ['Easy', 'Intermediate', 'Hard'];
const EXPLORATION_RATE = 0.15;

function getSimplicity(candidate) {
  const tierRank = TIER_ORDER.indexOf(candidate.problem_tier);
  const difficultyRank = DIFFICULTY_ORDER.indexOf(candidate.difficulty);
  return tierRank + difficultyRank;
}

function preferEasierOrSameLevel(candidates, sourceTierRank, sourceDifficultyRank) {
  const simpler = candidates.filter(candidate => {
    const tierRank = TIER_ORDER.indexOf(candidate.problem_tier);
    const difficultyRank = DIFFICULTY_ORDER.indexOf(candidate.difficulty);
    return tierRank <= sourceTierRank &&
      difficultyRank <= sourceDifficultyRank &&
      (tierRank < sourceTierRank || difficultyRank < sourceDifficultyRank);
  });
  if (simpler.length > 0) return simpler;

  const sameLevel = candidates.filter(candidate =>
    candidate.problem_tier === TIER_ORDER[sourceTierRank] &&
    candidate.difficulty === DIFFICULTY_ORDER[sourceDifficultyRank]
  );
  return sameLevel.length > 0 ? sameLevel : candidates;
}

function selectAdaptiveTask({
  source,
  candidates,
  attemptedTaskIds = new Set(),
  recommendedTaskIds = new Set(),
  meanRewards = new Map(),
  random = Math.random
}) {
  const sourceTierRank = TIER_ORDER.indexOf(source.problem_tier);
  const sourceDifficultyRank = DIFFICULTY_ORDER.indexOf(source.difficulty);
  if (sourceTierRank < 0 || sourceDifficultyRank < 0) return null;

  const eligible = candidates.filter(candidate =>
    String(candidate.id) !== String(source.id) &&
    String(candidate.language) === String(source.language) &&
    String(candidate.concept) === String(source.concept) &&
    TIER_ORDER.includes(candidate.problem_tier) &&
    DIFFICULTY_ORDER.includes(candidate.difficulty)
  );
  if (eligible.length === 0) return null;

  const unseen = eligible.filter(candidate =>
    !attemptedTaskIds.has(String(candidate.id)) &&
    !recommendedTaskIds.has(String(candidate.id))
  );
  const notYetAttempted = eligible.filter(candidate =>
    !attemptedTaskIds.has(String(candidate.id))
  );
  const pool = unseen.length > 0
    ? preferEasierOrSameLevel(unseen, sourceTierRank, sourceDifficultyRank)
    : notYetAttempted.length > 0
      ? preferEasierOrSameLevel(notYetAttempted, sourceTierRank, sourceDifficultyRank)
      : eligible;

  const tieBreak = (first, second) =>
    getSimplicity(second) - getSimplicity(first) ||
    String(first.id).localeCompare(String(second.id), undefined, { numeric: true });
  const hasLearnedOutcomes = pool.some(candidate => meanRewards.has(String(candidate.id)));

  if (random() < EXPLORATION_RATE) {
    return pool[Math.floor(random() * pool.length)];
  }

  if (!hasLearnedOutcomes) {
    return [...pool].sort(tieBreak)[0];
  }

  return [...pool].sort((first, second) => {
    const firstReward = meanRewards.get(String(first.id)) ?? 0.5;
    const secondReward = meanRewards.get(String(second.id)) ?? 0.5;
    return secondReward - firstReward || tieBreak(first, second);
  })[0];
}

module.exports = { EXPLORATION_RATE, selectAdaptiveTask };
