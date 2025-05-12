import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route Component
 * A wrapper component that restricts access to authenticated users
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectTo = '/login',
  fallback = null
}) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timeoutId;
    
    // Don't do anything while auth is still loading
    if (loading) {
      return;
    }
    
    // Give a little delay to prevent flickering during hot reloads
    timeoutId = setTimeout(() => {
      // Check if user is authenticated after auth is loaded
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        // Only redirect if fallback is not provided
        if (!fallback) {
          // Redirect to login with return URL
          navigate(
            `${redirectTo}?returnUrl=${encodeURIComponent(location.pathname)}`,
            { replace: true }
          );
        }
      } 
      // If route requires admin access, check admin status
      else if (requireAdmin && !isAdmin) {
        console.log('User is not admin, redirecting to unauthorized');
        // Redirect to home or unauthorized page
        navigate('/unauthorized', { replace: true });
      } else {
        console.log('User authenticated successfully:', user?.email);
      }
      
      setIsChecking(false);
    }, 50); // Short timeout to ensure consistent behavior
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isAdmin, loading, navigate, location.pathname, redirectTo, requireAdmin, user, fallback]);

  // Show loading state while checking auth
  if (loading || isChecking) {
    return <div className="loading">Loading...</div>;
  }

  // If we've checked and user is not authenticated and fallback is provided
  if (!isAuthenticated && fallback) {
    return fallback;
  }

  // If we've checked and not redirected, render the children
  return children;
} 