import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const userStr = localStorage.getItem('user');

  // Redirect to login if no token
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check user role
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || user.role !== 'admin') {
      localStorage.clear();
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;

