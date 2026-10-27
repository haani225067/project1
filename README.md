# Habit Tracker with Streaks (MERN Stack)

A production-grade, full-stack Habit Tracking and Consistency web application built with the MERN stack (MongoDB Atlas + Mongoose, Express.js, React + Vite, Node.js). Designed and implemented according to ICTAK MERN guidelines with strict security, defensive error handling, timezone-resilient streak algorithms, and comprehensive automated test coverage.

---

## 1. Problem Statement
People struggle to build lasting daily habits because consistency is hard to visualize over time. Traditional to-do lists discard completed items without showing momentum, while rigid trackers fail to handle timezones gracefully or reset streaks unjustly. This application provides actionable feedback, streak momentum, weekly progress visualization, and GitHub-style calendar heatmaps so users can clearly see their dedication and stay motivated.

## 2. Target Users
- **Registered Users Only**: Single role (`user`).
- Each user has strict data isolation and can access and edit **ONLY** their own habits, completions, and analytics.

---

## 3. Scope & Feature Boundaries

### MVP (Must-Have - Fully Implemented)
- **User Authentication**: Secure signup, login, profile verification using bcrypt (salted hashing) and signed JWT tokens with expiration.
- **Habit Management**: Create, edit, soft-archive, search, paginate, and delete habits with cascade deletion of completion history.
- **Daily Completions & Undo**: One-click check-off with optimistic UI updates and instant undo capabilities.
- **Streak Calculation Engine**: Accurate calculation of Current Streak and Longest Streak that accounts for today-in-progress, leap years, month boundaries, and year turnovers.
- **Calendar Heatmaps**: Custom CSS Grid 365-day heatmaps with 5 visual intensity levels, month labels, and hover tooltips for single habit and cross-habit views.
- **Weekly Progress Strip**: Monday-to-Sunday glance displaying daily completion ratios and total week percentage.
- **Back-Filling History**: Toggle completions up to 30 days in the past from the habit detail view.
- **Streak Milestone Celebrations**: Interactive visual celebratory feedback upon achieving streak milestones (7, 30, 100 days).
- **Responsive & Accessible Design**: Mobile-first design (tested at 360px, 768px, 1280px), full keyboard navigation (Space/Enter), ARIA labels, semantic markup, and Dark/Light mode toggle.

### Explicitly Excluded (Out of Scope for MVP)
- Push notifications / email reminders
- Social sharing / friend feeds
- Non-daily habit frequencies (e.g. 3 times a week, monthly)
- Avatar and image file uploads

---

## 4. User Stories & Acceptance Criteria

1. **User Registration & Login**
   - *As a new user*, I want to create an account with my name, email, and password so that my habit data is saved privately.
   - *Acceptance Criteria*: Passwords must be at least 8 characters. Emails must be valid and unique. Duplicate registrations return HTTP 409. Successful registration or login issues a signed JWT and saves user state.

2. **Habit Creation & Customization**
   - *As a user*, I want to create a habit with a custom title, description, color, and emoji icon so that it is visually distinct and easy to recognize.
   - *Acceptance Criteria*: Name must be 2–60 characters. A default color is provided if none selected. Habit is instantly added to the dashboard.

3. **Daily Habit Completion & Undo**
   - *As a user*, I want to check off a habit for today with one click, or uncheck it if I made a mistake.
   - *Acceptance Criteria*: The action reflects instantly on the UI (optimistic update). The server ensures idempotency via a compound unique index `(habit, date)`. Undo removes the record and recalculates streaks.

4. **Streak Calculation & Forgiveness Rule**
   - *As a user*, I want my current streak to stay intact while today is still underway even if I haven't completed it yet.
   - *Acceptance Criteria*: If today is completed, streak ends today. If today is NOT completed, streak continues if yesterday was completed. The streak only resets if yesterday was also missed. Longest streak records all-time consecutive runs.

5. **Historical Heatmap & Back-filling**
   - *As a user*, I want to view a 365-day calendar heatmap and back-fill completed days up to 30 days prior.
   - *Acceptance Criteria*: Interactive grid showing intensity levels. Clicking a cell within the 30-day window toggles completion. Future dates (>1 day ahead of server UTC) and dates older than 30 days are rejected.

6. **Weekly Consistency Overview**
   - *As a user*, I want to see my completion rate across Monday through Sunday for the current week so that I can monitor my weekly rhythm.
   - *Acceptance Criteria*: Dashboard presents a weekly strip with daily ratios (e.g., 3/4 habits done) and an aggregate weekly percentage score.

---

## 5. Tech Stack

- **Backend**: Node.js, Express.js (REST API), MongoDB Atlas with Mongoose ODM.
- **Security**: Helmet, CORS origin restriction, Express Rate Limit, NoSQL injection protection, bcryptjs, JSON Web Tokens.
- **Validation**: Express-Validator for strong body, query, and parameter schema checks.
- **Frontend**: React 18, Vite, React Router DOM v6, Axios (configured single instance with interceptors), Vanilla Modern CSS variables (custom styling with zero bloat).
- **Testing**: Jest, Supertest, mongodb-memory-server for isolated, zero-external-dependency automated test suites.

---

## 6. Architecture & Request Flow

```
[ Browser / Client (React + Vite) ]
          |
          | HTTP Requests with Bearer JWT (Axios Instance)
          v
[ Express Server (server/src/app.js) ]
          |
     [ Helmet, CORS, RateLimiter, BodySanitizer ]
          |
     [ Route Dispatcher (/api/auth, /api/habits, /api/stats) ]
          |
     [ JWT Auth Middleware (verify token, attach req.user) ]
          |
     [ Request Validation Middleware (express-validator) ]
          |
     [ Controller Layer (habitsController, statsController) ]
          |
     [ Business Logic & Streak Engine (streak.js, dates.js) ]
          |
     [ Mongoose Model Layer (User, Habit, Completion) ]
          |
[ MongoDB Atlas / In-Memory MongoDB ]
```

---

## 7. Data Models

### User Schema
- `name`: String, required, 2-50 chars, trimmed.
- `email`: String, required, unique, lowercase, trimmed, validated.
- `password`: String, required, min 8 chars, hashed with bcrypt (cost factor 10), hidden by default (`select: false`).
- `timestamps`: `createdAt`, `updatedAt`.

### Habit Schema
- `user`: ObjectId (ref: `User`), required, indexed.
- `name`: String, required, 2-60 chars, trimmed.
- `description`: String, optional, max 200 chars, trimmed.
- `color`: String, hex format `#RRGGBB`, default `#6366f1`.
- `icon`: String, emoji/icon symbol, optional.
- `isArchived`: Boolean, default `false`.
- `timestamps`: `createdAt`, `updatedAt`.

### Completion Schema
- `habit`: ObjectId (ref: `Habit`), required, indexed.
- `user`: ObjectId (ref: `User`), required, indexed.
- `date`: String in `YYYY-MM-DD` format, required.
- **Indexes**:
  - Compound Unique Index: `{ habit: 1, date: 1 }` (Prevents duplicate completions on the same day).
  - Query Index: `{ user: 1, date: 1 }` (Optimizes user heatmap and weekly aggregations).
- `timestamps`: `createdAt`, `updatedAt`.

---

## 8. Directory Structure

```
assignment/
├── client/                      # React frontend application (Vite)
│   ├── public/
│   │   └── _redirects           # SPA routing fallback for Netlify
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # AuthContext & ThemeContext
│   │   ├── hooks/               # Custom hooks (e.g. useToast)
│   │   ├── pages/               # Page views (Dashboard, Habits, Detail, Insights, Auth)
│   │   ├── services/            # Single centralized Axios API client
│   │   ├── styles/              # Global styles, variables, reset
│   │   ├── utils/               # Local date formatting and helpers
│   │   ├── App.jsx              # Routing & providers
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── package.json
│   ├── vercel.json              # SPA routing fallback for Vercel
│   └── vite.config.js
├── server/                      # Node.js Express REST API
│   ├── src/
│   │   ├── config/              # db.js, env.js
│   │   ├── controllers/         # authController, habitsController, completionsController, statsController
│   │   ├── middleware/          # auth, validate, errorHandler, notFound
│   │   ├── models/              # User, Habit, Completion
│   │   ├── routes/              # authRoutes, habitsRoutes, statsRoutes
│   │   ├── utils/               # streak.js, dates.js
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point
│   ├── tests/                   # Jest & Supertest automated test suite
│   ├── scripts/                 # seed.js (Demo user data generator)
│   └── package.json
├── docs/
│   ├── api-contract.md          # Full API specification and schemas
│   └── TESTING.md               # Test scenarios, steps, results, and bug log
├── .gitignore                   # Excludes node_modules, .env, dist, etc.
└── README.md                    # Project documentation
```

---

## 9. Environment Variables

### Server (`server/.env.example`)
```env
# Port for the Express server
PORT=5000

# MongoDB Connection String (Paste your MongoDB Atlas URI below)
# Example: mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/habittracker?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/habittracker

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_change_in_production_min32chars
JWT_EXPIRES_IN=7d

# Allowed Frontend Origin for CORS
CLIENT_ORIGIN=http://localhost:5173
```

### Client (`client/.env.example`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

> **Security Rule**: Real `.env` files are ignored by git and never committed to version control.

---

## 10. Local Setup & Running Instructions

### Prerequisites
- Node.js (v18+ recommended, v20+ supported)
- MongoDB instance (Local or free MongoDB Atlas cluster)

### 1. Clone the repository
```bash
git clone <repository-url>
cd assignment
```

### 2. Configure Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
```

### 3. Configure Frontend
```bash
cd ../client
npm install
cp .env.example .env
# Ensure VITE_API_URL points to http://localhost:5000/api
```

### 4. Run Development Servers
- Start Backend (from `/server`):
  ```bash
  npm run dev
  ```
- Start Frontend (from `/client`):
  ```bash
  npm run dev
  ```
- Open browser at: `http://localhost:5173`

### 5. Optional Demo Seed Script
To generate a demo user with 120 days of realistic completion data for visual evaluation:
```bash
cd server
npm run seed
```
Demo Credentials:
- Email: `demo@example.com`
- Password: `Password123!`

---

## 11. Streak Calculation Rules

Streak calculations are handled deterministically in `server/src/utils/streak.js`:
- **Date Format**: Standardized as `YYYY-MM-DD` strings.
- **Current Streak**:
  - Counts consecutive completed days working backward from today.
  - **Grace Period (Today in progress)**: If today is not completed yet, the streak does **not** reset if yesterday was completed. The current streak will reflect yesterday's consecutive run until today ends.
  - If both today and yesterday are missed, current streak is `0`.
- **Longest Streak**: The maximum consecutive run of completed dates across the user's entire history for that habit.
- **Date Boundary Handling**: Tested against leap years (Feb 28 - Feb 29 - Mar 1), month boundaries (30/31 days), and year transitions (Dec 31 - Jan 1).

---

## 12. Security Measures

- **Password Hashing**: Strong salting and hashing with `bcryptjs`.
- **Stateless Authorization**: JWT with expiry validated on every protected route.
- **Resource Ownership Verification**: Every query is strictly scoped by `req.user.id`. Accessing another user's habit ID results in a safe `404 Not Found`.
- **NoSQL Injection Prevention**: Strict validation on all incoming query parameters and IDs, plus sanitization.
- **HTTP Header Hardening**: Integrated `helmet` middleware.
- **Strict CORS**: Only requests from `CLIENT_ORIGIN` are permitted.
- **Rate Limiting**: Brute-force protection on authentication routes (`/api/auth/*`).
- **Defensive Error Handling**: Centralized error middleware prevents raw stack traces or internal DB error objects from leaking to the client.

---

## 13. Deployment Guide

### A. Deploy Backend (e.g. Render / Railway)
1. Push your repository to GitHub.
2. Create a new Web Service on Render or Railway pointing to the `/server` directory.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure Environment Variables in the host dashboard:
   - `PORT`: 5000 (or provided by host)
   - `MONGODB_URI`: `<Your MongoDB Atlas Production URI>`
   - `JWT_SECRET`: `<Secure random 64-char string>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_ORIGIN`: `https://your-habit-tracker.vercel.app`

### B. MongoDB Atlas Configuration
1. Create a free M0 cluster on MongoDB Atlas.
2. In **Network Access**, add `0.0.0.0/0` (or host IP range).
3. In **Database Access**, create a dedicated database user with `readWrite` permissions on `habittracker` database.

### C. Deploy Frontend (e.g. Vercel / Netlify)
1. Create a new project pointing to the `/client` directory.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
6. SPA Routing Fallback: Handled automatically by `client/vercel.json` and `client/public/_redirects`.

### Post-Deployment Verification Checklist
- [ ] Frontend communicates with backend over HTTPS.
- [ ] No hardcoded `localhost` URLs in build output.
- [ ] Refreshing deep links (e.g., `/habits/some-id`) loads the page without 404.
- [ ] Database credentials and JWT secrets are not visible in client bundles or git logs.

---

## 14. Screenshots & Demo Placeholders
- *Dashboard Overview*: `[Screenshot Placeholder: Dashboard with streaks and weekly strip]`
- *Habit Detail & Heatmap*: `[Screenshot Placeholder: 365-day single habit heatmap]`
- *Overall Insights*: `[Screenshot Placeholder: Aggregate heatmap & weekly ratios]`
- *Live Demo URL*: `https://habit-tracker-example.vercel.app` (Placeholder)
- *Live API URL*: `https://habit-tracker-api.onrender.com` (Placeholder)

---

## 15. Known Limitations & Future Roadmap
- **Timezone Drift on Travel**: The client sends the local date string (`YYYY-MM-DD`). If a user travels across the international date line on the same day, duplicate check-offs are prevented by the unique date constraint, but streak continuity reflects the local day reported.
- **Offline Sync**: Currently requires an active network connection; offline Progressive Web App (PWA) with Service Worker sync is planned for v2.
- **Custom Frequencies**: MVP supports daily habits; custom schedules (e.g., "3 days per week" or "weekdays only") will be introduced in future updates.

---

## 16. Self-Review Questions & Answers (ICTAK Guidelines)
- **Q: How does the application prevent timezone discrepancies in streak calculation?**  
  *A: The client computes today's date in local calendar time (`YYYY-MM-DD`) and sends this string. The server enforces date validity and ensures streaks are calculated based on calendar days, avoiding UTC offset shifts.*
- **Q: How is data privacy enforced between different users?**  
  *A: The JWT middleware extracts `req.user.id`. Every Mongoose query filtering habits, completions, or statistics includes `{ user: req.user.id }`. Unauthorized access attempts return a safe `404 Not Found` rather than leaking resource existence.*
- **Q: Why was an optimistic UI implemented for habit check-offs?**  
  *A: Habit tracking requires rapid, frictionless feedback. Optimistic UI updates the checkmark and streak immediately in local state. If the server request fails, the UI rolls back automatically and notifies the user via toast.*
