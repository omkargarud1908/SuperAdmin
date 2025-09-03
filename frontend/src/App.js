import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Roles from './components/Roles';
import AuditLogs from './components/AuditLogs';
import Analytics from './components/Analytics';
import EmailReminders from './components/EmailReminders';
import Navbar from './components/Navbar';
import { authAPI } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('App: Checking auth status...');
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('App: Token exists:', !!token);
    console.log('App: Saved user exists:', !!savedUser);

    if (token && savedUser) {
      try {
        console.log('App: Validating token with API...');
        const response = await authAPI.getCurrentUser();
        console.log('App: Token validation successful:', response.data);
        setUser(response.data.user);
      } catch (error) {
        console.log('App: Token validation failed:', error);
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('App: No token or user found in localStorage');
    }
    console.log('App: Setting loading to false');
    setLoading(false);
  };

  const handleLogin = (userData) => {
    console.log('App: User logged in successfully:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    console.log('App: Still loading auth status...');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('App: No user found, showing login page');
    return <Login onLogin={handleLogin} />;
  }

  console.log('App: User authenticated, rendering main app:', user);

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/email-reminders" element={<EmailReminders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;