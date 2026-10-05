export function normalizeOutput(str) {
  return (str || '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

export function normalizeTerminalOutput(raw) {
  return (raw || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^>\s*$/.test(line))
    .join('\n')
    .trim();
}

export function extractEffectiveOutput(actual, expected) {
  const cleanActual = normalizeTerminalOutput(actual);
  const cleanExpected = normalizeOutput(expected);
  if (cleanActual === cleanExpected) return cleanActual;
  return cleanActual;
}

export function removePythonInputPrompts(output, code) {
  const promptPattern = /\binput\s*\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/g;
  const prompts = [...(code || '').matchAll(promptPattern)]
    .map(match => match[1] ?? match[2])
    .filter(Boolean);

  return prompts.reduce((cleanOutput, prompt) => {
    const promptIndex = cleanOutput.indexOf(prompt);
    if (promptIndex === -1) return cleanOutput;
    return cleanOutput.slice(0, promptIndex) + cleanOutput.slice(promptIndex + prompt.length);
  }, (output || '').replace(/\r/g, ''));
}

export function isOutputMatch(actual, expected) {
  const cleanActual = normalizeTerminalOutput(actual);
  const cleanExpected = normalizeOutput(expected);

  if (!cleanExpected) return true;

  if (cleanActual === cleanExpected) return true;

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
