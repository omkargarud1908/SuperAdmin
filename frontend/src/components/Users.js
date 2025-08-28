import React, { useState, useEffect } from 'react';
import api from '../services/api';

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

      const response = await api.get(`/superadmin/users?${params}`);
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
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
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
    </div>
  );
};

export default Users;