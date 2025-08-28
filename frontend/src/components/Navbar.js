import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    onLogout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">SuperAdmin</span>
          </Link>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          
          <Link 
            to="/users" 
            className={`nav-link ${isActive('/users') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="nav-icon">👥</span>
            Users
          </Link>
          
          <Link 
            to="/audit-logs" 
            className={`nav-link ${isActive('/audit-logs') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="nav-icon">📋</span>
            Audit Logs
          </Link>
          
          <Link 
            to="/analytics" 
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">{user?.roles?.includes('superadmin') ? 'Super Admin' : 'Admin'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
