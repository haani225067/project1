const mongoose = require('mongoose');
const User = require('../src/models/User');
const Habit = require('../src/models/Habit');
const Completion = require('../src/models/Completion');
const config = require('../src/config/env');
const { addDays, getUtcTodayString } = require('../src/utils/dates');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(config.MONGODB_URI);

    const demoEmail = 'demo@example.com';
    const demoPassword = 'Password123!';

    // Clean up existing demo user
    const existingUser = await User.findOne({ email: demoEmail });
    if (existingUser) {
      console.log('[Seed] Removing previous demo user data...');
      await Completion.deleteMany({ user: existingUser._id });
      await Habit.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    console.log('[Seed] Creating demo user...');
    const user = await User.create({
      name: 'Demo Alex',
      email: demoEmail,
      password: demoPassword,
    });

    console.log('[Seed] Creating 4 demo habits...');
    const habitsData = [
      {
        user: user._id,
        name: 'Morning Meditation',
        description: '15 minutes of quiet mindfulness',
        color: '#6366f1',
        icon: '🧘',
        probability: 0.85,
      },
      {
        user: user._id,
        name: 'Read 20 Pages',
        description: 'Non-fiction reading each afternoon',
        color: '#10b981',
        icon: '📚',
        probability: 0.75,
      },
      {
        user: user._id,
        name: 'Drink 2.5L Water',
        description: 'Stay hydrated throughout the workday',
        color: '#0ea5e9',
        icon: '💧',
        probability: 0.90,
      },
      {
        user: user._id,
        name: 'Evening Jog / Workout',
        description: '30 minutes outdoor cardio or strength session',
        color: '#f59e0b',
        icon: '🏃',
        probability: 0.65,
      },
    ];

    const habits = [];
    for (const h of habitsData) {
      const habit = await Habit.create({
        user: h.user,
        name: h.name,
        description: h.description,
        color: h.color,
        icon: h.icon,
      });
      habits.push({ habit, probability: h.probability });
    }

    console.log('[Seed] Generating ~120 days of realistic completion data...');
    const today = getUtcTodayString();
    const completionsToInsert = [];

    // Seed 120 days backwards up to today
    for (let i = 119; i >= 0; i--) {
      const date = addDays(today, -i);

      for (const { habit, probability } of habits) {
        // Pseudo-random consistency check
        // For the last 7 days, ensure high completion so user has active current streaks
        const boost = i <= 6 ? 0.2 : 0;
        const roll = Math.random();

        if (roll < probability + boost) {
          completionsToInsert.push({
            habit: habit._id,
            user: user._id,
            date,
          });
        }
      }
    }

    if (completionsToInsert.length > 0) {
      await Completion.insertMany(completionsToInsert);
    }

    console.log('====================================================');
    console.log(' Seed completed successfully!');
    console.log(` Created user: ${demoEmail}`);
    console.log(` Password:     ${demoPassword}`);
    console.log(` Habits:       ${habits.length}`);
    console.log(` Completions:  ${completionsToInsert.length}`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
