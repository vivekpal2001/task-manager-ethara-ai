# 📋 TaskFlow — Team Task Manager

A full-stack, production-ready web application designed for team task management, featuring role-based access control, real-time Kanban boards, and productivity analytics.

## 🌟 Key Features

- **Advanced Authentication**: Secure JWT-based auth with robust error handling and password hashing.
- **Role-Based Access Control (RBAC)**: Multi-tenant architecture. Users can be Project Owners, Admins, or Members. Permissions are tightly scoped to specific projects.
- **Dynamic Kanban Board**: Interactive Drag-and-Drop Kanban interface using `@hello-pangea/dnd`.
- **Productivity Dashboard**: Visual analytics and task breakdowns using `recharts`.
- **Proactive Alerts**: Overdue task monitoring with visual toast notifications.
- **Beautiful UI**: Built using vanilla CSS modules focusing on a premium glassmorphism aesthetic with floating animated background blobs.
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile views.

---

## 🚀 Technology Stack

**Frontend:**
- React.js + Vite
- Recharts (Data Visualization)
- dnd-kit / `@hello-pangea/dnd` (Drag and drop)
- Canvas Confetti (Micro-interactions)
- Lucide React (Icons)
- Vercel (Deployment)

**Backend:**
- Node.js + Express
- PostgreSQL (Neon Serverless Database)
- Prisma ORM
- JSON Web Tokens (JWT) & bcryptjs
- Zod (Input Validation)
- Railway (Deployment)

---

## 🗄️ Database Design (Prisma Schema)

The database is built on PostgreSQL with relational integrity.

- **User**: Stores global user accounts (`id`, `name`, `email`, `passwordHash`, `role`).
- **Project**: Represents a workspace (`id`, `name`, `description`, `ownerId`).
- **ProjectMember**: Junction table mapping Users to Projects with specific roles (`userId`, `projectId`, `role: ADMIN | MEMBER`).
- **Task**: The core entity (`id`, `title`, `description`, `status`, `priority`, `dueDate`, `projectId`, `assigneeId`).

*Relationships:*
- A User can own many Projects.
- A User can be a member of many Projects.
- A Project has many Tasks and many Members.
- A Task belongs to one Project and can be assigned to one User.

---

## 🔐 Role-Based Access Control (RBAC)

Security is handled at the **Workspace (Project) Level**:
1. **Global Role**: All sign-ups default to a global `MEMBER`.
2. **Project Owner**: The creator of a project has absolute control.
3. **Project Admin**: Can invite members, create tasks, edit any task, and delete tasks within that project.
4. **Project Member**: Can view the project board and only update the status (e.g., To Do -> Done) of tasks explicitly assigned to them.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` — Create a new account
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET  /api/auth/me` — Get current user profile & stats

### Projects & Team
- `POST   /api/projects` — Create a new project
- `GET    /api/projects` — List all projects user is part of
- `GET    /api/projects/:id` — Get project details, stats, and members
- `PATCH  /api/projects/:id` — Update project details (Owner/Admin only)
- `DELETE /api/projects/:id` — Delete a project (Owner only)
- `POST   /api/projects/:id/members` — Add a teammate
- `DELETE /api/projects/:id/members/:userId` — Remove a teammate

### Tasks
- `POST   /api/projects/:id/tasks` — Create a task (Admin/Owner)
- `GET    /api/projects/:id/tasks` — List tasks with filters (Status, Priority)
- `PATCH  /api/projects/:id/tasks/:taskId` — Update task details
- `DELETE /api/projects/:id/tasks/:taskId` — Delete task (Admin/Owner)

### Dashboard Analytics
- `GET /api/dashboard` — Get aggregated global stats, active projects, and overdue tasks.

---

## 🛠️ Local Development Setup

**1. Clone & Install Dependencies**
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

**2. Environment Variables**
In the `/server` directory, create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@neon-db-url..."
JWT_SECRET="your_super_secret_key"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
```
In the `/client` directory, create a `.env` file:
```env
VITE_API_URL="http://localhost:5000/api"
```

**3. Initialize Database**
```bash
cd server
npx prisma generate
npx prisma db push
```

**4. Start Development Servers**
```bash
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

---

## ☁️ Deployment Guide

### Backend (Railway)
1. Connect your GitHub repository to Railway and select the `/server` root directory.
2. Add your `.env` variables in the Railway dashboard.
3. Ensure your `package.json` has `"postinstall": "prisma generate"`.
4. Railway will automatically build and deploy the Node.js server.

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel and select the `/client` root directory.
2. Vercel will automatically detect the Vite framework.
3. Add `VITE_API_URL` to Vercel's Environment Variables, pointing to your Railway public domain (e.g., `https://your-app.up.railway.app/api`).
4. Click Deploy!
