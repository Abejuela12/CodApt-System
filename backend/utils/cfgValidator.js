

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
      const isMethodSig      = /\)\s*\{?\s*$/.test(line) && /\(/.test(line);
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
 * validateCFG(code, language, requiredConstruct, expectedOutput)
 */
function validateCFG(code, language, requiredConstruct, expectedOutput) {
  const feedback         = [];
  let   structuralErrors = 0;

  // 1. Required construct check
  const constructUsed = isConstructUsed(code, language, requiredConstruct);

  if (requiredConstruct && !constructUsed) {
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
    const label = labels[requiredConstruct] || `the \`${requiredConstruct}\` construct`;
    feedback.push(
      `⚠ This task requires ${label}. ` +
      `Make sure you are actually using it, not just mentioning it in a comment or string.`
    );
  }

  // 2. Hardcoding check
  const hardcoded = isHardcoded(code, language, expectedOutput, constructUsed);

  if (hardcoded) {
    structuralErrors++;
    feedback.push(
      '⚠ It looks like you printed the answer directly without computing it. ' +
      'Try using variables and operations to derive the result.'
    );
  }

  // 3. Syntax heuristics
  const { count: syntaxErrors, messages: syntaxMessages } =
    countSyntaxErrors(code, language);

  syntaxMessages.forEach(msg => feedback.push(`⚠ Syntax: ${msg}`));

  // 4. Positive feedback when everything is clean
  if (constructUsed && !hardcoded && syntaxErrors === 0) {
    feedback.push('✔ Code structure looks good.');
  }

  return { syntaxErrors, structuralErrors, feedback, constructUsed };
}

module.exports = { validateCFG };