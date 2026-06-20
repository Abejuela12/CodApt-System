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
  const [avgScore, setAvgScore] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const fetchReports = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams({ timeframe: selectedTimeframe, user: selectedUser });
      const res = await fetch(`http://localhost:5000/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load admin reports');
      const data = await res.json();

      setAvgScore(data.avgScore || 0);
      setAvgProgress(data.avgProgress || 0);
      setPerformanceData(data.performanceData || []);
      setTopics(data.topics || []);
      setPieData(data.pieData || []);
    } catch (err) {
      console.error('Failed to fetch admin reports:', err);
      setFetchError('Could not load report data from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedTimeframe, selectedUser]);

  const downloadReport = async () => {
    try {
      const params = new URLSearchParams({ timeframe: selectedTimeframe, user: selectedUser });
      const res = await fetch(`http://localhost:5000/api/admin/reports/download?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to download report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CodApt_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      setFetchError('Could not download report. Please try again.');
    }
  };

  const handleGenerateAndDownload = async () => {
    await fetchReports();
    await downloadReport();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports</h1>
      
      <div className={styles.filterBar}>
        <select className={styles.dropdown}
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="6m">Last 6 Months</option>
          <option value="3m">Last 3 Months</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select className={styles.dropdown}
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="new">New Users</option>
        </select>

        <button
          className={styles.generateBtn}
          onClick={handleGenerateAndDownload}
          disabled={isLoading}
        >
          {isLoading ? 'Generating…' : 'Generate & Download Report'}
        </button>
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
      {fetchError && <div className={styles.errorMessage}>{fetchError}</div>}
      {isLoading && <div className={styles.loading}>Loading reports...</div>}

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
                  <div className={styles.bar} style={{ width: `${Math.min((topic.count / 1000) * 100, 100)}px`, backgroundColor: topic.color }}></div>
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