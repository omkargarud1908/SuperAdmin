import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/superadmin/users', { params }),
  getUser: (id) => api.get(`/superadmin/users/${id}`),
  createUser: (userData) => api.post('/superadmin/users', userData),
  updateUser: (id, userData) => api.put(`/superadmin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/superadmin/users/${id}`),
};

// Roles API
export const rolesAPI = {
  getRoles: () => api.get('/superadmin/roles'),
  getRole: (id) => api.get(`/superadmin/roles/${id}`),
  getRoleForEdit: (id) => api.get(`/superadmin/roles/${id}/edit`),
  createRole: (roleData) => api.post('/superadmin/roles', roleData),
  updateRole: (id, roleData) => api.put(`/superadmin/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/superadmin/roles/${id}`),
  assignRole: (userId, roleId) => api.post('/superadmin/roles/assign-role', { userId, roleId }),
  removeRole: (userId, roleId) => api.delete('/superadmin/roles/assign-role', { data: { userId, roleId } }),
};

// Audit Logs API
export const auditLogsAPI = {
  getAuditLogs: (params = {}) => api.get('/superadmin/audit-logs', { params }),
  getAuditSummary: (params = {}) => api.get('/superadmin/audit-logs/summary', { params }),
  getActions: () => api.get('/superadmin/audit-logs/actions'),
  getTargetTypes: () => api.get('/superadmin/audit-logs/target-types'),
};

// Analytics API
export const analyticsAPI = {
  getSummary: () => api.get('/superadmin/analytics/summary'),
  getUserAnalytics: (params = {}) => api.get('/superadmin/analytics/users', { params }),
  getActivityAnalytics: (params = {}) => api.get('/superadmin/analytics/activity', { params }),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/superadmin/settings'),
  getSetting: (key) => api.get(`/superadmin/settings/${key}`),
  updateSetting: (key, value) => api.put(`/superadmin/settings/${key}`, { value }),
  createSetting: (key, value) => api.post('/superadmin/settings', { key, value }),
  deleteSetting: (key) => api.delete(`/superadmin/settings/${key}`),
  getFeatureToggles: () => api.get('/superadmin/settings/feature-toggles'),
  updateFeatureToggles: (featureToggles) => api.put('/superadmin/settings/feature-toggles', { featureToggles }),
};

// Email Reminders API
export const emailRemindersAPI = {
  getStats: () => api.get('/superadmin/email-reminders/stats'),
  getInactiveUsers: () => api.get('/superadmin/email-reminders/inactive-users'),
  getAllInactiveUsers: () => api.get('/superadmin/email-reminders/all-inactive-users'),
  sendReminderToUser: (userId) => api.post(`/superadmin/email-reminders/send-reminder/${userId}`),
  sendRemindersToAll: () => api.post('/superadmin/email-reminders/send-reminders'),
  markUserActive: (userId) => api.put(`/superadmin/email-reminders/mark-active/${userId}`),
  resetUserReminders: (userId) => api.put(`/superadmin/email-reminders/reset-reminders/${userId}`),
  getCronStatus: () => api.get('/superadmin/email-reminders/cron-status'),
  triggerReminderJob: () => api.post('/superadmin/email-reminders/trigger-reminder-job'),
  triggerCleanupJob: () => api.post('/superadmin/email-reminders/trigger-cleanup-job'),
  restartCron: () => api.post('/superadmin/email-reminders/restart-cron'),
  stopCron: () => api.post('/superadmin/email-reminders/stop-cron'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;