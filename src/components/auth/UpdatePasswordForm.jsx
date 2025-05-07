import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Update Password Form Component
 * Allows users to set a new password after reset
 */
export default function UpdatePasswordForm({ onSuccess, redirectTo }) {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setMessage('');
    
    // Validate form input
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    // Check password match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Proceed with password update
    try {
      setLoading(true);
      
      const { success, message: resultMessage, error: resultError } = await updatePassword(newPassword);
      
      if (success) {
        setMessage(resultMessage || 'Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(resultError || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Set New Password</h2>
      
      {message && (
        <div className="success-message">
          {message}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            disabled={loading}
            required
          />
          <small className="password-requirements">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={loading}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      
      <div className="auth-links">
        <a href={redirectTo || '/login'}>Back to Sign In</a>
      </div>
    </div>
  );
} 