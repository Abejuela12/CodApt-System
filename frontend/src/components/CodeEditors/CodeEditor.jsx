import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import './Split.css';
import { PYTHON_EASY_TASKS } from '../../data/pythonEasyTasks';
import { analyzeCode, evaluateCode } from "../../utils/codeAnalyzer";
import { recommendNextTask } from "../../utils/recommendNextTask";
import { calculateLanguageProgress, getLanguageLevel } from "../../utils/levelUtils";
import { getHintLevel } from "../../utils/hintUtils";

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
    const [showDropdown, setShowDropdown] = useState(false);
    const [code, setCode] = useState('# Write your code here\nprint("Hello CodApt!")');
    const [tasks, setTasks] = useState([]);
    const [output, setOutput] = useState('');
    const [showAssessment, setShowAssessment] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [startTime] = useState(Date.now());
    const [timeSpent, setTimeSpent] = useState(0);   
    const [hintLevel, setHintLevel] = useState(0);
    const [showHint, setShowHint] = useState(false);        
    const [recommendation, setRecommendation] = useState(''); 
    const [assessmentResult, setAssessmentResult] = useState({ 
      correct: false,
      attempts: 0,
      timeSpent: 0,
      feedback: [],
      recommendation: ''
    });

const hintRef = useRef(null);

const getStarterCode = (lang) => {
  const normalized = lang?.toString().toLowerCase();
  if (normalized === 'javascript') return `console.log("Replace this line!");`;
  if (normalized === 'java') return `System.out.println("Replace this line!");`;
  return `print("Replace this line!")`;
};

const getCommentSymbol = (lang) => {
  const normalized = lang?.toString().toLowerCase();
  return normalized === 'python' ? '#' : '//';
};
  // handle Hint
const handleHint = () => {
  const level = getHintLevel(
    attempts,
    assessmentResult.level || "Beginner"
  );

  setHintLevel(level);
  setShowHint(true);

  setTimeout(() => {
    hintRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
};



  // Update handleRun:
  const handleRun = () => {
    const result = evaluateCode(code, language);
    setOutput(result);
  };


  // const task = PYTHON_EASY_TASKS[currentTaskIndex] || PYTHON_EASY_TASKS[0];

  const task =
  tasks.length > 0
    ? tasks[currentTaskIndex]
    : PYTHON_EASY_TASKS[currentTaskIndex];
  
  const calculateScore = (attempts, timeSpent, isCorrect) => {
    if (!isCorrect) return 0;

    let base = 100;

    // Penalize attempts
    const attemptPenalty = (attempts - 1) * 10;

    // Penalize slow solving (every 30s = -5)
    const timePenalty = Math.floor(timeSpent / 30) * 5;

    let finalScore = base - attemptPenalty - timePenalty;

    return Math.max(finalScore, 20); // minimum score if correct
  };


  const classifyUser = (averageScore) => {
      if (averageScore >= 85) return "Advanced";
      if (averageScore >= 60) return "Intermediate";
      return "Beginner";
    };

    // HANDLE SUBMIT
    const handleSubmit = async () => {
      console.log('🚀 SUBMIT clicked! Task:', task);

      if (!task) {
        alert('❌ No task loaded!');
        return;
      }

      const newAttempts = attempts + 1;
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

      try {
        // 1. Analyze code
        const result = analyzeCode(code, task, language);

        // 2. Calculate score
        const score = calculateScore(newAttempts, timeSpentSeconds, result.correct);

        // 3. Send to backend FIRST
        const backendResponse = await fetch('http://localhost:5000/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1,
            problemId: task.id,
            language: language,
            concept: concept,
            code: code,
            attempts: newAttempts,
            timeSpent: timeSpentSeconds,
            isCorrect: result.correct
          })
        });

        const backendData = await backendResponse.json();

        console.log('✅ Backend Response:', backendData);

        // 4. Recommendation
        const rec = recommendNextTask(
          newAttempts,
          timeSpentSeconds,
          result.correct,
          currentTaskIndex
        );
         
        const languageProgress = calculateLanguageProgress(language, userData?.progress || {});
        const computedLevel = getLanguageLevel(language, userData?.progress || {}).label;


        // 5. Update UI
        setAssessmentResult({
          correct: result.correct,
          attempts: newAttempts,
          timeSpent: timeSpentSeconds,
          feedback: result.feedback || [],
          output: result.output || '',
          score: score,
          level: computedLevel, 
          expected: task.expectedOutput || task.expected_output || 'No expected output',
          recommendation: rec,
          nextTaskIndex: result.correct
            ? (currentTaskIndex < tasks.length - 1 ? currentTaskIndex + 1 : 'Complete!')
            : currentTaskIndex
        });

        setAttempts(newAttempts);
        setTimeSpent(timeSpentSeconds);

        if (result.correct) {
          onCompleteTask(language, concept, currentTaskIndex + 1);
        }

        setShowAssessment(true);

      } catch (error) {
        console.error('❌ Submit error:', error);
        alert('Submit failed: ' + error.message);
      }
    };

  // useEffect(() => {
  //   const currentTask = PYTHON_EASY_TASKS[currentTaskIndex];
  //   if (currentTask) {
  //     // ✅ CLEAN STARTER CODE - ONLY line numbers
  //     setCode(`# Task ${currentTask.id}: ${currentTask.title}\n\n# Write your code here:\n\nprint("Replace this line!")`);
      
  //     setOutput('');
  //     setAttempts(0);
  //     setTimeSpent(0);
  //     setRecommendation('');
  //   }
  // }, [currentTaskIndex]);

  

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/problems/${language}/${concept}/${level}`
        );
        const data = await res.json();

        console.log("📦 DB Tasks:", data);

        setTasks(data);
      } catch (err) {
        console.log("❌ Failed to load DB tasks", err);
      }
    };

    fetchTasks();
  }, [language, concept, level]);

  useEffect(() => {
    if (!task) return;

    console.log("📥 TASK LOADED:", task);
    console.log("💡 TASK HINTS:", task?.hints);

    const comment = getCommentSymbol(language);
    setCode(
      `${comment} Task ${task.id}: ${task.title || ""}\n\n` +
      `${comment} Write your code here:\n` +
      `${getStarterCode(language)}`
    );

    setOutput('');
    setAttempts(0);
    setTimeSpent(0);
    setRecommendation('');
  }, [currentTaskIndex, tasks, language]);


  const buttonStyle = {
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: "900",
    fontSize: "12px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };

  const buttonHover = (e, color) => {
    e.target.style.transform = "scale(1.05)";
    e.target.style.opacity = "0.9";
  };

  const buttonLeave = (e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.opacity = "1";
  };

  const getLanguage = (lang) => {
    const normalized = lang?.toString().toLowerCase();
    switch(normalized) {
      case 'python': return 'python';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      default: return 'plaintext';
    }
  };

const hints = task?.hints || {};

const hintText =
  hintLevel === 1
    ? hints.level1
    : hintLevel === 2
    ? hints.level2
    : hintLevel >= 3
    ? hints.level3
    : "No hint available yet.";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d1117', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Navbar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 50px',
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        flexShrink: 0,
        minHeight: '45px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/CODAPT_LOGO.png" 
            alt="CodApt Logo" 
            style={{ 
              height: '45px',
              width: 'auto', 
              cursor: 'pointer' 
            }}
            onClick={onHomeClick}
          />
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {language?.toUpperCase()} / {concept}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Name Badge */}
          <div style={{ backgroundColor: '#48a859', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            {userData?.name || 'Student'}
          </div>
          
      {/* Profile Icon - PERFECT DARK MODE FIX */}
      <div style={{ position: 'relative' }}>
        <div 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            border: '2px solid #374151',
            padding: '2px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            transition: 'all 0.3s ease'
          }} 
          onClick={onProfileClick}
        >
          {userData?.photo ? (
            <img 
              src={userData.photo} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )}
        </div>

        {/* Unified Dropdown - NO editorDropdown class */}
        <div className="unifiedDropdown">
          <div className="dropdownArrow"></div>
          <div className="dropdownItem" onClick={onProfileClick}>Profile</div>
          <div className="dropdownItem" style={{ color: '#f87171' }} onClick={onLogout}>Logout</div>
        </div>
      </div>

        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Split
          style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}
          sizes={[45, 55]}
          minSize={200}
          gutterSize={12}
          direction="horizontal"
          gutterStyle={() => ({
            backgroundColor: '#1e3a8a',
            cursor: 'col-resize',
          })}
        >
          {/* Left Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Split
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              sizes={[85, 15]}
              minSize={50}
              gutterSize={12}
              direction="vertical"
              gutterStyle={() => ({
                backgroundColor: '#1e3a8a',
                cursor: 'row-resize',
              })}
            >
              {/* 🎨 CODEDEX-STYLE INSTRUCTIONS - EXACT MATCH */}
              <aside style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                backgroundColor: '#0a0e17', 
                borderRight: '1px solid #21262d',
                height: '100%', 
                overflow: 'hidden',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                
                {/* Header - Codédex Style */}
                <div style={{ 
                  padding: '8px 24px', 
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  letterSpacing: '0.5px',
                  flexShrink: 0
                }}>
                  LESSON
                </div>

                {/* Content - Scrollable */}
                <div style={{ flex: 1, padding: '32px 24px', overflow: 'auto', lineHeight: '1.7' }}>
                  
                  {/* Task Number + Title */}
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: '800', 
                    color: '#f8fafc',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em'
                  }}>
                    {String(currentTaskIndex + 1).padStart(2, '0')}. {task?.title || 'Your First Variable'}
                  </div>

                  {/* Concept Tag */}
                  <div style={{ 
                    color: '#60a5fa', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    marginBottom: '24px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    borderRadius: '6px',
                    display: 'inline-block',
                    border: '1px solid rgba(96, 165, 250, 0.3)'
                  }}>
                    #{concept}
                  </div>

                  {/* 🎯 MAIN EXPLANATION - Codédex Style */}
                  {task?.explanation && (
                    <div style={{ marginBottom: '32px' }}>
                     <div 
                        style={{ 
                          fontSize: '16px', 
                          color: '#e2e8f0',
                          lineHeight: '1.7',
                          marginBottom: '24px'
                        }}
                        dangerouslySetInnerHTML={{ __html: task.explanation }}
                      />
                    </div>
                  )}

                  {/* 💡 EXAMPLE - Exact Codédex Style */}
                  <div style={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ 
                        width: '32px', height: '32px', 
                        background: '#10b981', 
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 'bold', color: 'white'
                      }}>
                        💡
                      </div>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#f8fafc',
                        margin: 0
                      }}>
                        Example
                      </h4>
                    </div>
                    
                    <div style={{ fontSize: '15px', color: '#e2e8f0' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <code style={{ 
                          display: 'block',
                          background: '#1e293b',
                          padding: '16px',
                          borderRadius: '8px',
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: '#a78bfa',
                          borderLeft: '4px solid #8b5cf6',
                          fontSize: '14px'
                        }}>
                        num = 1 <br />
                        print(num)
                        </code>
                      </div>
                      <div style={{ 
                        color: '#94a3b8', 
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        Output: <span style={{ color: '#10b981', fontWeight: '600' }}>1</span>
                      </div>
                    </div>
                  </div>

                  {/* 📋 INSTRUCTIONS - Exact Codédex Blue Box */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#3b82f6',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      Instructions
                    </h3>
                    
                    <div style={{ 
                      fontSize: '16px', 
                      color: '#f1f5f9',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-line'
                    }}>
                      {task?.instruction || 'Create the variable and print it exactly as shown in the example!'}
                    </div>
                  </div>

                  {/* ✅ EXPECTED OUTPUT */}
                  <div style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '10px',
                    padding: '20px'
                  }}>
                    <div style={{ 
                      color: '#22c55e',
                      fontWeight: '700',
                      fontSize: '16px',
                      marginBottom: '12px'
                    }}>
                      ✅ Expected Output
                    </div>
                    <div style={{
                      backgroundColor: '#22c55e20',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      color: '#22c55e',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}>
                      {task?.expected_output || 'Your output here...'}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Help Panel - ULTRA COMPACT */}
              <div style={{ 
                backgroundColor: '#0d1117', 
                borderRight: '1px solid #30363d', 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  padding: '10px 12px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  backgroundColor: '#161b22',
                  borderBottom: '1px solid #30363d',
                  color: '#8b949e',
                  flexShrink: 0 
                }}>
                  💡 HELP
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handleHint}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    backgroundColor: '#0d1117', 
                    border: '1px solid #373a40', 
                    borderRadius: '6px', 
                    color: '#8b949e', 
                    fontWeight: '500', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#161b22';
                    e.target.style.borderColor = '#58a6ff';
                    e.target.style.color = '#58a6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0d1117';
                    e.target.style.borderColor = '#373a40';
                    e.target.style.color = '#8b949e';
                  }}>
                    Show Hint
                  </button>
                  {showHint && (
                    <div
                      ref={hintRef}
                      style={{
                        marginTop: "10px",
                        padding: "10px",
                        background: "#161b22",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#c9d1d9"
                      }}
                    >
                      {hintText}
                    </div>
                  )}
                </div>
              </div>
            </Split>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Split
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              sizes={[65, 35]}
              minSize={100}
              gutterSize={12}
              direction="vertical"
              gutterStyle={() => ({
                backgroundColor: '#1e3a8a',
                cursor: 'row-resize',
              })}
            >
              {/* Code Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0, backgroundColor: 'white' }}>
                <div style={{ backgroundColor: '#1e3a8a', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', 
                            color: '#dbeafe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span>{concept}.{language?.toLowerCase() === 'python' ? 'py' : language?.toLowerCase() === 'java' ? 'java' : 'js'}</span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Editor
                    key={currentTaskIndex} 
                    height="100%"
                    language={getLanguage(language)}
                    theme="light"
                    value={code}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                    }}
                    onChange={(val) => setCode(val)}
                  />
                  
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '12px', zIndex: 10 }}>
                    <button
                        onClick={handleRun}
                        onMouseEnter={(e) => buttonHover(e)}
                        onMouseLeave={buttonLeave}
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#facc15",
                          color: "black"
                        }}
                      >
                      ▶ RUN
                    </button>
                    <button
                      onClick={handleSubmit}
                      onMouseEnter={(e) => buttonHover(e)}
                      onMouseLeave={buttonLeave}
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#3b82f6",
                        color: "white"
                      }}
                    >
                      Submit
                    </button>
                      {/* Only to test db */}
                    {/* <button
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5000/api/problems/Python/Variables/Easy');
                          const problems = await response.json();
                          console.log('✅ DATABASE WORKS!', problems);
                          alert(`✅ Connected! ${problems.length} problems loaded`);
                        } catch (error) {
                          alert('❌ Backend Error - Run: cd backend && node server.js');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Test DB
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Terminal */}
              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#010409', borderTop: '4px solid #161b22', minHeight: 0 }}>
                <div style={{ backgroundColor: '#0d1117', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', flexShrink: 0 }}>
                    Terminal
                </div>
                <div style={{ flex: 1, padding: '16px', fontFamily: 'monospace', fontSize: '14px', overflow: 'auto', color: '#d1d5db' }}>
                   {output || "> Terminal output will appear here..."}
                </div>
              </div>
            </Split>
          </div>
        </Split>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e3a8a', padding: '8px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid black', flexShrink: 0 }}>
        <button
          onClick={onBack}
          onMouseEnter={buttonHover}
          onMouseLeave={buttonLeave}
          style={{
            padding: '4px 32px',
            backgroundColor: '#0d1117',
            color: 'white',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px',
            border: '1px solid #4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Back
        </button>
        {/* <button
          onMouseEnter={buttonHover}
          onMouseLeave={buttonLeave}
          style={{
            padding: '4px 32px',
            backgroundColor: '#0d1117',
            color: 'white',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px',
            border: '1px solid #4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Next
        </button> */}
      </footer>
      
      {/* start of assessment */}
{showAssessment && (
  <div style={{
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  }}>

    <div style={{
      width: "520px",
      backgroundColor: "#0f172a",
      borderRadius: "16px",
      border: "1px solid #334155",
      color: "white",
      overflow: "hidden",
      boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
        fontWeight: "700"
      }}>
        <span>{concept} • {level}</span>

        <span
          onClick={() => setShowAssessment(false)}
          style={{
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold"
          }}
        >
          ✕
        </span>
      </div>

      {/* STATUS */}
      <div style={{ padding: "18px 20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{
            fontSize: "18px",
            fontWeight: "700",
            color: assessmentResult.correct ? "#4ade80" : "#ef4444"
          }}>
            {assessmentResult.correct ? "✔ Correct" : "✘ Incorrect"}
          </span>

          {/* LEVEL BADGE */}
          <span style={{
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor:
              assessmentResult.level === "Advanced" ? "#22c55e20" :
              assessmentResult.level === "Intermediate" ? "#facc1520" :
              "#ef444420",
            color:
              assessmentResult.level === "Advanced" ? "#22c55e" :
              assessmentResult.level === "Intermediate" ? "#facc15" :
              "#ef4444"
          }}>
            {assessmentResult.level || "Beginner"}
          </span>
        </div>

        {/* LANGUAGE CLASSIFICATION */}
        <div style={{
          marginTop: "10px",
          fontSize: "13px",
          color: "#94a3b8"
        }}>
          Language: <span style={{ color: "#60a5fa", fontWeight: "600" }}>
            {language}
          </span>
        </div>

        {/* FEEDBACK */}
        <div style={{
          marginTop: "14px",
          padding: "14px",
          backgroundColor: "#020617",
          border: "1px solid #334155",
          borderRadius: "10px"
        }}>
          <p style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#60a5fa",
            marginBottom: "8px"
          }}>
            Feedback Analysis
          </p>

          {assessmentResult.feedback?.length > 0 ? (
            assessmentResult.feedback.map((msg, i) => (
              <p key={i} style={{
                fontSize: "13px",
                color: "#e2e8f0",
                marginBottom: "4px"
              }}>
                • {msg}
              </p>
            ))
          ) : (
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              No major issues detected.
            </p>
          )}
        </div>
      </div>

      {/* METRICS (RESTORED + SCORE INCLUDED) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: "1px solid #334155"
      }}>

        <div style={{ padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Attempts</div>
          <div style={{ color: "#4ade80", fontWeight: "700" }}>
            {assessmentResult.attempts}
          </div>
        </div>

        <div style={{
          padding: "14px",
          textAlign: "center",
          borderLeft: "1px solid #334155"
        }}>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Time</div>
          <div style={{ color: "#4ade80", fontWeight: "700" }}>
            {assessmentResult.timeSpent}s
          </div>
        </div>

        <div style={{
          padding: "14px",
          textAlign: "center",
          borderLeft: "1px solid #334155"
        }}>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Score</div>
          <div style={{ color: "#facc15", fontWeight: "800" }}>
            {assessmentResult.score}
          </div>
        </div>
      </div>

      {/* RECOMMENDATION */}
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#94a3b8" }}>
          Recommended Next Task
        </p>

        <p style={{
          color: "#4ade80",
          fontWeight: "700",
          marginTop: "6px"
        }}>
          {assessmentResult.recommendation || "Keep practicing!"}
        </p>

        <button
          onClick={() => {
            setShowAssessment(false);

            if (assessmentResult.nextTaskIndex === 'Complete!') {
              onNextTask?.('Complete!');
              return;
            }

            if (onNextTask && typeof assessmentResult.nextTaskIndex === 'number') {
              onNextTask(assessmentResult.nextTaskIndex);
            }
          }}
          style={{
            marginTop: "16px",
            padding: "10px 28px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          {assessmentResult.correct ? "Next Task" : "Retry Task"}
        </button>
      </div>

    </div>
  </div>
)}
      {/* end of assessment */}
    </div>
  );
};

export default CodeEditor;