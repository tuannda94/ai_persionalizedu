import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  InboxOutlined,
  BarChartOutlined,
  MessageOutlined,
  FolderOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
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
// Ant Design CSS
import 'antd/dist/reset.css';

const { Header, Sider, Content } = Layout;

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Button
      type="text"
      danger
      icon={<LogoutOutlined />}
      onClick={handleLogout}
    >
      Đăng xuất
    </Button>
  );
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
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

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link to="/users">Users</Link>,
    },
    {
      key: '/versions',
      icon: <FileTextOutlined />,
      label: <Link to="/versions">Versions</Link>,
    },
    {
      key: '/packages',
      icon: <InboxOutlined />,
      label: <Link to="/packages">Packages</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link to="/analytics">Analytics</Link>,
    },
    {
      key: '/feedback',
      icon: <MessageOutlined />,
      label: <Link to="/feedback">Feedback</Link>,
    },
    {
      key: '/documents',
      icon: <FolderOutlined />,
      label: <Link to="/documents">Documents</Link>,
    },
  ];

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AuthStatus />
              <Layout style={{ minHeight: '100vh' }}>
                <Sider
                  trigger={null}
                  collapsible
                  collapsed={collapsed}
                  style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                  }}
                >
                  <div
                    style={{
                      height: 32,
                      margin: 16,
                      background: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    {collapsed ? 'AI' : 'AI Admin'}
                  </div>
                  <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['/']}
                    items={menuItems}
                  />
                </Sider>
                <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
                  <Header
                    style={{
                      padding: '0 24px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Button
                      type="text"
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setCollapsed(!collapsed)}
                      style={{
                        fontSize: '16px',
                        width: 64,
                        height: 64,
                      }}
                    />
                    <Space>
                      <LogoutButton />
                    </Space>
                  </Header>
                  <Content
                    style={{
                      margin: '24px 16px',
                      padding: 24,
                      minHeight: 280,
                      background: '#fff',
                      borderRadius: 8,
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/versions" element={<Versions />} />
                      <Route path="/packages" element={<Packages />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/documents" element={<Documents />} />
                    </Routes>
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

