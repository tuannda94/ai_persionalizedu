import React, { useState, useEffect } from 'react';
import { telemetryAPI, feedbackAPI } from '../services/api';

function Analytics() {
  const [telemetryStats, setTelemetryStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [telemetryRes, feedbackRes] = await Promise.all([
        telemetryAPI.stats(days),
        feedbackAPI.stats(days)
      ]);
      setTelemetryStats(telemetryRes.data);
      setFeedbackStats(feedbackRes.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      alert('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Analytics Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Telemetry Stats */}
          {telemetryStats && (
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0 }}>Usage Statistics</h2>
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {telemetryStats.total_queries || 0}
                </div>
                <div style={{ color: '#6b7280', marginTop: '5px' }}>Total Queries</div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {Math.round(telemetryStats.average_duration_ms || 0)}ms
                </div>
                <div style={{ color: '#6b7280', marginTop: '5px' }}>Average Response Time</div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Top Subjects</h3>
                {telemetryStats.top_subjects?.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: idx < telemetryStats.top_subjects.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <span>{item.subject || 'Unknown'}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                  </div>
                )) || <div style={{ color: '#6b7280' }}>No data</div>}
              </div>
            </div>
          )}

          {/* Feedback Stats */}
          {feedbackStats && (
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0 }}>Feedback Statistics</h2>
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {feedbackStats.total || 0}
                </div>
                <div style={{ color: '#6b7280', marginTop: '5px' }}>Total Feedback</div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>By Status</h3>
                {Object.entries(feedbackStats.by_status || {}).map(([status, count]) => (
                  <div key={status} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <span style={{ fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>By Type</h3>
                {Object.entries(feedbackStats.by_type || {}).map(([type, count]) => (
                  <div key={type} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                    <span style={{ fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Performance Metrics</h2>
            <div style={{ marginTop: '15px', color: '#6b7280' }}>
              <p>Response time distribution and RAG accuracy metrics will be displayed here.</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Average query time: {telemetryStats?.average_duration_ms ? `${Math.round(telemetryStats.average_duration_ms)}ms` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
