require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const roleRoutes = require('../routes/roles');
const auditLogRoutes = require('../routes/auditLogs');
const analyticsRoutes = require('../routes/analytics');
const settingsRoutes = require('../routes/settings');

const app = express();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log('Database connected successfully!'))
  .catch((err) => console.error('Database connection error:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/superadmin/users', userRoutes);
app.use('/api/v1/superadmin/roles', roleRoutes);
app.use('/api/v1/superadmin/audit-logs', auditLogRoutes);
app.use('/api/v1/superadmin/analytics', analyticsRoutes);
app.use('/api/v1/superadmin/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler - using a different approach to avoid path-to-regexp issue
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;