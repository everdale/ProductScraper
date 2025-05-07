/**
 * Dashboard Component
 * 
 * Example component for a protected dashboard page
 */

import React from 'react';
import { useAuth } from '../components/auth';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-welcome">
        <h2>Welcome, {profile?.first_name || user?.email}</h2>
        <p>You are now logged in and can access protected features.</p>
      </div>

      <div className="dashboard-actions">
        <Link to="/profile" className="dashboard-link">Edit Profile</Link>
        <button onClick={signOut} className="signout-button">Sign Out</button>
      </div>

      <div className="dashboard-content">
        <h3>Your Activity</h3>
        <p>This is a placeholder for your dashboard content.</p>
        <p>Build your application specific features here!</p>
      </div>
    </div>
  );
};

export default Dashboard; 