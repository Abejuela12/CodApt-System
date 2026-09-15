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

const javaVariablesInstruction = 'Declare an int variable called age with the value 18. Then print it.';
const javaVariablesCases = [
  { name: 'Java Variables valid declaration', code: 'int age = 18;\nSystem.out.println(age);', expected: true },
  { name: 'Java Variables hardcoded output', code: 'System.out.println(18);', expected: false },
  { name: 'Java Variables expression bypass', code: 'System.out.println(9 + 9);', expected: false },
  { name: 'Java Variables wrong name', code: 'int other = 9;\nSystem.out.println(other + 9);', expected: false },
  { name: 'Java Variables wrong type', code: 'long age = 18;\nSystem.out.println(age);', expected: false },
  { name: 'Java Variables wrong initialization value', code: 'int age = 19;\nSystem.out.println(age);', expected: false },
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

const unsupportedJavaVariables = validateCFG(
  'System.out.println(18);',
  'Java',
  null,
  '18',
  { concept: 'Variables', instruction: 'Declare a variable using an unsupported wording pattern.' }
);
assert.strictEqual(unsupportedJavaVariables.constructUsed, false, 'Unsupported Java Variables instructions must fail closed');
console.log('PASS: Unsupported Java Variables instruction fails closed');

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
