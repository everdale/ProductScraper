import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Profile Form Component
 * Allows users to view and update their profile information
 */
export default function ProfileForm() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load profile data when available
  useEffect(() => {
    if (profile?.profile_data) {
      setFormData({
        fullName: profile.profile_data.fullName || '',
        phoneNumber: profile.profile_data.phoneNumber || '',
        address: profile.profile_data.address || '',
        bio: profile.profile_data.bio || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setMessage('');
    
    // Proceed with profile update
    try {
      setLoading(true);
      
      const { success, error: resultError } = await updateProfile({
        profile_data: {
          ...profile?.profile_data,
          ...formData
        }
      });
      
      if (success) {
        setMessage('Profile updated successfully!');
      } else {
        setError(resultError || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If no user or still loading auth, show loading state
  if (authLoading) {
    return <div className="loading">Loading profile...</div>;
  }
  
  // If no user, show not logged in message
  if (!user) {
    return <div className="error-message">You must be logged in to view your profile</div>;
  }

  return (
    <div className="profile-form-container">
      <h2>Your Profile</h2>
      
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
      
      <div className="profile-basic-info">
        <div className="profile-avatar">
          {/* Display user initial or avatar */}
          <div className="avatar-placeholder">
            {user.email.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="profile-details">
          <h3>{formData.fullName || 'User'}</h3>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter your phone number"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            disabled={loading}
            rows={4}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
      
      <div className="profile-security-section">
        <h3>Security</h3>
        <div className="security-links">
          <a href="/change-password" className="security-link">Change Password</a>
          <a href="/account-settings" className="security-link">Account Settings</a>
        </div>
      </div>
    </div>
  );
} 