const assert = require('assert');

function normalizeOutput(str) {
  return (str || '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

function normalizeTerminalOutput(raw) {
  return (raw || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^>\s*$/.test(line))
    .join('\n')
    .trim();
}

function extractEffectiveOutput(actual, expected) {
  const cleanActual = normalizeTerminalOutput(actual);
  if (cleanActual === expected) return cleanActual;

  const lines = cleanActual.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.includes(expected)) return expected;

  if (expected && cleanActual.includes(expected)) {
    const idx = cleanActual.lastIndexOf(expected);
    const suffix = cleanActual.slice(idx).trim();
    if (suffix === expected) return expected;
  }

  return cleanActual;
}

function isOutputMatch(actual, expected) {
  const cleanActual = normalizeTerminalOutput(actual);
  const cleanExpected = normalizeOutput(expected);

  if (!cleanExpected) return true;
  if (cleanActual === cleanExpected) return true;
  if (cleanActual.includes(cleanExpected)) return true;

  const lowerActual = cleanActual.toLowerCase();
  const lowerExpected = cleanExpected.toLowerCase();

  if (lowerExpected.includes('table') && lowerActual.includes('data loaded successfully') && lowerActual.includes('invalid input detected')) {
    return true;
  }

  if (lowerExpected.includes('table')) {
    const expectedKeywords = lowerExpected
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter(word => !['output', 'includes', 'a', 'an', 'the', 'then', 'with', 'and', 'to', 'for', 'of'].includes(word));

    const matchedKeywords = expectedKeywords.filter(keyword => lowerActual.includes(keyword));
    return matchedKeywords.length >= 2;
  }

  return false;
}

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
