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

3. **Start Postgres with Docker**
   ```bash
   docker-compose up --build
   ```

## 📜 Commands

### Development
```bash
nx serve frontend    # Start frontend dev server
nx serve backend     # Start backend dev server
nx build backend     # Build backend
nx build frontend    # Build frontend
```

### Code Quality
```bash
nx run {project}:format          # Format all code
nx run {project}:format:check    # Check formatting
nx run {project}:lint            # Lint all code
```

### Database
```bash
# Run migrations
nx run backend:db:migrate

# Generate Prisma client
nx run backend:db:generate

# Open Prisma Studio
nx run backend:db:studio
```
## 🔐 Authentication

- **Frontend**: Google OAuth via Firebase Web SDK
- **Backend**: Firebase token verification + JWT access/refresh tokens
- **Flow**: Google sign-in → Firebase token → Backend verification → JWT tokens

## 📅 Google Calendar API

The backend includes simplified Google Calendar API integration using Firebase authentication:

### Setup
1. **Enable Google Calendar API** in Google Cloud Console
2. **Configure Firebase** with Google Calendar scopes (already done in frontend)
3. **No additional environment variables needed** - uses Firebase tokens

### How It Works
1. **Frontend**: User signs in with Google via Firebase
2. **Frontend**: User connects his Google Calendar and stores keys to the database
3. **Backend**: Uses stored Google access tokens to fetch calendar events
4. **Backend**: Returns simplified event data

## 📁 Structure

```
apps/
├── backend/          # Express API server
├── frontend/         # React application
libs/
└── shared-types/     # Shared TypeScript types
```