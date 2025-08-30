# Super Admin Backend & Frontend

A complete Super Admin system with REST APIs, React frontend, and comprehensive testing capabilities.

## 🎯 Features

- **User Management**: CRUD operations with role-based access control
- **Role Management**: Create, update, delete roles and assign them to users
- **Audit Logging**: Comprehensive activity tracking with filtering
- **Analytics Dashboard**: User statistics, activity metrics, and trends
- **Feature Toggles**: Dynamic system settings and feature management
- **JWT Authentication**: Secure token-based authentication
- **SQLite Database**: Lightweight database with Prisma ORM
- **React Frontend**: Modern UI for testing all API endpoints
- **Postman Collection**: Complete API testing suite
- **Comprehensive Testing**: Unit tests and integration tests

## 🏗️ Architecture

```
SuperAdmin/
├── Backend/                 # Node.js + Express API
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & audit middleware
│   ├── prisma/            # Database schema & migrations
│   ├── test/              # Backend tests
│   └── server.js          # Main server file
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   └── services/      # API service layer
│   └── public/           # Static assets
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+ or v18+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed database with initial data
   npm run db:seed
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The frontend will be running on `http://localhost:3000`

## 🔐 Authentication

### Default Super Admin Credentials

- **Email**: `superadmin@example.com`
- **Password**: `Test1234!`

### JWT Token Usage

After login, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "superadmin@example.com",
  "password": "Test1234!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "Super Admin",
    "email": "superadmin@example.com",
    "roles": ["superadmin"]
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

### User Management Endpoints

#### GET /superadmin/users
Get all users with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

#### POST /superadmin/users
Create a new user.

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "roles": ["user"]
}
```

#### PUT /superadmin/users/:id
Update user information.

#### DELETE /superadmin/users/:id
Delete a user.

### Role Management Endpoints

#### GET /superadmin/roles
Get all roles.

#### POST /superadmin/roles
Create a new role.

**Request:**
```json
{
  "name": "moderator",
  "permissions": ["read", "write", "moderate"]
}
```

#### POST /superadmin/roles/assign-role
Assign a role to a user.

**Request:**
```json
{
  "userId": "user_id",
  "roleId": "role_id"
}
```

### Audit Logs Endpoints

#### GET /superadmin/audit-logs
Get audit logs with filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `userId` (string): Filter by actor user
- `action` (string): Filter by action type
- `targetType` (string): Filter by target type
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

#### GET /superadmin/audit-logs/summary
Get audit summary statistics.

### Analytics Endpoints

#### GET /superadmin/analytics/summary
Get analytics summary with user counts, role distribution, and activity metrics.

#### GET /superadmin/analytics/users
Get user analytics with registration trends and role distribution.

#### GET /superadmin/analytics/activity
Get activity analytics with action breakdowns and hourly activity.

### Settings Endpoints

#### GET /superadmin/settings
Get all system settings.

#### PUT /superadmin/settings/:key
Update a specific setting.

**Request:**
```json
{
  "value": "new_value"
}
```

#### GET /superadmin/settings/feature-toggles
Get feature toggles configuration.

#### PUT /superadmin/settings/feature-toggles
Update feature toggles.

**Request:**
```json
{
  "featureToggles": {
    "new_ui": true,
    "beta_features": false,
    "dark_mode": true
  }
}
```

## 🧪 Testing

### Backend Tests

Run backend tests:
```bash
cd Backend
npm test
```

### Frontend Tests

Run frontend tests:
```bash
cd frontend
npm test
```

### API Testing with Postman

1. Import the `SuperAdmin_API.postman_collection.json` file into Postman
2. Set the `baseUrl` variable to `http://localhost:5000`
3. Run the "Login" request to get an authentication token
4. The token will be automatically set for subsequent requests

## 🗄️ Database Schema

### Users Table
- `id` (String, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `hashedPassword` (String)
- `roles` (String Array)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `lastLogin` (DateTime, Optional)

### Roles Table
- `id` (String, Primary Key)
- `name` (String, Unique)
- `permissions` (String Array)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### UserRoles Table (Junction)
- `id` (String, Primary Key)
- `userId` (String, Foreign Key)
- `roleId` (String, Foreign Key)
- `createdAt` (DateTime)

### AuditLogs Table
- `id` (String, Primary Key)
- `actorUserId` (String, Foreign Key)
- `action` (String)
- `targetType` (String)
- `targetId` (String)
- `details` (String, Optional)
- `timestamp` (DateTime)

### Settings Table
- `id` (String, Primary Key)
- `key` (String, Unique)
- `value` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the Backend directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key-here"

# Server
PORT=5000
NODE_ENV=development
```

### Prisma Configuration

The project uses SQLite for simplicity. For production, you can change the database provider in `Backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}
```

###ScreenShots

<img width="783" height="832" alt="{32E46578-17C8-4500-889E-9B5F8335A936}" src="https://github.com/user-attachments/assets/4d9476f7-625e-400d-aadb-933ef3c4352e" />

<img width="1842" height="888" alt="{7AA448AB-B65E-4056-B265-B6FD319B3C5C}" src="https://github.com/user-attachments/assets/5336807d-4bf8-401b-83b4-d3f4aa4caede" />

<img width="1563" height="892" alt="{5885E93D-FEDF-48A9-802F-6FDDCD0036C8}" src="https://github.com/user-attachments/assets/b614e71f-4fc0-4377-a078-ca63ae1d74fe" />



## 📝 API Examples

### Complete User Management Flow

1. **Login:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"superadmin@example.com","password":"Test1234!"}'
   ```

2. **Create User:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/superadmin/users \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"password123","roles":["user"]}'
   ```

3. **Get Users:**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/superadmin/users?page=1&limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Role Assignment Flow

1. **Create Role:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/superadmin/roles \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"admin","permissions":["read","write"]}'
   ```

2. **Assign Role:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/superadmin/roles/assign-role \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId":"USER_ID","roleId":"ROLE_ID"}'
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure SQLite is properly installed
   - Check file permissions for the database file
   - Run `npm run db:push` to sync schema

2. **JWT token issues:**
   - Verify JWT_SECRET is set in environment variables
   - Check token expiration (default: 24 hours)
   - Ensure proper Authorization header format

3. **CORS errors:**
   - Backend CORS is configured for development
   - Update CORS settings for production deployment

4. **Prisma errors:**
   - Run `npm run db:generate` after schema changes
   - Ensure database URL is correct
   - Check Prisma client is generated

### Logs

Check server logs for detailed error information:
```bash
cd Backend
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request



---

**Happy Coding! 🚀**
