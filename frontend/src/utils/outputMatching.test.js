import assert from 'node:assert/strict';
import test from 'node:test';
import { isOutputMatch, removePythonInputPrompts } from './outputMatching.js';

test('removes every Python input prompt before checking output', () => {
  const code = 'name = input("name: ")\nage = int(input("age: "))\nprint(f"Name: {name}, Age: {age}")';
  const terminalOutput = 'name: age: Name: Maria, Age: 21';
  const outputForChecking = removePythonInputPrompts(terminalOutput, code);

  assert.equal(outputForChecking, 'Name: Maria, Age: 21');
  assert.equal(isOutputMatch(outputForChecking, 'Name: Maria, Age: 21'), true);
});

test('removes prompts when they appear on separate lines', () => {
  const code = 'name = input("name: ")\nage = input("age: ")';

  assert.equal(
    removePythonInputPrompts('name: \nage: \nMaria, 21', code),
    '\n\nMaria, 21'
  );
});

test('does not remove unrelated output or user-entered values', () => {
  const code = 'name = input("name: ")';

  assert.equal(
    removePythonInputPrompts('Unexpected output\nname: Maria\nHello, Maria!', code),
    'Unexpected output\nMaria\nHello, Maria!'
  );
});

test('does not remove a prompt that is not present in the code', () => {
  assert.equal(
    removePythonInputPrompts('Enter your name: Hello, Juan!', 'name = input()'),
    'Enter your name: Hello, Juan!'
  );
});
