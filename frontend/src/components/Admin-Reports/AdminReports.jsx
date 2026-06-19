import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import styles from './AdminReports.module.css';

const AdminReports = () => {
  // Data for the Performance Graph
  const performanceData = [
    { name: "Jan '24", success: 15, score: 10 },
    { name: "Feb '24", success: 18, score: 14 },
    { name: "Mar '24", success: 20, score: 16 },
    { name: "Apr '24", success: 21, score: 17 },
    { name: "May '24", success: 22, score: 19 },
  ];

  const topics = [
    { name: "Array & Strings", count: 845, color: "#76D7A4" },
    { name: "Conditionals", count: 645, color: "#F1C40F" },
    { name: "Loops", count: 552, color: "#76D7A4" },
    { name: "Input Handling", count: 471, color: "#F1C40F" },
    { name: "Functions", count: 442, color: "#76D7A4" },
    { name: "Recursion", count: 298, color: "#F1C40F" },
  ];

  // Data for the Pie Chart
  const pieData = [
    { name: 'Syntax Errors', value: 43, color: '#EE6666' },
    { name: 'Logic Errors', value: 25, color: '#FAC858' },
    { name: 'Other Errors', value: 32, color: '#5470C6' },
    { name: 'Semantic', value: 23, color: '#91CC75' },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports</h1>
      
      <div className={styles.filterBar}>
        <select className={styles.dropdown}><option>All Time</option></select>
        <select className={styles.dropdown}><option>All Users</option></select>
        <button className={styles.generateBtn}>Generate Report</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>📈</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Avg Score</span>
            <h2 className={styles.statValue}>30%</h2>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.iconCircle} style={{backgroundColor: '#E6F4EA'}}>✅</div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Average Progress</span>
            <h2 className={styles.statValue}>30%</h2>
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