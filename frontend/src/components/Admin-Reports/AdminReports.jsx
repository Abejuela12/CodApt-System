import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import styles from './AdminReports.module.css';

const AdminReports = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/reports');
        if (!response.ok) throw new Error('Failed to load report data');
        const data = await response.json();
        setPerformanceData(data.performanceData || []);
        setTopics(data.topics || []);
        setPieData(data.pieData || []);
      } catch (err) {
        console.error('Admin reports fetch error:', err);
        setError('Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports</h1>
      
      <div className={styles.filterBar}>
        <select className={styles.dropdown}><option>All Time</option></select>
        <select className={styles.dropdown}><option>All Users</option></select>
        <button className={styles.generateBtn}>Generate Report</button>
      </div>

      <div className={styles.statsRow}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>📈</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Avg Score</span>
            <h2 className={styles.statValue}>{loading ? '…' : performanceData.length ? `${Math.round(performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length)}%` : '0%'}</h2>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>✅</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Average Progress</span>
            <h2 className={styles.statValue}>{loading ? '…' : performanceData.length ? `${Math.round(performanceData.reduce((sum, item) => sum + item.success, 0) / performanceData.length)}%` : '0%'}</h2>
          </div>
        </div>
      </div>

      <div className={styles.mainChartCard}>
        <h2 className={styles.chartTitle}>Learner Performance Over Time</h2>
        <div className={styles.chartInner}>
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
        </div>
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.topicsCard}>
          <h3 className={styles.sectionHeading}>Top Programming Topics</h3>
          <div className={styles.topicsList}>
            {topics.map((topic, i) => (
              <div key={i} className={styles.topicItem}>
                <span className={styles.topicName}>{topic.name}</span>
                <div className={styles.progressContainer}>
                  <div className={styles.bar} style={{ width: `${(topic.count / 1000) * 100}px`, backgroundColor: topic.color }}></div>
                  <span className={styles.topicCount}>{topic.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.pieCard}>
          <h3 className={styles.sectionHeading}>Error Types Distribution</h3>
          <div className={styles.pieContent}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;