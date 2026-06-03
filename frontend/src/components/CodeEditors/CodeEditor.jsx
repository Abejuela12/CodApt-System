import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import './Split.css';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { calculateLanguageProgress, getLanguageLevel } from "../../utils/levelUtils";
import { getHintLevel } from "../../utils/hintUtils";
import { recommendNextTask } from "../../utils/recommendNextTask";

// ─── normalize output for comparison ────────────────────────────
function normalizeOutput(str) {
  return (str || '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

// ─── language starter templates ─────────────────────────────────
function getStarterCode(language, task) {
  const id    = task?.id    || '';
  const title = task?.title || '';

  if (language === 'Python') {
    return `# Task ${id}: ${title}\n\n# Write your code here:\nprint("Replace this line!")`;
  }
  if (language === 'Java') {
    return `// Task ${id}: ${title}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here:\n        System.out.println("Replace this line!");\n    }\n}`;
  }
  if (language === 'JavaScript') {
    return `// Task ${id}: ${title}\n\n// Write your code here:\nconsole.log("Replace this line!");`;
  }
  return '// Write your code here';
}

function monacoLang(language) {
  const map = { Python: 'python', Java: 'java', JavaScript: 'javascript' };
  return map[language] || 'plaintext';
}

function fileExt(language) {
  const map = { Python: 'py', Java: 'java', JavaScript: 'js' };
  return map[language] || 'txt';
}

// ─── Level helpers ───────────────────────────────────────────────
// BUG FIX #1: server returns 'Easy' | 'Intermediate' | 'Hard'
// but the badge in the old code only coloured 'Hard' and 'Intermediate'
// and used the raw string as the label.  We now map it to the
// human-readable Beginner / Intermediate / Advanced labels that
// match the manuscript and the thesis proposal terminology.
function mapLevelLabel(serverLevel) {
  const map = {
    Easy:         'Beginner',
    Intermediate: 'Intermediate',
    Hard:         'Advanced',
  };
  return map[serverLevel] || serverLevel || 'Beginner';
}

function getLevelColors(serverLevel) {
  if (serverLevel === 'Hard')         return { bg: '#22c55e20', text: '#22c55e' };
  if (serverLevel === 'Intermediate') return { bg: '#facc1520', text: '#facc15' };
  return                                     { bg: '#60a5fa20', text: '#60a5fa' }; // Beginner → blue
}

// ─── Recommendation reason builder (client-side enrichment) ──────
// BUG FIX #2: the backend explanation is just one generic sentence.
// We add a richer human rationale based on the assessment data.
function buildRichExplanation(rec, assessmentData) {
  if (!rec) return '';
  const { correct, attempts, syntaxErrors, structuralErrors, level } = assessmentData;
  const diff    = rec.difficulty;
  const concept = rec.concept;

  const parts = [];

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

  // Append the cosine score rationale
  const pct = Math.round((rec.similarityScore || 0) * 100);
  parts.push(`It scored ${pct}% similarity to your learner profile across topic, difficulty, and required constructs.`);

  return parts.join(' ');
}


const CodeEditor = ({
  language,
  concept,
  level,
  onBack,
  onProfileClick,
  onHomeClick,
  onLogout,
  onCompleteTask,
  userData,
  currentTaskIndex,
  onNextTask
}) => {
  const [code, setCode]                 = useState('');
  const [tasks, setTasks]               = useState([]);
  const [output, setOutput]             = useState('');
  const [isRunning, setIsRunning]       = useState(false);
  const [currentTier, setCurrentTier] = useState('Beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [attempts, setAttempts]         = useState(0);
  const [startTime, setStartTime]       = useState(Date.now());
  const [timeSpent, setTimeSpent]       = useState(0);
  const [hintLevel, setHintLevel]       = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint]         = useState(false);
  const [assessmentResult, setAssessmentResult] = useState({
    correct: false, attempts: 0, timeSpent: 0,
    feedback: [], cfgFeedback: [],
    syntaxErrors: 0, structuralErrors: 0,
    score: 0, level: 'Easy', recommendation: '',
    cosineRecommendation: null
  });

  const hintRef = useRef(null);

  const task = tasks.length > 0 ? tasks[currentTaskIndex] : null;

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

    setTimeout(() => {
      hintRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 50);
  };

  const calculateScore = (att, time, correct) => {
    if (!correct) return 0;
    return Math.max(100 - (att - 1) * 10 - Math.floor(time / 30) * 5, 20);
  };

  // ── RUN ──────────────────────────────────────────────────────
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('⏳ Running...');

    try {
      const res  = await fetch(`${API_BASE}/api/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ language, code })
      });
      const data = await res.json();
      setOutput(data.output || '(no output)');
    } catch (err) {
      setOutput('❌ Could not reach the backend. Make sure your server is running.');
    } finally {
      setIsRunning(false);
    }
  };

  // ── SUBMIT ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!task)        { alert('❌ No task loaded!'); return; }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const newAttempts      = attempts + 1;
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      setOutput('⏳ Running your code...');
      const runRes  = await fetch(`${API_BASE}/api/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ language, code })
      });
      const runData = await runRes.json();
      const actualOutput = runData.output || '';
      setOutput(actualOutput || '(no output)');

      if (runData.error) {
        const score = calculateScore(newAttempts, timeSpentSeconds, false);
        setAssessmentResult({
          correct: false, attempts: newAttempts, timeSpent: timeSpentSeconds,
          feedback: [`⚠ Runtime error: ${actualOutput}`],
          cfgFeedback: [], syntaxErrors: 1, structuralErrors: 0,
          output: actualOutput, score,
          // BUG FIX #1: use local level fallback consistently
          level: 'Easy',
          expected: task.expected_output || '',
          recommendation: recommendNextTask(newAttempts, timeSpentSeconds, false, currentTaskIndex),
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
      const actual    = normalizeOutput(actualOutput);
      const isCorrect = actual === expected;

      const submitRes  = await fetch(`${API_BASE}/api/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?.id ?? null,
          problemId: task.id,
          language,
          concept,
          code,
          attempts: newAttempts,
          timeSpent: timeSpentSeconds,
          isCorrect,
          hintUsed
        })
      });
      const submitData = await submitRes.json();
      console.log('✅ Backend Response:', submitData);

      const finalCorrect          = submitData.correct             ?? isCorrect;
      const cfgFeedback           = submitData.cfgFeedback         || [];
      const syntaxErrors          = submitData.syntaxErrors        ?? 0;
      const structuralErrors      = submitData.structuralErrors    ?? 0;
      // BUG FIX #1: server sends 'Easy'|'Intermediate'|'Hard' — keep raw for logic,
      // display mapped label in the badge
      const backendLevel          = submitData.level               || 'Easy';
      const nextTier = submitData.nextTier || 'Beginner';
      setCurrentTier(nextTier);
      const cosineRecommendation  = submitData.recommendation      || null;
      const score                 = calculateScore(newAttempts, timeSpentSeconds, finalCorrect);
      const feedback = [];
      if (!isCorrect) {
        feedback.push(`Expected: "${expected}"`);
        feedback.push(`Your output: "${actual}"`);
      } else {
        feedback.push('✔ Output matches the expected result.');
      }
      cfgFeedback.forEach(msg => feedback.push(msg));

      const rec = recommendNextTask(newAttempts, timeSpentSeconds, finalCorrect, currentTaskIndex);

      // BUG FIX #2: enrich the cosine explanation before storing
      const enrichedRecommendation = cosineRecommendation
        ? {
            ...cosineRecommendation,
            explanation: buildRichExplanation(cosineRecommendation, {
              correct:          finalCorrect,
              attempts:         newAttempts,
              syntaxErrors,
              structuralErrors,
              level:            backendLevel
            })
          }
        : null;

      setAssessmentResult({
        correct:               finalCorrect,
        attempts:              newAttempts,
        timeSpent:             timeSpentSeconds,
        feedback,
        cfgFeedback,
        syntaxErrors,
        structuralErrors,
        output:                actualOutput,
        score,
        level:                 backendLevel,
        expected:              task.expected_output || '',
        recommendation:        rec,
        cosineRecommendation:  enrichedRecommendation,
        nextTaskIndex:         finalCorrect
          ? (currentTaskIndex < tasks.length - 1 ? currentTaskIndex + 1 : 'Complete!')
          : currentTaskIndex
      });

      setAttempts(newAttempts);
      setTimeSpent(timeSpentSeconds);
      if (finalCorrect) onCompleteTask(language, concept, currentTaskIndex + 1);
      setShowAssessment(true);

    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('Submit failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── fetch tasks ───────────────────────────────────────────────
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/problems/${language}/${concept}/${level}?tier=${currentTier}`
        );
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.log('❌ Failed to load DB tasks', err);
      }
    };
    fetchTasks();
  }, [language, concept, level, currentTier]);

  // ── reset editor when task changes ───────────────────────────
  useEffect(() => {
    setCurrentTier('Beginner');
  }, [language, concept, level]);

  useEffect(() => {
    if (!task) return;
    setCode(getStarterCode(language, task));
    setOutput('');
    setAttempts(0);
    setTimeSpent(0);
    setShowHint(false);
    setHintLevel(0);
    setHintUsed(false);
    setStartTime(Date.now());
  }, [task, language]);

  const btnBase = {
    padding: '8px 20px', borderRadius: '8px',
    fontWeight: '900', fontSize: '12px',
    border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
  };
  const btnHover = e => { e.target.style.transform = 'scale(1.05)'; e.target.style.opacity = '0.9'; };
  const btnLeave = e => { e.target.style.transform = 'scale(1)';    e.target.style.opacity = '1';   };

  // ── Derived display values for assessment modal ───────────────
  const displayLevel  = mapLevelLabel(assessmentResult.level);
  const levelColors   = getLevelColors(assessmentResult.level);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#0d1117', color:'white', fontFamily:'sans-serif' }}>

      {/* ── Navbar ── */}
      <header style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 50px', backgroundColor:'white',
        borderBottom:'1px solid #e5e7eb', flexShrink:0, minHeight:'45px', boxSizing:'border-box'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <img src="/CODAPT_LOGO.png" alt="CodApt Logo"
            style={{ height:'45px', width:'auto', cursor:'pointer' }}
            onClick={onHomeClick}
          />
          <span style={{ fontSize:'18px', fontWeight:'bold', color:'#1e3a8a' }}>
            {language?.toUpperCase()} / {concept}
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ backgroundColor:'#48a859', color:'white', padding:'4px 16px', borderRadius:'20px', fontSize:'14px', fontWeight:'bold' }}>
            {userData?.name || 'Student'}
          </div>
          <div style={{ position:'relative' }}>
            <div
              style={{
                width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #374151',
                padding:'2px', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', overflow:'hidden', backgroundColor:'#ffffff'
              }}
              onClick={onProfileClick}
            >
              {userData?.photo
                ? <img src={userData.photo} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
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
        <Split
          style={{ display:'flex', flexDirection:'row', width:'100%', height:'100%' }}
          sizes={[45, 55]} minSize={200} gutterSize={12} direction="horizontal"
          gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'col-resize' })}
        >

          {/* ── Left Panel ── */}
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <Split
              style={{ display:'flex', flexDirection:'column', height:'100%' }}
              sizes={[85, 25]} minSize={50} gutterSize={12} direction="vertical"
              gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'row-resize' })}
            >
              <aside style={{
                display:'flex', flexDirection:'column',
                backgroundColor:'#0a0e17', borderRight:'1px solid #21262d',
                height:'100%', overflow:'hidden'
              }}>
                <div style={{
                  padding:'8px 24px',
                  background:'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color:'white', fontWeight:'700', fontSize:'16px', flexShrink:0
                }}>
                  LESSON
                </div>

                <div style={{ flex:1, padding:'32px 24px', overflow:'auto', lineHeight:'1.7' }}>
                  <div style={{ fontSize:'28px', fontWeight:'800', color:'#f8fafc', marginBottom:'8px' }}>
                    {String(currentTaskIndex + 1).padStart(2,'0')}. {task?.title || 'Loading...'}
                  </div>

                  <div style={{
                    color:'#60a5fa', fontSize:'14px', fontWeight:'600',
                    marginBottom:'24px', padding:'6px 12px',
                    backgroundColor:'rgba(96,165,250,0.1)', borderRadius:'6px',
                    display:'inline-block', border:'1px solid rgba(96,165,250,0.3)'
                  }}>
                    #{concept}
                  </div>

                  {task?.explanation && (
                    <div
                      style={{ fontSize:'16px', color:'#e2e8f0', lineHeight:'1.7', marginBottom:'24px' }}
                      dangerouslySetInnerHTML={{ __html: task.explanation }}
                    />
                  )}

                  <div style={{
                    background:'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.1) 100%)',
                    border:'1px solid rgba(59,130,246,0.3)',
                    borderRadius:'12px', padding:'24px', marginBottom:'24px'
                  }}>
                    <h3 style={{ fontSize:'20px', fontWeight:'700', color:'#3b82f6', margin:'0 0 16px 0' }}>
                      Instructions
                    </h3>
                    <div style={{ fontSize:'16px', color:'#f1f5f9', lineHeight:'1.7', whiteSpace:'pre-line' }}>
                      {task?.instruction || 'Loading task...'}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor:'rgba(34,197,94,0.15)',
                    border:'1px solid rgba(34,197,94,0.4)',
                    borderRadius:'10px', padding:'20px'
                  }}>
                    <div style={{ color:'#22c55e', fontWeight:'700', fontSize:'16px', marginBottom:'12px' }}>
                      ✅ Expected Output
                    </div>
                    <pre style={{
                      backgroundColor:'#22c55e20', padding:'12px 20px', borderRadius:'8px',
                      fontFamily:'monospace', color:'#22c55e', fontSize:'15px',
                      fontWeight:'500', margin:0, whiteSpace:'pre-wrap'
                    }}>
                      {task?.expected_output || 'Your output here...'}
                    </pre>
                  </div>
                </div>
              </aside>

              {/* Hint Panel */}              
              <div style={{ backgroundColor:'#0d1117', borderRight:'1px solid #30363d', overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
                {/* Header */}
                <div style={{
                  padding:'8px 12px', fontSize:'11px', fontWeight:'700',
                  backgroundColor:'#161b22', borderBottom:'1px solid #30363d',
                  color:'#8b949e', letterSpacing:'0.08em', textTransform:'uppercase'
                }}>
                  💡 Hint System
                </div>

                <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:'8px', flex:1, overflowY:'auto' }}>

                  {/* Hint level indicators */}
                  <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'2px' }}>
                    {[1,2,3].map(lvl => (
                      <div key={lvl} style={{
                        flex:1, height:'4px', borderRadius:'4px',
                        backgroundColor: hintLevel >= lvl ? (lvl === 1 ? '#22c55e' : lvl === 2 ? '#facc15' : '#f87171') : '#2d333b',
                        transition:'background-color 0.4s ease'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize:'10px', color:'#4b5563', textAlign:'right' }}>
                    {hintLevel === 0 ? 'No hint used' : `Level ${hintLevel} hint`}
                  </div>

                  {/* Hint button */}
                  <button
                    onClick={handleHint}
                    style={{
                      width:'100%', padding:'10px 12px',
                      background: showHint
                        ? 'linear-gradient(135deg, #1e3a5f, #1e4baf)'
                        : 'linear-gradient(135deg, #161b22, #1c2333)',
                      border: showHint ? '1px solid #3b82f6' : '1px solid #30363d',
                      borderRadius:'8px',
                      color: showHint ? '#93c5fd' : '#8b949e',
                      fontWeight:'700',
                      cursor:'pointer',
                      fontSize:'12px',
                      letterSpacing:'0.05em',
                      transition:'all 0.2s ease',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:'6px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.color = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = showHint ? '#3b82f6' : '#30363d';
                      e.currentTarget.style.color = showHint ? '#93c5fd' : '#8b949e';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize:'14px' }}>
                      {hintLevel === 0 ? '🔍' : hintLevel === 1 ? '💡' : hintLevel === 2 ? '🔆' : '🔥'}
                    </span>
                    {showHint ? 'Next Hint' : 'Show Hint'}
                  </button>

                  {/* Hint content box */}
                  {showHint && (
                    <div ref={hintRef} style={{
                      marginTop:'4px',
                      padding:'12px',
                      background:'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))',
                      border:`1px solid ${
                        hintLevel === 1 ? 'rgba(34,197,94,0.3)'
                        : hintLevel === 2 ? 'rgba(250,204,21,0.3)'
                        : 'rgba(248,113,113,0.3)'
                      }`,
                      borderRadius:'8px',
                      animation:'hintFadeIn 0.3s ease'
                    }}>
                      {/* Hint level badge */}
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:'5px',
                        padding:'2px 8px', borderRadius:'20px', marginBottom:'8px',
                        fontSize:'10px', fontWeight:'800', letterSpacing:'0.05em',
                        backgroundColor: hintLevel === 1 ? 'rgba(34,197,94,0.15)' : hintLevel === 2 ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)',
                        color: hintLevel === 1 ? '#4ade80' : hintLevel === 2 ? '#fde047' : '#f87171',
                        border: `1px solid ${hintLevel === 1 ? 'rgba(34,197,94,0.3)' : hintLevel === 2 ? 'rgba(250,204,21,0.3)' : 'rgba(248,113,113,0.3)'}`
                      }}>
                        {hintLevel === 1 ? '🟢 SUBTLE' : hintLevel === 2 ? '🟡 MODERATE' : '🔴 DIRECT'}
                      </div>

                      {/* Hint text */}
                      <div style={{
                        fontSize:'12px', color:'#cbd5e1', lineHeight:'1.7',
                        fontStyle: hintLevel === 1 ? 'italic' : 'normal'
                      }}>
                        {hintText}
                      </div>
                    </div>
                  )}

                </div>

                {/* CSS animation injected inline */}
                <style>{`
                  @keyframes hintFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </div>
            </Split>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
            <Split
              style={{ display:'flex', flexDirection:'column', height:'100%' }}
              sizes={[65, 35]} minSize={100} gutterSize={12} direction="vertical"
              gutterStyle={() => ({ backgroundColor:'#1e3a8a', cursor:'row-resize' })}
            >
              <div style={{ display:'flex', flexDirection:'column', position:'relative', minHeight:0, backgroundColor:'white' }}>
                <div style={{
                  backgroundColor:'#1e3a8a', padding:'8px 16px', fontSize:'14px',
                  fontWeight:'bold', color:'#dbeafe',
                  display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0
                }}>
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
                    <button
                      onClick={handleRun}
                      disabled={isRunning}
                      onMouseEnter={btnHover} onMouseLeave={btnLeave}
                      style={{ ...btnBase, backgroundColor: isRunning ? '#6b7280' : '#facc15', color:'black' }}
                    >
                      {isRunning ? '⏳ Running...' : '▶ RUN'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      onMouseEnter={btnHover} onMouseLeave={btnLeave}
                      style={{ ...btnBase, backgroundColor: isSubmitting ? '#6b7280' : '#3b82f6', color:'white' }}
                    >
                      {/* BUG FIX: more informative loading state */}
                      {isSubmitting ? '⏳ Analysing...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', backgroundColor:'#010409', borderTop:'4px solid #161b22', minHeight:0 }}>
                <div style={{
                  backgroundColor:'#0d1117', padding:'8px 16px',
                  fontSize:'12px', fontWeight:'bold', textTransform:'uppercase',
                  color:'#9ca3af', flexShrink:0
                }}>
                  Terminal
                </div>
                <pre style={{
                  flex:1, padding:'16px', fontFamily:'monospace',
                  fontSize:'14px', overflow:'auto', color:'#d1d5db',
                  margin:0, whiteSpace:'pre-wrap'
                }}>
                  {output || '> Terminal output will appear here...'}
                </pre>
              </div>
            </Split>
          </div>

        </Split>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor:'#1e3a8a', padding:'8px 24px',
        display:'flex', justifyContent:'flex-end', gap:'12px',
        borderTop:'1px solid black', flexShrink:0
      }}>
        <button
          onClick={onBack}
          onMouseEnter={btnHover} onMouseLeave={btnLeave}
          style={{ ...btnBase, padding:'4px 32px', backgroundColor:'#0d1117', color:'white', border:'1px solid #4b5563', fontWeight:'bold', fontSize:'14px' }}
        >
          Back
        </button>
      </footer>

      {/* ── Assessment Modal ── */}
      {showAssessment && (
        <div style={{
          position:'fixed', top:0, left:0, width:'100%', height:'100%',
          backgroundColor:'rgba(0,0,0,0.7)',
          display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000
        }}>
          <div style={{
            width:'580px', backgroundColor:'#0f172a',
            borderRadius:'16px', border:'1px solid #334155',
            color:'white', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.6)',
            maxHeight:'90vh', overflowY:'auto'
          }}>

            {/* Header */}
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'14px 20px',
              background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', fontWeight:'700'
            }}>
              <span>{concept} • {level}</span>
              <span onClick={() => setShowAssessment(false)} style={{ cursor:'pointer', fontSize:'18px' }}>✕</span>
            </div>

            <div style={{ padding:'18px 20px 0' }}>

              {/* ── BUG FIX #1: Correct/Incorrect + Level badge ── */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'18px', fontWeight:'700', color: assessmentResult.correct ? '#4ade80' : '#ef4444' }}>
                  {assessmentResult.correct ? '✔ Correct' : '✗ Incorrect'}
                </span>
                {/* Now shows Beginner / Intermediate / Advanced */}
                <span style={{
                  padding:'6px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:'700',
                  backgroundColor: levelColors.bg,
                  color:           levelColors.text,
                  border:         `1px solid ${levelColors.text}40`
                }}>
                  {displayLevel}
                </span>
              </div>

              <div style={{ marginTop:'6px', fontSize:'12px', color:'#64748b' }}>
                Classified by performance indicators (attempts, time, error counts)
              </div>

              <div style={{ marginTop:'8px', fontSize:'13px', color:'#94a3b8' }}>
                Language: <span style={{ color:'#60a5fa', fontWeight:'600' }}>{language}</span>
              </div>

              {/* Feedback */}
              <div style={{
                marginTop:'14px', padding:'14px',
                backgroundColor:'#020617', border:'1px solid #334155', borderRadius:'10px'
              }}>
                <p style={{ fontSize:'13px', fontWeight:'700', color:'#60a5fa', marginBottom:'8px' }}>
                  Feedback Analysis
                </p>
                {assessmentResult.feedback?.length > 0
                  ? assessmentResult.feedback.map((msg, i) => (
                      <p key={i} style={{ fontSize:'13px', color:'#e2e8f0', marginBottom:'4px' }}>• {msg}</p>
                    ))
                  : <p style={{ fontSize:'13px', color:'#94a3b8' }}>No issues detected.</p>
                }
              </div>

              {/* Syntax / Structural error counts — always shown */}
              <div style={{ marginTop:'10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div style={{
                  padding:'10px 14px', borderRadius:'8px',
                  backgroundColor: assessmentResult.syntaxErrors > 0 ? '#450a0a' : '#052e16',
                  border:`1px solid ${assessmentResult.syntaxErrors > 0 ? '#ef4444' : '#16a34a'}`
                }}>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'2px' }}>Syntax Errors</div>
                  <div style={{ fontWeight:'700', fontSize:'20px', color: assessmentResult.syntaxErrors > 0 ? '#ef4444' : '#4ade80' }}>
                    {assessmentResult.syntaxErrors}
                  </div>
                </div>
                <div style={{
                  padding:'10px 14px', borderRadius:'8px',
                  backgroundColor: assessmentResult.structuralErrors > 0 ? '#451a03' : '#052e16',
                  border:`1px solid ${assessmentResult.structuralErrors > 0 ? '#f97316' : '#16a34a'}`
                }}>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'2px' }}>Structural Errors</div>
                  <div style={{ fontWeight:'700', fontSize:'20px', color: assessmentResult.structuralErrors > 0 ? '#f97316' : '#4ade80' }}>
                    {assessmentResult.structuralErrors}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
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

            {/* ── BUG FIX #2: Enriched Recommendation Card ── */}
            <div style={{ padding:'0 20px 4px' }}>
              {assessmentResult.cosineRecommendation ? (
                <div style={{
                  backgroundColor:'#0f2744',
                  border:'1px solid #1e40af',
                  borderRadius:'10px',
                  padding:'14px 16px'
                }}>
                  {/* Section label */}
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#60a5fa', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    🎯 Recommended Next Exercise
                  </div>

                  {/* Exercise title */}
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#f1f5f9', marginBottom:'8px' }}>
                    {assessmentResult.cosineRecommendation.title}
                  </div>

                  {/* Tags row */}
                  <div style={{ display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#1e3a8a', color:'#93c5fd', fontWeight:'600' }}>
                      {assessmentResult.cosineRecommendation.language}
                    </span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#14532d', color:'#86efac', fontWeight:'600' }}>
                      {assessmentResult.cosineRecommendation.concept}
                    </span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#3f1a00', color:'#fdba74', fontWeight:'600' }}>
                      {assessmentResult.cosineRecommendation.difficulty}
                    </span>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'999px', backgroundColor:'#1e293b', color:'#94a3b8', fontWeight:'600' }}>
                      {Math.round((assessmentResult.cosineRecommendation.similarityScore || 0) * 100)}% match
                    </span>
                  </div>

                  {/* Why this recommendation — enriched explanation */}
                  <div style={{
                    backgroundColor:'rgba(96,165,250,0.08)',
                    border:'1px solid rgba(96,165,250,0.15)',
                    borderRadius:'8px',
                    padding:'10px 12px'
                  }}>
                    <div style={{ fontSize:'11px', color:'#60a5fa', fontWeight:'700', marginBottom:'4px' }}>
                      WHY THIS EXERCISE?
                    </div>
                    <div style={{ fontSize:'12px', color:'#cbd5e1', lineHeight:'1.6' }}>
                      {assessmentResult.cosineRecommendation.explanation}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', fontSize:'13px', color:'#94a3b8', padding:'8px 0' }}>
                  {assessmentResult.recommendation || 'Keep practising!'}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div style={{ padding:'16px 20px 20px', textAlign:'center' }}>
              <button
                onClick={() => {
                  setShowAssessment(false);
                  if (assessmentResult.nextTaskIndex === 'Complete!') { onNextTask?.('Complete!'); return; }
                  if (onNextTask && typeof assessmentResult.nextTaskIndex === 'number') {
                    onNextTask(assessmentResult.nextTaskIndex);
                  }
                }}
                style={{
                  padding:'10px 28px',
                  background:'#3b82f6', border:'none', borderRadius:'8px',
                  color:'white', fontWeight:'700', cursor:'pointer'
                }}
              >
                {assessmentResult.correct ? 'Next Task →' : 'Retry Task'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CodeEditor;