# College Placement Management System (CPMS)
**Full Stack PBL Project (Topic 29: College Placement Management System)**

A full-stack web application designed for campus hiring. Built with a **pure HTML5, CSS3, and Vanilla JavaScript** frontend, a **Node.js + Express.js** REST API backend, and a **MySQL** database.

---

## 🌟 Key Features

- **Three Role-Based Portals**:
  - **Student Portal**: Explore eligible placement drives, apply in real time, view application status with visual journey timeline (Applied → Shortlisted → Offered), manage academic profile, and upload PDF resumes.
  - **Recruiter / Company Portal**: Corporate registration with TPO approval workflow, post placement drives with detailed eligibility criteria (CGPA, branches, backlogs, deadlines), review applicant CVs, manage interview rounds, and update decisions (Shortlist, Select, Reject).
  - **TPO Admin Portal**: Campus-wide recruitment dashboard, live visual analytics (Branch-wise placements, Company hires, and Month-wise hiring trends), corporate recruiter verification/approval, complete batch records with real-time search, and one-click Excel report export (`.xlsx`).
- **Real-Time Eligibility Engine**: Automatically cross-references student CGPA, branch, active backlogs, and application deadlines against company criteria.
- **Pure Web Standards**:
  - **No React / No UI framework required**. Pure semantic HTML5, modern responsive CSS, and Vanilla JavaScript.
  - Direct static file serving via Express or any static web server.
- **RESTful API Backend**: 15+ secure REST endpoints using JWT authentication and bcrypt password hashing.

---

## 📁 Project Structure

```text
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/              # Auth, Student, Company, Drive, Admin controllers
│   ├── middleware/               # JWT auth, role validation, multer file upload
│   ├── routes/                   # Express REST API routes
│   ├── services/                 # Eligibility engine, cloud upload, email notifications
│   ├── uploads/resumes/          # Local resume PDF storage
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server & static frontend serving
├── database/
│   ├── schema.sql                # MySQL relational schema (7 tables)
│   └── seed.sql                  # Seed data with test credentials
├── frontend/
│   ├── css/
│   │   └── styles.css            # Custom responsive CSS design system
│   ├── js/
│   │   ├── api.js                # Fetch API wrapper with JWT interceptor
│   │   ├── auth.js               # Session & role-based route guard
│   │   ├── toast.js              # Toast notification system
│   │   ├── navbar.js             # Shared responsive navigation bar
│   │   ├── login.js              # Login controller & demo credentials
│   │   ├── register.js           # Student & recruiter registration logic
│   │   ├── student.js            # Student portal controller
│   │   ├── company.js            # Recruiter portal controller
│   │   └── admin.js              # TPO dashboard & chart controller
│   ├── index.html                # Root router & role-based redirect
│   ├── login.html                # Sign-in page with quick demo access
│   ├── register.html             # Multi-role account registration
│   ├── student.html              # Student dashboard & drive applications
│   ├── company.html              # Recruiter dashboard & applicant review
│   └── admin.html                # TPO Officer dashboard & visual analytics
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Database Setup
1. Ensure MySQL is running on your machine.
2. Create and seed the database:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

### 2. Backend Setup
1. Configure `backend/.env`:
   ```env
   PORT=5050
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=placement_db
   JWT_SECRET=your_secret_key
   ```
2. Start the backend:
   ```bash
   cd backend
   node server.js
   ```

### 3. Accessing the Application
Once the backend is running, the frontend is served directly:
- **Application URL**: `http://localhost:5050`
- Or open `frontend/login.html` directly in any web browser or via VS Code Live Server.

---

## 👥 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **TPO Admin** | `admin@college.edu` | `admin123` |
| **Student** | `rahul.sharma@college.edu` | `student123` |
| **Recruiter** | `recruiter@google.com` | `company123` |
