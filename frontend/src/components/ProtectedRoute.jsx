import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

// Redirects to login if not authenticated, or to home if wrong role
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    // Token exists but user not yet restored — just render children
    // (App.jsx handles token decode on load)
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    const dashMap = { ADMIN: '/admin', TRAINER: '/trainer', STUDENT: '/student' };
    return <Navigate to={dashMap[user.role] || '/login'} replace />;
  }

  return children;
}
