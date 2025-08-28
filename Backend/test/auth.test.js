const request = require('supertest');
const app = require('../server');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        hashedPassword,
        roles: ['user']
      }
    });

    // Create a role and assign it to the user
    const role = await prisma.role.create({
      data: {
        name: 'user',
        permissions: ['read']
      }
    });

    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: role.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userRole.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.role.deleteMany({
      where: { name: 'user' }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.roles).toContain('user');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      authToken = loginResponse.body.token;
    });

    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});