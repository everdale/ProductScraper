import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../Layout';

/**
 * Profile Form Component
 * Allows users to view and update their profile information
 */
export default function ProfileForm() {
  const { user, profile, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Set initial form data from profile when available
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || ''
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
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { success, error } = await updateProfile(formData);
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: error || 'Failed to update profile.' 
        });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'An unexpected error occurred.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="auth-form-container">
        <h2>Your Profile</h2>
        
        {message.text && (
          <div className={`${message.type}-message`}>
            {message.text}
          </div>
        )}
        
        <div className="profile-basic-info">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          </div>
          
          <div className="profile-details">
            <h3>{profile?.first_name} {profile?.last_name}</h3>
            <p>{user?.email}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Your first name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Your last name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
} 