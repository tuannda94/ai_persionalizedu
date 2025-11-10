/**
 * Authentication utilities for Student App
 */

export function checkAuthStatus() {
  const isAuthenticated = localStorage.getItem('is_authenticated') === 'true';
  const userStr = localStorage.getItem('user');
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }

  return { isAuthenticated, user };
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.setItem('is_authenticated', 'false');
}

export function setAuth(user, tokens) {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('user_id', user.id);
  localStorage.setItem('is_authenticated', 'true');
}

