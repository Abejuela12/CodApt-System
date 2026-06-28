const assert = require('assert');
const { getFallbackProblems, resolveProblemMetadata } = require('./problemCatalog');

const pythonEasy = getFallbackProblems({ language: 'Python', concept: 'Variables', difficulty: 'Easy', problemTier: 'Beginner' });
assert.ok(pythonEasy.length > 0, 'Python Variables Easy should return a fallback problem');
assert.equal(pythonEasy[0].problem_tier, 'Beginner');

const javaIntermediate = getFallbackProblems({ language: 'Java', concept: 'Loops', difficulty: 'Intermediate', problemTier: 'Intermediate' });
assert.ok(javaIntermediate.length > 0, 'Java Loops Intermediate should return a fallback problem');

const resolved = resolveProblemMetadata(100001);
assert.ok(resolved, 'Fallback problem metadata should resolve by ID');

console.log('PASS problemCatalog fallback tests');
