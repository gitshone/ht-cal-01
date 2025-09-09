# HT-Cal-01

A full-stack calendar application built with NX monorepo, React frontend, and Node.js backend.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, Firebase
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Firebase Admin, JWT
- **Tools**: NX Monorepo, ESLint, Prettier, Docker

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   # Edit the .env files with your configuration
   ```

3. **Start with Docker**
   ```bash
   docker-compose up --build
   ```

## 📜 Commands

### Development
```bash
nx serve frontend    # Start frontend dev server
nx build backend     # Build backend
nx build frontend    # Build frontend
```

### Code Quality
```bash
npm run format       # Format all code
npm run format:check # Check formatting
npm run lint         # Lint all code
```

### Database (via Docker)
```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Generate Prisma client
docker-compose exec backend npm run db:generate

# Open Prisma Studio
docker-compose exec backend npm run db:studio

# Access database directly
docker-compose exec postgres psql -U postgres -d ht_cal_db
```

### Docker
```bash
docker-compose up              # Start all services
docker-compose up postgres     # Database only
docker-compose logs -f backend # View backend logs
docker-compose down            # Stop services
```

## 🔐 Authentication

- **Frontend**: Google OAuth via Firebase Web SDK
- **Backend**: Firebase token verification + JWT access/refresh tokens
- **Flow**: Google sign-in → Firebase token → Backend verification → JWT tokens

## 📁 Structure

```
apps/
├── backend/          # Express API server
├── frontend/         # React application
libs/
└── shared-types/     # Shared TypeScript types
```

**Note**: Backend runs entirely in Docker. All database operations (migrations, Prisma commands) should be executed via `docker-compose exec backend`.
