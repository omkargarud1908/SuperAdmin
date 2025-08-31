const request = require("supertest");
const app = require("../server");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

describe("Auth Endpoints", () => {
  let testUser;
  let testRole;
  let testPermission;

  beforeAll(async () => {
    // Ensure role exists (or create it)
    testRole = await prisma.role.findUnique({
      where: { name: "user" },
    });

    if (!testRole) {
      testRole = await prisma.role.create({
        data: {
          name: "user",
        },
      });
    }

    // Ensure permission exists (or create it)
    testPermission = await prisma.permission.findUnique({
      where: { name: "read" },
    });

    if (!testPermission) {
      testPermission = await prisma.permission.create({
        data: {
          name: "read",
        },
      });
    }

    // Attach permission to role
    await prisma.rolePermission.create({
      data: {
        role: { connect: { id: testRole.id } },
        permission: { connect: { id: testPermission.id } },
      },
    });

    // Create a test user with role
    const hashedPassword = await bcrypt.hash("testpassword123", 12);
    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        hashedPassword,
        userRoles: {
          create: {
            role: { connect: { id: testRole.id } },
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.userRole.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }

    if (testRole) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: testRole.id },
      });
      await prisma.role.delete({
        where: { id: testRole.id },
      });
    }

    if (testPermission) {
      await prisma.rolePermission.deleteMany({
        where: { permissionId: testPermission.id },
      });
      await prisma.permission.delete({
        where: { id: testPermission.id },
      });
    }

    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "testpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("test@example.com");

      const roleNames = response.body.user.roles || [];
      expect(roleNames).toContain("user");
    });

    it("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "testpassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject invalid password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should require email and password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email and password are required");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "testpassword123",
        });
      authToken = loginResponse.body.token;
    });

    it("should get current user info with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("test@example.com");

      const roleNames = response.body.user.roles || [];
      expect(roleNames).toContain("user");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/v1/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });
  });
});
