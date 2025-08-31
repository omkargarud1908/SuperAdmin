import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AuditLogs.css';

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    userName: '',
    userEmail: '',
    action: '',
    targetType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/superadmin/audit-logs?${params}`);
      console.log("Audit Logs Response:", response.data.auditLogs); // ✅ Debug log
      console.log("Filters applied:", filters); // Debug filters
      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load audit logs';
      setError(errorMessage);
      console.error('Audit logs error:', err);
      
      // Log detailed error information
      if (err.response?.data) {
        console.error('Error response data:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} = ${value}`); // Debug log
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      userName: '',
      userEmail: '',
      action: '',
      targetType: '',
      startDate: '',
      endDate: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE': '#27ae60',
      'UPDATE': '#f39c12',
      'DELETE': '#e74c3c',
      'LOGIN': '#3498db',
      'ASSIGN_ROLE': '#9b59b6',
      'REMOVE_ROLE': '#e67e22',
      'CREATE_ROLE': '#27ae60',
      'UPDATE_ROLE': '#f39c12',
      'DELETE_ROLE': '#e74c3c'
    };
    return colors[action] || '#95a5a6';
  };

  const safeRender = (value) => {
    if (value == null) return '-';
    if (typeof value === 'string' || typeof value === 'number') return value;
    return JSON.stringify(value); // fallback if it's an object
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="audit-logs">
        <h1>Audit Logs</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="audit-logs">
      <h1>Audit Logs</h1>
      
      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>User Name:</label>
            <input
              type="text"
              name="userName"
              value={filters.userName}
              onChange={handleFilterChange}
              placeholder="Enter user name"
            />
          </div>
          
          <div className="filter-group">
            <label>User Email:</label>
            <input
              type="text"
              name="userEmail"
              value={filters.userEmail}
              onChange={handleFilterChange}
              placeholder="Enter user email"
            />
          </div>
          
          <div className="filter-group">
            <label>Target Type:</label>
            <select name="targetType" value={filters.targetType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="USER">User</option>
              <option value="ROLE">Role</option>
              <option value="USER_ROLE">User Role</option>
              <option value="SETTING">Setting</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Action:</label>
            <select name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="ASSIGN_ROLE">Assign Role</option>
              <option value="REMOVE_ROLE">Remove Role</option>
              <option value="CREATE_ROLE">Create Role</option>
              <option value="UPDATE_ROLE">Update Role</option>
              <option value="DELETE_ROLE">Delete Role</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {/* Audit Logs Table */}
      <div className="audit-logs-table">
        {auditLogs.length === 0 ? (
          <div className="no-logs">
            <p>No audit logs found with the current filters.</p>
            <p>Try adjusting your filter criteria or check if there are any logs in the system.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>
                    {log.actor ? (
                      <div className="user-info">
                        <span className="user-name">{safeRender(log.actor.name)}</span>
                        <span className="user-email">{safeRender(log.actor.email)}</span>
                      </div>
                    ) : (
                      'Unknown User'
                    )}
                  </td>
                  <td>
                    <span 
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(log.action) }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>{safeRender(log.targetType)}</td>
                  <td>{safeRender(log.targetId)}</td>
                  <td className="details-cell">
                    {safeRender(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages} 
            ({pagination.total} total entries)
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
