import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Versions from './pages/Versions';
import Packages from './pages/Packages';
import Analytics from './pages/Analytics';
import Feedback from './pages/Feedback';
import Documents from './pages/Documents';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AuthStatus from './components/AuthStatus';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 15px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      Logout
    </button>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAuthenticated(user.role === 'admin');
      } catch (e) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AuthStatus />
              <div style={{ display: 'flex', height: '100vh' }}>
                {/* Sidebar */}
                <nav style={{
                  width: '250px',
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h2>Admin Dashboard</h2>
                  <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
                    <li style={{ marginBottom: '10px' }}>
                      <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>Users</Link>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <Link to="/versions" style={{ color: 'white', textDecoration: 'none' }}>Versions</Link>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <Link to="/packages" style={{ color: 'white', textDecoration: 'none' }}>Packages</Link>
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      <Link to="/analytics" style={{ color: 'white', textDecoration: 'none' }}>Analytics</Link>
                    </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/feedback" style={{ color: 'white', textDecoration: 'none' }}>Feedback</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/documents" style={{ color: 'white', textDecoration: 'none' }}>Documents</Link>
            </li>
                  </ul>
                  <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <LogoutButton />
                  </div>
                </nav>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/versions" element={<Versions />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/documents" element={<Documents />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

