const assert = require('assert');
const { startInteractiveSession, writeToInteractiveSession, getInteractiveSessionOutput, removeInteractiveSession } = require('./runCode');

(async () => {
  const session = await startInteractiveSession({
    language: 'python',
    code: 'name = input(); print("Hello " + name)'
  });

  assert.ok(session.sessionId, 'expected a session id');

  await new Promise(resolve => setTimeout(resolve, 250));
  const inputResult = writeToInteractiveSession(session.sessionId, 'Ada');
  assert.strictEqual(inputResult.error, false, 'expected input to be accepted');

  await new Promise(resolve => setTimeout(resolve, 250));
  const outputResult = getInteractiveSessionOutput(session.sessionId);
  assert.match(outputResult.output, /Hello Ada/i, 'expected echoed output from stdin program');

  removeInteractiveSession(session.sessionId);
  console.log('runCode stdin regression test passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
