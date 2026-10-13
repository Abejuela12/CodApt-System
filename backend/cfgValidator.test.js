const assert = require('assert');
const { validateCFG } = require('./utils/cfgValidator');

const cases = [
  {
    name: 'JS if/else valid',
    lang: 'javascript',
    code: 'const qty=15; if(qty>=100){console.log("Bulk discount");} else if(qty>=50){console.log("Medium discount");} else {console.log("No discount");}',
    construct: 'if',
    expectedOutput: 'Bulk discount',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'JS direct print invalid',
    lang: 'javascript',
    code: 'console.log("Hello")',
    construct: 'if',
    expectedOutput: 'Hello',
    expected: { constructUsed: false, structuralErrors: 2 }
  },
  {
    name: 'JS object literal valid',
    lang: 'javascript',
    code: 'const student = {\n  name: "Rosa",\n  grade: 92\n};\nconsole.table(student);\nconsole.log("Data loaded successfully");\nconsole.error("Invalid input detected");',
    construct: 'console.log',
    expectedOutput: 'Data loaded successfully',
    expected: { constructUsed: true, structuralErrors: 1 }
  },
  {
    name: 'JS for valid',
    lang: 'javascript',
    code: 'for(let i=0;i<3;i++){console.log(i);}',
    construct: 'for',
    expectedOutput: '0\n1\n2',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'JS while valid',
    lang: 'javascript',
    code: 'let x = 0; while(x < 3){ x++; console.log(x); }',
    construct: 'while',
    expectedOutput: '1\n2\n3',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'JS function valid',
    lang: 'javascript',
    code: 'function f(x){ return x * 2; } console.log(f(3));',
    construct: 'function',
    expectedOutput: '6',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'JS else-if valid',
    lang: 'javascript',
    code: 'const qty=30; if(qty>=100){console.log("Bulk");} else if(qty>=50){console.log("Medium");} else {console.log("Low");}',
    construct: 'else-if',
    expectedOutput: 'Low',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python elif valid',
    lang: 'python',
    code: 'x = -1\nif x > 0:\n    print("Pos")\nelif x < 0:\n    print("Neg")\nelse:\n    print("Zero")',
    construct: 'elif',
    expectedOutput: 'Neg',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'JS try-catch-finally valid',
    lang: 'javascript',
    code: 'try{ throw new Error(); } catch(e){ console.log("err"); } finally { console.log("done"); }',
    construct: 'try-catch-finally',
    expectedOutput: 'done',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python try-except-finally valid',
    lang: 'python',
    code: 'try:\n    x = 1/0\nexcept ZeroDivisionError:\n    print("err")\nfinally:\n    print("done")',
    construct: 'try-except-finally',
    expectedOutput: 'done',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python if valid',
    lang: 'python',
    code: 'x = 10\nif x > 5:\n    print("High")\nelse:\n    print("Low")',
    construct: 'if',
    expectedOutput: 'High',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python direct print invalid',
    lang: 'python',
    code: 'print("Hi")',
    construct: 'if',
    expectedOutput: 'Hi',
    expected: { constructUsed: false, structuralErrors: 2 }
  },
  {
    name: 'Python for valid',
    lang: 'python',
    code: 'for i in range(3):\n    print(i)',
    construct: 'for',
    expectedOutput: '0\n1\n2',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python while valid',
    lang: 'python',
    code: 'x = 0\nwhile x < 3:\n    x += 1\n    print(x)',
    construct: 'while',
    expectedOutput: '1\n2\n3',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Python function valid',
    lang: 'python',
    code: 'def f(x):\n    return x * 2\nprint(f(3))',
    construct: 'function',
    expectedOutput: '6',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Java switch valid',
    lang: 'java',
    code: 'int x = 2; switch(x){case 1: System.out.println("One"); break; case 2: System.out.println("Two"); break; default: System.out.println("Other");}',
    construct: 'switch',
    expectedOutput: 'Two',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Java direct println invalid',
    lang: 'java',
    code: 'System.out.println("Hello")',
    construct: 'switch',
    expectedOutput: 'Hello',
    expected: { constructUsed: false, structuralErrors: 2 }
  },
  {
    name: 'Java for valid',
    lang: 'java',
    code: 'for(int i = 0; i < 3; i++){ System.out.println(i); }',
    construct: 'for',
    expectedOutput: '0\n1\n2',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Java while valid',
    lang: 'java',
    code: 'int x = 0; while(x < 3){ x++; System.out.println(x); }',
    construct: 'while',
    expectedOutput: '1\n2\n3',
    expected: { constructUsed: true, structuralErrors: 0 }
  },
  {
    name: 'Java function valid',
    lang: 'java',
    code: 'public void f(){ System.out.println("hi"); }',
    construct: 'function',
    expectedOutput: 'hi',
    expected: { constructUsed: true, structuralErrors: 0 }
  }
];

let failed = 0;

const objectLiteralResult = validateCFG(
  'const student = { name: "Rosa", grade: 92 };\nconsole.table(student);\nconsole.log("Data loaded successfully");\nconsole.error("Invalid input detected");',
  'javascript',
  'console.log',
  'Data loaded successfully'
);
const categorizedFeedbackResult = validateCFG(
  'const value = 1',
  'JavaScript',
  'while',
  'ok'
);
assert(
  categorizedFeedbackResult.structuralFeedback.some(message => message.includes('while loop')) &&
  categorizedFeedbackResult.syntaxFeedback.length > 0,
  'Structural and syntax feedback should be returned in separate categories'
);
assert(
  categorizedFeedbackResult.syntaxFeedback.every(message => !message.includes('while loop')) &&
  categorizedFeedbackResult.structuralFeedback.every(message => !message.startsWith('⚠ Line ')),
  'Feedback categories should not contain each other’s messages'
);
const simultaneousValidationResult = validateCFG(
  'double celsius = 22.0;\ncelsius = 25.0;\nSystem.out.println(celsius)',
  'Java',
  null,
  '77.0',
  {
    concept: 'Variables',
    instruction: 'Declare a double variable called celsius with the value 25.0. Print celsius.'
  }
);
assert(
  simultaneousValidationResult.structuralErrors > 0 && simultaneousValidationResult.syntaxErrors > 0,
  'Structural and syntax errors should both be reported for the same invalid submission'
);
assert(
  simultaneousValidationResult.structuralFeedback.length > 0 &&
  simultaneousValidationResult.syntaxFeedback.length > 0,
  'A missing semicolon and an invalid variable initialization should both have categorized feedback'
);

const javaVariablesInstruction = 'Declare an int variable called age with the value 18. Then print it.';
const javaVariablesCases = [
  { name: 'Java Variables valid declaration', code: 'int age = 18;\nSystem.out.println(age);', expected: true },
  { name: 'Java Variables hardcoded output', code: 'System.out.println(18);', expected: false },
  { name: 'Java Variables expression bypass', code: 'System.out.println(9 + 9);', expected: false },
  { name: 'Java Variables wrong name', code: 'int other = 9;\nSystem.out.println(other + 9);', expected: false },
  { name: 'Java Variables wrong type', code: 'long age = 18;\nSystem.out.println(age);', expected: false },
  { name: 'Java Variables wrong initialization value', code: 'int age = 19;\nSystem.out.println(age);', expected: false },
  { name: 'Java Variables reassigned after the required initialization', code: 'int age = 18;\nage = 18;\nSystem.out.println(age);', expected: false },
  { name: 'Java Variables formatting variation', code: 'int   age=18;\nSystem.out.println(age);', expected: true },
  { name: 'Java Variables valid extra calculation', code: 'int age = 18;\nint doubled = age * 2;\nSystem.out.println(age);', expected: true },
];

javaVariablesCases.forEach(test => {
  const result = validateCFG(test.code, 'Java', null, '18', {
    concept: 'Variables',
    instruction: javaVariablesInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, `${test.name}: constructUsed`);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const javaArithmeticInstruction = 'Declare int variables a = 20 and b = 8. Print the result of a + b on the first line and a - b on the second line.';
const javaArithmeticCases = [
  {
    name: 'reject Java arithmetic that hardcodes the declared values',
    code: 'int a = 20;\nint b = 8;\nSystem.out.println(20 + 8);\nSystem.out.println(20 - 8);',
    expected: false
  },
  {
    name: 'accept Java arithmetic that uses the declared variables',
    code: 'int a = 20;\nint b = 8;\nSystem.out.println(a + b);\nSystem.out.println(a - b);',
    expected: true
  },
];

javaArithmeticCases.forEach(test => {
  const result = validateCFG(test.code, 'Java', null, '28\n12', {
    concept: 'Operators',
    instruction: javaArithmeticInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const booleanPrintInstruction = 'Declare a boolean variable called isStudent with the value true. Then print it.';
const booleanPrintCases = [
  {
    name: 'reject Java hardcoded boolean output when instruction says print the variable',
    code: 'boolean isStudent = true;\nSystem.out.println("true");',
    expected: false
  },
  {
    name: 'accept Java output that prints the declared boolean variable',
    code: 'boolean isStudent = true;\nSystem.out.println(isStudent);',
    expected: true
  },
  {
    name: 'reject Python hardcoded boolean output when instruction says print the variable',
    code: 'isStudent = True\nprint("true")',
    expected: false
  },
  {
    name: 'accept Python output that prints the declared boolean variable',
    code: 'isStudent = True\nprint(isStudent)',
    expected: true
  },
  {
    name: 'reject Python variable first assigned a wrong value and then overwritten',
    code: 'name = "yow"\nname = "John"\nprint(name)',
    instruction: 'Declare a variable called name with the value "John". Then print it.',
    expected: false
  },
  {
    name: 'accept Python variable initialized to the required value and printed',
    code: 'name = "John"\nprint(name)',
    instruction: 'Declare a variable called name with the value "John". Then print it.',
    expected: true
  },
];

booleanPrintCases.forEach(test => {
  const result = validateCFG(test.code, test.name.includes('Python') ? 'Python' : 'Java', null, 'true', {
    concept: 'Data Types',
    instruction: test.instruction || booleanPrintInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const unsupportedJavaVariables = validateCFG(
  'System.out.println(18);',
  'Java',
  null,
  '18',
  { concept: 'Variables', instruction: 'Declare a variable using an unsupported wording pattern.' }
);
assert.strictEqual(unsupportedJavaVariables.constructUsed, false, 'Unsupported Java Variables instructions must fail closed');
console.log('PASS: Unsupported Java Variables instruction fails closed');

const javaScriptVariableInstruction = 'Declare a variable called name using let with the value "Alice". Print it using console.log().';
const javaScriptVariableCases = [
  {
    name: 'JavaScript Variables rejects overwriting the instructed initial value',
    code: 'let name = "Joy";\nname = "Alice";\nconsole.log(name);',
    expected: false
  },
  {
    name: 'JavaScript Variables accepts the instructed declaration',
    code: 'let name = "Alice";\nconsole.log(name);',
    expected: true
  },
  {
    name: 'JavaScript Variables rejects a different declaration name',
    code: 'let username = "Alice";\nconsole.log(username);',
    expected: false
  }
];

javaScriptVariableCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', null, 'Alice', {
    concept: 'Variables',
    instruction: javaScriptVariableInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const objectDestructuringInstruction = 'Use object destructuring to extract all three properties into variables. Print each on its own line.';
const objectDestructuringCases = [
  {
    name: 'JavaScript destructuring rejects hardcoded values instead of extracted variables',
    code: 'const car = { properties: "Toyota", model: "Vios", year: "2022" };\nconst { properties, model, year } = car;\nconsole.log("Toyota");\nconsole.log("Vios");\nconsole.log("2022");',
    expected: false
  },
  {
    name: 'JavaScript destructuring accepts printing each extracted variable',
    code: 'const car = { properties: "Toyota", model: "Vios", year: "2022" };\nconst { properties, model, year } = car;\nconsole.log(properties);\nconsole.log(model);\nconsole.log(year);',
    expected: true
  }
];

objectDestructuringCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', null, 'Toyota\nVios\n2022', {
    concept: 'Variables',
    instruction: objectDestructuringInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const javaScriptTypeofInstruction = 'Declare a variable called score with the value 98.5 and a variable called message with the value "Well done". Print the typeof score on the first line and the typeof message on the second line.';
const javaScriptTypeofCases = [
  {
    name: 'JavaScript Data Types rejects hardcoded typeof output',
    code: 'let score = 98.5;\nlet message = "Well done";\nconsole.log("number");\nconsole.log("string");',
    expected: false
  },
  {
    name: 'JavaScript Data Types accepts typeof output from the instructed variables',
    code: 'let score = 98.5;\nlet message = "Well done";\nconsole.log(typeof score);\nconsole.log(typeof message);',
    expected: true
  }
];

javaScriptTypeofCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', null, 'number\nstring', {
    concept: 'Data Types',
    instruction: javaScriptTypeofInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const javaScriptNaNInstruction = 'Declare a variable called parsed with the value Number("abc"). Print parsed on the first line, isNaN(parsed) on the second line, and the typeof parsed on the third line.';
const javaScriptNaNCases = [
  {
    name: 'JavaScript NaN task rejects hardcoded expected output',
    code: 'let parsed = Number("abc");\nconsole.log("NaN");\nconsole.log("true");\nconsole.log("number");',
    expected: false
  },
  {
    name: 'JavaScript NaN task accepts expressions using the declared variable',
    code: 'let parsed = Number("abc");\nconsole.log(parsed);\nconsole.log(isNaN(parsed));\nconsole.log(typeof parsed);',
    expected: true
  },
  {
    name: 'JavaScript NaN task rejects printing a different expression',
    code: 'let parsed = Number("abc");\nconsole.log(parsed);\nconsole.log(true);\nconsole.log(typeof parsed);',
    expected: false
  }
];

javaScriptNaNCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', null, 'NaN\ntrue\nnumber', {
    concept: 'Data Types',
    instruction: javaScriptNaNInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const javaScriptArithmeticInstruction = 'Declare variables x = 15 and y = 4. Print x + y on the first line, x * y on the second line, x % y on the third line, and x ** 2 on the fourth line.';
const javaScriptArithmeticCases = [
  {
    name: 'JavaScript arithmetic task rejects expected output computed from hardcoded literals',
    code: 'let x = 15, y = 4;\nconsole.log(15 + 4);\nconsole.log(15 * 4);\nconsole.log(15 % 4);\nconsole.log(15 ** 2);',
    expected: false
  },
  {
    name: 'JavaScript arithmetic task accepts expressions using the declared variables',
    code: 'let x = 15, y = 4;\nconsole.log(x + y);\nconsole.log(x * y);\nconsole.log(x % y);\nconsole.log(x ** 2);',
    expected: true
  }
];

javaScriptArithmeticCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', null, '19\n60\n3\n225', {
    concept: 'Operators',
    instruction: javaScriptArithmeticInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const strictEqualityInstruction = 'Print the result of 0 == false on the first line, 0 === false on the second line, "1" == 1 on the third line, and "1" === 1 on the fourth line.';
const strictEqualityCases = [
  {
    name: 'JavaScript equality task accepts the instructed comparison expressions without an unrequested declaration',
    code: 'console.log(0 == false);\nconsole.log(0 === false);\nconsole.log("1" == 1);\nconsole.log("1" === 1);',
    expected: true
  },
  {
    name: 'JavaScript equality task rejects hardcoded expected output',
    code: 'console.log("true");\nconsole.log("false");\nconsole.log("true");\nconsole.log("false");',
    expected: false
  }
];

strictEqualityCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', 'let', 'true\nfalse\ntrue\nfalse', {
    concept: 'Operators',
    instruction: strictEqualityInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const javaScriptIncrementInstruction = 'Declare a variable called counter with the value 10. Print counter++ on the first line, then print counter on the second line, then print ++counter on the third line.';
const javaScriptIncrementCases = [
  {
    name: 'JavaScript increment task accepts the instructed post- and pre-increment expressions',
    code: 'let counter = 10;\nconsole.log(counter++);\nconsole.log(counter);\nconsole.log(++counter);',
    expected: true
  },
  {
    name: 'JavaScript increment task rejects hardcoded output instead of increment expressions',
    code: 'let counter = 10;\nconsole.log(10);\nconsole.log(11);\nconsole.log(12);',
    expected: false
  }
];

javaScriptIncrementCases.forEach(test => {
  const result = validateCFG(test.code, 'JavaScript', 'let', '10\n11\n12', {
    concept: 'Operators',
    instruction: javaScriptIncrementInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const isOnlineInstruction = 'Create a boolean variable called isOnline and set it to true. Use an if statement to print "Online".';
const isOnlineDirectPrint = validateCFG(
  'print(True)',
  'Python',
  'if',
  'Online',
  { concept: 'Conditionals', instruction: isOnlineInstruction }
);
assert.strictEqual(
  isOnlineDirectPrint.constructUsed,
  false,
  'Python isOnline task must reject direct output without assigning the required variable'
);
console.log('PASS: Python isOnline task rejects direct output without its variable');

const isOnlineVariable = validateCFG(
  'isOnline = True\nif isOnline:\n    print("Online")',
  'Python',
  'if',
  'Online',
  { concept: 'Conditionals', instruction: isOnlineInstruction }
);
assert.strictEqual(
  isOnlineVariable.constructUsed,
  true,
  'Python isOnline task accepts assignment and use of the required variable'
);
console.log('PASS: Python isOnline task accepts the required variable');

const ageIfElseInstruction = 'Declare an integer variable called age with the value 18. Use if-else to print "adult" when age is greater than or equal to 18.';
const ageIfElseCases = [
  {
    name: 'reject Python conditional that uses a literal instead of the declared variable',
    language: 'Python',
    code: 'age = 18\nif 18 >= 18:\n    print("adult")\nelse:\n    print("not adult")',
    requiredConstruct: 'if-else',
    expected: false
  },
  {
    name: 'reject Python hardcoded conditional even when required construct metadata is missing',
    language: 'Python',
    code: 'number = 7\nif 7 % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',
    requiredConstruct: null,
    instruction: 'Declare a variable called number with the value 7. Use if-else to print "Even" if the number is divisible by 2, otherwise print "Odd".',
    expected: false
  },
  {
    name: 'accept Python conditional that uses the declared variable',
    language: 'Python',
    code: 'age = 18\nif age >= 18:\n    print("adult")\nelse:\n    print("not adult")',
    requiredConstruct: 'if-else',
    expected: true
  },
  {
    name: 'reject JavaScript conditional that uses a literal instead of the declared variable',
    language: 'JavaScript',
    code: 'let age = 18;\nif (18 >= 18) { console.log("adult"); } else { console.log("not adult"); }',
    requiredConstruct: 'if-else',
    expected: false
  },
  {
    name: 'accept JavaScript conditional that uses the declared variable',
    language: 'JavaScript',
    code: 'let age = 18;\nif (age >= 18) { console.log("adult"); } else { console.log("not adult"); }',
    requiredConstruct: 'if-else',
    expected: true
  },
];

const compareNumbersInstruction = 'Declare variables x = 45 and y = 60. Use if-else to print "x is larger" if x is greater than y, otherwise print "y is larger".';
const compareNumbersCases = [
  {
    name: 'reject Python condition with declared variables replaced by literals',
    code: 'x = 45\ny = 60\nif 45 > 60:\n    print("x is larger")\nelse:\n    print("y is larger")',
    expected: false
  },
  {
    name: 'reject Python condition that uses only one of the declared variables',
    code: 'x = 45\ny = 60\nif x > 60:\n    print("x is larger")\nelse:\n    print("y is larger")',
    expected: false
  },
  {
    name: 'accept Python condition that compares both declared variables',
    code: 'x = 45\ny = 60\nif x > y:\n    print("x is larger")\nelse:\n    print("y is larger")',
    expected: true
  },
];

ageIfElseCases.forEach(test => {
  const result = validateCFG(test.code, test.language, test.requiredConstruct, test.language === 'Python' ? 'Odd' : 'adult', {
    concept: 'Conditionals',
    instruction: test.instruction || ageIfElseInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

compareNumbersCases.forEach(test => {
  const result = validateCFG(test.code, 'Python', 'if-else', 'y is larger', {
    concept: 'Conditionals',
    instruction: compareNumbersInstruction
  });
  try {
    assert.strictEqual(result.constructUsed, test.expected, test.name);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

const requiredPythonDataTypesInstruction = 'Declare a variable called speed with the value 85. Store the result of speed > 60 in a variable called is_speeding and the result of speed == 100 in a variable called is_max. Print is_speeding on the first line, is_max on the second line, and the type of is_speeding on the third line.';
const pythonDataTypesPrintOnly = validateCFG(
  "print(\"True\")\nprint(\"False\")\nprint(\"<class 'bool'>\")",
  'Python',
  null,
  "True\nFalse\n<class 'bool'>",
  { concept: 'Data Types', instruction: requiredPythonDataTypesInstruction }
);
assert.strictEqual(
  pythonDataTypesPrintOnly.constructUsed,
  false,
  'Python Data Types task must reject matching output without the instructed variables'
);
console.log('PASS: Python Data Types task rejects matching output without variables');

const pythonDataTypesAssignments = validateCFG(
  'speed = 85\nis_speeding = speed > 60\nis_max = speed == 100\nprint(is_speeding)\nprint(is_max)\nprint(type(is_speeding))',
  'Python',
  null,
  "True\nFalse\n<class 'bool'>",
  { concept: 'Data Types', instruction: requiredPythonDataTypesInstruction }
);
assert.strictEqual(
  pythonDataTypesAssignments.constructUsed,
  true,
  'Python Data Types task accepts the instructed variable assignments'
);
console.log('PASS: Python Data Types task accepts instructed variable assignments');

const pythonLogicalOperatorsInstruction = 'Declare a variable age = 20. Print age >= 18 and age <= 65 on the first line, age < 13 or age > 60 on the second line, and not age == 20 on the third line.';
const pythonLogicalOperatorsPrintOnly = validateCFG(
  'print("True")\nprint("False")\nprint("False")',
  'Python',
  null,
  'True\nFalse\nFalse',
  { concept: 'Operators', instruction: pythonLogicalOperatorsInstruction }
);
assert.strictEqual(
  pythonLogicalOperatorsPrintOnly.constructUsed,
  false,
  'Python logical operators task must reject expected output printed as literals'
);
console.log('PASS: Python logical operators task rejects print-only answers');

const pythonLogicalOperatorsWithoutExpressions = validateCFG(
  'age = 20\nprint("True")\nprint("False")\nprint("False")',
  'Python',
  null,
  'True\nFalse\nFalse',
  { concept: 'Operators', instruction: pythonLogicalOperatorsInstruction }
);
assert.strictEqual(
  pythonLogicalOperatorsWithoutExpressions.constructUsed,
  false,
  'Python logical operators task must reject the required variable with literal output'
);
console.log('PASS: Python logical operators task requires instructed print expressions');

const pythonLogicalOperatorsSolution = validateCFG(
  'age = 20\nprint(age >= 18 and age <= 65)\nprint(age < 13 or age > 60)\nprint(not age == 20)',
  'Python',
  null,
  'True\nFalse\nFalse',
  { concept: 'Operators', instruction: pythonLogicalOperatorsInstruction }
);
assert.strictEqual(
  pythonLogicalOperatorsSolution.constructUsed,
  true,
  'Python logical operators task accepts the required variable and expressions'
);
console.log('PASS: Python logical operators task accepts instructed expressions');

const javaVariablesPatternCases = [
  {
    name: 'Java Variables String declaration',
    instruction: 'Inside the main method, declare a String variable called name with the value "John". Then print it.',
    code: 'String name = "John";\nSystem.out.println(name);',
  },
  {
    name: 'Java Variables two declarations',
    instruction: 'Declare a String variable called city with the value "Manila" and an int variable called year with the value 2025. Print city on the first line and year on the second line.',
    code: 'String city = "Manila";\nint year = 2025;\nSystem.out.println(city);\nSystem.out.println(year);',
  },
  {
    name: 'Java Variables area calculation declarations',
    instruction: 'Declare int variables length = 7 and width = 4. Compute their product and store it in a variable called area. Print area.',
    code: 'int length = 7;\nint width = 4;\nint area = length * width;\nSystem.out.println(area);',
  },
  {
    name: 'Java Variables Celsius declaration',
    instruction: 'Declare a double variable called celsius with the value 25.0. Convert it to Fahrenheit using the formula and store the result in a variable called fahrenheit. Print fahrenheit.',
    code: 'double celsius = 25.0;\ndouble fahrenheit = celsius * 9.0 / 5.0 + 32.0;\nSystem.out.println(fahrenheit);',
  },
  {
    name: 'Java Variables full name declarations',
    instruction: 'Declare a String variable called firstName with value "Maria" and another called lastName with value "Santos". Combine them with a space in between and store the result in fullName. Print fullName.',
    code: 'String firstName = "Maria";\nString lastName = "Santos";\nString fullName = firstName + " " + lastName;\nSystem.out.println(fullName);',
  },
  {
    name: 'Java Variables circumference declaration',
    instruction: 'Declare a double variable called radius with the value 5.0. Compute the circumference using Math.PI and store it in a variable called circumference. Print the result rounded to 2 decimal places.',
    code: 'double radius = 5.0;\ndouble circumference = 2 * Math.PI * radius;\nSystem.out.println(Math.round(circumference * 100.0) / 100.0);',
  },
  {
    name: 'Java Variables BMI declarations',
    instruction: 'Declare double variables weight = 70.0 and height = 1.75. Compute the BMI and print the result rounded to 1 decimal place.',
    code: 'double weight = 70.0;\ndouble height = 1.75;\ndouble bmi = weight / (height * height);\nSystem.out.println(Math.round(bmi * 10.0) / 10.0);',
  },
  {
    name: 'Java Variables interest declarations',
    instruction: 'Declare double variables principal = 1000.0, rate = 5.0, and time = 3.0. Compute simple interest using the formula and print the result.',
    code: 'double principal = 1000.0;\ndouble rate = 5.0;\ndouble time = 3.0;\ndouble interest = principal * rate * time / 100.0;\nSystem.out.println(interest);',
  },
];

javaVariablesPatternCases.forEach(test => {
  const result = validateCFG(test.code, 'Java', null, '', {
    concept: 'Variables',
    instruction: test.instruction
  });
  try {
    assert.strictEqual(result.constructUsed, true, `${test.name}: constructUsed`);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
  }
});

try {
  assert.strictEqual(objectLiteralResult.syntaxErrors, 0, 'JS object literal should not trigger missing semicolon warnings');
  console.log('PASS: JS object literal regression');
} catch (err) {
  failed += 1;
  console.error('FAIL: JS object literal regression');
  console.error(err.message);
  console.error('Result:', objectLiteralResult);
}

cases.forEach(test => {
  const result = validateCFG(test.code, test.lang, test.construct, test.expectedOutput);
  try {
    assert.strictEqual(result.constructUsed, test.expected.constructUsed, `${test.name}: constructUsed`);
    assert.strictEqual(result.structuralErrors, test.expected.structuralErrors, `${test.name}: structuralErrors`);
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${test.name}`);
    console.error(err.message);
    console.error('Result:', result);
    console.error('Expected:', test.expected);
  }
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${cases.length} CFG validation tests passed.`);
