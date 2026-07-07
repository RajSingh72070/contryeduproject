import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all page components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UploadDocs = lazy(() => import('./pages/UploadDocs'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const AIChat = lazy(() => import('./pages/AIChat'));
const ChatHistory = lazy(() => import('./pages/ChatHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Premium Pulse Loading Skeleton screen
const PageSkeleton = () => (
  <div className="flex-1 p-8 space-y-6 animate-pulse bg-slate-950/10 min-h-[calc(100vh-120px)] flex flex-col">
    <div className="space-y-2">
      <div className="h-8 bg-slate-800/50 rounded-xl w-1/4"></div>
      <div className="h-4 bg-slate-800/30 rounded-lg w-1/3"></div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
      <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
      <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
      <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
    </div>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <div className="h-72 bg-slate-800/40 rounded-2xl lg:col-span-1"></div>
      <div className="h-72 bg-slate-800/40 rounded-2xl lg:col-span-2"></div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Dashboard Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<AIChat />} />
                <Route path="/chat-history" element={<ChatHistory />} />
                <Route path="/upload" element={<UploadDocs />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard/admin" element={<AdminPanel />} />
              </Route>

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
