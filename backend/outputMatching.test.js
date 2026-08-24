const assert = require('assert');
const { isOutputMatch } = require('./utils/outputMatching');
const { validateCFG } = require('./utils/cfgValidator');

// Table-style legacy check
const sampleActual = `┌─────────┬────────┐
│ (index) │ Values │
├─────────┼────────┤
│ name    │ 'Rosa' │
│ grade   │ 92     │
└─────────┴────────┘
Data loaded successfully
Invalid input detected`;
const sampleExpected = 'Output includes a table with name and grade, then:\nData loaded successfully\nInvalid input detected';
assert.strictEqual(isOutputMatch(sampleActual, sampleExpected), true, 'table-based output should match by content');
console.log('PASS: table-style output matching');

// ── BUG #1 REGRESSION TEST CASES ──

// CASE 1 — EXTRA PLACEHOLDER OUTPUT
const case1Expected = "<class 'int'>\n<class 'float'>";
const case1Actual = "Replace this line!\n<class 'int'>\n<class 'float'>";
assert.strictEqual(isOutputMatch(case1Actual, case1Expected), false, 'CASE 1: Extra placeholder output must be REJECTED');
console.log('PASS: CASE 1 — EXTRA PLACEHOLDER OUTPUT');

// CASE 2 — EXACT EXPECTED OUTPUT
const case2Expected = "<class 'int'>\n<class 'float'>";
const case2Actual = "<class 'int'>\n<class 'float'>";
assert.strictEqual(isOutputMatch(case2Actual, case2Expected), true, 'CASE 2: Exact expected output must be ACCEPTED');
console.log('PASS: CASE 2 — EXACT EXPECTED OUTPUT');

// CASE 3 — WRONG OUTPUT
const case3Expected = "15";
const case3Actual = "10";
assert.strictEqual(isOutputMatch(case3Actual, case3Expected), false, 'CASE 3: Wrong output must be REJECTED');
console.log('PASS: CASE 3 — WRONG OUTPUT');

// CASE 4 — CORRECT COMPUTED OUTPUT
const case4Expected = "15";
const case4Actual = "15";
assert.strictEqual(isOutputMatch(case4Actual, case4Expected), true, 'CASE 4: Correct computed output must be ACCEPTED');
console.log('PASS: CASE 4 — CORRECT COMPUTED OUTPUT');

// CASE 5 — REQUIRED CONSTRUCT MISSING
const case5CodeMissingIf = "print('large')";
const case5Cfg = validateCFG(case5CodeMissingIf, 'python', 'if', 'large');
assert.strictEqual(case5Cfg.constructUsed, false, 'CASE 5: Code missing required construct if must fail CFG validation');
console.log('PASS: CASE 5 — REQUIRED CONSTRUCT MISSING');

// CASE 6 — EXISTING VALID VARIABLE SOLUTION
const case6Code = "x = 10\ny = 5\nprint(x + y)";
const case6ExpectedOutput = "15";
const case6ActualOutput = "15";
const case6Cfg = validateCFG(case6Code, 'python', 'assignment', case6ExpectedOutput);
assert.strictEqual(isOutputMatch(case6ActualOutput, case6ExpectedOutput), true, 'CASE 6: Output match for valid variable solution');
assert.strictEqual(case6Cfg.constructUsed, true, 'CASE 6: Valid variable solution must satisfy CFG construct');
console.log('PASS: CASE 6 — EXISTING VALID VARIABLE SOLUTION');

// CASE 7 — EXTRA OUTPUT AFTER CORRECT OUTPUT
const case7Expected = "15";
const case7Actual = "15\nhello";
assert.strictEqual(isOutputMatch(case7Actual, case7Expected), false, 'CASE 7: Extra output after correct output must be REJECTED');
console.log('PASS: CASE 7 — EXTRA OUTPUT AFTER CORRECT OUTPUT');
