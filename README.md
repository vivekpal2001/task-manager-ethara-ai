# 📋 Team Task Manager — Ethara AI

A full-stack web application for team task management with role-based access control.

## 🚀 Tech Stack

| Layer      | Technology           |
|------------|---------------------|
| Frontend   | React + Vite        |
| Backend    | Node.js + Express   |
| Database   | PostgreSQL (Neon)   |
| ORM        | Prisma              |
| Auth       | JWT + bcrypt        |
| Validation | Zod                 |

## 📦 Project Structure

```
TaskManager/
├── client/          # React frontend (coming Phase 4)
├── server/          # Express backend
│   ├── prisma/      # Schema & migrations
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── utils/
└── design.txt       # UI/UX design system
```

## 🏗️ Build Phases

- [x] **Phase 1** — Auth, DB Schema, JWT
- [ ] **Phase 2** — Projects & Team Management
- [ ] **Phase 3** — Tasks CRUD & Assignment
- [ ] **Phase 4** — React Frontend + Dashboard
- [ ] **Phase 5** — Polish, Animations, Analytics

## 🔧 Setup

```bash
cd server
cp .env.example .env   # Add your Neon DB URL
npx prisma migrate dev
npm run dev
```

## 📡 API Endpoints (Phase 1)

```
POST   /api/auth/signup    → Register
POST   /api/auth/login     → Login + JWT
GET    /api/auth/me         → Profile (protected)
GET    /api/health          → Health check
```
