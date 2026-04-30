# Team Task Manager

A full-stack web application with role-based access control (Admin and Member) for managing projects and tasks collaboratively.

## Tech Stack

**Frontend:** React, Tailwind CSS, React Router, Axios, React Toastify, React DnD  
**Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Authentication  
**Deployment:** Railway (Backend + Frontend)

---

## Folder Structure

```
Ethara/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── .env
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

---

## API Documentation

### Auth Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/me | Get current user | Yes |

### User Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/users | Get all users | Admin |
| PUT | /api/users/:id/role | Update user role | Admin |
| DELETE | /api/users/:id | Delete user | Admin |

### Project Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/projects | Get all projects | Yes |
| POST | /api/projects | Create project | Admin |
| GET | /api/projects/:id | Get project by ID | Yes |
| PUT | /api/projects/:id | Update project | Admin |
| DELETE | /api/projects/:id | Delete project | Admin |
| POST | /api/projects/:id/members | Add member | Admin |
| DELETE | /api/projects/:id/members/:userId | Remove member | Admin |

### Task Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/tasks | Get all tasks | Yes |
| POST | /api/tasks | Create task | Admin |
| GET | /api/tasks/:id | Get task by ID | Yes |
| PUT | /api/tasks/:id | Update task | Yes |
| DELETE | /api/tasks/:id | Delete task | Admin |
| GET | /api/tasks/project/:projectId | Get tasks by project | Yes |

---

## Deployment on Railway

1. Push code to GitHub
2. Create two Railway services: one for backend, one for frontend
3. Set environment variables in Railway dashboard
4. Backend: set `npm run start` as start command
5. Frontend: set `npm run build` then serve with `npx serve dist`

---

## Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create/Edit/Delete Projects | ✅ | ❌ |
| Manage Team Members | ✅ | ❌ |
| Create/Assign Tasks | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ |
| Update Task Status | ✅ | ✅ |
| View Dashboard | ✅ | ✅ |
