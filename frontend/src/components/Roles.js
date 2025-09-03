import React, { useState, useEffect } from 'react';
import { rolesAPI } from '../services/api';
import RoleEditModal from './RoleEditModal';
import LoadingSpinner from './LoadingSpinner';
import './Roles.css';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  });
  const [assignForm, setAssignForm] = useState({
    userId: '',
    roleId: ''
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getRoles();
      console.log('Roles fetched successfully:', response.data);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Fetch roles error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch roles';
      setError(errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    console.log('Creating role with data:', formData);
    
    try {
      setActionLoading(true);
      const response = await rolesAPI.createRole(formData);
      console.log('Role created successfully:', response.data);
      setShowCreateModal(false);
      setFormData({ name: '', permissions: [] });
      setError('');
      await fetchRoles();
    } catch (error) {
      console.error('Create role error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create role';
      setError(errorMessage);
      
      // Log detailed error information
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    console.log('Assigning role with data:', assignForm);
    
    try {
      const response = await rolesAPI.assignRole(assignForm.userId, assignForm.roleId);
      console.log('Role assigned successfully:', response.data);
      setShowAssignModal(false);
      setAssignForm({ userId: '', roleId: '' });
      setError('');
      fetchRoles(); // Refresh to show updated user counts
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



  const handleDeleteRole = async (roleId, roleName) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      try {
        setActionLoading(true);
        const response = await rolesAPI.deleteRole(roleId);
        console.log('Role deleted successfully:', response.data);
        setError('');
        await fetchRoles();
      } catch (error) {
        console.error('Delete role error:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to delete role';
        setError(errorMessage);
        
        // Log detailed error information
        if (error.response?.data) {
          console.error('Error response data:', error.response.data);
        }
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log('Form changed:', { name, value, type, checked });
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        permissions: checked 
          ? [...prev.permissions, value]
          : prev.permissions.filter(p => p !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    console.log('Updated form data:', formData);
  };

  const availablePermissions = [
    'user:read', 'user:write', 'user:delete',
    'role:read', 'role:write', 'role:delete',
    'audit:read', 'analytics:read', 'settings:read', 'settings:write'
  ];

  if (loading) {
    return (
      <div className="roles">
        <h1>Role Management</h1>
        <LoadingSpinner text="Loading roles" />
      </div>
    );
  }

  return (
    <div className="roles">
      {actionLoading && (
        <LoadingSpinner 
          text="Processing" 
          overlay={true} 
          size="medium"
        />
      )}
      
      <div className="roles-header">
        <h1>Role Management</h1>
        <button 
          className="create-role-btn"
          onClick={() => setShowCreateModal(true)}
          disabled={actionLoading}
        >
          Create New Role
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {roles.length === 0 ? (
        <div className="no-roles">
          <p>No roles found in the system.</p>
          <p>Create your first role to get started with role management.</p>
        </div>
      ) : (
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card">
              <div className="role-header">
                <h3>{role.name}</h3>
                <div className="role-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setSelectedRole(role);
                      setShowEditModal(true);
                    }}
                    disabled={actionLoading}
                  >
                    Edit
                  </button>
                  <button 
                    className="assign-btn"
                    onClick={() => {
                      setSelectedRole(role);
                      setAssignForm({ userId: '', roleId: role.id });
                      setShowAssignModal(true);
                    }}
                    disabled={actionLoading}
                  >
                    Assign to User
                  </button>
                  {role.name !== 'superadmin' && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
                           <div className="role-details">
               <div className="role-stats">
                 <div className="stat-item">
                   <span className="stat-number">{role.userCount}</span>
                   <span className="stat-label">Users</span>
                 </div>
                 <div className="stat-item">
                   <span className="stat-date">{new Date(role.createdAt).toLocaleDateString()}</span>
                   <span className="stat-label">Created</span>
                 </div>
               </div>
               
               {role.permissions && role.permissions.length > 0 && (
                 <div className="permissions">
                   <strong>Permissions:</strong>
                   <div className="permission-tags">
                     {role.permissions.map(permission => (
                       <span key={permission} className="permission-tag">
                         {permission}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>

              
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Role</h3>
            <form onSubmit={handleCreateRole}>
              <div className="form-group">
                <label>Role Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter role name"
                />
              </div>
              
              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-checkboxes">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="permission-checkbox">
                      <input
                        type="checkbox"
                        value={permission}
                        checked={formData.permissions.includes(permission)}
                        onChange={handleFormChange}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit">Create Role</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Assign Role to User</h3>
            <form onSubmit={handleAssignRole}>
              <div className="form-group">
                <label>User ID:</label>
                                  <input
                    type="text"
                    name="userId"
                    value={assignForm.userId}
                    onChange={(e) => {
                      console.log('Assign form userId changed:', e.target.value);
                      setAssignForm(prev => ({ ...prev, userId: e.target.value }));
                    }}
                    required
                    placeholder="Enter user ID"
                    className="form-input"
                  />
              </div>
              
              <div className="form-group">
                <label>Selected Role:</label>
                <input
                  type="text"
                  value={selectedRole?.name || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit">Assign Role</button>
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {showEditModal && selectedRole && (
        <RoleEditModal
          role={selectedRole}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSave={() => {
            fetchRoles();
            setShowEditModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
};

export default Roles;
