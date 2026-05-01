# Task Tracker

A MERN stack project management app with role-based access control (Admin / Member).

## Features

- JWT Authentication (Register / Login)
- Role-based access: Admin creates projects & tasks; Members update their task status
- Project management with team members
- Task board (To Do / In Progress / Done) with priority & due dates
- Dashboard with stats and overdue tracking
- Deploy-ready for Railway

## Tech Stack

- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT + bcryptjs
- **Deploy**: Railway

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/task-tracker.git
cd task-tracker
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET
```

### 3. Set up the client

```bash
cd ../client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000 (already set)
```

### 4. Run locally (two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Visit `http://localhost:5173`

## API Endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/projects | Auth | List projects |
| POST | /api/projects | Admin | Create project |
| GET | /api/projects/:id | Member | Get project |
| PUT | /api/projects/:id | Project Admin | Update project |
| DELETE | /api/projects/:id | Project Admin | Delete project |
| POST | /api/projects/:id/members | Project Admin | Add member |
| DELETE | /api/projects/:id/members/:userId | Project Admin | Remove member |
| GET | /api/tasks/stats | Auth | Dashboard stats |
| GET | /api/tasks/my | Auth | My tasks |
| GET | /api/tasks/project/:id | Auth | Project tasks |
| POST | /api/tasks | Admin | Create task |
| PUT | /api/tasks/:id | Admin/Assignee | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |

## Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a random secret string
   - `NODE_ENV` — `production`
4. Railway auto-detects `railway.toml` and runs the build + start commands
5. Your app is live!

## Role-based Access

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Delete task | ✅ | ❌ |
| Update task (full) | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |
