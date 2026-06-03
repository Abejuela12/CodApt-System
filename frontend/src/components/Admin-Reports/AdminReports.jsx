import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import styles from './AdminReports.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminReports = ({ authToken }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [topics, setTopics] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    fetchReportsData();
  }, [authToken]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats for basic data
      const statsRes = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const statsData = await statsRes.json();
      
      if (statsRes.ok && statsData.data) {
        // Calculate average score from recent users
        const recentUsers = statsData.data.recentUsers || [];
        if (recentUsers.length > 0) {
          const totalScore = recentUsers.reduce((sum, user) => sum + (user.avg_success || 0), 0);
          const avg = Math.round((totalScore / recentUsers.length) * 100);
          setAvgScore(avg);
          setAvgProgress(Math.min(recentUsers.length * 5, 100)); // Simple progress calculation
        }
      }

      // Fetch real report charts (no mock/random data)
      const [perfRes, topicsRes, errorsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/reports/performance`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/api/admin/reports/topics`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/api/admin/reports/errors`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      const perfJson = await perfRes.json();
      const topicsJson = await topicsRes.json();
      const errorsJson = await errorsRes.json();

      if (perfRes.ok && perfJson?.data?.performance) {
        // Ensure stable shape for recharts
        const cleaned = (perfJson.data.performance || []).map(p => ({
          name: p.name,
          success: Number(p.success) || 0,
          score: Number(p.score) || 0,
        }));
        setPerformanceData(cleaned);
      } else {
        setPerformanceData([]);
      }

      if (topicsRes.ok && topicsJson?.data?.topics) {
        const cleaned = (topicsJson.data.topics || []).map(t => ({
          name: t.name,
          count: Number(t.count) || 0,
          color: t.color || '#76D7A4'
        }));
        setTopics(cleaned);
      } else {
        setTopics([]);
      }

      if (errorsRes.ok && errorsJson?.data?.errorDistribution) {
        const cleaned = (errorsJson.data.errorDistribution || []).map(e => ({
          name: e.name,
          value: Number(e.value) || 0,
          color: e.color || '#91CC75'
        }));
        setPieData(cleaned);
      } else {
        setPieData([]);
      }

    } catch (err) {
      console.error('Failed to fetch reports data', err);
      // Keep UI stable if backend fails
      setPerformanceData([]);
      setPieData([]);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };


  const handleGenerateReport = () => {
    // Generate a report export (could be PDF/CSV)
    const reportContent = {
      timestamp: new Date().toISOString(),
      avgScore,
      avgProgress,
      performanceData,
      topics,
      errorDistribution: pieData
    };
    
    console.log('Report Generated:', reportContent);
    alert('Report has been generated and is ready for export!\nCheck the console for details.');
  };

  if (loading) {
    return <div className={styles.container}><p>Loading reports data...</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports</h1>
      
      <div className={styles.filterBar}>
        <select className={styles.dropdown}><option>Last 6 Months</option><option>Last Year</option><option>All Time</option></select>
        <select className={styles.dropdown}><option>All Users</option></select>
        <button className={styles.generateBtn} onClick={handleGenerateReport}>Generate Report</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>📈</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Avg Score</span>
            <h2 className={styles.statValue}>{avgScore}%</h2>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>✅</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Average Progress</span>
            <h2 className={styles.statValue}>{avgProgress}%</h2>
          </div>
        </div>
      </div>

      <div className={styles.mainChartCard}>
        <h2 className={styles.chartTitle}>Learner Performance Over Time</h2>
        <div className={styles.chartInner}>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="success" name="Success Rate" stroke="#5470C6" strokeWidth={3} dot={{ r: 6, fill: '#5470C6' }} />
                <Line type="monotone" dataKey="score" name="Avg Score" stroke="#EE6666" strokeWidth={3} dot={{ r: 6, fill: '#EE6666' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No performance data available</p>
          )}
        </div>
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.topicsCard}>
          <h3 className={styles.sectionHeading}>Top Programming Topics</h3>
          <div className={styles.topicsList}>
            {topics.length > 0 ? (
              topics.map((topic, i) => (
                <div key={i} className={styles.topicItem}>
                  <span className={styles.topicName}>{topic.name}</span>
                  <div className={styles.progressContainer}>
                    <div className={styles.bar} style={{ width: `${Math.min((topic.count / 10), 100)}px`, backgroundColor: topic.color }}></div>
                    <span className={styles.topicCount}>{topic.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No topic data available</p>
            )}
          </div>
        </div>

        <div className={styles.pieCard}>
          <h3 className={styles.sectionHeading}>Error Types Distribution</h3>
          <div className={styles.pieContent}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.legend}>
                  {pieData.map((item, i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.dot} style={{ backgroundColor: item.color }}></span>
                      {item.name}: {item.value}%
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>No error data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;