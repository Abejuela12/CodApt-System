const { startInteractiveSession, writeToInteractiveSession, getInteractiveSessionOutput, removeInteractiveSession } = require('./utils/runCode');

(async () => {
  const s = await startInteractiveSession({ language: 'python', code: 'name=input(); print("Hello " + name)' });
  console.log('started', s);
  setTimeout(() => {
    const r = writeToInteractiveSession(s.sessionId, 'Ada');
    console.log('write', r);
  }, 250);
  setTimeout(() => {
    console.log('poll', getInteractiveSessionOutput(s.sessionId));
    removeInteractiveSession(s.sessionId);
  }, 1000);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
