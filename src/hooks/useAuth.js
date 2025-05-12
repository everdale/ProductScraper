/**
 * Authentication Hook
 * 
 * A custom React hook for managing authentication state and providing auth methods.
 * This centralizes all auth-related functionality for components.
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, authHelpers, generateCSRFToken } from '../lib/supabase';
import profileService from '../lib/profileService';

// Create an auth context
const AuthContext = createContext(null);

/**
 * AuthProvider component for wrapping application with auth context
 */
export const AuthProvider = ({ children }) => {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Hook for consuming auth context in components
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Main authentication logic hook
 */
function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and set up auth listener on mount
  useEffect(() => {
    let mounted = true;
    
    // Check for existing session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        console.log('Checking for existing session...');
        
        const { data, error } = await authHelpers.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (data?.session?.user) {
          console.log('Existing session found:', data.session.user);
          setUser(data.session.user);
          
          // Fetch user's profile
          try {
            const { data: profileData } = await profileService.getCurrentProfile();
            if (profileData) {
              setProfile(profileData);
              console.log('Profile loaded for existing session:', profileData);
            } else {
              console.log('No profile found for the user, may need to create one');
            }
          } catch (profileErr) {
            console.error('Error fetching profile for existing session:', profileErr);
          }
          setLoading(false);
        } else {
          console.log('No existing session found');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    
    getInitialSession();
    
    // Set up auth change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log(`Auth event in hook: ${event}`, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, updating user state:', session.user);
          setUser(session.user);
          
          // Fetch user's profile
          try {
            const { data: profileData } = await profileService.getCurrentProfile();
            if (profileData) {
              console.log('User profile loaded:', profileData);
              setProfile(profileData);
            } else {
              console.log('No profile data found for user');
            }
          } catch (err) {
            console.error('Error fetching profile after sign in:', err);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('User signed out or deleted, clearing state');
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, session updated');
          if (session?.user) {
            setUser(session.user);
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('User updated, refreshing user state:', session.user);
          setUser(session.user);
          
          // Refresh profile data
          try {
            const { data: profileData } = await profileService.getCurrentProfile();
            if (profileData) {
              console.log('Updated profile loaded:', profileData);
              setProfile(profileData);
            }
          } catch (err) {
            console.error('Error fetching profile after user update:', err);
          }
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authHelpers.signUp(email, password);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      // Note: User won't be signed in immediately if email confirmation is required
      return { 
        success: true, 
        message: result.message || 'Account created successfully' 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in a user
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate CSRF token for future requests
      generateCSRFToken();
      
      const result = await authHelpers.signIn(email, password);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with OAuth provider
   */
  const signInWithProvider = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authHelpers.signInWithProvider(provider);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authHelpers.signOut();
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authHelpers.resetPassword(email);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { 
        success: true, 
        message: result.message || 'Password reset email sent' 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authHelpers.updatePassword(newPassword);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { 
        success: true, 
        message: result.message || 'Password updated successfully' 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await profileService.updateProfile(updates);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      // Update local profile state
      setProfile(data);
      
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role) => {
    return user?.app_metadata?.role === role;
  };

  // Return the authentication state and methods
  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole
  };
} 