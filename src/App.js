/**
 * Main App Component
 * 
 * Sets up routing and authentication for the application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AuthProvider, 
  LoginForm, 
  SignupForm, 
  ResetPasswordForm, 
  UpdatePasswordForm,
  ProfileForm,
  ProtectedRoute,
} from './components/auth';
import Dashboard from './components/Dashboard';
import TestPage from './TestPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/update-password" element={<UpdatePasswordForm />} />
            <Route path="/test" element={<TestPage />} />
            
            {/* Protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileForm />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Redirect to login for root path */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 