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
    userId: '',
    action: '',
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
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/api/v1/superadmin/audit-logs?${params}`);
      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
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
      userId: '',
      action: '',
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
      'ASSIGN_ROLE': '#9b59b6'
    };
    return colors[action] || '#95a5a6';
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
            <label>User ID:</label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Enter user ID"
            />
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
                      <span className="user-name">{log.actor.name}</span>
                      <span className="user-email">{log.actor.email}</span>
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
                <td>{log.targetType}</td>
                <td>{log.targetId}</td>
                <td className="details-cell">
                  {log.details || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
