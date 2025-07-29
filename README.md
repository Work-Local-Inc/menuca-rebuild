# MenuCA Rebuild - Phase 1 Foundation

Multi-tenant SaaS platform for restaurant management with PostgreSQL + Redis + TypeScript.

<!-- CodeRabbit Test: Adding a small documentation update -->

## 🏗️ Phase 1 Foundation Complete

✅ **MC-F-DB-001**: Multi-tenant PostgreSQL with Row Level Security  
✅ **MC-F-BE-001**: Node.js/Express server with TypeScript  
✅ **MC-F-DB-004**: Redis caching infrastructure  

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your database/Redis credentials
```

### 3. Setup Database
```bash
# Create PostgreSQL database
createdb menuca_development

# Run database setup
npm run build
npm run db:setup
```

### 4. Test Foundation Services
```bash
npx ts-node test-foundation.ts
```

### 5. Start Development Server
```bash
npm run dev
```

## 🧪 Testing the Setup

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Multi-tenant API Test
```bash
# Default tenant
curl http://localhost:3000/api/v1

# Custom tenant via header
curl -H "x-tenant-id: restaurant-123" http://localhost:3000/api/v1

# Custom tenant via subdomain (if configured)
curl -H "Host: restaurant-123.localhost:3000" http://localhost:3000/api/v1
```

### System Status
```bash
curl http://localhost:3000/status
```

## 🏛️ Architecture Overview

### Database (PostgreSQL 15+)
- **Multi-tenant**: Shared schema with Row Level Security (RLS)
- **Schema**: Core tables (tenants, users) with proper indexes
- **Security**: Tenant isolation enforced at database level
- **Monitoring**: Health views and connection pooling

### Cache (Redis 7+)
- **Sessions**: JWT token storage and management
- **Caching**: Application-level caching with TTL
- **Rate Limiting**: API throttling and protection
- **Real-time**: WebSocket connection management

### Server (Node.js + TypeScript)
- **Framework**: Express with security middleware
- **Multi-tenant**: Automatic tenant context from headers/subdomains
- **Logging**: Structured logging with Winston
- **Monitoring**: Health checks and system status endpoints

## 🔒 Multi-tenant Security

### Row Level Security (RLS)
```sql
-- Automatic tenant isolation
SET app.current_tenant_id = 'restaurant-123';
SELECT * FROM users; -- Only returns users for restaurant-123
```

### Tenant Context
- Header: `x-tenant-id: restaurant-123`
- Subdomain: `restaurant-123.yourdomain.com`
- Default: Falls back to 'default' tenant

## 📊 Database Schema

### Core Tables
- `tenants` - Restaurant partners/organizations
- `users` - Multi-role users with tenant isolation
- Health monitoring views and audit logging

### Default Test Data
- **Tenant**: `default`
- **Admin User**: `admin@menuca.local` / `password123`

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server

# Database
npm run db:setup     # Initialize database schema
npm run db:migrate   # Run database migrations

# Quality
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm test             # Run tests
```

## 📁 Project Structure

```
src/
├── server/          # Express application
├── database/        # PostgreSQL connection & queries
├── cache/           # Redis connection & operations
├── config/          # Configuration management
├── types/           # TypeScript type definitions
├── middleware/      # Express middleware (planned)
└── utils/           # Utility functions (planned)

scripts/
├── setup-database.sql    # Database schema
└── setup-database.ts     # Database initialization

docs/
└── DBA01-DBA06.md       # Database architecture docs
```

## 🎯 Next Steps (Phase 2)

Ready to implement:
1. **MC-F-BE-002**: JWT Authentication System
2. **MC-F-BE-003**: Role-Based Access Control (RBAC)
3. **MC-C-BE-001**: Menu Management API
4. **MC-F-IN-001**: Stripe Payment Integration

## 🔧 Environment Variables

Key configuration in `.env`:

```bash
# Database
DB_HOST=localhost
DB_NAME=menuca_development
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
JWT_SECRET=your_super_secret_key

# Multi-tenant
DEFAULT_TENANT_ID=default
TENANT_HEADER=x-tenant-id
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d menuca_development
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Build Issues
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

## 📈 Performance Targets

- **Response Time**: <2 seconds during peak load
- **Concurrent Users**: 10,000+ simultaneous
- **Throughput**: 1,000 transactions/second
- **Availability**: 99.9% uptime

Foundation services are optimized to meet these targets through connection pooling, caching, and proper indexing.

---

**Phase 1 Complete** ✅ | **Ready for Phase 2** 🚀