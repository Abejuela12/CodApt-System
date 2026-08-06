import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import './Split.css';
import { calculateLanguageProgress, getLanguageLevel } from "../../utils/levelUtils";
import { getHintLevel } from "../../utils/hintUtils";
import { recommendNextTask } from "../../utils/recommendNextTask";
import { normalizeOutput, normalizeTerminalOutput, extractEffectiveOutput, isOutputMatch } from "../../utils/outputMatching";
import { API_BASE_URL } from "../../config";

// ── Mastery fanfare using Web Audio API (no external files needed) ──
function playMasterySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // A short triumphant ascending arpeggio: C5 E5 G5 C6
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.18 },
      { freq: 659.25, start: 0.15, dur: 0.18 },
      { freq: 783.99, start: 0.30, dur: 0.18 },
      { freq: 1046.5, start: 0.45, dur: 0.40 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    // Sparkle: high shimmer chord
    [1318.5, 1567.98].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.55);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc.start(ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 1.15);
    });

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    // Silently ignore — audio may be blocked before user interaction
  }
}

function getStarterCode(language, task) {
  const id    = task?.id    || '';
  const title = task?.title || '';
  if (language === 'Python')     return `# Task: ${title}\n\n# Write your code here:\nprint("Replace this line!")`;
  if (language === 'Java')       return `// Task: ${title}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here:\n        System.out.println("Replace this line!");\n    }\n}`;
  if (language === 'JavaScript') return `// Task: ${title}\n\n// Write your code here:\nconsole.log("Replace this line!");`;
  return '// Write your code here';
}

function monacoLang(language) {
  return { Python: 'python', Java: 'java', JavaScript: 'javascript' }[language] || 'plaintext';
}

function fileExt(language) {
  return { Python: 'py', Java: 'java', JavaScript: 'js' }[language] || 'txt';
}

function mapLevelLabel(serverLevel) {
  return { Easy: 'Beginner', Intermediate: 'Intermediate', Hard: 'Advanced' }[serverLevel] || serverLevel || 'Beginner';
}

function getLevelColors(serverLevel) {
  if (serverLevel === 'Hard')         return { bg: '#22c55e20', text: '#22c55e' };
  if (serverLevel === 'Intermediate') return { bg: '#facc1520', text: '#facc15' };
  return                                     { bg: '#60a5fa20', text: '#60a5fa' };
}

function buildRichExplanation(rec, assessmentData) {
  if (!rec) return '';
  const { correct, attempts, syntaxErrors, structuralErrors, level } = assessmentData;
  const diff    = rec.difficulty;
  const concept = rec.concept;
  const parts   = [];

  if (!correct) {
    parts.push(`You haven't solved the current task yet — we're keeping the difficulty similar so you can reinforce this concept before advancing.`);
  } else if (structuralErrors > 0) {
    parts.push(`Your output was correct but ${structuralErrors} structural issue${structuralErrors > 1 ? 's were' : ' was'} detected. This exercise focuses on ${concept} to strengthen your code structure.`);
  } else if (syntaxErrors > 0) {
    parts.push(`A few syntax patterns to watch. This ${diff} ${concept} exercise will help you practise clean, correct code.`);
  } else if (attempts > 3) {
    parts.push(`It took ${attempts} attempts — that's fine! This next exercise revisits ${concept} at a ${diff} level to build your confidence.`);
  } else if (level === 'Hard') {
    parts.push(`Great performance! You've been classified as Advanced, so we're pushing you to a ${diff} ${concept} challenge.`);
  } else {
    parts.push(`Solid work. This ${diff} ${concept} exercise is the natural next step based on your current performance profile.`);
  }

  const pct = Math.round((rec.similarityScore || 0) * 100);
  parts.push(`It scored ${pct}% similarity to your learner profile across topic, difficulty, and required constructs.`);
  return parts.join(' ');
}

const CodeEditor = ({
  language, concept, level,
  onBack, onProfileClick, onHomeClick, onLogout,
  onCompleteTask, userData, currentTaskIndex, onNextTask
}) => {
  const [code, setCode]           = useState('');
  const [tasks, setTasks]         = useState([]);
  const [output, setOutput]       = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalSessionId, setTerminalSessionId] = useState(null);
  const [terminalStatus, setTerminalStatus] = useState('idle');
  const terminalContainerRef = useRef(null);
  const xtermRef = useRef(null);
  const terminalBufferRef = useRef('');
  const terminalSessionIdRef = useRef(null);
  const [currentTier, setCurrentTier]     = useState('Beginner');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showMastery, setShowMastery]       = useState(false);
  const [tasksLoading, setTasksLoading]     = useState(true);
  const [attempts, setAttempts]   = useState(0);
  const [startTime]               = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintUsed, setHintUsed]   = useState(false);
  const [showHint, setShowHint]   = useState(false);
  const [assessmentResult, setAssessmentResult] = useState({
    correct: false, attempts: 0, timeSpent: 0,
    feedback: [], cfgFeedback: [],
    syntaxErrors: 0, structuralErrors: 0,
    score: 0, level: 'Easy', recommendation: '',
    cosineRecommendation: null
  });

  const hintRef = useRef(null);
  const task    = tasks.length > 0 ? tasks[currentTaskIndex] : null;

  const hintsObj = task?.hints || {};
  const hintText =
    hintLevel === 1 ? hintsObj.level1 :
    hintLevel === 2 ? hintsObj.level2 :
    hintLevel >= 3  ? hintsObj.level3 : 'No hint available yet.';

  const handleHint = () => {
    const lvl = getHintLevel(attempts, assessmentResult.level || 'Easy');
    setHintUsed(true);
    setHintLevel(lvl);
    setShowHint(true);
    setTimeout(() => hintRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const calculateScore = (att, time, correct) => {
    if (!correct) return 0;
    return Math.max(100 - (att - 1) * 10 - Math.floor(time / 30) * 5, 20);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('⏳ Running...');
    try {
      if (terminalSessionId) {
        await fetch(`${API_BASE_URL}/api/terminal/${terminalSessionId}`, { method: 'DELETE' });
      }
      const res  = await fetch(`${API_BASE_URL}/api/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      const data = await res.json();
      const outputText = data.output || '';
      setTerminalSessionId(data.sessionId || null);
      terminalSessionIdRef.current = data.sessionId || null;
      setTerminalStatus(data.status || 'idle');
      setOutput(outputText);
      terminalBufferRef.current = '';
      if (xtermRef.current) {
        xtermRef.current.clear();
        if (outputText) {
          xtermRef.current.write(outputText.replace(/\n/g, '\r\n'));
        }
        xtermRef.current.focus();
      }
    } catch {
      setOutput('❌ Could not reach the backend. Make sure your server is running.');
      xtermRef.current?.writeln('❌ Could not reach the backend. Make sure your server is running.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleXtermData = async (data) => {
    if (!xtermRef.current) return;
    const currentBuffer = terminalBufferRef.current;
    if (data === '\r') {
      const value = currentBuffer.trimEnd();
      terminalBufferRef.current = '';
      xtermRef.current.write('\r\n');
      if (!value) {
        return;
      }
      try {
        const sessionId = terminalSessionIdRef.current;
        if (!sessionId) {
          xtermRef.current.writeln('❌ No active terminal session. Press Run again to restart.');
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/terminal/input`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, input: value })
        });
        const result = await res.json().catch(() => null);
        if (!res.ok) {
          const message = result?.message || result?.output || `HTTP ${res.status}`;
          xtermRef.current.writeln(`❌ Input request failed: ${message}`);
          return;
        }
        if (result?.output) {
          xtermRef.current.write(result.output.replace(/\n/g, '\r\n'));
          setOutput(prev => prev ? prev + result.output : result.output);
        }
        if (result?.status && result.status !== terminalStatus) {
          setTerminalStatus(result.status);
        }
      } catch (err) {
        console.error('Terminal input error:', err);
        xtermRef.current.writeln(`❌ Failed to send input: ${err.message}`);
      }
    } else if (data === '\u007F') {
      if (currentBuffer.length > 0) {
        terminalBufferRef.current = currentBuffer.slice(0, -1);
        xtermRef.current.write('\b \b');
      }
    } else {
      terminalBufferRef.current += data;
      xtermRef.current.write(data);
    }
  };

  const handleSubmit = async () => {
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    const newAttempts      = attempts + 1;
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      const currentOutput = output || '';
      let actualOutput = currentOutput;
      let currentStatus = terminalStatus || 'idle';
      let currentSessionId = terminalSessionId;
      let runtimeError = false;

      if (!terminalSessionId) {
        const runRes  = await fetch(`${API_BASE_URL}/api/run`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code })
        });
        const runData = await runRes.json();
        currentSessionId = runData.sessionId || null;
        setTerminalSessionId(currentSessionId);
        terminalSessionIdRef.current = currentSessionId;
        currentStatus = runData.status || currentStatus;
        actualOutput = runData.output || currentOutput;
        runtimeError = runData.error || currentStatus === 'error';
        setTerminalStatus(currentStatus);
        setOutput(actualOutput);
        if (xtermRef.current) {
          if (actualOutput) {
            xtermRef.current.write(actualOutput.replace(/\n/g, '\r\n'));
          }
          xtermRef.current.focus();
        }
      } else {
        actualOutput = currentOutput;
        runtimeError = currentStatus === 'error';
      }

      setTerminalStatus(currentStatus);
      setOutput(actualOutput);

      if (runtimeError) {
        const score = calculateScore(newAttempts, timeSpentSeconds, false);
        setAssessmentResult({
          correct: false, attempts: newAttempts, timeSpent: timeSpentSeconds,
          feedback: [`⚠ Runtime error: ${actualOutput}`],
          cfgFeedback: [], syntaxErrors: 1, structuralErrors: 0,
          output: actualOutput, score, level: 'Easy',
          expected: task.expected_output || '',
          recommendation: recommendNextTask(newAttempts, timeSpentSeconds, false, currentTaskIndex) || 'Keep practising!',
          cosineRecommendation: null,
          nextTaskIndex: currentTaskIndex
        });
        setAttempts(newAttempts);
        setTimeSpent(timeSpentSeconds);
        setShowAssessment(true);
        setIsSubmitting(false);
        return;
      }

      const expected  = normalizeOutput(task.expected_output || '');
      const actualRaw = normalizeTerminalOutput(actualOutput);
      const actual    = extractEffectiveOutput(actualRaw, expected);
      const isCorrect = isOutputMatch(actualOutput, task.expected_output || '');

      const submitRes  = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?.id ?? null,
          problemId: task.id, language, concept, code,
          attempts: newAttempts, timeSpent: timeSpentSeconds,
          isCorrect, hintUsed
        })
      });
      const submitData = await submitRes.json();
      console.log('✅ Backend Response:', submitData);

      // Require agreement between server and client before treating as correct.
      // Some mismatches can occur (server-side CFG checks, normalization differences).
      const serverCorrect        = submitData.correct === true;
      const serverConstructUsed  = submitData.constructUsed === true;
      const finalCorrect         = serverCorrect && isCorrect && serverConstructUsed;
      if (!serverCorrect && isCorrect) {
        console.warn('Submit mismatch: local output match but server did not mark correct', { problemId: task?.id, userId: userData?.id });
      }
      const cfgFeedback          = submitData.cfgFeedback      || [];
      const syntaxErrors         = submitData.syntaxErrors     ?? 0;
      const structuralErrors     = submitData.structuralErrors ?? 0;
      const backendLevel         = submitData.level            || 'Easy';
      const nextTier             = submitData.nextTier         || 'Beginner';
      setCurrentTier(nextTier);
      const cosineRecommendation = submitData.recommendation   || null;
      const isMastered           = submitData.isMastered       || false;
      const score                = calculateScore(newAttempts, timeSpentSeconds, finalCorrect);
      const recommendationText   = cosineRecommendation?.title
        ? `${cosineRecommendation.title} • ${cosineRecommendation.concept} • ${cosineRecommendation.difficulty}`
        : (rec || 'Keep practising!');

      const feedback = [];
      if (!isCorrect) {
        feedback.push(`Expected: "${expected}"`);
        feedback.push(`Your output: "${actual}"`);
      } else {
        feedback.push('✔ Output matches the expected result.');
      }
      cfgFeedback.forEach(msg => feedback.push(msg));

      const rec = recommendNextTask(newAttempts, timeSpentSeconds, finalCorrect, currentTaskIndex);

      const enrichedRecommendation = cosineRecommendation
        ? { ...cosineRecommendation, explanation: buildRichExplanation(cosineRecommendation, { correct: finalCorrect, attempts: newAttempts, syntaxErrors, structuralErrors, level: backendLevel }) }
        : null;

      const isLastTask    = currentTaskIndex >= tasks.length - 1;
      const nextTaskIndex = finalCorrect ? (isLastTask ? 'Complete!' : currentTaskIndex + 1) : currentTaskIndex;

      setAssessmentResult({
        correct: finalCorrect, attempts: newAttempts, timeSpent: timeSpentSeconds,
        feedback, cfgFeedback, syntaxErrors, structuralErrors,
        output: actualOutput, score, level: backendLevel,
        expected: task.expected_output || '',
        recommendation: recommendationText,
        cosineRecommendation: enrichedRecommendation,
        nextTaskIndex,
      });

      setAttempts(newAttempts);
      setTimeSpent(timeSpentSeconds);
      if (finalCorrect) onCompleteTask(language, concept, currentTaskIndex + 1);

      // Show mastery celebration whenever the last task is solved correctly,
      // regardless of what the backend isMastered flag says (DB timing can lag).
      if (finalCorrect && nextTaskIndex === 'Complete!') {
        playMasterySound();
        setShowMastery(true);
      } else {
        setShowAssessment(true);
      }

    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('Submit failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/problems/${language}/${concept}/${level}?tier=${currentTier}`);
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.log('❌ Failed to load DB tasks', err);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [language, concept, level, currentTier]);

  useEffect(() => {
    if (!task) return;
    setCode(getStarterCode(language, task));
    setOutput('');
    setTerminalSessionId(null);
    terminalSessionIdRef.current = null;
    setTerminalStatus('idle');
    terminalBufferRef.current = '';
    setAttempts(0);
    setTimeSpent(0);
    setShowHint(false);
    setHintLevel(0);
    setHintUsed(false);
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  }, [currentTaskIndex, tasks, language]);

  useEffect(() => {
    if (xtermRef.current || !terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      disableStdin: false,
      theme: { background: '#010409', foreground: '#d1d5db', cursor: '#d1d5db' },
      fontFamily: 'monospace',
      fontSize: 14,
      cols: 80,
      rows: 20,
      scrollback: 1000,
    });

    term.open(terminalContainerRef.current);
    term.focus();
    term.onData(handleXtermData);
    xtermRef.current = term;

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!terminalSessionId) return;

    const intervalId = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/terminal/${terminalSessionId}`);
        const data = await res.json();
        if (data.output && xtermRef.current) {
          xtermRef.current.write(data.output.replace(/\n/g, '\r\n'));
          setOutput(prev => prev ? prev + data.output : data.output);
        }
        if (data.status !== terminalStatus) {
          setTerminalStatus(data.status || 'idle');
        }
      } catch {
        setTerminalStatus('error');
      }
    }, 400);

    return () => window.clearInterval(intervalId);
  }, [terminalSessionId, terminalStatus]);

  const btnBase  = { padding: '8px 20px', borderRadius: '8px', fontWeight: '900', fontSize: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' };
  const btnHover = e => { e.target.style.transform = 'scale(1.05)'; e.target.style.opacity = '0.9'; };
  const btnLeave = e => { e.target.style.transform = 'scale(1)';    e.target.style.opacity = '1'; };

  const displayLevel = mapLevelLabel(assessmentResult.level);
  const levelColors  = getLevelColors(assessmentResult.level);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#0d1117', color:'white', fontFamily:'sans-serif' }}>

      {/* ── Navbar ── */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 50px', backgroundColor:'white', borderBottom:'1px solid #e5e7eb', flexShrink:0, minHeight:'45px', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <img src="/CODAPT_LOGO.png" alt="CodApt Logo" style={{ height:'45px', width:'auto', cursor:'pointer' }} onClick={onHomeClick} />
          <span style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a8a' }}>{language?.toUpperCase()} / {concept}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ backgroundColor:'#48a859', color:'white', padding:'4px 16px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold' }}>
            {userData?.name || 'Student'}
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #374151', padding:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', backgroundColor:'#ffffff' }} onClick={onProfileClick}>
              {userData?.photo
                ? <img src={userData.photo} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
            </div>
            <div className="unifiedDropdown">
              <div className="dropdownArrow"/>
              <div className="dropdownItem" onClick={onProfileClick}>Profile</div>
              <div className="dropdownItem" style={{ color:'#f87171' }} onClick={onLogout}>Logout</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Split style={{ display:'flex', flexDirection:'row', width:'100%', height:'100%' }} sizes={[45,55]} minSize={200} gutterSize={12} direction="horizontal" gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'col-resize' })}>

          {/* Left Panel */}
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <Split style={{ display:'flex', flexDirection:'column', height:'100%' }} sizes={[85,15]} minSize={50} gutterSize={12} direction="vertical" gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'row-resize' })}>
              <aside style={{ display:'flex', flexDirection:'column', backgroundColor:'#0a0e17', borderRight:'1px solid #21262d', height:'100%', overflow:'hidden' }}>
                <div style={{ padding:'8px 24px', background:'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', color:'white', fontWeight:'700', fontSize:'16px', flexShrink:0 }}>LESSON</div>
                <div style={{ flex:1, padding:'32px 24px', overflow:'auto', lineHeight:'1.7' }}>
                  {tasksLoading ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'16px', animation:'pulse 1.5s ease-in-out infinite' }}>
                      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                      <div style={{ height:'32px', width:'70%', background:'#1e293b', borderRadius:'8px' }}/>
                      <div style={{ height:'14px', width:'30%', background:'#1e293b', borderRadius:'6px' }}/>
                      <div style={{ height:'80px', background:'#1e293b', borderRadius:'12px' }}/>
                      <div style={{ height:'120px', background:'#1e293b', borderRadius:'12px' }}/>
                      <div style={{ height:'60px', background:'#1e293b', borderRadius:'10px' }}/>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize:'28px', fontWeight:'800', color:'#f8fafc', marginBottom:'8px' }}>
                        {String(currentTaskIndex + 1).padStart(2,'0')}. {task?.title || '—'}
                      </div>
                      <div style={{ color:'#60a5fa', fontSize:'14px', fontWeight:'600', marginBottom:'24px', padding:'6px 12px', backgroundColor:'rgba(96,165,250,0.1)', borderRadius:'6px', display:'inline-block', border:'1px solid rgba(96,165,250,0.3)' }}>
                        #{concept}
                      </div>
                      {task?.explanation && (
                        <div style={{ fontSize:'16px', color:'#e2e8f0', lineHeight:'1.7', marginBottom:'24px' }} dangerouslySetInnerHTML={{ __html: task.explanation }} />
                      )}
                      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,0.1) 0%,rgba(99,102,241,0.1) 100%)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'12px', padding:'24px', marginBottom:'24px' }}>
                        <h3 style={{ fontSize:'20px', fontWeight:'700', color:'#3b82f6', margin:'0 0 16px 0' }}>Instructions</h3>
                        <div style={{ fontSize:'16px', color:'#f1f5f9', lineHeight:'1.7', whiteSpace:'pre-line' }}>{task?.instruction || '—'}</div>
                      </div>
                      <div style={{ backgroundColor:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:'10px', padding:'20px' }}>
                        <div style={{ color:'#22c55e', fontWeight:'700', fontSize:'16px', marginBottom:'12px' }}>✅ Expected Output</div>
                        <pre style={{ backgroundColor:'#22c55e20', padding:'12px 20px', borderRadius:'8px', fontFamily:'monospace', color:'#22c55e', fontSize:'15px', fontWeight:'500', margin:0, whiteSpace:'pre-wrap' }}>
                          {task?.expected_output || '—'}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </aside>

              {/* Hint Panel */}
              <div style={{ backgroundColor:'#0d1117', borderRight:'1px solid #30363d', overflow:'hidden' }}>
                <div style={{ padding:'10px 12px', fontSize:'12px', fontWeight:'600', backgroundColor:'#161b22', borderBottom:'1px solid #30363d', color:'#8b949e', flexShrink:0 }}>
                  💡 HELP
                </div>
                <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  <button onClick={handleHint}
                    style={{ width:'100%', padding:'10px 12px', backgroundColor:'#0d1117', border:'1px solid #373a40', borderRadius:'6px', color:'#8b949e', fontWeight:'500', cursor:'pointer', fontSize:'13px' }}
                    onMouseEnter={e => { e.target.style.backgroundColor='#161b22'; e.target.style.borderColor='#58a6ff'; e.target.style.color='#58a6ff'; }}
                    onMouseLeave={e => { e.target.style.backgroundColor='#0d1117'; e.target.style.borderColor='#373a40'; e.target.style.color='#8b949e'; }}
                  >Show Hint</button>
                  {showHint && (
                    <div ref={hintRef} style={{ marginTop:'10px', padding:'10px', background:'#161b22', borderRadius:'6px', fontSize:'13px', color:'#c9d1d9' }}>
                      {hintText}
                    </div>
                  )}
                </div>
              </div>
            </Split>
          </div>

          {/* Right Panel */}
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <Split style={{ display:'flex', flexDirection:'column', height:'100%' }} sizes={[65,35]} minSize={100} gutterSize={12} direction="vertical" gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'row-resize' })}>
              <div style={{ display:'flex', flexDirection:'column', position:'relative', minHeight:0, backgroundColor:'white' }}>
                <div style={{ backgroundColor:'#1e3a8a', padding:'8px 16px', fontSize:'14px', fontWeight:'bold', color:'#dbeafe', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                  <span>{concept}.{fileExt(language)}</span>
                </div>
                <div style={{ flex:1, minHeight:0 }}>
                  <Editor
                    key={currentTaskIndex}
                    height="100%"
                    language={monacoLang(language)}
                    theme="light"
                    value={code}
                    options={{ minimap:{enabled:false}, fontSize:14, lineNumbers:'on', scrollBeyondLastLine:false }}
                    onChange={val => setCode(val || '')}
                  />
                  <div style={{ position:'absolute', bottom:'16px', right:'16px', display:'flex', gap:'12px', zIndex:10 }}>
                    <button onClick={handleRun} disabled={isRunning} onMouseEnter={btnHover} onMouseLeave={btnLeave}
                      style={{ ...btnBase, backgroundColor: isRunning ? '#6b7280' : '#facc15', color:'black' }}>
                      {isRunning ? '⏳ Running...' : '▶ RUN'}
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} onMouseEnter={btnHover} onMouseLeave={btnLeave}
                      style={{ ...btnBase, backgroundColor: isSubmitting ? '#6b7280' : '#3b82f6', color:'white' }}>
                      {isSubmitting ? '⏳ Analysing...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', backgroundColor:'#010409', borderTop:'4px solid #161b22', minHeight:0 }}>
                <div style={{ backgroundColor:'#0d1117', padding:'8px 16px', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', color:'#9ca3af', flexShrink:0 }}>Terminal</div>
                <div
                  ref={terminalContainerRef}
                  onClick={() => xtermRef.current?.focus()}
                  style={{ flex:1, backgroundColor:'#010409', borderRadius:'0 0 0 0', overflow:'hidden', cursor:'text', minHeight:'220px' }}
                />
              </div>
            </Split>
          </div>
        </Split>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor:'#1e3a8a', padding:'8px 24px', display:'flex', justifyContent:'flex-end', gap:'12px', borderTop:'1px solid black', flexShrink:0 }}>
        <button onClick={onBack} onMouseEnter={btnHover} onMouseLeave={btnLeave}
          style={{ ...btnBase, padding:'4px 32px', backgroundColor:'#0d1117', color:'white', border:'1px solid #4b5563', fontWeight:'bold', fontSize:'14px' }}>
          Back
        </button>
      </footer>

      {/* ── Assessment Modal ── */}
      {showAssessment && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
          <div style={{ width:'580px', backgroundColor:'#0f172a', borderRadius:'16px', border:'1px solid #334155', color:'white', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', fontWeight:'700' }}>
              <span>{concept} • {level}</span>
              <span onClick={() => setShowAssessment(false)} style={{ cursor:'pointer', fontSize:'18px' }}>✕</span>
            </div>

            <div style={{ padding:'18px 20px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'18px', fontWeight:'700', color: assessmentResult.correct ? '#4ade80' : '#ef4444' }}>
                  {assessmentResult.correct ? '✔ Correct' : '✗ Incorrect'}
                </span>
                <span style={{ padding:'6px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:'700', backgroundColor: levelColors.bg, color: levelColors.text, border:`1px solid ${levelColors.text}40` }}>
                  {displayLevel}
                </span>
              </div>
              <div style={{ marginTop:'6px', fontSize:'12px', color:'#64748b' }}>Classified by performance indicators (attempts, time, error counts)</div>
              <div style={{ marginTop:'8px', fontSize:'13px', color:'#94a3b8' }}>Language: <span style={{ color:'#60a5fa', fontWeight:'600' }}>{language}</span></div>

              <div style={{ marginTop:'14px', padding:'14px', backgroundColor:'#020617', border:'1px solid #334155', borderRadius:'10px' }}>
                <p style={{ fontSize:'13px', fontWeight:'700', color:'#60a5fa', marginBottom:'8px' }}>Feedback Analysis</p>
                {assessmentResult.feedback?.length > 0
                  ? assessmentResult.feedback.map((msg, i) => <p key={i} style={{ fontSize:'13px', color:'#e2e8f0', marginBottom:'4px' }}>• {msg}</p>)
                  : <p style={{ fontSize:'13px', color:'#94a3b8' }}>No issues detected.</p>
                }
              </div>

              <div style={{ marginTop:'10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div style={{ padding:'10px 14px', borderRadius:'8px', backgroundColor: assessmentResult.syntaxErrors > 0 ? '#450a0a' : '#052e16', border:`1px solid ${assessmentResult.syntaxErrors > 0 ? '#ef4444' : '#16a34a'}` }}>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'2px' }}>Syntax Errors</div>
                  <div style={{ fontWeight:'700', fontSize:'20px', color: assessmentResult.syntaxErrors > 0 ? '#ef4444' : '#4ade80' }}>{assessmentResult.syntaxErrors}</div>
                </div>
                <div style={{ padding:'10px 14px', borderRadius:'8px', backgroundColor: assessmentResult.structuralErrors > 0 ? '#451a03' : '#052e16', border:`1px solid ${assessmentResult.structuralErrors > 0 ? '#f97316' : '#16a34a'}` }}>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'2px' }}>Structural Errors</div>
                  <div style={{ fontWeight:'700', fontSize:'20px', color: assessmentResult.structuralErrors > 0 ? '#f97316' : '#4ade80' }}>{assessmentResult.structuralErrors}</div>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:'1px solid #334155', marginTop:'18px' }}>
              <div style={{ padding:'14px', textAlign:'center' }}>
                <div style={{ fontSize:'12px', color:'#94a3b8' }}>Attempts</div>
                <div style={{ color:'#4ade80', fontWeight:'700' }}>{assessmentResult.attempts}</div>
              </div>
              <div style={{ padding:'14px', textAlign:'center', borderLeft:'1px solid #334155' }}>
                <div style={{ fontSize:'12px', color:'#94a3b8' }}>Time</div>
                <div style={{ color:'#4ade80', fontWeight:'700' }}>{assessmentResult.timeSpent}s</div>
              </div>
              <div style={{ padding:'14px', textAlign:'center', borderLeft:'1px solid #334155' }}>
                <div style={{ fontSize:'12px', color:'#94a3b8' }}>Score</div>
                <div style={{ color:'#facc15', fontWeight:'800' }}>{assessmentResult.score}</div>
              </div>
            </div>

            <div style={{ padding:'0 20px 4px' }}>
              {assessmentResult.cosineRecommendation ? (
                <div style={{ backgroundColor:'#0f2744', border:'1px solid #1e40af', borderRadius:'10px', padding:'14px 16px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#60a5fa', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>🎯 Recommended Next Exercise</div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#f1f5f9', marginBottom:'8px' }}>{assessmentResult.cosineRecommendation.title}</div>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#1e3a8a', color:'#93c5fd', fontWeight:'600' }}>{assessmentResult.cosineRecommendation.language}</span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#14532d', color:'#86efac', fontWeight:'600' }}>{assessmentResult.cosineRecommendation.concept}</span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#3f1a00', color:'#fdba74', fontWeight:'600' }}>{assessmentResult.cosineRecommendation.difficulty}</span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#1e293b', color:'#94a3b8', fontWeight:'600' }}>{Math.round((assessmentResult.cosineRecommendation.similarityScore || 0) * 100)}% match</span>
                  </div>
                  <div style={{ backgroundColor:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:'8px', padding:'10px 12px' }}>
                    <div style={{ fontSize:'11px', color:'#60a5fa', fontWeight:'700', marginBottom:'4px' }}>WHY THIS EXERCISE?</div>
                    <div style={{ fontSize:'12px', color:'#cbd5e1', lineHeight:'1.6' }}>{assessmentResult.cosineRecommendation.explanation}</div>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'10px', padding:'12px 14px', textAlign:'left' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#60a5fa', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Recommendation</div>
                  <div style={{ fontSize:'13px', color:'#e2e8f0', lineHeight:'1.6' }}>
                    {assessmentResult.recommendation || 'Keep practising!'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding:'16px 20px 20px', textAlign:'center' }}>
              <button
                onClick={() => {
                  setShowAssessment(false);
                  // ONLY advance when correct — closing modal on retry keeps the user on the same task
                  if (assessmentResult.correct && typeof assessmentResult.nextTaskIndex === 'number') {
                    onNextTask?.(assessmentResult.nextTaskIndex);
                  }
                }}
                style={{ padding:'10px 28px', background: assessmentResult.correct ? '#22c55e' : '#3b82f6', border:'none', borderRadius:'8px', color:'white', fontWeight:'700', cursor:'pointer' }}
              >
                {assessmentResult.correct ? 'Next Task →' : '↩ Retry Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mastery Celebration Modal — fires IN the editor before going back ── */}
      {showMastery && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.88)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 }}>
          {/* floating stars */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            {['✦','★','✦','★','✦','★','✦','★','✦','★'].map((s, i) => (
              <span key={i} style={{
                position:'absolute',
                left:`${5 + i * 10}%`, top:`${10 + (i % 4) * 18}%`,
                fontSize:`${16 + (i % 3) * 10}px`,
                color:['#FFD700','#facc15','#fbbf24','#fff','#FFC107'][i % 5],
                animation:`masterFloat ${1.8 + (i % 3) * 0.4}s ease-in-out infinite alternate`,
                opacity:0.75
              }}>{s}</span>
            ))}
          </div>

          <style>{`
            @keyframes masterFloat  { from{transform:translateY(0) rotate(-5deg);} to{transform:translateY(-18px) rotate(5deg);} }
            @keyframes masterPop    { 0%{opacity:0;transform:scale(0.55);} 65%{transform:scale(1.06);} 100%{opacity:1;transform:scale(1);} }
            @keyframes goldShimmer  { 0%,100%{background-position:-200% center;} 50%{background-position:200% center;} }
            @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1;} 100%{transform:translateY(100vh) rotate(720deg);opacity:0;} }
          `}</style>

          {/* confetti dots */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            {Array.from({length:18}).map((_, i) => (
              <div key={i} style={{
                position:'absolute',
                left:`${Math.random()*100}%`,
                top:'-10px',
                width:`${6 + (i % 4)*4}px`,
                height:`${6 + (i % 4)*4}px`,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                backgroundColor:['#facc15','#3b82f6','#22c55e','#f87171','#a78bfa'][i % 5],
                animation:`confettiFall ${2 + (i % 4) * 0.4}s ${(i % 6) * 0.2}s linear forwards`
              }}/>
            ))}
          </div>

          <div style={{ position:'relative', zIndex:1, width:'min(480px,92vw)', backgroundColor:'#0f172a', borderRadius:'24px', border:'2px solid #facc15', boxShadow:'0 0 70px rgba(250,204,21,0.45), 0 30px 60px rgba(0,0,0,0.8)', padding:'44px 36px 36px', textAlign:'center', animation:'masterPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ fontSize:'76px', lineHeight:1, marginBottom:'14px' }}>🏆</div>

            <div style={{ fontSize:'30px', fontWeight:'900', marginBottom:'8px', background:'linear-gradient(90deg,#facc15,#fbbf24,#FFD700,#facc15)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'goldShimmer 2.2s linear infinite' }}>
              Concept Mastered!
            </div>

            <div style={{ fontSize:'16px', color:'#94a3b8', marginBottom:'22px', lineHeight:1.55 }}>
              You completed all tasks in<br/>
              <span style={{ color:'#facc15', fontWeight:'800', fontSize:'19px' }}>{concept}</span>
              {' '}for <span style={{ color:'#60a5fa', fontWeight:'700' }}>{language}</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'22px' }}>
              {[
                { icon:'✅', label:'Tasks Done', value: tasks.length },
                { icon:'⭐', label:'Score',      value: assessmentResult.score },
                { icon:'🎯', label:'Level',      value: mapLevelLabel(assessmentResult.level) }
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ backgroundColor:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.22)', borderRadius:'12px', padding:'12px 6px' }}>
                  <div style={{ fontSize:'22px', marginBottom:'4px' }}>{icon}</div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginBottom:'3px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                  <div style={{ fontSize:'16px', fontWeight:'900', color:'#f1f5f9' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', backgroundColor:'rgba(250,204,21,0.14)', border:'1px solid #facc15', borderRadius:'999px', padding:'8px 22px', marginBottom:'28px' }}>
              <span style={{ fontSize:'16px' }}>🏅</span>
              <span style={{ color:'#facc15', fontWeight:'800', fontSize:'14px', letterSpacing:'0.03em' }}>{concept} — MASTERED</span>
            </div>

            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button
                onClick={() => { setShowMastery(false); onNextTask?.('Complete!', concept); }}
                style={{ padding:'13px 28px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#facc15,#f59e0b)', color:'#1e3a5f', fontWeight:'900', fontSize:'15px', cursor:'pointer', boxShadow:'0 5px 18px rgba(250,204,21,0.45)', transition:'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                Choose Next Concept →
              </button>
              <button
                onClick={() => { setShowMastery(false); onNextTask?.('Complete!', concept); }}
                style={{ padding:'13px 20px', borderRadius:'12px', border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontWeight:'600', fontSize:'14px', cursor:'pointer' }}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CodeEditor;