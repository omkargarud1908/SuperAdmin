import React, { useState, useEffect } from 'react';
import { usersAPI, rolesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
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
  const [activeRoleFilter, setActiveRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    isActive: true
  });
  const [roleForm, setRoleForm] = useState({
    roleId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [filters]);

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getRoles();
      console.log('Roles fetched successfully in Users component:', response.data);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch roles';
      console.error('Error details:', errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await usersAPI.getUsers(params);
      console.log('Users fetched successfully:', response.data);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch users error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch users';
      setError(errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.search.value;
    console.log('Searching for:', searchValue);
    setFilters(prev => ({ ...prev, page: 1, search: searchValue }));
  };

  const handleRoleFilter = (role) => {
    console.log('Filtering by role:', role);
    const roleValue = role || '';
    setActiveRoleFilter(role);
    setFilters(prev => ({ ...prev, page: 1, role: roleValue }));
  };

  const handlePageChange = (page) => {
    console.log('Changing to page:', page);
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEdit = (user) => {
    console.log('Editing user:', user);
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
        const response = await usersAPI.deleteUser(userId);
        console.log('User deleted successfully:', response.data);
        setError('');
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Delete user error:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to delete user';
        setError(errorMessage);
        
        // Log detailed error information
        if (error.response?.data) {
          console.error('Error response data:', error.response.data);
        }
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await usersAPI.updateUser(editingUser.id, editForm);
      console.log('User updated successfully:', response.data);
      setShowEditModal(false);
      setEditingUser(null);
      setError('');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Update user error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update user';
      setError(errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log('Edit form changed:', { name, value, type, checked });
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleAssignment = async (e) => {
    e.preventDefault();
    console.log('Assigning role to user:', { userId: selectedUser.id, roleId: roleForm.roleId });
    
    try {
      // The backend now automatically replaces existing roles with the new one
      const response = await rolesAPI.assignRole(selectedUser.id, roleForm.roleId);
      console.log('Role assigned successfully:', response.data);
      setShowRoleModal(false);
      setRoleForm({ roleId: '' });
      setSelectedUser(null);
      setError('');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Assign role error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to assign role';
      setError(errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    }
  };

  const handleAssignRole = (user) => {
    console.log('Assigning role to user:', user);
    setSelectedUser(user);
    setRoleForm({ roleId: '' });
    setShowRoleModal(true);
  };

  if (loading) {
    return (
      <div className="users-container">
        <h1>User Management</h1>
        <LoadingSpinner text="Loading users" />
      </div>
    );
  }

  return (
    <div className="users-container">
      <h1>User Management</h1>
      
      <div className="filters">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            name="search"
            placeholder="Search users..."
            onChange={(e) => console.log('Search input changed:', e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        
        <div className="role-filters">
          <button 
            className={activeRoleFilter === '' ? 'active' : ''}
            onClick={() => handleRoleFilter('')}
          >
            All
          </button>
          <button 
            className={activeRoleFilter === 'superadmin' ? 'active' : ''}
            onClick={() => handleRoleFilter('superadmin')}
          >
            Super Admins
          </button>
          <button 
            className={activeRoleFilter === 'user' ? 'active' : ''}
            onClick={() => handleRoleFilter('user')}
          >
            Users
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {users.length === 0 ? (
        <div className="no-users">
          <p>No users found with the current filters.</p>
          <p>Try adjusting your search criteria or check if there are any users in the system.</p>
        </div>
      ) : (
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
                    className="assign-role-btn"
                    onClick={() => handleAssignRole(user)}
                  >
                    Assign Role
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
      )}

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

             {/* Role Assignment Modal */}
       {showRoleModal && (
         <div className="modal-overlay">
           <div className="modal">
             <h3>Assign Role to {selectedUser?.name}</h3>
             <form onSubmit={handleRoleAssignment}>
               <div className="form-group">
                 <label>Select Role:</label>
                 <select
                   name="roleId"
                   value={roleForm.roleId}
                   onChange={(e) => {
                     console.log('Role form roleId changed:', e.target.value);
                     setRoleForm(prev => ({ ...prev, roleId: e.target.value }));
                   }}
                   required
                 >
                   <option value="">Choose a role...</option>
                   {roles.map(role => (
                     <option key={role.id} value={role.id}>
                       {role.name}
                     </option>
                   ))}
                 </select>
               </div>
               <div className="form-group">
                 <label>Current User:</label>
                 <input
                   type="text"
                   value={`${selectedUser?.name} (${selectedUser?.email})`}
                   disabled
                   className="disabled-input"
                 />
               </div>
               {selectedUser?.roles && selectedUser.roles.length > 0 && (
                 <div className="form-group">
                   <label>Current Roles:</label>
                   <div className="current-roles">
                     {selectedUser.roles.map((role, index) => (
                       <span key={index} className="current-role-tag">
                         {role}
                       </span>
                     ))}
                   </div>
                   <small className="role-warning">
                     ⚠️ Assigning a new role will replace all existing roles for this user.
                   </small>
                 </div>
               )}
               <div className="modal-actions">
                 <button type="submit">Assign Role</button>
                 <button 
                   type="button" 
                   onClick={() => setShowRoleModal(false)}
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