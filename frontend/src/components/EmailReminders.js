import React, { useState, useEffect } from 'react';
import { emailRemindersAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './EmailReminders.css';

function EmailReminders() {
  const [stats, setStats] = useState(null);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [allInactiveUsers, setAllInactiveUsers] = useState([]);
  const [cronStatus, setCronStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load each endpoint separately to handle partial failures
      let statsData = null;
      let usersData = [];
      let allUsersData = [];
      let cronData = {};
      
      try {
        const statsRes = await emailRemindersAPI.getStats();
        statsData = statsRes.data.data;
        console.log('Stats loaded successfully:', statsData);
      } catch (err) {
        console.warn('Failed to load stats:', err);
        // Don't fail the entire component for stats
      }
      
      try {
        const usersRes = await emailRemindersAPI.getInactiveUsers();
        usersData = usersRes.data.data;
        console.log('Eligible users loaded successfully:', usersData);
      } catch (err) {
        console.warn('Failed to load eligible users:', err);
        // Don't fail the entire component for users
      }
      
      try {
        const allUsersRes = await emailRemindersAPI.getAllInactiveUsers();
        allUsersData = allUsersRes.data.data;
        console.log('All inactive users loaded successfully:', allUsersData);
      } catch (err) {
        console.warn('Failed to load all inactive users:', err);
        // Don't fail the entire component for users
      }
      
      try {
        const cronRes = await emailRemindersAPI.getCronStatus();
        cronData = cronRes.data.data;
        console.log('Cron status loaded successfully:', cronData);
      } catch (err) {
        console.warn('Failed to load cron status:', err);
        // Don't fail the entire component for cron status
      }
      
      // Only show error if ALL endpoints failed
      if (!statsData && usersData.length === 0 && allUsersData.length === 0 && Object.keys(cronData).length === 0) {
        setError('Failed to load email reminder data');
      } else {
        setStats(statsData);
        setInactiveUsers(usersData);
        setAllInactiveUsers(allUsersData);
        setCronStatus(cronData);
      }
      
    } catch (err) {
      console.error('Email reminders error:', err);
      setError('Failed to load email reminder data');
    } finally {
      setLoading(false);
    }
  };

  const sendReminderToUser = async (userId) => {
    try {
      setActionLoading(true);
      await emailRemindersAPI.sendReminderToUser(userId);
      setMessage('Reminder sent successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to send reminder');
      console.error('Send reminder error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const sendRemindersToAll = async () => {
    try {
      setActionLoading(true);
      const response = await emailRemindersAPI.sendRemindersToAll();
      setMessage(`Reminder campaign completed! ${response.data.data.successful} successful, ${response.data.data.failed} failed`);
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to send reminders');
      console.error('Send reminders error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const markUserActive = async (userId) => {
    try {
      setActionLoading(true);
      await emailRemindersAPI.markUserActive(userId);
      setMessage('User marked as active!');
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to mark user as active');
      console.error('Mark active error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const resetUserReminders = async (userId) => {
    try {
      setActionLoading(true);
      await emailRemindersAPI.resetUserReminders(userId);
      setMessage('User reminders reset successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to reset user reminders');
      console.error('Reset reminders error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const triggerReminderJob = async () => {
    try {
      setActionLoading(true);
      const response = await emailRemindersAPI.triggerReminderJob();
      setMessage('Reminder job triggered successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to trigger reminder job');
      console.error('Trigger job error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const restartCron = async () => {
    try {
      setActionLoading(true);
      await emailRemindersAPI.restartCron();
      setMessage('Cron jobs restarted successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setMessage('Failed to restart cron jobs');
      console.error('Restart cron error:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="email-reminders">
        <h1>Email Reminders</h1>
        <LoadingSpinner text="Loading email reminders" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-reminders">
        <h1>Email Reminders</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="email-reminders">
      {actionLoading && (
        <LoadingSpinner 
          text="Processing" 
          overlay={true} 
          size="medium"
        />
      )}
      
      <h1>Email Reminders</h1>
      
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Statistics Section */}
      <div className="stats-section">
        <h2>Inactive User Statistics</h2>
        {stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalInactive || 0}</div>
              <div className="stat-label">Total Inactive Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.usersWithReminders || 0}</div>
              <div className="stat-label">Users with Reminders</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.inactivityThreshold || 7}</div>
              <div className="stat-label">Inactivity Threshold (days)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.maxReminders || 3}</div>
              <div className="stat-label">Max Reminders per User</div>
            </div>
          </div>
        ) : (
          <div className="no-data">Statistics not available</div>
        )}
      </div>

      {/* Cron Job Status */}
      <div className="cron-section">
        <h2>Cron Job Status</h2>
        {cronStatus.jobs && Object.keys(cronStatus.jobs).length > 0 ? (
          <>
            <div className="cron-info">
              <div className="info-item">
                <strong>Initialized:</strong> {cronStatus.initialized ? '✅ Yes' : '❌ No'}
              </div>
              <div className="info-item">
                <strong>Timezone:</strong> {cronStatus.timezone || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Current Time:</strong> {cronStatus.currentTimeLocal || 'N/A'}
              </div>
            </div>
            <div className="cron-status">
              {Object.entries(cronStatus.jobs).map(([jobName, status]) => (
                <div key={jobName} className="cron-job">
                  <div className="job-name">{jobName}</div>
                  <div className={`job-status ${status.status === 'scheduled' || status.status === 'running' || status.status === 'completed' ? 'running' : 'stopped'}`}>
                    {status.status === 'scheduled' ? '🟡 Scheduled' : 
                     status.status === 'running' ? '🟢 Running' : 
                     status.status === 'completed' ? '✅ Completed' :
                     status.status === 'failed' ? '❌ Failed' : '🔴 Stopped'}
                  </div>
                  <div className="job-details">
                    <div>Description: {status.description || 'N/A'}</div>
                    <div>Status: {status.status || 'unknown'}</div>
                    <div>Next Run: {status.nextRun || 'N/A'}</div>
                    <div>Last Run: {status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}</div>
                    {status.error && <div className="error">Error: {status.error}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="cron-actions">
              <button 
                onClick={triggerReminderJob} 
                disabled={actionLoading}
                className="btn btn-primary"
              >
                {actionLoading ? 'Triggering...' : 'Trigger Reminder Job'}
              </button>
              <button 
                onClick={restartCron} 
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                {actionLoading ? 'Restarting...' : 'Restart Cron Jobs'}
              </button>
            </div>
          </>
        ) : (
          <div className="no-data">Cron status not available</div>
        )}
      </div>

      {/* Inactive Users Section */}
      <div className="users-section">
        <div className="section-header">
          <h2>Inactive Users</h2>
          {inactiveUsers && inactiveUsers.length > 0 && (
            <button 
              onClick={sendRemindersToAll} 
              disabled={actionLoading}
              className="btn btn-primary"
            >
              {actionLoading ? 'Sending...' : `Send Reminders to All Eligible (${inactiveUsers.length})`}
            </button>
          )}
        </div>
        
        {!allInactiveUsers || allInactiveUsers.length === 0 ? (
          <div className="no-users">No inactive users found</div>
        ) : (
          <div className="users-table">
            <div className="table-info">
              <p>
                Showing {allInactiveUsers.length} inactive users. 
                {inactiveUsers.length > 0 ? (
                  <span className="eligible-info"> {inactiveUsers.length} are eligible for reminders.</span>
                ) : (
                  <span className="no-eligible-info"> None are currently eligible for reminders (may have received recent reminders or reached max limit).</span>
                )}
              </p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Last Activity</th>
                  <th>Last Login</th>
                  <th>Last Reminder</th>
                  <th>Reminder Count</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInactiveUsers.map(user => {
                  const isEligible = inactiveUsers.some(eligibleUser => eligibleUser.id === user.id);
                  return (
                    <tr key={user.id} className={isEligible ? 'eligible-user' : 'not-eligible-user'}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.lastActivity 
                          ? new Date(user.lastActivity).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td>
                        {user.lastReminderSent 
                          ? new Date(user.lastReminderSent).toLocaleDateString()
                          : 'None'
                        }
                      </td>
                      <td>{user.reminderCount}</td>
                      <td>
                        {isEligible ? (
                          <span className="status-eligible">✅ Eligible</span>
                        ) : (
                          <span className="status-not-eligible">⏳ Not Eligible</span>
                        )}
                      </td>
                      <td className="actions">
                        <button 
                          onClick={() => sendReminderToUser(user.id)}
                          disabled={actionLoading || !isEligible}
                          className={`btn btn-sm ${isEligible ? 'btn-primary' : 'btn-secondary'}`}
                          title={!isEligible ? 'User not eligible for reminders (recent reminder or max reached)' : ''}
                        >
                          Send Reminder
                        </button>
                        <button 
                          onClick={() => markUserActive(user.id)}
                          disabled={actionLoading}
                          className="btn btn-sm btn-success"
                        >
                          Mark Active
                        </button>
                        <button 
                          onClick={() => resetUserReminders(user.id)}
                          disabled={actionLoading}
                          className="btn btn-sm btn-warning"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailReminders;
