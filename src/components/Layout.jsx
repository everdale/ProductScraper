import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './auth';

/**
 * Layout Component
 * Provides consistent layout structure across the application
 */
const Layout = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Determine active tab
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="main-layout">
      <header className="main-header">
        <Link to="/" className="header-logo">
          <span className="logo-icon">📊</span>
          <span>ShopWise</span>
        </Link>
        
        <nav className="header-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/crawler" 
            className={`nav-link ${isActive('/crawler') ? 'active' : ''}`}
          >
            Store Manager
          </Link>
        </nav>
        
        <div className="header-actions">
          {user && (
            <>
              <Link 
                to="/profile" 
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                Profile
              </Link>
              <button onClick={signOut} className="sign-out-button">
                Sign Out
              </button>
            </>
          )}
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="main-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} ShopWise - Compare products across e-commerce sites</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 