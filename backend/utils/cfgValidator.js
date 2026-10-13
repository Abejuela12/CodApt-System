// ─── helpers ────────────────────────────────────────────────────

function stripComments(code, language) {
  const lang = (language || '').toLowerCase();
  if (lang === 'python') {
    return code.replace(/#.*/g, '');
  }
  if (lang === 'java' || lang === 'javascript') {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');
  }
  return code;
}

function stripStrings(code) {
  // Remove Python triple-quoted strings and JS string literals
  return code
    .replace(/("""|''')[\s\S]*?\1/g, '')          // Python triple-quoted strings
    .replace(/`([^`\\]|\\.)*`/g, '``')             // JS template literals
    .replace(/"([^"\\]|\\.)*"/g, '""')
    .replace(/'([^'\\]|\\.)*'/g, "''");
}

function cleanCode(code, language) {
  return stripStrings(stripComments(code, language));
}

// ─── construct detection ─────────────────────────────────────────

function isConstructUsed(code, language, construct) {
  if (!construct) return true;

  const cleaned = cleanCode(code, language);
  const lang    = (language || '').toLowerCase();

  switch (construct) {

    // ── Python ──────────────────────────────────────────────────
    case 'for':
      if (lang === 'python') {
        return /\bfor\b.+\bin\b/.test(cleaned);
      }
      return /\bfor\s*\(/.test(cleaned);

    case 'while':
      if (lang === 'python') {
        return /\bwhile\s+[^:]+:/.test(cleaned);
      }
      return /\bwhile\s*\(/.test(cleaned);

    case 'if':
      if (lang === 'python') {
        return /\bif\s+[^:]+:/.test(cleaned);
      }
      return /\bif\s*\(/.test(cleaned);

    case 'if-else':
      if (lang === 'python') {
        return /\bif\b/.test(cleaned) && (/\belse\b/.test(cleaned) || /\belif\b/.test(cleaned));
      }
      return /\bif\b/.test(cleaned) && /\belse\b/.test(cleaned);

    case 'else-if':
      if (lang === 'python') {
        return /\belif\b/.test(cleaned);
      }
      return /\belse\s+if\b/.test(cleaned);

    case 'elif':
      return /\belif\b/.test(cleaned);

    case 'def':
      return /\bdef\s+\w+\s*\(/.test(cleaned);

    // BUG FIX (ETC-related): 'assignment' was previously unhandled and fell
    // through to the literal-word default case below, which searched the
    // student's code for the text "assignment" — something real code never
    // contains. That made every FALLBACK_PROBLEMS task requiring
    // 'assignment' (Python Variables / Data Types / Operators) permanently
    // unsolvable even with perfectly correct code. This detects a real
    // assignment operator (=) while excluding ==, !=, <=, >= so comparisons
    // aren't mistaken for assignments.
    case 'assignment':
      return /(?<![=!<>])=(?!=)/.test(cleaned);

    case 'function':
      if (lang === 'python') {
        return /\bdef\s+\w+\s*\(/.test(cleaned);
      }
      if (lang === 'java') {
        return /\b(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\([^)]*\)\s*\{/.test(cleaned);
      }
      return (
        /\bfunction\s+\w+\s*\(/.test(cleaned)  ||
        /\bfunction\s*\(/.test(cleaned)         ||
        /\b(?:const|let|var)\s+\w+\s*=\s*\([^\)]*\)\s*=>/.test(cleaned) ||
        /\b(?:const|let|var)\s+\w+\s*=\s*[^\s\(][^=]*=>/.test(cleaned) ||
        /\b\w+\s*=\s*\([^\)]*\)\s*=>/.test(cleaned) ||
        /\b\w+\s*=\s*[^\s\(][^=]*=>/.test(cleaned) ||
        /\b(?:const|let|var)\s+\w+\s*=\s*function/.test(cleaned)
      );

    case 'return':
      return /\breturn\b/.test(cleaned);

    case 'void':
      return /\bvoid\s+\w+\s*\(/.test(cleaned);

    case 'Scanner':
      return /\bScanner\b/.test(cleaned);

    case 'console.log':
      return /\bconsole\.log\s*\(/.test(cleaned);

    case 'printf':
      return /\bprintf\s*\(/.test(cleaned);

    case 'input':
      return /\binput\s*\(/.test(cleaned);

    case 'readline':
      return /\breadline\b/.test(cleaned);

    case 'const':
      return /\bconst\b/.test(cleaned);

    case 'let':
      return /\blet\b/.test(cleaned);

    case 'switch':
      return /\bswitch\s*\(/.test(cleaned);

    case 'ternary':
      return /\?[^:\n]+:[^;\n]+/.test(cleaned);

    case 'throw':
      return /\bthrow\b/.test(cleaned);

    case 'raise':
      return /\braise\b/.test(cleaned);

    case 'finally':
      return /\bfinally\b/.test(cleaned);

    case 'try-catch':
      if (lang === 'python') {
        return /\btry\b/.test(cleaned) && /\bexcept\b/.test(cleaned);
      }
      return /\btry\b/.test(cleaned) && /\bcatch\b/.test(cleaned);

    case 'try-catch-finally':
      if (lang === 'python') {
        return /\btry\b/.test(cleaned) && /\bexcept\b/.test(cleaned) && /\bfinally\b/.test(cleaned);
      }
      return /\btry\b/.test(cleaned) && /\bcatch\b/.test(cleaned) && /\bfinally\b/.test(cleaned);

    case 'try-except':
      return /\btry\b/.test(cleaned) && /\bexcept\b/.test(cleaned);

    case 'try-except-finally':
      return /\btry\b/.test(cleaned) && /\bexcept\b/.test(cleaned) && /\bfinally\b/.test(cleaned);

    case 'custom-exception':
      return /\bclass\s+\w*Exception\b/.test(cleaned) || /\bextends\s+\w*Exception\b/.test(cleaned) || /\bthrow\s+new\b/.test(cleaned);

    case 'exception-chaining':
      return /\braise\b[^\n]*\bfrom\b/.test(cleaned) || /\binitCause\b/.test(cleaned) || /\bnew\b[^\n]*Exception\s*\([^\n]*,[^\n]*\)/.test(cleaned);

    case 'multi-catch':
      return /\bcatch\s*\([^\n]*\|[^\n]*\)/.test(cleaned);

    default: {
      const re = new RegExp(`\\b${construct}\\b`);
      return re.test(cleaned);
    }
  }
}

function parseJavaLiteral(value) {
  const literal = value.trim().replace(/[.,]$/, '');
  if (/^"(?:\\.|[^"\\])*"$/.test(literal)) return literal;
  if (/^-?\d+(?:\.\d+)?$/.test(literal)) return literal;
  return null;
}

function parseJavaVariableDeclarations(instruction) {
  const declarations = [];
  const addDeclaration = (type, name, value) => {
    const literal = parseJavaLiteral(value);
    if (literal) declarations.push({ type, name, value: literal });
  };

  const calledPattern = /(?:\bdeclare\s+|\band\s+)(?:a|an)\s+(String|int|double)\s+variable\s+called\s+(\w+)\s+with(?:\s+the)?\s+value\s+((?:"(?:\\.|[^"\\])*"|(?:-?\d+(?:\.\d+)?)))/gi;
  let match;
  while ((match = calledPattern.exec(instruction)) !== null) {
    addDeclaration(match[1], match[2], match[3]);
  }

  const pluralPattern = /\b(?:Declare|and)\s+(String|int|double)\s+variables?\s+(.+?)(?=\.(?:\s|$))/gi;
  while ((match = pluralPattern.exec(instruction)) !== null) {
    const assignmentPattern = /(\w+)\s*=\s*((?:"(?:\\.|[^"\\])*"|\-?\d+(?:\.\d+)?))(?=\s*(?:,|\band\b|$))/g;
    let assignment;
    while ((assignment = assignmentPattern.exec(match[2])) !== null) {
      addDeclaration(match[1], assignment[1], assignment[2]);
    }
  }

  const firstType = declarations[0]?.type;
  const anotherPattern = /\band\s+another\s+called\s+(\w+)\s+with\s+value\s+((?:"(?:\\.|[^"\\])*"|\-?\d+(?:\.\d+)?))/gi;
  while ((match = anotherPattern.exec(instruction)) !== null) {
    if (!firstType) return { supported: false, declarations: [] };
    addDeclaration(firstType, match[1], match[2]);
  }

  const derivedNames = [...instruction.matchAll(/\bstore\s+(?:it|the result)\s+in\s+(?:a\s+)?variable\s+called\s+(\w+)/gi)]
    .map(derived => derived[1]);

  if (declarations.length === 0) return { supported: false, declarations: [] };
  return { supported: true, declarations, derivedNames };
}

function validateJavaVariables(code, instruction) {
  const parsed = parseJavaVariableDeclarations(instruction);
  if (!parsed.supported) {
    return {
      valid: false,
      feedback: ['⚠ This Java Variables task uses an unsupported declaration format and cannot be validated safely.']
    };
  }

  const source = stripComments(code, 'java');
  const declarationMissing = parsed.declarations.some(({ type, name, value }) => {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${type}\\s+${name}\\s*=\\s*${escapedValue}\\s*;`);
    return !pattern.test(source);
  });
  const reassigned = parsed.declarations.some(({ name }) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const assignmentPattern = new RegExp(`\\b${escapedName}\\s*(?:=(?!=)|\\+=|-=|\\*=|/=|%=)`, 'g');
    const mutationSource = cleanCode(code, 'java');
    return [...mutationSource.matchAll(assignmentPattern)].length !== 1;
  });
  const derivedMissing = parsed.derivedNames.some(name =>
    !new RegExp(`\\b(?:String|int|double)\\s+${name}\\s*=`, 'i').test(source)
  );

  return {
    valid: !declarationMissing && !reassigned && !derivedMissing,
    feedback: reassigned
      ? ['⚠ This task requires initializing each instructed variable once; do not assign another value to it before printing.']
      : !declarationMissing && !derivedMissing
      ? []
      : ['⚠ This Java Variables task requires the declared variables and initial values from the instructions.']
  };
}

function parseJavaRequiredPrintExpressions(instruction) {
  const expressions = [];
  const linePattern = /\s+on\s+the\s+(?:first|second|third|\d+(?:st|nd|rd|th))\s+line/gi;
  const firstPrint = /\bprint\s+(?:the\s+result\s+of\s+)?/gi.exec(instruction);
  if (!firstPrint) return expressions;

  let cursor = firstPrint.index + firstPrint[0].length;
  let lineMatch = linePattern.exec(instruction);
  while (lineMatch && lineMatch.index >= cursor) {
    const expression = instruction.slice(cursor, lineMatch.index).trim().replace(/[.,;]$/, '');
    if (expression) expressions.push(expression);

    cursor = linePattern.lastIndex;
    const nextExpression = /\band\s+(?:the\s+result\s+of\s+)?/gi;
    nextExpression.lastIndex = cursor;
    const nextMatch = nextExpression.exec(instruction);
    if (!nextMatch) break;
    cursor = nextExpression.lastIndex;
    linePattern.lastIndex = cursor;
    lineMatch = linePattern.exec(instruction);
  }

  return expressions;
}

function validateJavaRequiredPrintExpressions(code, instruction) {
  const requiredExpressions = parseJavaRequiredPrintExpressions(instruction);
  if (requiredExpressions.length === 0) return true;

  const source = stripComments(code, 'java');
  const printArguments = [...source.matchAll(/(?:System\.out\.println|System\.out\.print|print)\s*\(([^;\n]*)\)\s*;?/g)]
    .map(match => match[1].replace(/\s+/g, ''));
  let nextArgumentIndex = 0;

  return requiredExpressions.every(expression => {
    const normalizedExpression = expression.replace(/\s+/g, '');
    const matchingIndex = printArguments.findIndex((argument, index) =>
      index >= nextArgumentIndex && argument === normalizedExpression
    );
    if (matchingIndex === -1) return false;
    nextArgumentIndex = matchingIndex + 1;
    return true;
  });
}

function parsePythonRequiredAssignments(instruction) {
  const assignments = [];
  const literalPattern = '(True|False|true|false|-?\\d+(?:\\.\\d+)?|"(?:\\\\.|[^"\\\\])*"|\\\'(?:\\\\.|[^\\\'\\\\])*\\\')';
  const directDeclarationPattern = new RegExp(
    `\\b(?:declare|create)\\s+(?:a\\s+|an\\s+)?variable\\s+(\\w+)\\s*=\\s*${literalPattern}`,
    'gi'
  );
  const declaredPattern = new RegExp(
    `\\bvariable\\s+called\\s+(\\w+)\\s+(?:with\\s+(?:the\\s+)?value\\s+${literalPattern}|and\\s+set\\s+it\\s+to\\s+${literalPattern})`,
    'gi'
  );
  let match;

  while ((match = directDeclarationPattern.exec(instruction)) !== null) {
    const value = match[2];
    assignments.push({
      name: match[1],
      expression: /^true$/i.test(value) ? 'True' : /^false$/i.test(value) ? 'False' : value
    });
  }

  while ((match = declaredPattern.exec(instruction)) !== null) {
    const value = match[2] || match[3];
    assignments.push({
      name: match[1],
      expression: /^true$/i.test(value) ? 'True' : /^false$/i.test(value) ? 'False' : value
    });
  }

  const resultPattern = /\bresult\s+of\s+(.+?)\s+in\s+(?:a\s+)?variable\s+called\s+(\w+)/gi;
  while ((match = resultPattern.exec(instruction)) !== null) {
    assignments.push({ name: match[2], expression: match[1].trim() });
  }

  return [...new Map(assignments.map(assignment => [assignment.name, assignment])).values()];
}

function parsePythonRequiredPrintExpressions(instruction) {
  const printStart = instruction.match(/\bprint\s+/i);
  if (!printStart) return [];

  const printSection = instruction.slice(printStart.index + printStart[0].length);
  const linePattern = /(.+?)\s+on\s+the\s+(?:first|second|third|\d+(?:st|nd|rd|th))\s+line/gi;
  const expressions = [];
  let match;

  while ((match = linePattern.exec(printSection)) !== null) {
    const expression = match[1]
      .replace(/^[,\s]*(?:and\s+)?/i, '')
      .trim()
      .replace(/[.,;]$/, '')
      .replace(/^the\s+type\s+of\s+(\w+)$/i, 'type($1)');
    if (expression) expressions.push(expression);
  }

  return expressions;
}

function validatePythonRequiredAssignments(code, instruction) {
  const requiredAssignments = parsePythonRequiredAssignments(instruction);
  if (requiredAssignments.length === 0) return true;

  const source = stripComments(code, 'python');
  return requiredAssignments.every(({ name, expression }) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const assignmentPattern = new RegExp(`^\\s*${escapedName}\\s*=\\s*(.*?)\\s*$`);
    const firstAssignment = source.split('\n')
      .map(line => line.match(assignmentPattern))
      .find(Boolean);
    return firstAssignment &&
      firstAssignment[1].replace(/\s+/g, '') === expression.replace(/\s+/g, '');
  });
}

function parseJavaScriptRequiredDeclarations(instruction) {
  const declarations = [];
  const valuePattern = '("(?:\\\\.|[^"\\\\])*"|\\\'(?:\\\\.|[^\\\'\\\\])*\\\'|[A-Za-z_$][\\w$]*\\s*\\([^;\\n]*?\\)|-?\\d+(?:\\.\\d+)?|true|false|null)';
  const pattern = new RegExp(
    `\\bvariable\\s+(?:called|named)\\s+([A-Za-z_$][\\w$]*)\\s+(?:using\\s+(let|const|var)\\s+)?with\\s+(?:the\\s+)?value\\s+(${valuePattern})(?=\\s*(?:and\\s+(?:a|another)\\s+variable\\b|[,.;]\\s*(?:print|then)\\b|$))`,
    'gi'
  );
  let match;

  while ((match = pattern.exec(instruction)) !== null) {
    declarations.push({
      name: match[1],
      keyword: match[2],
      expression: match[3]
    });
  }

  return declarations;
}

function validateJavaScriptRequiredDeclarations(code, instruction) {
  const declarations = parseJavaScriptRequiredDeclarations(instruction);
  if (declarations.length === 0) return true;

  const source = stripComments(code, 'javascript');
  const mutationSource = cleanCode(code, 'javascript');

  return declarations.every(({ name, keyword, expression }) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedValue = expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const declarationKeywordPattern = keyword
      ? `\\b${keyword}`
      : '\\b(?:let|const|var)';
    const declarationPattern = new RegExp(
      `${declarationKeywordPattern}\\s+${escapedName}\\s*=\\s*${escapedValue}(?=\\s*[;,\\n]|\\s*$)`
    );
    const assignmentPattern = new RegExp(
      `(?:\\b(?:let|const|var)\\s+)?\\b${escapedName}\\s*(?:=(?!=)|\\+=|-=|\\*=|/=|%=)`,
      'g'
    );
    return declarationPattern.test(source) &&
      [...mutationSource.matchAll(assignmentPattern)].length === 1;
  });
}

function validateJavaScriptRequiredPrintExpressions(code, instruction) {
  const printStart = /\bprint\s+/i.exec(instruction);
  if (!printStart) return true;

  const ordinal = '(?:first|second|third|fourth|fifth|\\d+(?:st|nd|rd|th))';
  const printPattern = new RegExp(
    `(?:^|,\\s*(?:(?:and|then)\\s+)?|\\bthen\\s+|\\band\\s+)(?:print\\s+)?(?:the\\s+)?(.+?)\\s+on\\s+the\\s+${ordinal}\\s+line`,
    'gi'
  );
  const printInstructions = instruction
    .slice(printStart.index + printStart[0].length)
    .replace(/^the\s+result\s+of\s+/i, '');
  const requiredExpressions = [...printInstructions.matchAll(printPattern)]
    .map(match => match[1]
      .replace(/^the\s+result\s+of\s+/i, '')
      .replace(/[.,;]$/, '')
      .trim());
  if (requiredExpressions.length === 0) return true;

  const source = stripComments(code, 'javascript');
  const printArguments = getJavaScriptConsoleLogArguments(source)
    .map(expression => expression.replace(/\btypeof\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g, 'typeof $1'))
    .map(expression => expression.replace(/\s+/g, ''));
  const normalizedRequirements = requiredExpressions.map(expression => expression.replace(/\s+/g, ''));

  return printArguments.length === normalizedRequirements.length &&
    printArguments.every((expression, index) => expression === normalizedRequirements[index]);
}

function getJavaScriptConsoleLogArguments(source) {
  const argumentsList = [];
  const calls = /\bconsole\.log\s*\(/g;
  let call;

  while ((call = calls.exec(source)) !== null) {
    const start = calls.lastIndex;
    let depth = 1;
    let quote = null;
    let escaped = false;

    for (let index = start; index < source.length; index++) {
      const character = source[index];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === quote) {
          quote = null;
        }
        continue;
      }

      if (character === '"' || character === "'" || character === '`') {
        quote = character;
      } else if (character === '(') {
        depth++;
      } else if (character === ')' && --depth === 0) {
        argumentsList.push(source.slice(start, index).trim());
        calls.lastIndex = index + 1;
        break;
      }
    }
  }

  return argumentsList;
}

function validatePythonRequiredPrintExpressions(code, instruction) {
  const requiredExpressions = parsePythonRequiredPrintExpressions(instruction);
  if (requiredExpressions.length === 0) return true;

  const source = cleanCode(code, 'python').replace(/\s+/g, '');
  return requiredExpressions.every(expression =>
    source.includes(`print(${expression.replace(/\s+/g, '')})`)
  );
}

function validateJavaScriptObjectDestructuring(code, instruction) {
  if (!/\bobject destructuring\b/i.test(instruction) ||
      !/\bextract\b[\s\S]*\binto variables\b/i.test(instruction)) {
    return true;
  }

  const source = stripComments(code, 'javascript');
  const declaration = /\b(?:const|let|var)\s*\{\s*([^{}]+)\s*\}\s*=\s*[A-Za-z_$][\w$]*/g;
  const destructuring = [...source.matchAll(declaration)]
    .map(match => match[1])
    .find(Boolean);
  if (!destructuring) return false;

  const variableNames = destructuring.split(',').map(binding => {
    const parts = binding.trim().split(/\s*:\s*/);
    return parts[parts.length - 1].trim();
  });
  if (variableNames.length < 2 || variableNames.some(name => !/^[A-Za-z_$][\w$]*$/.test(name))) {
    return false;
  }

  const printCalls = [...source.matchAll(/\bconsole\.log\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*;?/g)]
    .map(match => match[1]);
  return variableNames.every(name => printCalls.includes(name));
}

function parseInstructionVariableNames(instruction) {
  const patterns = [
    /\b(?:declare|create|initialize|set up)\s+(?:an?\s+)?(?:integer|int|double|float|string|str|boolean|bool|number|numeric)?\s*variable\s+(?:called|named)\s+([A-Za-z_]\w*)/gi,
    /\b(?:declare|create|initialize|set up)\s+(?:an?\s+)?(?:integer|int|double|float|string|str|boolean|bool|number|numeric)\s+variable\s+(?!called\b|named\b)([A-Za-z_]\w*)/gi,
    /\b(?:declare|create|initialize|set up)\s+(?:an?\s+)?variable\s+([A-Za-z_]\w*)\s*(?:=|\bwith\b|\band\b)/gi,
    /\bvariable\s+(?:called|named)\s+([A-Za-z_]\w*)/gi,
  ];
  const names = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(instruction)) !== null) {
      names.add(match[1]);
    }
  });

  const assignmentDeclarations = /\b(?:declare|create|initialize|set up)\s+(?:(?:one|two|three|four|five|\d+)\s+)?(?:(?:integer|int|double|float|string|str|boolean|bool|number|numeric)\s+)?variables?\s+([^.!?]+)/gi;
  let declaration;
  while ((declaration = assignmentDeclarations.exec(instruction)) !== null) {
    for (const match of declaration[1].matchAll(/\b([A-Za-z_]\w*)\s*=/g)) {
      names.add(match[1]);
    }
  }

  return [...names];
}

function usesDeclaredVariableInIfCondition(code, language, instruction) {
  const variableNames = parseInstructionVariableNames(instruction);
  if (variableNames.length === 0) return true;

  const source = cleanCode(code, language);
  const lang = (language || '').toLowerCase();
  const conditions = lang === 'python'
    ? [...source.matchAll(/\bif\s+([^:\n]+)\s*:/g)].map(match => match[1])
    : [...source.matchAll(/\bif\s*\(([^)]*)\)/g)].map(match => match[1]);

  return conditions.some(condition =>
    variableNames.every(name => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(condition))
  );
}

function validatesPrintedDeclaredVariables(code, language, instruction) {
  if (!/\bprint\s+(?:it|them|the\s+(?:variable|variables|value|values))\b/i.test(instruction)) {
    return true;
  }

  const variableNames = parseInstructionVariableNames(instruction);
  if (variableNames.length === 0) return true;

  const source = cleanCode(code, language);
  const printArguments = [...source.matchAll(/(?:\bprint|\.println|\.printf|\.log)\s*\(([^)]*)\)/g)]
    .map(match => match[1]);

  return variableNames.every(name => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const variablePattern = new RegExp(`\\b${escapedName}\\b`);
    return printArguments.some(argument => variablePattern.test(argument));
  });
}

// ─── hardcoding detection ────────────────────────────────────────

function isHardcoded(code, language, expectedOutput) {
  if (!expectedOutput) return false;

  const lang    = (language || '').toLowerCase();
  const trimmed = expectedOutput.trim();

  // Skip multi-line expected outputs — they are almost always computed
  if (trimmed.includes('\n')) return false;

  // Skip long strings — too risky to flag (could be a legitimately
  // short computed string that happens to match)
  if (trimmed.length > 40) return false;

  const rawLines = code.split('\n');
  const lines = rawLines.map(l => l.trim());

  // Escape special regex characters in the expected value
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // BUG FIX: tighten the print regex so it only matches when the
  // value is the SOLE argument — not part of an expression.
  let printPattern;
  if (lang === 'python') {
    printPattern = new RegExp(
      `^print\\s*\\(\\s*[f]?['"]?${escaped}['"]?\\s*\\)$`
    );
  } else {
    printPattern = new RegExp(
      `(?:console\\.log|System\\.out\\.println(?:ln)?)\\s*\\(\\s*['"]?${escaped}['"]?\\s*\\)\\s*;?$`
    );
  }

  for (let i = 0; i < lines.length; i++) {
    if (!printPattern.test(lines[i])) continue;
    if (isWithinControlFlowOrComputation(rawLines, i, lang)) {
      return false;
    }
    return true;
  }

  return false;
}

function isWithinControlFlowOrComputation(rawLines, index, lang) {
  const line = rawLines[index];
  const indent = line.match(/^\s*/)[0].length;

  for (let j = index - 1; j >= 0; j--) {
    const prevRaw = rawLines[j];
    const prevTrim = prevRaw.trim();
    if (!prevTrim) continue;

    if (lang === 'python') {
      const prevIndent = prevRaw.match(/^\s*/)[0].length;
      if (prevIndent < indent && /\b(if|elif|else|for|while|try|except|finally|def|class)\b.*:\s*$/.test(prevTrim)) {
        return true;
      }
      if (/\b(if|elif|else|for|while|try|except|finally|def|class)\b.*:\s*$/.test(prevTrim)) {
        return true;
      }
    } else {
      if (/\b(if|else if|else|for|while|switch|case|default|try|catch|finally)\b/.test(prevTrim)) {
        return true;
      }
      if (/\b(function|def|class|void|public|private|protected|static)\b/.test(prevTrim) && /\{\s*$/.test(prevTrim)) {
        return true;
      }
    }
  }

  return false;
}

// ─── syntax heuristics ───────────────────────────────────────────

function isObjectPropertyLikeLine(line) {
  const trimmed = line.trim();
  return (/^(?:[$A-Z_][\w$]*|["'][^"']+["']|\d+)\s*:\s*.+/.test(trimmed) ||
          /^(?:[$A-Z_][\w$]*|["'][^"']+["']|\d+)\s*,?\s*$/.test(trimmed) ||
          /^\w+\s*:\s*.+/.test(trimmed));
}

function countSyntaxErrors(code, language) {
  const lang     = (language || '').toLowerCase();
  const lines    = code.split('\n');
  const messages = [];
  let   count    = 0;

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const line    = rawLine.trim();

    // Skip blank lines, comment-only lines, import/package lines
    if (!line)                                  return;
    if (line.startsWith('#'))                   return;
    if (line.startsWith('//'))                  return;
    if (line.startsWith('import '))             return;
    if (line.startsWith('package '))            return;
    if (line.startsWith('@'))                   return; // BUG FIX: skip annotations

    if (lang === 'python') {
      // Missing colon after block-opening keywords
      if (
        /^(if|elif|else|for|while|def|class)\b.*[^:]$/.test(line) &&
        !line.endsWith('\\') &&
        !line.endsWith(',')  &&
        !line.endsWith('(')
      ) {
        messages.push(`Line ${lineNum}: missing colon at end of block statement`);
        count++;
      }
      // Mixed indentation
      if (/^\t+ /.test(rawLine) || /^ +\t/.test(rawLine)) {
        messages.push(`Line ${lineNum}: mixed tabs and spaces in indentation`);
        count++;
      }
    }

    if (lang === 'java' || lang === 'javascript') {
      // BUG FIX: skip lines that are only an opening or closing brace,
      // method signatures, or annotations — previously caused many false positives
      const isBlockStatement = /^(if|else|for|while|do|try|catch|finally|switch|class|function|interface|enum)\b/.test(line);
      const isMethodSig      = /^(?:(?:public|private|protected|static|final|abstract|synchronized)\s+)*(?:[\w<>\[\],.?]+\s+)+[\w$]+\s*\([^)]*\)\s*\{?$/.test(line);
      const isBraceOnly      = /^[{}]$/.test(line);
      const isPropertyLike   = isObjectPropertyLikeLine(line);

      if (
        !/[{};]$/.test(line)  &&
        !isBlockStatement      &&
        !isMethodSig           &&
        !isBraceOnly           &&
        !isPropertyLike        &&
        line.length > 3
      ) {
        messages.push(`Line ${lineNum}: possible missing semicolon`);
        count++;
      }
    }

    if (lang === 'java') {
      // Assignment instead of comparison in if condition
      if (/\bif\s*\([^)]*[^=!<>]=[^=][^)]*\)/.test(line)) {
        messages.push(`Line ${lineNum}: possible assignment (=) instead of equality (==) in condition`);
        count++;
      }
    }
  });

  return { count, messages };
}

// ─── main export ─────────────────────────────────────────────────

/**
 * validateCFG(code, language, requiredConstruct, expectedOutput, context)
 */
function validateCFG(code, language, requiredConstruct, expectedOutput, context = {}) {
  const feedback         = [];
  let   structuralErrors = 0;

  // 1. Required construct check
  const normalizedLanguage = (language || '').toLowerCase();
  const normalizedInstruction = context.instruction || '';
  const instructionRequiresDeclarationKeyword =
    normalizedLanguage !== 'javascript' ||
    !['let', 'const', 'var'].includes((requiredConstruct || '').toLowerCase()) ||
    new RegExp(`\\b${requiredConstruct}\\b`, 'i').test(normalizedInstruction);
  const enforcedConstruct = instructionRequiresDeclarationKeyword ? requiredConstruct : null;
  let constructUsed = isConstructUsed(code, language, enforcedConstruct);

  if (enforcedConstruct && !constructUsed) {
    structuralErrors++;
    const labels = {
      'for':      'a for loop',
      'while':    'a while loop',
      'if':       'an if statement',
      'def':      'a function definition (def)',
      'function': 'a function declaration',
      'void':     'a void method',
      'return':   'a return statement',
      'try':      'a try/catch block',
      'Scanner':  'a Scanner for user input'
    };
    const label = labels[enforcedConstruct] || `the \`${enforcedConstruct}\` construct`;
    feedback.push(
      `⚠ This task requires ${label}. ` +
      `Make sure you are actually using it, not just mentioning it in a comment or string.`
    );
  }

  if (language === 'Java' && context.concept === 'Variables') {
    const javaVariablesResult = validateJavaVariables(code, context.instruction || '');
    if (!javaVariablesResult.valid) {
      constructUsed = false;
      structuralErrors++;
      javaVariablesResult.feedback.forEach(msg => feedback.push(msg));
    }
  }

  if (
    (language || '').toLowerCase() === 'java' &&
    !validateJavaRequiredPrintExpressions(code, context.instruction || '')
  ) {
    constructUsed = false;
    structuralErrors++;
    feedback.push('⚠ This task requires printing the expressions specified in the instructions, using the instructed variables.');
  }

  if ((language || '').toLowerCase() === 'python') {
    const instruction = context.instruction || '';
    const assignmentsValid = validatePythonRequiredAssignments(code, instruction);
    const printExpressionsValid = validatePythonRequiredPrintExpressions(code, instruction);
    if (!assignmentsValid || !printExpressionsValid) {
      constructUsed = false;
      structuralErrors++;
      feedback.push(
        !assignmentsValid
          ? '⚠ This task requires assigning the instructed values and results to their named variables.'
          : '⚠ This task requires printing the expressions specified in the instructions.'
      );
    }
  }

  if ((language || '').toLowerCase() === 'javascript') {
    const instruction = context.instruction || '';
    const declarationsValid = validateJavaScriptRequiredDeclarations(code, instruction);
    const printExpressionsValid = validateJavaScriptRequiredPrintExpressions(code, instruction);
    if (!declarationsValid || !printExpressionsValid) {
      constructUsed = false;
      structuralErrors++;
      feedback.push(
        !declarationsValid
          ? '⚠ This task requires declaring the instructed JavaScript variable once with its required initial value.'
          : '⚠ This task requires printing the instructed expressions using the declared variables.'
      );
    }
  }

  if (
    (language || '').toLowerCase() === 'javascript' &&
    !validateJavaScriptObjectDestructuring(code, context.instruction || '')
  ) {
    constructUsed = false;
    structuralErrors++;
    feedback.push('⚠ This task requires destructuring the object and printing each extracted variable, not hardcoded values.');
  }

  const instructionRequiresIf = /\b(?:use|include|write|add)\s+(?:an?\s+)?if(?:\s*-\s*else|\s+and\s+else)?\b/i
    .test(context.instruction || '');
  if (
    (['if', 'if-else'].includes((requiredConstruct || '').toLowerCase()) || instructionRequiresIf) &&
    !usesDeclaredVariableInIfCondition(code, language, context.instruction || '')
  ) {
    constructUsed = false;
    structuralErrors++;
    feedback.push('⚠ This task requires using the instructed variable in the if condition, not replacing it with a literal value.');
  }

  if (!validatesPrintedDeclaredVariables(code, language, context.instruction || '')) {
    constructUsed = false;
    structuralErrors++;
    feedback.push('⚠ This task requires printing the instructed variable, not a hardcoded value.');
  }

  // 2. Hardcoding check
  // BUG FIX (ETC-01): this boolean was previously computed and used only to
  // increment structuralErrors/feedback locally — it was never returned from
  // this function, so server.js's finalCorrect calculation had no way to see
  // it and hardcoded submissions were silently accepted as correct. It is
  // now included in the returned object below.
  const hardcoded = isHardcoded(code, language, expectedOutput);

  if (hardcoded) {
    structuralErrors++;
    feedback.push(
      '⚠ It looks like you printed the answer directly without computing it. ' +
      'This submission will not be marked correct — use variables and operations to derive the result.'
    );
  }

  // 3. Syntax heuristics
  const { count: syntaxErrors, messages: syntaxMessages } =
    countSyntaxErrors(code, language);

  const syntaxFeedback = syntaxMessages.map(msg => `⚠ ${msg}`);
  syntaxFeedback.forEach(msg => feedback.push(msg));
  const structuralFeedback = feedback.filter(msg => !msg.startsWith('⚠ Line '));

  // 4. Positive feedback when everything is clean
  if (constructUsed && !hardcoded && syntaxErrors === 0) {
    feedback.push('✔ Code structure looks good.');
    structuralFeedback.push('✔ Code structure looks good.');
  }

  return {
    syntaxErrors,
    structuralErrors,
    feedback,
    structuralFeedback,
    syntaxFeedback,
    constructUsed,
    hardcoded
  };
}

module.exports = { validateCFG };