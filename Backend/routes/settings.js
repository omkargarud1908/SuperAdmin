const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/v1/superadmin/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });

    // Parse JSON values
    const formattedSettings = settings.map(setting => ({
      ...setting,
      value: isJsonString(setting.value) ? JSON.parse(setting.value) : setting.value
    }));

    res.json({ settings: formattedSettings });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/settings/:key - Get setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    // Parse JSON value if it's a JSON string
    const value = isJsonString(setting.value) ? JSON.parse(setting.value) : setting.value;

    res.json({
      setting: {
        ...setting,
        value
      }
    });

  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/v1/superadmin/settings/:key - Update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    // Convert value to string if it's an object
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'UPDATE_SETTING',
      'SETTING',
      key,
      { key, value: stringValue }
    );

    // Parse JSON value if it's a JSON string
    const parsedValue = isJsonString(setting.value) ? JSON.parse(setting.value) : setting.value;

    res.json({
      message: 'Setting updated successfully',
      setting: {
        ...setting,
        value: parsedValue
      }
    });

  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/v1/superadmin/settings/:key - Delete setting
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    // Prevent deleting critical settings
    const criticalSettings = ['feature_toggles', 'system_config'];
    if (criticalSettings.includes(key)) {
      return res.status(400).json({ 
        message: 'Cannot delete critical system settings' 
      });
    }

    await prisma.setting.delete({
      where: { key }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'DELETE_SETTING',
      'SETTING',
      key,
      { key, value: setting.value }
    );

    res.json({ message: 'Setting deleted successfully' });

  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/superadmin/settings - Create setting
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    // Check if setting already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key }
    });

    if (existingSetting) {
      return res.status(400).json({ message: 'Setting with this key already exists' });
    }

    // Convert value to string if it's an object
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.setting.create({
      data: { key, value: stringValue }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'CREATE_SETTING',
      'SETTING',
      key,
      { key, value: stringValue }
    );

    // Parse JSON value if it's a JSON string
    const parsedValue = isJsonString(setting.value) ? JSON.parse(setting.value) : setting.value;

    res.status(201).json({
      message: 'Setting created successfully',
      setting: {
        ...setting,
        value: parsedValue
      }
    });

  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/settings/feature-toggles - Get feature toggles
router.get('/feature-toggles', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'feature_toggles' }
    });

    let featureToggles = {};
    if (setting) {
      featureToggles = isJsonString(setting.value) ? JSON.parse(setting.value) : {};
    }

    res.json({ featureToggles });

  } catch (error) {
    console.error('Get feature toggles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/v1/superadmin/settings/feature-toggles - Update feature toggles
router.put('/feature-toggles', async (req, res) => {
  try {
    const { featureToggles } = req.body;

    if (!featureToggles || typeof featureToggles !== 'object') {
      return res.status(400).json({ message: 'Feature toggles object is required' });
    }

    const stringValue = JSON.stringify(featureToggles);

    const setting = await prisma.setting.upsert({
      where: { key: 'feature_toggles' },
      update: { value: stringValue },
      create: { key: 'feature_toggles', value: stringValue }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'UPDATE_FEATURE_TOGGLES',
      'SETTING',
      'feature_toggles',
      { featureToggles }
    );

    res.json({
      message: 'Feature toggles updated successfully',
      featureToggles: JSON.parse(setting.value)
    });

  } catch (error) {
    console.error('Update feature toggles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to check if a string is valid JSON
function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = router;