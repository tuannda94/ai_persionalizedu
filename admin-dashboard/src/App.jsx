import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Versions from './pages/Versions';
import Packages from './pages/Packages';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px'
        }}>
          <h2>Admin Dashboard</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
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
          </ul>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/versions" element={<Versions />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

