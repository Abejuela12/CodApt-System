const FALLBACK_PROBLEMS = [
  {
    id: 100001,
    language: 'Python',
    concept: 'Variables',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Declare and Print a String Variable',
    instruction: 'Create a variable with a string value and print it.',
    expected_output: 'hello',
    required_construct: 'assignment',
    explanation: '<p>Use a variable assignment and print the value.</p>'
  },
  {
    id: 100002,
    language: 'Python',
    concept: 'Data Types',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Store an Integer in a Variable',
    instruction: 'Store the number 42 in a variable and print it.',
    expected_output: '42',
    required_construct: 'assignment',
    explanation: '<p>Assign a numeric value and print it.</p>'
  },
  {
    id: 100003,
    language: 'Python',
    concept: 'Operators',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Use Arithmetic Operators',
    instruction: 'Compute 8 + 7 and print the result.',
    expected_output: '15',
    required_construct: 'assignment',
    explanation: '<p>Use a simple arithmetic expression.</p>'
  },
  {
    id: 100004,
    language: 'Python',
    concept: 'Conditionals',
    difficulty: 'Intermediate',
    problem_tier: 'Intermediate',
    title: 'Check a Condition',
    instruction: 'Use an if statement to print a message when a number is greater than 10.',
    expected_output: 'large',
    required_construct: 'if',
    explanation: '<p>Use an if statement to make a decision.</p>'
  },
  {
    id: 100005,
    language: 'Python',
    concept: 'Loops',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Print Numbers with a Loop',
    instruction: 'Use a for loop to print 1, 2, and 3.',
    expected_output: '1\n2\n3',
    required_construct: 'for',
    explanation: '<p>Use a loop to repeat output.</p>'
  },
  {
    id: 100006,
    language: 'Python',
    concept: 'Functions',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Define and Call a Function',
    instruction: 'Define a function that returns the string hello and print it.',
    expected_output: 'hello',
    required_construct: 'def',
    explanation: '<p>Define a function and call it.</p>'
  },
  {
    id: 100007,
    language: 'Python',
    concept: 'Input & Output',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Read Input and Print It',
    instruction: 'Read a value from input and print it.',
    expected_output: 'hello',
    required_construct: 'input',
    explanation: '<p>Use input and print it.</p>'
  },
  {
    id: 100008,
    language: 'Python',
    concept: 'Error Handling',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Handle a Value Error',
    instruction: 'Use try and except to handle a value error.',
    expected_output: 'handled',
    required_construct: 'try-except',
    explanation: '<p>Use try/except error handling.</p>'
  },
  {
    id: 100009,
    language: 'Java',
    concept: 'Variables',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Declare and Print an Integer',
    instruction: 'Declare an integer variable and print it.',
    expected_output: '42',
    required_construct: 'int',
    explanation: '<p>Use a variable declaration and print it.</p>'
  },
  {
    id: 100010,
    language: 'Java',
    concept: 'Loops',
    difficulty: 'Intermediate',
    problem_tier: 'Intermediate',
    title: 'Use a For Loop in Java',
    instruction: 'Use a for loop to print numbers from 1 to 3.',
    expected_output: '1\n2\n3',
    required_construct: 'for',
    explanation: '<p>Write a loop in Java.</p>'
  },
  {
    id: 100011,
    language: 'JavaScript',
    concept: 'Variables',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    title: 'Declare and Log a Variable',
    instruction: 'Create a variable and log it to the console.',
    expected_output: 'hello',
    required_construct: 'const',
    explanation: '<p>Use a variable and console.log.</p>'
  },
  {
    id: 100012,
    language: 'JavaScript',
    concept: 'Loops',
    difficulty: 'Intermediate',
    problem_tier: 'Intermediate',
    title: 'Loop Through a List',
    instruction: 'Use a for loop to iterate over an array and log each element.',
    expected_output: 'a\nb\nc',
    required_construct: 'for',
    explanation: '<p>Use a loop over an array.</p>'
  }
];

function normalizeConceptString(str) {
  const s = String(str || '').trim().toLowerCase();
  if (s === 'conditional') return 'conditionals';
  return s.replace(/[^a-z0-9]/gi, '');
}

function getFallbackProblems({ language, concept, difficulty, problemTier }) {
  const normConcept = normalizeConceptString(concept);
  return FALLBACK_PROBLEMS.filter(problem =>
    problem.language === language &&
    normalizeConceptString(problem.concept) === normConcept &&
    (!difficulty || problem.difficulty === difficulty) &&
    (!problemTier || problem.problem_tier === problemTier)
  );
}

function resolveProblemMetadata(problemId) {
  return FALLBACK_PROBLEMS.find(problem => problem.id === problemId) || null;
}

function getConceptTotalTaskCount(language, concept, problemTier) {
  const matches = getFallbackProblems({ language, concept, problemTier });
  return matches.length > 0 ? matches.length : 3;
}

module.exports = {
  FALLBACK_PROBLEMS,
  getFallbackProblems,
  resolveProblemMetadata,
  getConceptTotalTaskCount
};
