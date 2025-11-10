import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    is_active: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    student_id: '',
    role: 'student',
    is_active: true
  });
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';

      const response = await usersAPI.list();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Don't show alert if it's a 401 - interceptor will handle redirect
      if (error.response?.status !== 401) {
        alert('Failed to load users: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(formData);
      alert('User created successfully');
      setShowCreateForm(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        student_id: '',
        role: 'student',
        is_active: true
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateUser = async (userId) => {
    try {
      await usersAPI.update(userId, editFormData);
      alert('User updated successfully');
      setSelectedUser(null);
      setEditFormData({});
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await usersAPI.delete(userId);
      alert('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openEditForm = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      student_id: user.student_id || '',
      role: user.role || 'student',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#ef4444',
      student: '#3b82f6'
    };
    return colors[role] || '#6b7280';
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Users Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f3f4f6',
        borderRadius: '5px'
      }}>
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="student">Student</option>
        </select>
        <select
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          onClick={() => setFilters({ role: '', is_active: '' })}
          style={{
            padding: '8px 15px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '5px',
          border: '1px solid #e5e7eb'
        }}>
          <h2>Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Student ID</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Full Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Student ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Last Login</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.full_name || '-'}</td>
                    <td style={{ padding: '12px' }}>{user.student_id || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role),
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: user.is_active ? '#10b98120' : '#ef444420',
                        color: user.is_active ? '#10b981' : '#ef4444',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => openEditForm(user)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2>Edit User: {selectedUser.email}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Student ID</label>
                <input
                  type="text"
                  value={editFormData.student_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, student_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label>Role</label>
                <select
                  value={editFormData.role || 'student'}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select
                  value={editFormData.is_active !== undefined ? editFormData.is_active.toString() : 'true'}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label>New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  value={editFormData.password || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  minLength={6}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => handleUpdateUser(selectedUser.id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setEditFormData({});
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
