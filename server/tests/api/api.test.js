const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Habit = require('../../src/models/Habit');
const Completion = require('../../src/models/Completion');
const { getUtcTodayString, addDays } = require('../../src/utils/dates');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear collections between tests
  await Promise.all([
    User.deleteMany({}),
    Habit.deleteMany({}),
    Completion.deleteMany({}),
  ]);
});

describe('Habit Tracker API Integration Tests', () => {
  const userA = {
    name: 'Alice Wonder',
    email: 'alice@example.com',
    password: 'Password123!',
  };

  const userB = {
    name: 'Bob Builder',
    email: 'bob@example.com',
    password: 'Password456!',
  };

  const registerUser = async (userData) => {
    return request(app).post('/api/auth/register').send(userData);
  };

  const loginUser = async (email, password) => {
    return request(app).post('/api/auth/login').send({ email, password });
  };

  // -------------------------------------------------------------
  // 1. Authentication Tests
  // -------------------------------------------------------------
  describe('Authentication (/api/auth)', () => {
    test('POST /api/auth/register - successfully creates a user and returns JWT', async () => {
      const res = await registerUser(userA);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(userA.email.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined(); // Password must never be exposed
      expect(res.body.data.token).toBeDefined();
    });

    test('POST /api/auth/register - rejects duplicate email with 409 Conflict', async () => {
      await registerUser(userA);
      const res = await registerUser(userA);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('POST /api/auth/register - fails validation for short password or invalid email', async () => {
      const invalidRes1 = await registerUser({
        name: 'Short',
        email: 'not-an-email',
        password: '123',
      });
      expect(invalidRes1.status).toBe(400);
      expect(invalidRes1.body.success).toBe(false);

      const invalidRes2 = await registerUser({
        name: 'A', // min length is 2
        email: 'valid@example.com',
        password: 'Password123!',
      });
      expect(invalidRes2.status).toBe(400);
      expect(invalidRes2.body.success).toBe(false);
    });

    test('POST /api/auth/login - returns 200 with JWT for correct credentials', async () => {
      await registerUser(userA);
      const res = await loginUser(userA.email, userA.password);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.name).toBe(userA.name);
    });

    test('POST /api/auth/login - returns 401 with generic message for invalid credentials', async () => {
      await registerUser(userA);
      const res = await loginUser(userA.email, 'WrongPassword!');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    test('GET /api/auth/me - returns user profile when authenticated', async () => {
      const reg = await registerUser(userA);
      const token = reg.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(userA.email.toLowerCase());
    });

    test('GET /api/auth/me - returns 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 2. Habits CRUD & Ownership Isolation Tests
  // -------------------------------------------------------------
  describe('Habits CRUD & Ownership (/api/habits)', () => {
    let tokenA;
    let tokenB;

    beforeEach(async () => {
      const resA = await registerUser(userA);
      tokenA = resA.body.data.token;

      const resB = await registerUser(userB);
      tokenB = resB.body.data.token;
    });

    test('POST /api/habits - creates a habit successfully', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Morning Jog',
          description: 'Jog for 30 minutes in the park',
          color: '#10b981',
          icon: '🏃',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.habit.name).toBe('Morning Jog');
      expect(res.body.data.habit.color).toBe('#10b981');
    });

    test('POST /api/habits - rejects invalid habit name', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: '', // Empty
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Ownership Isolation: User B cannot access, update, or delete User A habit', async () => {
      // User A creates habit
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Private Habit A' });

      const habitId = createRes.body.data.habit._id;

      // User B attempts GET -> must return 404
      const getRes = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(getRes.status).toBe(404);

      // User B attempts PUT -> must return 404
      const putRes = await request(app)
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Habit' });
      expect(putRes.status).toBe(404);

      // User B attempts DELETE -> must return 404
      const delRes = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(delRes.status).toBe(404);

      // User A can still retrieve it normally
      const verifyRes = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.habit.name).toBe('Private Habit A');
    });

    test('GET /api/habits - handles pagination and search filter', async () => {
      // Create 5 habits for User A
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name: `Habit Number ${i}` });
      }

      // Page 1 with limit 2
      const pageRes = await request(app)
        .get('/api/habits?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(pageRes.status).toBe(200);
      expect(pageRes.body.data.habits.length).toBe(2);
      expect(pageRes.body.data.pagination.total).toBe(5);
      expect(pageRes.body.data.pagination.totalPages).toBe(3);
      expect(pageRes.body.data.pagination.hasNextPage).toBe(true);

      // Search filter
      const searchRes = await request(app)
        .get('/api/habits?q=Number 3')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.habits.length).toBe(1);
      expect(searchRes.body.data.habits[0].name).toBe('Habit Number 3');
    });

    test('DELETE /api/habits/:id - cascade deletes habit and completions', async () => {
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Habit to Delete' });

      const habitId = createRes.body.data.habit._id;
      const today = getUtcTodayString();

      // Add completion
      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ date: today });

      // Delete habit
      const deleteRes = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(deleteRes.status).toBe(200);

      // Verify habit is gone
      const checkHabit = await Habit.findById(habitId);
      expect(checkHabit).toBeNull();

      // Verify completion is cascade deleted
      const checkCompletions = await Completion.find({ habit: habitId });
      expect(checkCompletions.length).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 3. Completions & Date Validations Tests
  // -------------------------------------------------------------
  describe('Completions & Range Validations', () => {
    let token;
    let habitId;
    const today = getUtcTodayString();

    beforeEach(async () => {
      const reg = await registerUser(userA);
      token = reg.body.data.token;

      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hydration Track' });

      habitId = habitRes.body.data.habit._id;
    });

    test('POST /api/habits/:id/completions - marks habit completed for today', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completion.date).toBe(today);
    });

    test('Idempotency: Re-marking same date returns 200 gracefully without error', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today });

      const secondRes = await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.message).toMatch(/already completed/i);
    });

    test('Rejects dates more than 1 day in the future', async () => {
      const farFutureDate = addDays(today, 3);
      const res = await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: farFutureDate });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/more than 1 day ahead/i);
    });

    test('Allows back-filling within 30 days but rejects older dates', async () => {
      const validPast = addDays(today, -15);
      const resValid = await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: validPast });
      expect(resValid.status).toBe(201);

      const invalidPast = addDays(today, -32);
      const resInvalid = await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: invalidPast });
      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.message).toMatch(/limited to the past 30 days/i);
    });

    test('DELETE /api/habits/:id/completions/:date - undoes a completion', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today });

      const undoRes = await request(app)
        .delete(`/api/habits/${habitId}/completions/${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(undoRes.status).toBe(200);
      expect(undoRes.body.success).toBe(true);

      // Verify deletion from database
      const count = await Completion.countDocuments({ habit: habitId, date: today });
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 4. Stats & Heatmap Tests
  // -------------------------------------------------------------
  describe('Stats & Analytics Endpoints', () => {
    let token;
    let habitId;
    const today = getUtcTodayString();

    beforeEach(async () => {
      const reg = await registerUser(userA);
      token = reg.body.data.token;

      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Reading' });

      habitId = habitRes.body.data.habit._id;

      // Seed 3 consecutive completed days (yesterday, day before, today)
      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: addDays(today, -2) });

      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: addDays(today, -1) });

      await request(app)
        .post(`/api/habits/${habitId}/completions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today });
    });

    test('GET /api/habits/:id/stats - returns currentStreak 3 and longestStreak 3', async () => {
      const res = await request(app)
        .get(`/api/habits/${habitId}/stats?today=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.currentStreak).toBe(3);
      expect(res.body.data.longestStreak).toBe(3);
      expect(res.body.data.totalCompletions).toBe(3);
    });

    test('GET /api/stats/today - returns today status for habit', async () => {
      const res = await request(app)
        .get(`/api/stats/today?date=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalActive).toBe(1);
      expect(res.body.data.completedCount).toBe(1);
      expect(res.body.data.progressPercentage).toBe(100);
      expect(res.body.data.habits[0].completedToday).toBe(true);
    });

    test('GET /api/stats/weekly - returns 7-day breakdown', async () => {
      const res = await request(app)
        .get(`/api/stats/weekly?date=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.days.length).toBe(7);
      expect(res.body.data.totalActiveHabits).toBe(1);
    });

    test('GET /api/stats/heatmap - returns array of heatmap days with levels', async () => {
      const res = await request(app)
        .get(`/api/stats/heatmap?days=30&date=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.days.length).toBe(30);
      const todayCell = res.body.data.days.find((d) => d.date === today);
      expect(todayCell).toBeDefined();
      expect(todayCell.count).toBe(1);
      expect(todayCell.level).toBeGreaterThan(0);
    });
  });
});
