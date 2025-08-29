import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    activeUsersLast7Days: 0,
    totalAuditLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/analytics/summary');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="loading">Loading...</div>
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
