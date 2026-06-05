const normalizeLanguage = (language) => {
  return (language || 'python').toString().trim().toLowerCase();
};

const stripSemicolon = (line) => line.replace(/;\s*$/, '').trim();

const parseValue = (value) => {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  const lower = value.toLowerCase();
  if (lower === 'true' || lower === 'false') {
    return lower === 'true';
  }

  if (!isNaN(value) && value !== '') {
    return Number(value);
  }

  return value;
};

const stripLanguageKeyword = (line, language) => {
  const normalized = normalizeLanguage(language);
  if (normalized === 'javascript') {
    return line.replace(/^(const|let|var)\s+/, '').trim();
  }
  if (normalized === 'java') {
    return line.replace(/^(String|int|double|float|char|boolean|long|byte|short)\s+/, '').trim();
  }
  return line;
};

const replaceVariables = (expr, context) => {
  return Object.keys(context).reduce((current, varName) => {
    const regex = new RegExp(`\\b${varName}\\b`, 'g');
    return current.replace(regex, JSON.stringify(context[varName]));
  }, expr);
};

const getPrintMatch = (line, language) => {
  const normalized = normalizeLanguage(language);
  if (normalized === 'python') {
    return line.match(/print\s*\(\s*(.+?)\s*\)$/);
  }
  if (normalized === 'javascript') {
    return line.match(/console\.log\s*\(\s*(.+?)\s*\)$/);
  }
  if (normalized === 'java') {
    return line.match(/System\.out\.(?:print|println)\s*\(\s*(.+?)\s*\)$/);
  }
  return null;
};

export function evaluateCode(code, language = 'python') {
  const normalized = normalizeLanguage(language);
  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'));

  const context = {};
  let output = '';

  lines.forEach((rawLine) => {
    const line = stripSemicolon(rawLine);
    if (!line) return;

    const printMatch = getPrintMatch(line, normalized);
    if (printMatch) {
      let expr = printMatch[1].trim();
      expr = replaceVariables(expr, context);

      try {
        const result = eval(expr);
        output += `${result}\n`;
      } catch {
        output += 'ERROR\n';
      }
      return;
    }

    if (line.includes('=') && !/print\s*\(|console\.log\s*\(|System\.out\.(?:print|println)\s*\(/.test(line)) {
      const assignment = stripLanguageKeyword(line, normalized);
      const parts = assignment.split('=');
      if (parts.length === 2) {
        const varName = parts[0].trim();
        const value = parseValue(parts[1].trim());
        context[varName] = value;
      }
    }
  });

  const trimmedOutput = output.trim();
  return trimmedOutput || 'No output produced';
}

export function analyzeCode(code, task, language = 'python') {
  const expectedOutput = (
    task?.expectedOutput || task?.expected_output || ''
  ).toString().trim();
  const output = evaluateCode(code, language).
    toString().trim();

  const normalized = normalizeLanguage(language);
  const hasPrint = Boolean(getPrintMatch(stripSemicolon(code.trim()), normalized));
  const hasAssignment = /(=)/.test(code);

  const feedback = [];
  if (!hasAssignment) {
    feedback.push('Missing variable assignment');
  }
  if (!hasPrint) {
    const printHint =
      normalized === 'python'
        ? 'Missing print statement'
        : normalized === 'javascript'
        ? 'Missing console.log statement'
        : 'Missing System.out.print/println statement';
    feedback.push(printHint);
  }

  if (expectedOutput && output !== expectedOutput) {
    feedback.push(`Expected "${expectedOutput}" but got "${output}"`);
  }

  return {
    correct: expectedOutput ? output === expectedOutput : false,
    output,
    expected: expectedOutput,
    feedback,
  };
}
