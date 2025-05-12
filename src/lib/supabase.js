/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client with the project URL and anonymous key.
 * It exports the client for use throughout the application.
 * 
 * Make sure to set the REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables
 * in your .env file or deployment environment.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables for Supabase configuration
// In a development environment, these would come from a .env file
// In production, they should be set in the hosting platform
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Error: Supabase environment variables are missing. Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'svea-auth',
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'implicit',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
    debug: process.env.NODE_ENV !== 'production',
  },
  global: {
    fetch: (...args) => {
      const [url, options = {}] = args;
      
      // Log the request in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Supabase Request: ${options.method || 'GET'} ${url}`);
        if (options.body) {
          try {
            console.log('Request Body:', JSON.parse(options.body));
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
      
      return fetch(...args);
    }
  }
});

// Helper function for handling Supabase errors consistently
const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error.message);
  // You can add more error handling logic here, such as sending to a monitoring service
  return { error: error.message || 'An unexpected error occurred' };
};

// Helper function to execute SQL directly (use with caution - requires appropriate permissions)
const executeSql = async (sqlQuery) => {
  try {
    // First try using RPC (stored procedure) if available
    const { data, error } = await supabase.rpc('execute_sql', { query: sqlQuery });
    
    if (error) {
      console.error('Error executing SQL via RPC:', error);
      
      // If RPC fails, try a direct approach
      // This might not work depending on your Supabase setup and permissions
      // Most free/basic plans don't allow direct SQL unless using the SQL editor
      console.log('Attempting alternative SQL execution method...');
      
      // This is a fallback that might not work depending on permissions
      const { error: directError } = await supabase.from('_sql').select('*').eq('query', sqlQuery);
      
      if (directError) {
        console.error('Error executing SQL directly:', directError);
        return { 
          error: 'Could not execute SQL. Please use the Supabase dashboard to run this SQL manually.',
          sqlQuery
        };
      }
      
      return { success: true };
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Helper function to create a table if it doesn't exist
const createTableIfNotExists = async (tableName, tableSchema) => {
  try {
    // Check if table exists
    const { error: checkError } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    // If table doesn't exist, create it
    if (checkError && checkError.code === '42P01') { // PostgreSQL code for relation does not exist
      console.log(`Table '${tableName}' does not exist. Creating it now...`);
      
      const sqlQuery = `
        CREATE TABLE IF NOT EXISTS public.${tableName} (
          ${tableSchema}
        );
      `;
      
      const { error } = await executeSql(sqlQuery);
      
      if (error) {
        console.error(`Error creating table '${tableName}':`, error);
        return { error: `Failed to create table '${tableName}': ${error.message || 'Unknown error'}` };
      }
      
      console.log(`Table '${tableName}' created successfully`);
      return { success: true };
    }
    
    if (checkError) {
      console.error(`Error checking if table '${tableName}' exists:`, checkError);
      return { error: checkError.message };
    }
    
    console.log(`Table '${tableName}' already exists`);
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Test Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.error('Connection error:', error);
      return { error: error.message };
    } else {
      console.log('Connected successfully, sample data:', data);
      return { success: true, data };
    }
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Comprehensive authentication helpers
const authHelpers = {
  // Sign up a new user
  signUp: async (email, password) => {
    try {
      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Invalid email format' };
      }
      
      // Validate password strength
      if (!isPasswordStrong(password)) {
        return { 
          error: 'Password is too weak. It should be at least 8 characters long and include uppercase, lowercase, number, and special character.' 
        };
      }
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) return handleSupabaseError(error);
      return { success: true, message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Sign in an existing user
  signIn: async (email, password) => {
    try {
      console.log('Attempting to sign in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        return handleSupabaseError(error);
      }
      
      console.log('Sign in successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Sign in exception:', error);
      return handleSupabaseError(error);
    }
  },

  // Sign out the current user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return handleSupabaseError(error);
      return { success: true };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Get the current user session
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },
  
  // Get the current user
  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return handleSupabaseError(error);
      return { data: data.user };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },
  
  // Reset password (send reset email)
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return handleSupabaseError(error);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },
  
  // Update password once user has reset token
  updatePassword: async (newPassword) => {
    try {
      if (!isPasswordStrong(newPassword)) {
        return { 
          error: 'Password is too weak. It should be at least 8 characters long and include uppercase, lowercase, number, and special character.' 
        };
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) return handleSupabaseError(error);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },
  
  // Handle OAuth login (Google, GitHub, etc.)
  signInWithProvider: async (provider) => {
    try {
      // Log the exact redirect URL being used
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('OAuth redirectTo URL:', redirectUrl);
      console.log('Window location origin:', window.location.origin);
      console.log('Full current URL:', window.location.href);
      console.log(`Auth provider being used: ${provider}`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) {
        console.error('OAuth error:', error);
        return handleSupabaseError(error);
      }
      return { success: true };
    } catch (error) {
      console.error('OAuth exception:', error);
      return handleSupabaseError(error);
    }
  },
  
  // Set up auth state change listener
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Password strength validation
function isPasswordStrong(password) {
  if (!password || password.length < 8) return false;
  
  // Check for uppercase, lowercase, number, and special char
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

// CSRF protection token
const generateCSRFToken = () => {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrf-token', token);
  }
  return token;
};

const validateCSRFToken = (token) => {
  if (typeof window !== 'undefined') {
    return token === localStorage.getItem('csrf-token');
  }
  return false;
};

// Helper function to check the authentication status
const checkAuth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return { authenticated: false, error: error.message };
    }
    
    if (!data.session) {
      console.warn('No active session found');
      return { authenticated: false };
    }
    
    console.log('Auth check successful, user authenticated:', data.session.user.id);
    return { 
      authenticated: true, 
      user: data.session.user,
      session: data.session
    };
  } catch (error) {
    console.error('Exception in checkAuth:', error);
    return { authenticated: false, error: error.message };
  }
};

// Export all the items
export {
  supabase,
  handleSupabaseError,
  executeSql,
  createTableIfNotExists,
  testConnection,
  authHelpers,
  generateCSRFToken,
  validateCSRFToken,
  checkAuth
}; 