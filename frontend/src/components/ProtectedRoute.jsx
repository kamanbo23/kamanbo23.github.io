import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  // Not authenticated at all - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route and not an admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and meets role requirements
  return children;
};

export default ProtectedRoute; 