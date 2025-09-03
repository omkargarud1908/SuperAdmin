import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

function Dashboard() {
  console.log('Dashboard: Component function called');
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    activeUsersLast7Days: 0,
    totalAuditLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Dashboard: Component mounted, fetching stats...');
    console.log('Dashboard: Current loading state:', loading);
    console.log('Dashboard: Current stats state:', stats);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Dashboard: Starting fetchStats...');
      setLoading(true);
      setError(null);
      console.log('Dashboard: Fetching stats from API...');
      const response = await analyticsAPI.getSummary();
      console.log('Dashboard: API response received:', response);
      console.log('Dashboard: Response data:', response.data);
      setStats(response.data);
      console.log('Dashboard: Stats state updated successfully');
    } catch (err) {
      console.error('Dashboard: API call failed:', err);
      console.error('Dashboard: Error details:', err.response?.data);
      console.error('Dashboard: Error status:', err.response?.status);
      setError('Failed to load dashboard statistics');
    } finally {
      console.log('Dashboard: Setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <LoadingSpinner text="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="welcome-text">Welcome to the Super Admin Dashboard</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
          <Link to="/users" className="stat-link">View Users</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔐</div>
          <div className="stat-content">
            <h3>{stats.totalRoles}</h3>
            <p>Total Roles</p>
          </div>
          <Link to="/roles" className="stat-link">View Roles</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.activeUsersLast7Days}</h3>
            <p>Active Users (7 days)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalAuditLogs}</h3>
            <p>Audit Logs</p>
          </div>
          <Link to="/audit-logs" className="stat-link">View Logs</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/users" className="action-btn">
            <span>👤</span>
            Manage Users
          </Link>
          <Link to="/audit-logs" className="action-btn">
            <span>📋</span>
            View Audit Logs
          </Link>
          <Link to="/analytics" className="action-btn">
            <span>📈</span>
            View Analytics
          </Link>
          <Link to="/email-reminders" className="action-btn">
            <span>📧</span>
            Email Reminders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
