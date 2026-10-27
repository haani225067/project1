# Habit Tracker API Contract

Base URL: `/api`  
Standard Response Format:
```json
{
  "success": true | false,
  "message": "Human-readable status or error description",
  "data": null | object | array
}
```

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Route:** `POST /api/auth/register`
- **Access:** Public (Rate limited)
- **Request Body:**
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Validation Rules:**
  - `name`: String, trimmed, required, 2-50 characters.
  - `email`: String, valid email format, normalized to lowercase, required.
  - `password`: String, minimum 8 characters, required.
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "660c1f2b4f1a25d3a8e99123",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-03-30T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g. invalid email or short password).
  - `409 Conflict`: Email already exists.

---

### 1.2 Login User
- **Route:** `POST /api/auth/login`
- **Access:** Public (Rate limited)
- **Request Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "660c1f2b4f1a25d3a8e99123",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-03-30T10:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials (generic message).

---

### 1.3 Get Current User Profile
- **Route:** `GET /api/auth/me`
- **Access:** Protected (Bearer JWT)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User profile retrieved",
    "data": {
      "user": {
        "id": "660c1f2b4f1a25d3a8e99123",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-03-30T10:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Token missing, expired, or invalid.

---

## 2. Habits Endpoints (All Protected)

### 2.1 List Habits
- **Route:** `GET /api/habits`
- **Access:** Protected
- **Query Parameters:**
  - `page` (optional, default: 1): Integer >= 1
  - `limit` (optional, default: 10, max: 50): Integer between 1 and 50
  - `archived` (optional, default: "false"): Boolean string ("true" | "false")
  - `q` (optional): Search string matching habit name or description (case-insensitive)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habits retrieved successfully",
    "data": {
      "habits": [
        {
          "_id": "660c1f2b4f1a25d3a8e99456",
          "user": "660c1f2b4f1a25d3a8e99123",
          "name": "Morning Meditation",
          "description": "15 minutes mindfulness breathing",
          "color": "#6366f1",
          "icon": "🧘",
          "isArchived": false,
          "createdAt": "2026-03-25T08:00:00.000Z",
          "updatedAt": "2026-03-25T08:00:00.000Z"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    }
  }
  ```

---

### 2.2 Create Habit
- **Route:** `POST /api/habits`
- **Access:** Protected
- **Request Body:**
  ```json
  {
    "name": "Read 20 pages",
    "description": "Read non-fiction book every afternoon",
    "color": "#10b981",
    "icon": "📚"
  }
  ```
- **Validation Rules:**
  - `name`: Required, 2-60 characters, trimmed string.
  - `description`: Optional, max 200 characters.
  - `color`: Optional, valid hex color code (e.g. `#3b82f6`), defaults to `#6366f1`.
  - `icon`: Optional, max 10 characters (emoji or short symbol).
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Habit created successfully",
    "data": {
      "habit": {
        "_id": "660c1f2b4f1a25d3a8e99789",
        "user": "660c1f2b4f1a25d3a8e99123",
        "name": "Read 20 pages",
        "description": "Read non-fiction book every afternoon",
        "color": "#10b981",
        "icon": "📚",
        "isArchived": false,
        "createdAt": "2026-03-30T10:30:00.000Z",
        "updatedAt": "2026-03-30T10:30:00.000Z"
      }
    }
  }
  ```

---

### 2.3 Get Single Habit
- **Route:** `GET /api/habits/:id`
- **Access:** Protected
- **URL Parameters:** `:id` (valid MongoDB ObjectId)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit retrieved successfully",
    "data": {
      "habit": {
        "_id": "660c1f2b4f1a25d3a8e99789",
        "user": "660c1f2b4f1a25d3a8e99123",
        "name": "Read 20 pages",
        "description": "Read non-fiction book every afternoon",
        "color": "#10b981",
        "icon": "📚",
        "isArchived": false,
        "createdAt": "2026-03-30T10:30:00.000Z",
        "updatedAt": "2026-03-30T10:30:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId.
  - `404 Not Found`: Habit not found or belongs to another user.

---

### 2.4 Update Habit
- **Route:** `PUT /api/habits/:id`
- **Access:** Protected
- **URL Parameters:** `:id`
- **Request Body (Partial or Full):**
  ```json
  {
    "name": "Read 30 pages",
    "description": "Updated goal",
    "color": "#0ea5e9",
    "icon": "📖",
    "isArchived": false
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit updated successfully",
    "data": {
      "habit": {
        "_id": "660c1f2b4f1a25d3a8e99789",
        "user": "660c1f2b4f1a25d3a8e99123",
        "name": "Read 30 pages",
        "description": "Updated goal",
        "color": "#0ea5e9",
        "icon": "📖",
        "isArchived": false,
        "createdAt": "2026-03-30T10:30:00.000Z",
        "updatedAt": "2026-03-30T11:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: Habit not found or unauthorized.

---

### 2.5 Delete Habit
- **Route:** `DELETE /api/habits/:id`
- **Access:** Protected
- **Description:** Deletes the habit and all associated completion documents.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit and its completion history deleted successfully",
    "data": null
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Habit not found or unauthorized.

---

## 3. Completions Endpoints (All Protected)

### 3.1 Mark Habit Completed for Date
- **Route:** `POST /api/habits/:id/completions`
- **Access:** Protected
- **Request Body:**
  ```json
  {
    "date": "2026-03-30"
  }
  ```
- **Validation Rules:**
  - `date`: Required String in exact `YYYY-MM-DD` format.
  - Rejects dates more than 1 day ahead of the server's current UTC date.
  - Allows back-filling up to 30 days in the past (rejects dates older than 30 days before today).
- **Behavior:**
  - Idempotent: If completion already exists for `(habit, date)`, returns `200 OK` gracefully indicating already completed. If new, returns `201 Created`.
- **Success Response (201 Created or 200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit marked as completed",
    "data": {
      "completion": {
        "_id": "660c1f2b4f1a25d3a8e99999",
        "habit": "660c1f2b4f1a25d3a8e99789",
        "user": "660c1f2b4f1a25d3a8e99123",
        "date": "2026-03-30",
        "createdAt": "2026-03-30T11:15:00.000Z"
      }
    }
  }
  ```

---

### 3.2 Undo Completion for Date
- **Route:** `DELETE /api/habits/:id/completions/:date`
- **Access:** Protected
- **URL Parameters:**
  - `:id`: Habit ObjectId
  - `:date`: String in `YYYY-MM-DD` format
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit completion undone successfully",
    "data": null
  }
  ```
- **Error Responses:**
  - `404 Not Found`: Habit or completion record not found.

---

### 3.3 Get Completions in Date Range
- **Route:** `GET /api/habits/:id/completions`
- **Access:** Protected
- **Query Parameters:**
  - `from` (optional): `YYYY-MM-DD`
  - `to` (optional): `YYYY-MM-DD`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Completions retrieved successfully",
    "data": {
      "completions": [
        {
          "_id": "660c1f2b4f1a25d3a8e99999",
          "habit": "660c1f2b4f1a25d3a8e99789",
          "date": "2026-03-30"
        }
      ]
    }
  }
  ```

---

## 4. Stats Endpoints (All Protected)

### 4.1 Single Habit Stats
- **Route:** `GET /api/habits/:id/stats`
- **Access:** Protected
- **Query Parameters:**
  - `today` (optional): `YYYY-MM-DD` (defaults to server's today)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Habit statistics retrieved",
    "data": {
      "currentStreak": 5,
      "longestStreak": 14,
      "totalCompletions": 42,
      "completionRateLast30Days": 80
    }
  }
  ```

---

### 4.2 Today's Overview
- **Route:** `GET /api/stats/today`
- **Access:** Protected
- **Query Parameters:**
  - `date`: `YYYY-MM-DD` (client's local today)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Today overview retrieved",
    "data": {
      "date": "2026-03-30",
      "totalActive": 4,
      "completedCount": 3,
      "progressPercentage": 75,
      "habits": [
        {
          "_id": "660c1f2b4f1a25d3a8e99456",
          "name": "Morning Meditation",
          "color": "#6366f1",
          "icon": "🧘",
          "completedToday": true,
          "currentStreak": 12
        }
      ]
    }
  }
  ```

---

### 4.3 Weekly Progress
- **Route:** `GET /api/stats/weekly`
- **Access:** Protected
- **Query Parameters:**
  - `date`: `YYYY-MM-DD`
- **Description:** Returns stats for the Monday–Sunday week containing `date`.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Weekly statistics retrieved",
    "data": {
      "weekStart": "2026-03-23",
      "weekEnd": "2026-03-29",
      "overallWeeklyPercentage": 82,
      "days": [
        {
          "date": "2026-03-23",
          "dayName": "Mon",
          "completed": 4,
          "total": 4,
          "percentage": 100
        },
        {
          "date": "2026-03-24",
          "dayName": "Tue",
          "completed": 3,
          "total": 4,
          "percentage": 75
        }
      ]
    }
  }
  ```

---

### 4.4 Calendar Heatmap
- **Route:** `GET /api/stats/heatmap`
- **Access:** Protected
- **Query Parameters:**
  - `days` (optional, default: 365, max: 365): Number of days to look back
  - `date` (optional): Anchor date `YYYY-MM-DD` (defaults to today)
  - `habitId` (optional): Specific habit ID (if calculating single habit heatmap)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Heatmap data retrieved",
    "data": {
      "totalActiveHabits": 4,
      "days": [
        {
          "date": "2026-03-30",
          "count": 3,
          "total": 4,
          "level": 3
        }
      ]
    }
  }
  ```
  *(Level ranges from 0 to 4 based on completion ratio or count).*
