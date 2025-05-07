import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Login Form Component
 * Allows users to sign in to their account
 */
export default function LoginForm({ onSuccess, redirectTo }) {
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError(''); 
    
    // Validate form input
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    // Proceed with login
    try {
      setLoading(true);
      
      const { success, error: resultError } = await signIn(email, password);
      
      if (success) {
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(resultError || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      setLoading(true);
      setError('');
      
      const { success, data, error: resultError } = await signInWithProvider(provider);
      
      if (!success) {
        setError(resultError || `Failed to sign in with ${provider}`);
      }
      // No need for success handling as user will be redirected to OAuth provider
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Sign In</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            required
          />
        </div>
        
        <div className="forgot-password">
          <a href="/reset-password">Forgot your password?</a>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>OR</span>
      </div>
      
      <div className="oauth-buttons">
        <button 
          type="button" 
          className="btn btn-oauth btn-google" 
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
        >
          Sign in with Google
        </button>
      </div>
      
      <div className="auth-links">
        Don't have an account? <a href={redirectTo || '/signup'}>Sign Up</a>
      </div>
    </div>
  );
} 