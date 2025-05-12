/**
 * Main App Component
 * 
 * Sets up routing and authentication for the application
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import StoreDashboard from './components/crawler/CrawlerDashboard';
import ConfigureCrawler from './components/crawler/ConfigureCrawler';
import Products from './components/crawler/Products';
import TestPage from './TestPage';
import { supabase } from './lib/supabase';

// Auth callback handler component
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  
  useEffect(() => {
    console.log('AuthCallback mounted - handling OAuth callback');
    console.log('Current URL:', window.location.href);
    
    // Extract return URL from URL hash fragment if present
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);
    
    // Check both hash and query parameters for returnUrl
    const returnUrl = hashParams.get('returnUrl') || 
                      queryParams.get('returnUrl') || 
                      '/dashboard';
                      
    console.log('Return URL from params:', returnUrl);
    
    // Handle the OAuth callback
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event in callback: ${event}`, session);
      
      if (event === 'SIGNED_IN' && session) {
        // Log success and redirect to dashboard or return URL
        console.log('Successfully authenticated in callback, session:', session);
        console.log('Redirecting to:', returnUrl);
        
        // Short delay to ensure session is properly stored
        setTimeout(() => {
          setIsProcessing(false);
          navigate(returnUrl, { replace: true });
        }, 300);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out in callback');
        setIsProcessing(false);
        navigate('/login', { replace: true });
      }
    });

    // Also check current session immediately
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Current session check in callback:', data);
        
        if (data?.session) {
          console.log('Session exists, redirecting to:', returnUrl);
          
          // Short delay to ensure session is properly stored
          setTimeout(() => {
            setIsProcessing(false);
            navigate(returnUrl, { replace: true });
          }, 300);
        } else {
          // No session found, continue waiting for auth events
          console.log('No session found in callback, waiting for auth events...');
          
          // Set a timeout to avoid hanging indefinitely
          setTimeout(() => {
            if (isProcessing) {
              console.log('Callback timeout reached, redirecting to login');
              setIsProcessing(false);
              navigate('/login', { replace: true });
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error checking session in callback:', error);
        setIsProcessing(false);
        navigate('/login', { replace: true });
      }
    };
    
    checkSession();

    // Clean up the subscription when component unmounts
    return () => {
      console.log('AuthCallback unmounting, cleaning up listener');
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, location, isProcessing]);

  return <div className="loading">Processing authentication, please wait...</div>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm redirectTo="/dashboard" />} />
            <Route path="/signup" element={<SignupForm redirectTo="/dashboard" />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/update-password" element={<UpdatePasswordForm redirectTo="/dashboard" />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfileForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crawler" 
              element={
                <ProtectedRoute>
                  <StoreDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crawler/configure/:id" 
              element={
                <ProtectedRoute>
                  <ConfigureCrawler />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crawler/products/:id" 
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              } 
            />
            
            {/* Test page */}
            <Route path="/test" element={<TestPage />} />
            
            {/* Redirect to dashboard if already logged in, otherwise to login */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute fallback={<Navigate to="/login" />}>
                  <Navigate to="/dashboard" />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 