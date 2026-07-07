import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Animated Spinner with glassmorphism ring */}
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin"></div>
          <div className="absolute w-12 h-12 rounded-full bg-slate-950/40 backdrop-blur-sm"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide animate-pulse">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect user to the login page but store the current location so they can go back after logging in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
