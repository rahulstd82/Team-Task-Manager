# Team Task Manager

A full-stack web application for team collaboration — create projects, manage members, assign tasks, and track progress with role-based access control.

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL (relational data, UUID primary keys)
- JWT for stateless authentication
- bcrypt for password hashing

**Frontend**
- React 18 + TypeScript
- Vite (dev server + build)
- React Router v6
- Axios with JWT interceptor

**Testing**
- Jest + ts-jest
- Supertest (integration tests)
- fast-check (property-based tests)

---

## Features

- **Authentication** — register and login with JWT (24-hour expiry)
- **Projects** — create and manage projects; every project creator becomes its Admin
- **Role-based access control** — Admin and Member roles enforced per project
- **Team management** — add/remove members by email address
- **Task management** — create tasks with title, description, due date, and assignee
- **Task status tracking** — `todo` → `in_progress` → `done`; members can only update their own tasks
- **Dashboard** — task counts by status, overdue tasks, and Admin project summary

---

## Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/rahulstd82/team-task-manager.git
cd team-task-manager
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client && npm install && cd ..
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/team_task_manager
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

### 5. Create the database

```bash
psql -U postgres -c "CREATE DATABASE team_task_manager;"
psql -U postgres -c "CREATE USER your_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE team_task_manager TO your_user;"
```

### 6. Run migrations

```bash
npm run migrate
```

---

## Running the App

You need two terminals running simultaneously.

**Terminal 1 — Backend API (port 3000)**
```bash
npm run dev
```

**Terminal 2 — Frontend (port 5173)**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

### Register & Login
1. Go to `/register` and create an account (password must be at least 8 characters)
2. You'll be redirected to the dashboard automatically

### Create a Project
1. Go to **Projects** in the navbar
2. Click **+ New Project**, enter a name and optional description
3. You are automatically the **Admin** of any project you create

### Add Members
1. Open a project by clicking its name or the **Open** button
2. In the **Members** section, type the email address of a registered user
3. Click **Add Member** — they'll appear in the members list with the `member` role

### Create Tasks (Admin only)
1. Inside a project, click **+ New Task**
2. Fill in the title (required), description, due date, and optionally assign it to a member
3. Tasks start with status `todo`

### Update Task Status
- **Admins** can change the status of any task via the dropdown in the task list
- **Members** can only change the status of tasks assigned to them

### Dashboard
The dashboard shows:
- Your task counts grouped by status (`todo`, `in_progress`, `done`)
- Any overdue tasks assigned to you (past due date, not done)
- If you own projects: a summary of all tasks across those projects

---

## Project Structure

```
├── src/                        # Backend source
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # Entry point
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification
│   │   ├── rbac.ts             # Role-based access control
│   │   └── errorHandler.ts     # Global error handler
│   ├── routes/
│   │   ├── auth.ts             # POST /auth/register, /auth/login
│   │   ├── users.ts            # GET /users/search
│   │   ├── projects.ts         # CRUD /projects
│   │   ├── members.ts          # /projects/:id/members
│   │   ├── tasks.ts            # /projects/:id/tasks
│   │   └── dashboard.ts        # GET /dashboard
│   ├── models/                 # Database query functions
│   ├── services/               # Business logic
│   └── db/
│       ├── client.ts           # PostgreSQL connection pool
│       └── migrations/         # SQL migration files
├── client/                     # Frontend source
│   └── src/
│       ├── pages/              # Login, Register, Dashboard, Projects, ProjectDetail
│       ├── components/         # Navbar, TaskStatusBadge
│       ├── api/                # Axios API clients
│       └── context/            # AuthContext (JWT + user state)
└── tests/
    ├── unit/                   # Unit tests (middleware)
    ├── integration/            # Integration tests (auth flows)
    └── property/               # Property-based tests (fast-check)
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new user, returns JWT |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/users/search?email=` | Auth | Look up user by email |
| GET | `/projects` | Auth | List user's projects |
| POST | `/projects` | Auth | Create project (caller becomes Admin) |
| PUT | `/projects/:id` | Admin | Update project name/description |
| DELETE | `/projects/:id` | Admin | Delete project and all tasks |
| GET | `/projects/:id/members` | Member | List project members |
| POST | `/projects/:id/members` | Admin | Add member by user ID |
| DELETE | `/projects/:id/members/:userId` | Admin | Remove member |
| GET | `/projects/:id/tasks` | Member | List project tasks |
| POST | `/projects/:id/tasks` | Admin | Create task |
| PUT | `/projects/:id/tasks/:taskId` | Auth | Update task (Admin: all fields; Member: status only if assigned) |
| GET | `/dashboard` | Auth | Get dashboard summary |

All error responses follow the format:
```json
{ "error": "Human-readable message", "field": "optional — for validation errors" }
```

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- --testPathPattern="tests/unit"

# Integration tests only
npm test -- --testPathPattern="tests/integration"
```

---

## Database Schema

```
users          — id, email (unique), name, password_hash, created_at
projects       — id, name, description, owner_id → users, created_at, updated_at
memberships    — id, project_id → projects, user_id → users, role (admin|member), joined_at
tasks          — id, project_id → projects, assignee_id → users, title, description,
                 status (todo|in_progress|done), due_date, status_updated_at, created_at
```

Deleting a project cascades to its memberships and tasks.

---

## License

MIT
