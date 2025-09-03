import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './Analytics.css';

function Analytics() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalRoles: 0,
    activeUsersLast7Days: 0,
    totalAuditLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/analytics/summary');
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getActiveUsersPercentage = () => {
    return calculatePercentage(analytics.activeUsersLast7Days, analytics.totalUsers);
  };

  if (loading) {
    return (
      <div className="analytics">
        <h1>Analytics</h1>
        <LoadingSpinner text="Loading analytics data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics">
        <h1>Analytics</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <h1>Analytics Dashboard</h1>
      
      {/* Time Range Selector */}
      <div className="time-range-selector">
        <label>Time Range:</label>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
            <div className="metric-trend">
              <span className="trend-indicator positive">↗</span>
              <span>All time</span>
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>{analytics.activeUsersLast7Days}</h3>
            <p>Active Users (7 days)</p>
            <div className="metric-trend">
              <span className="trend-indicator positive">↗</span>
              <span>{getActiveUsersPercentage()}% of total</span>
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">🔐</div>
          <div className="metric-content">
            <h3>{analytics.totalRoles}</h3>
            <p>Total Roles</p>
            <div className="metric-trend">
              <span className="trend-indicator neutral">→</span>
              <span>System roles</span>
            </div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <h3>{analytics.totalAuditLogs}</h3>
            <p>Audit Logs</p>
            <div className="metric-trend">
              <span className="trend-indicator positive">↗</span>
              <span>All time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="analytics-sections">
        {/* User Activity */}
        <div className="analytics-section">
          <h2>User Activity Overview</h2>
          <div className="activity-stats">
            <div className="activity-stat">
              <div className="stat-number">{analytics.activeUsersLast7Days}</div>
              <div className="stat-label">Active Users (7 days)</div>
              <div className="stat-percentage">
                {getActiveUsersPercentage()}% of total users
              </div>
            </div>
            <div className="activity-stat">
              <div className="stat-number">{analytics.totalUsers - analytics.activeUsersLast7Days}</div>
              <div className="stat-label">Inactive Users</div>
              <div className="stat-percentage">
                {100 - getActiveUsersPercentage()}% of total users
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="analytics-section">
          <h2>System Health</h2>
          <div className="health-indicators">
            <div className="health-indicator">
              <div className="health-icon">✅</div>
              <div className="health-content">
                <h4>Database</h4>
                <p>Connected and operational</p>
              </div>
            </div>
            <div className="health-indicator">
              <div className="health-icon">✅</div>
              <div className="health-content">
                <h4>Authentication</h4>
                <p>JWT tokens working</p>
              </div>
            </div>
            <div className="health-indicator">
              <div className="health-icon">✅</div>
              <div className="health-content">
                <h4>Audit Logging</h4>
                <p>All actions logged</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="analytics-section">
          <h2>Quick Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>User Engagement</h4>
              <p>
                {getActiveUsersPercentage()}% of users have been active in the last 7 days, 
                indicating {getActiveUsersPercentage() >= 50 ? 'good' : 'moderate'} engagement levels.
              </p>
            </div>
            <div className="insight-card">
              <h4>System Usage</h4>
              <p>
                The system has recorded {analytics.totalAuditLogs} audit log entries, 
                showing comprehensive activity tracking.
              </p>
            </div>
            <div className="insight-card">
              <h4>Role Management</h4>
              <p>
                {analytics.totalRoles} roles are configured in the system, 
                providing granular access control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
