/**
 * Authentication Middleware
 * 
 * This middleware handles token validation and user authentication for API routes.
 * It can be used to protect routes that require authentication.
 */

import { supabase, validateCSRFToken } from '../lib/supabase';

/**
 * Middleware to verify user is authenticated
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // Check if the authorization header exists and is properly formatted
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Missing or invalid authorization header'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: error?.message || 'Invalid or expired token'
      });
    }
    
    // Attach the user to the request object for use in route handlers
    req.user = data.user;
    
    // Continue to the next middleware or route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error', 
      message: 'An unexpected error occurred during authentication'
    });
  }
};

/**
 * Middleware to verify the user has admin role
 * This should be used after requireAuth middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const requireAdmin = (req, res, next) => {
  try {
    // First make sure user is authenticated and req.user exists
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User is not authenticated'
      });
    }
    
    // Check if the user has admin role in app_metadata
    const isAdmin = req.user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin privileges required'
      });
    }
    
    // User is an admin, proceed
    next();
    
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      error: 'Authorization error', 
      message: 'An unexpected error occurred during authorization'
    });
  }
};

/**
 * Middleware to validate CSRF token
 * This protects against Cross-Site Request Forgery attacks
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateCSRF = (req, res, next) => {
  try {
    // Get the CSRF token from the request header
    const csrfToken = req.headers['x-csrf-token'];
    
    // Check if the token exists and is valid
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Invalid or missing CSRF token'
      });
    }
    
    // Token is valid, proceed
    next();
    
  } catch (error) {
    console.error('CSRF middleware error:', error);
    return res.status(500).json({ 
      error: 'Security error', 
      message: 'An unexpected error occurred during CSRF validation'
    });
  }
};

/**
 * Middleware to check if email is verified
 * This should be used after requireAuth middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const requireEmailVerified = (req, res, next) => {
  try {
    // First make sure user is authenticated and req.user exists
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User is not authenticated'
      });
    }
    
    // Check if the user's email is verified
    if (!req.user.email_confirmed_at) {
      return res.status(403).json({ 
        error: 'Email verification required', 
        message: 'Please verify your email address'
      });
    }
    
    // Email is verified, proceed
    next();
    
  } catch (error) {
    console.error('Email verification middleware error:', error);
    return res.status(500).json({ 
      error: 'Verification error', 
      message: 'An unexpected error occurred during email verification check'
    });
  }
}; 