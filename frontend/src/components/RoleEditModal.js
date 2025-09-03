import React, { useState, useEffect } from 'react';
import { rolesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import './RoleEditModal.css';

function RoleEditModal({ role, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (role && isOpen) {
      loadRoleData();
    }
  }, [role, isOpen]);

  const loadRoleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await rolesAPI.getRoleForEdit(role.id);
      const { role: roleData, availablePermissions: perms } = response.data.data;
      
      setFormData({
        name: roleData.name,
        permissions: roleData.permissions || []
      });
      setAvailablePermissions(perms || []);
    } catch (err) {
      console.error('Error loading role data:', err);
      setError('Failed to load role data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await rolesAPI.updateRole(role.id, formData);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', permissions: [] });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="role-edit-modal-overlay">
      <div className="role-edit-modal">
        <div className="modal-header">
          <h2>Edit Role: {role?.name}</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {loading && !formData.name ? (
          <div className="modal-body">
            <LoadingSpinner text="Loading role data" size="small" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="roleName">Role Name:</label>
              <input
                type="text"
                id="roleName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter role name"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Permissions:</label>
              <div className="permissions-grid">
                {availablePermissions.map(permission => (
                  <label key={permission} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionChange(permission)}
                      disabled={loading}
                    />
                    <span className="permission-label">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RoleEditModal;
