/**
 * utils/cfgValidator.js
 * ─────────────────────────────────────────────────────────────────
 * Rule-Based Simplified Context-Free Grammar (CFG) Validator
 *
 * What it does:
 *   1. Checks that the required programming construct is actually
 *      present in active code (not in comments or strings).
 *   2. Detects hardcoded output — answer printed literally instead
 *      of computed.
 *   3. Counts syntax errors via lightweight language-aware heuristics.
 *   4. Counts structural errors (missing construct, hardcoding).
 *
 * BUG FIXES vs original:
 *   - Python `while` pattern was wrong: `while\s*\(` never matches
 *     Python style `while condition:`.  Fixed to try both forms.
 *   - Hardcoded detection fired on multi-word / numeric outputs
 *     that appeared inside variable assignment lines, not just print
 *     calls.  The regex anchoring is now tighter.
 *   - Java syntax check emitted false-positive "missing semicolon"
 *     on annotation lines (@Override, @Test, etc.).
 *   - Syntax check now skips blank lines and import statements.
 *
 * Returns:
 *   { syntaxErrors, structuralErrors, feedback, constructUsed }
 */

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
  // Remove double-quoted, single-quoted, and template-literal string contents
  return code
    .replace(/`([^`\\]|\\.)*`/g, '``')         // JS template literals
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
      // Python: for <var(s)> in <iterable>:
      // Java/JavaScript: for (...) loops
      if (lang === 'python') {
        return /\bfor\b.+\bin\b/.test(cleaned);
      }
      return /\bfor\s*\(/.test(cleaned);

    case 'while':
      // BUG FIX: Python uses `while cond:` not `while (cond)`
      if (lang === 'python') {
        return /\bwhile\s+[^:]+:/.test(cleaned);
      }
      // Java / JavaScript
      return /\bwhile\s*\(/.test(cleaned);

    case 'if':
      if (lang === 'python') {
        return /\bif\s+[^:]+:/.test(cleaned);
      }
      return /\bif\s*\(/.test(cleaned);

    case 'def':
      return /\bdef\s+\w+\s*\(/.test(cleaned);

    // ── Java ────────────────────────────────────────────────────
    case 'void':
      return /\bvoid\s+\w+\s*\(/.test(cleaned);

    case 'return':
      return /\breturn\b/.test(cleaned);

    case 'try':
      return /\btry\s*\{/.test(cleaned);

    case 'Scanner':
      return /\bScanner\b/.test(cleaned);

    // ── JavaScript ──────────────────────────────────────────────
    case 'function':
      return (
        /\bfunction\s+\w+\s*\(/.test(cleaned)  ||
        /\bfunction\s*\(/.test(cleaned)         ||
        /\bconst\s+\w+\s*=\s*\(/.test(cleaned) ||   // arrow fn
        /\bconst\s+\w+\s*=\s*function/.test(cleaned)
      );

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

  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);

  // Escape special regex characters in the expected value
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // BUG FIX: tighten the print regex so it only matches when the
  // value is the SOLE argument — not part of an expression.
  let printPattern;
  if (lang === 'python') {
    // print("42")  or  print(42)  or  print('42')
    printPattern = new RegExp(
      `^print\\s*\\(\\s*[f]?['"]?${escaped}['"]?\\s*\\)$`
    );
  } else {
    // console.log("42")  or  System.out.println("42")  (nothing else on line)
    printPattern = new RegExp(
      `(?:console\\.log|System\\.out\\.println(?:ln)?)\\s*\\(\\s*['"]?${escaped}['"]?\\s*\\)\\s*;?$`
    );
  }

  return lines.some(line => printPattern.test(line));
}

// ─── syntax heuristics ───────────────────────────────────────────

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

      if (
        !/[{};]$/.test(line)  &&
        !isBlockStatement      &&
        !isMethodSig           &&
        !isBraceOnly           &&
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
  const hardcoded = isHardcoded(code, language, expectedOutput);

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