const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // --- Create Permissions ---
  const permissions = ['all', 'read', 'write'];

  const permissionRecords = {};
  for (const perm of permissions) {
    const record = await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm },
    });
    permissionRecords[perm] = record;
  }

  console.log('Permissions created:', Object.keys(permissionRecords));

  // --- Create Roles ---
  const roles = [
    { name: 'superadmin', permissions: ['all'] },
    { name: 'admin', permissions: ['read', 'write'] },
    { name: 'user', permissions: ['read'] },
  ];

  const roleRecords = {};
  for (const role of roles) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
    roleRecords[role.name] = record;

    // Link permissions
    for (const permName of role.permissions) {
      const perm = permissionRecords[permName];
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: record.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: record.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log('Roles created with permissions:', Object.keys(roleRecords));

  // --- Create Super Admin User ---
  const hashedPassword = await bcrypt.hash('Test1234!', 12);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      hashedPassword,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: roleRecords['superadmin'].id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: roleRecords['superadmin'].id,
    },
  });

  console.log('Super Admin user created.');

  // --- Create Test Users ---
  const testUsers = [
    { name: 'Omkar Graud', email: 'omkargarud@gmail.com', password: 'password123', roles: ['user'] },
    { name: 'Rohit', email: 'rohit@gmail.com', password: 'password123', roles: ['admin'] },
  ];

  for (const u of testUsers) {
    const hashedUserPassword = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        hashedPassword: hashedUserPassword,
      },
    });

    for (const roleName of u.roles) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roleRecords[roleName].id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roleRecords[roleName].id,
        },
      });
    }
  }

  console.log('Test users created.');

  // --- Create Initial Settings ---
  const settings = [
    { key: 'feature_toggles', value: JSON.stringify({ new_ui: true, beta_features: false }) },
    { key: 'system_config', value: JSON.stringify({ maintenance_mode: false, max_users: 1000 }) },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Settings created.');
  console.log('✅ Seed data created successfully!');
  console.log('Super Admin credentials:');
  console.log('Email: superadmin@example.com');
  console.log('Password: Test1234!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
