const Habit = require('../models/Habit');
const Completion = require('../models/Completion');
const { calculateStreaks } = require('../utils/streak');
const {
  isValidDateString,
  getUtcTodayString,
  getWeekRange,
  getDaysList,
  addDays,
} = require('../utils/dates');

/**
 * @desc    Get streak and performance stats for a single habit
 * @route   GET /api/habits/:id/stats
 * @access  Protected
 */
const getHabitStats = async (req, res, next) => {
  try {
    const habitId = req.params.id;
    const today = req.query.today || getUtcTodayString();

    if (!isValidDateString(today)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid today date format. Expected YYYY-MM-DD',
        data: null,
      });
    }

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
        data: null,
      });
    }

    // Get all completed dates for this habit
    const completions = await Completion.find({
      habit: habitId,
      user: req.user._id,
    })
      .select('date')
      .lean();

    const dates = completions.map((c) => c.date);
    const stats = calculateStreaks(dates, today);

    return res.status(200).json({
      success: true,
      message: 'Habit statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get today's overview: active habits, completed status, streaks, progress
 * @route   GET /api/stats/today
 * @access  Protected
 */
const getTodayOverview = async (req, res, next) => {
  try {
    const date = req.query.date || getUtcTodayString();

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameter. Expected YYYY-MM-DD',
        data: null,
      });
    }

    // Fetch all active habits for user
    const habits = await Habit.find({
      user: req.user._id,
      isArchived: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Fetch all completions for user across all their habits
    const completions = await Completion.find({
      user: req.user._id,
    })
      .select('habit date')
      .lean();

    // Group completion dates by habit ID
    const completionsByHabit = new Map();
    for (const c of completions) {
      const hId = c.habit.toString();
      if (!completionsByHabit.has(hId)) {
        completionsByHabit.set(hId, []);
      }
      completionsByHabit.get(hId).push(c.date);
    }

    let completedCount = 0;
    const enrichedHabits = habits.map((habit) => {
      const hId = habit._id.toString();
      const habitDates = completionsByHabit.get(hId) || [];
      const isCompleted = habitDates.includes(date);

      if (isCompleted) {
        completedCount += 1;
      }

      const streakData = calculateStreaks(habitDates, date);

      return {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        icon: habit.icon,
        isArchived: habit.isArchived,
        completedToday: isCompleted,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      };
    });

    const totalActive = habits.length;
    const progressPercentage =
      totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: "Today's habits overview retrieved successfully",
      data: {
        date,
        totalActive,
        completedCount,
        progressPercentage,
        habits: enrichedHabits,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get weekly consistency progress for the week (Mon-Sun) containing the date
 * @route   GET /api/stats/weekly
 * @access  Protected
 */
const getWeeklyStats = async (req, res, next) => {
  try {
    const anchorDate = req.query.date || getUtcTodayString();

    if (!isValidDateString(anchorDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameter. Expected YYYY-MM-DD',
        data: null,
      });
    }

    const { weekStart, weekEnd, days } = getWeekRange(anchorDate);

    // Count user's active habits
    const totalActiveHabits = await Habit.countDocuments({
      user: req.user._id,
      isArchived: false,
    });

    // Get all completions for user within the week range
    const completions = await Completion.find({
      user: req.user._id,
      date: { $gte: weekStart, $lte: weekEnd },
    })
      .select('date habit')
      .lean();

    // Group completion counts by date
    const countsByDate = {};
    for (const d of days) {
      countsByDate[d] = 0;
    }

    for (const c of completions) {
      if (countsByDate[c.date] !== undefined) {
        countsByDate[c.date] += 1;
      }
    }

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let totalCompletedInWeek = 0;

    const daysData = days.map((dayStr, idx) => {
      const completed = countsByDate[dayStr] || 0;
      totalCompletedInWeek += completed;
      const percentage =
        totalActiveHabits > 0
          ? Math.round((completed / totalActiveHabits) * 100)
          : 0;

      return {
        date: dayStr,
        dayName: dayLabels[idx],
        completed,
        total: totalActiveHabits,
        percentage,
      };
    });

    const maxPossibleCompletions = totalActiveHabits * 7;
    const overallWeeklyPercentage =
      maxPossibleCompletions > 0
        ? Math.round((totalCompletedInWeek / maxPossibleCompletions) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      message: 'Weekly stats retrieved successfully',
      data: {
        weekStart,
        weekEnd,
        totalActiveHabits,
        overallWeeklyPercentage,
        days: daysData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get calendar heatmap data for the past N days (single habit or aggregated across all active habits)
 * @route   GET /api/stats/heatmap
 * @access  Protected
 */
const getHeatmapData = async (req, res, next) => {
  try {
    const rawDays = parseInt(req.query.days, 10);
    const daysCount = isNaN(rawDays) ? 365 : Math.min(365, Math.max(7, rawDays));
    const endDate = req.query.date || getUtcTodayString();

    if (!isValidDateString(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date parameter. Expected YYYY-MM-DD',
        data: null,
      });
    }

    const startDate = addDays(endDate, -(daysCount - 1));
    const allDates = getDaysList(startDate, endDate);

    const habitId = req.query.habitId;
    let totalExpectedPerDay = 1;

    const completionFilter = {
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    };

    if (habitId) {
      // Check habit ownership
      const habit = await Habit.findOne({ _id: habitId, user: req.user._id });
      if (!habit) {
        return res.status(404).json({
          success: false,
          message: 'Habit not found',
          data: null,
        });
      }
      completionFilter.habit = habitId;
      totalExpectedPerDay = 1;
    } else {
      totalExpectedPerDay = await Habit.countDocuments({
        user: req.user._id,
        isArchived: false,
      });
    }

    const completions = await Completion.find(completionFilter)
      .select('date habit')
      .lean();

    // Count completions per date
    const countsMap = new Map();
    for (const c of completions) {
      countsMap.set(c.date, (countsMap.get(c.date) || 0) + 1);
    }

    const days = allDates.map((dateStr) => {
      const count = countsMap.get(dateStr) || 0;
      const total = totalExpectedPerDay;

      let level = 0;
      if (totalExpectedPerDay > 0 && count > 0) {
        if (habitId) {
          // For single habit, level 4 if completed, 0 if not
          level = count >= 1 ? 4 : 0;
        } else {
          // For aggregated habits, 4 intensity levels
          const ratio = count / totalExpectedPerDay;
          if (ratio >= 0.8) level = 4;
          else if (ratio >= 0.5) level = 3;
          else if (ratio >= 0.25) level = 2;
          else level = 1;
        }
      }

      return {
        date: dateStr,
        count,
        total,
        level,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Heatmap data retrieved successfully',
      data: {
        startDate,
        endDate,
        totalExpectedPerDay,
        days,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHabitStats,
  getTodayOverview,
  getWeeklyStats,
  getHeatmapData,
};
