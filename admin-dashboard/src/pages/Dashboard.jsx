import React, { useEffect, useState } from 'react';
import { telemetryAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await telemetryAPI.stats(7);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {stats && (
        <div style={{ marginTop: '20px' }}>
          <h2>Statistics (Last 7 days)</h2>
          <p>Total Queries: {stats.total_queries}</p>
          <p>Average Duration: {stats.average_duration_ms}ms</p>
          <h3>Top Subjects</h3>
          <ul>
            {stats.top_subjects.map((item, idx) => (
              <li key={idx}>{item.subject}: {item.count} queries</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

