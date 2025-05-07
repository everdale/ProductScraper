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
  redirectTo = '/login'
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth to initialize
    if (!loading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Redirect to login with return URL
        navigate(
          `${redirectTo}?returnUrl=${encodeURIComponent(location.pathname)}`,
          { replace: true }
        );
      } 
      // If route requires admin access, check admin status
      else if (requireAdmin && !isAdmin) {
        // Redirect to home or unauthorized page
        navigate('/unauthorized', { replace: true });
      }
      
      setIsChecking(false);
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location.pathname, redirectTo, requireAdmin]);

  // Show loading state while checking auth
  if (loading || isChecking) {
    return <div className="loading">Loading...</div>;
  }

  // If we've checked and not redirected, render the children
  return children;
} 