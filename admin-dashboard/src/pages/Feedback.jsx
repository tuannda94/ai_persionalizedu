import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../services/api';

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    category: '',
    priority_min: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [filters, page]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20, ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) delete params[key];
      });
      const response = await feedbackAPI.list(params);
      setFeedbacks(response.data.items || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      alert('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await feedbackAPI.stats(7);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUpdateStatus = async (id, status, adminNotes, resolution) => {
    try {
      await feedbackAPI.update(id, {
        status,
        admin_notes: adminNotes,
        resolution
      });
      loadFeedbacks();
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
      alert('Feedback updated successfully');
    } catch (error) {
      console.error('Failed to update feedback:', error);
      alert('Failed to update feedback');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      reviewing: '#3b82f6',
      resolved: '#10b981',
      rejected: '#ef4444',
      archived: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: '#ef4444', // critical
      2: '#f59e0b', // high
      3: '#3b82f6', // medium
      4: '#10b981', // low
      5: '#6b7280' // info
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Feedback Management</h1>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
            <div style={{ color: '#6b7280' }}>Total Feedback</div>
          </div>
          {Object.entries(stats.by_status || {}).map(([status, count]) => (
            <div key={status} style={{ padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(status) }}>
                {count}
              </div>
              <div style={{ color: '#6b7280', textTransform: 'capitalize' }}>{status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        >
          <option value="">All Types</option>
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
          <option value="error">Error</option>
          <option value="suggestion">Suggestion</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>
        <select
          value={filters.priority_min}
          onChange={(e) => setFilters({ ...filters, priority_min: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        >
          <option value="">All Priorities</option>
          <option value="1">Critical (1)</option>
          <option value="2">High (2)</option>
          <option value="3">Medium (3)</option>
          <option value="4">Low (4)</option>
          <option value="5">Info (5)</option>
        </select>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              onClick={() => setSelectedFeedback(feedback)}
              style={{
                padding: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedFeedback?.id === feedback.id ? '#f3f4f6' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: getStatusColor(feedback.status),
                        color: 'white',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}
                    >
                      {feedback.status}
                    </span>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: getPriorityColor(feedback.priority),
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      P{feedback.priority}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {feedback.type} • {feedback.category}
                    </span>
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{feedback.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {feedback.message?.substring(0, 100)}...
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                    {new Date(feedback.created_at).toLocaleString()}
                    {feedback.app_version && ` • v${feedback.app_version}`}
                    {feedback.platform && ` • ${feedback.platform}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px' }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Feedback Details</h2>
              <button onClick={() => setSelectedFeedback(null)}>✕</button>
            </div>

            <FeedbackDetail
              feedback={selectedFeedback}
              onUpdate={handleUpdateStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackDetail({ feedback, onUpdate }) {
  const [status, setStatus] = useState(feedback.status);
  const [adminNotes, setAdminNotes] = useState(feedback.admin_notes || '');
  const [resolution, setResolution] = useState(feedback.resolution || '');

  const handleSave = () => {
    onUpdate(feedback.id, status, adminNotes, resolution);
  };

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Title:</strong> {feedback.title}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Message:</strong>
        <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '4px', marginTop: '5px' }}>
          {feedback.message}
        </div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Type:</strong> {feedback.type} • <strong>Category:</strong> {feedback.category} • <strong>Priority:</strong> {feedback.priority}
      </div>
      {feedback.error_code && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Error Code:</strong> {feedback.error_code}
          {feedback.error_details && (
            <pre style={{ padding: '10px', background: '#fee2e2', borderRadius: '4px', marginTop: '5px', fontSize: '12px' }}>
              {feedback.error_details}
            </pre>
          )}
        </div>
      )}
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px', borderRadius: '4px' }}
        >
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Admin Notes:</strong>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          style={{ width: '100%', minHeight: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '5px' }}
          placeholder="Add notes about this feedback..."
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Resolution:</strong>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          style={{ width: '100%', minHeight: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '5px' }}
          placeholder="Add resolution details..."
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default Feedback;

