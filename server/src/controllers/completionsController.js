const Habit = require('../models/Habit');
const Completion = require('../models/Completion');
const { isDateWithinAllowedRange, isValidDateString } = require('../utils/dates');

/**
 * @desc    Mark a habit as completed for a given date
 * @route   POST /api/habits/:id/completions
 * @access  Protected
 */
const markCompleted = async (req, res, next) => {
  try {
    const habitId = req.params.id;
    const { date } = req.body;

    // Check ownership of habit
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

    // Validate date range rule: not > 1 day in future, backfill up to 30 days
    const rangeCheck = isDateWithinAllowedRange(date);
    if (!rangeCheck.valid) {
      return res.status(400).json({
        success: false,
        message: rangeCheck.reason,
        data: null,
      });
    }

    // Check if already completed (idempotent check)
    const existing = await Completion.findOne({
      habit: habitId,
      date,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Habit was already completed for this date',
        data: { completion: existing },
      });
    }

    // Create completion record
    try {
      const completion = await Completion.create({
        habit: habitId,
        user: req.user._id,
        date,
      });

      return res.status(201).json({
        success: true,
        message: 'Habit marked as completed',
        data: { completion },
      });
    } catch (createErr) {
      // In case of parallel race condition hitting unique index
      if (createErr.code === 11000) {
        const raceExisting = await Completion.findOne({ habit: habitId, date });
        return res.status(200).json({
          success: true,
          message: 'Habit was already completed for this date',
          data: { completion: raceExisting },
        });
      }
      throw createErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Undo completion for a specific habit and date
 * @route   DELETE /api/habits/:id/completions/:date
 * @access  Protected
 */
const undoCompleted = async (req, res, next) => {
  try {
    const habitId = req.params.id;
    const { date } = req.params;

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date must be in valid YYYY-MM-DD format',
        data: null,
      });
    }

    // Verify habit ownership
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

    const deleted = await Completion.findOneAndDelete({
      habit: habitId,
      user: req.user._id,
      date,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'No completion record found for the specified date',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Habit completion undone successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get completions for a habit, optionally filtered by date range
 * @route   GET /api/habits/:id/completions
 * @access  Protected
 */
const getCompletions = async (req, res, next) => {
  try {
    const habitId = req.params.id;
    const { from, to } = req.query;

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

    const query = {
      habit: habitId,
      user: req.user._id,
    };

    if (from || to) {
      query.date = {};
      if (from) {
        if (!isValidDateString(from)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "from" date format. Expected YYYY-MM-DD',
            data: null,
          });
        }
        query.date.$gte = from;
      }
      if (to) {
        if (!isValidDateString(to)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "to" date format. Expected YYYY-MM-DD',
            data: null,
          });
        }
        query.date.$lte = to;
      }
    }

    const completions = await Completion.find(query)
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Completions retrieved successfully',
      data: { completions },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markCompleted,
  undoCompleted,
  getCompletions,
};
