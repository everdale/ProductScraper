/**
 * Dashboard Component
 * 
 * Main dashboard for the application showing available features
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth';
import Layout from './Layout';

const FeatureCard = ({ title, description, icon, link }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
    <Link to={link} className="feature-link">
      Open
    </Link>
  </div>
);

const Dashboard = () => {
  const { user, profile } = useAuth();

  const features = [
    {
      title: 'Product Crawler',
      description: 'Extract product data from e-commerce websites',
      icon: '🕸️',
      link: '/crawler'
    },
    {
      title: 'Profile',
      description: 'Manage your account settings and preferences',
      icon: '👤',
      link: '/profile'
    },
    // Add more features as needed
  ];

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <h1>Dashboard</h1>
          <h2>Welcome, {profile?.first_name || user?.email}</h2>
          <p>Select a feature to get started</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              link={feature.link}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 