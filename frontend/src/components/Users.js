import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await usersAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search: e.target.search.value }));
  };

  const handleRoleFilter = (role) => {
    setFilters(prev => ({ ...prev, page: 1, role: role || '' }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(userId);
        setError('');
        fetchUsers(); // Refresh the list
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updateUser(editingUser.id, editForm);
      setShowEditModal(false);
      setEditingUser(null);
      setError('');
      fetchUsers(); // Refresh the list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Management</h2>
      
      <div className="filters">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            name="search"
            placeholder="Search users..."
          />
          <button type="submit">Search</button>
        </form>
        
        <div className="role-filters">
          <button onClick={() => handleRoleFilter('')}>All</button>
          <button onClick={() => handleRoleFilter('superadmin')}>Super Admins</button>
          <button onClick={() => handleRoleFilter('user')}>Users</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.roles?.join(', ') || 'No roles'}</td>
              <td>
                <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
              <td>
                <button 
                  className="edit-btn"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {pagination.pages > 1 && (
          <>
            <button 
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={filters.page === page ? 'active' : ''}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              disabled={filters.page === pagination.pages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              Next
            </button>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit User</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditFormChange}
                  />
                  Active
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;