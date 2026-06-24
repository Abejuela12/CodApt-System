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
