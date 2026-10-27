const Habit = require('../models/Habit');
const Completion = require('../models/Completion');

/**
 * @desc    Create a new habit
 * @route   POST /api/habits
 * @access  Protected
 */
const createHabit = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    const habit = await Habit.create({
      user: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#6366f1',
      icon: icon || '⭐',
      isArchived: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all habits for the logged-in user with pagination, archive filter, and search
 * @route   GET /api/habits
 * @access  Protected
 */
const getHabits = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    // Archive filter: default is false (active habits only)
    if (req.query.archived === 'true') {
      filter.isArchived = true;
    } else if (req.query.archived === 'all') {
      // do not filter by isArchived
    } else {
      filter.isArchived = false;
    }

    // Search query filter (escaped string)
    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim().length > 0) {
      const sanitizedQ = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitizedQ, $options: 'i' } },
        { description: { $regex: sanitizedQ, $options: 'i' } },
      ];
    }

    const [habits, total] = await Promise.all([
      Habit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Habit.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      message: 'Habits retrieved successfully',
      data: {
        habits,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single habit by ID (strictly owned by current user)
 * @route   GET /api/habits/:id
 * @access  Protected
 */
const getHabitById = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Habit retrieved successfully',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a habit by ID
 * @route   PUT /api/habits/:id
 * @access  Protected
 */
const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
        data: null,
      });
    }

    const { name, description, color, icon, isArchived } = req.body;

    if (name !== undefined) habit.name = name.trim();
    if (description !== undefined) habit.description = description.trim();
    if (color !== undefined) habit.color = color;
    if (icon !== undefined) habit.icon = icon;
    if (isArchived !== undefined) habit.isArchived = Boolean(isArchived);

    await habit.save();

    return res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a habit and all of its associated completions
 * @route   DELETE /api/habits/:id
 * @access  Protected
 */
const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
        data: null,
      });
    }

    // Cascade delete all completions for this habit
    await Completion.deleteMany({
      habit: habit._id,
      user: req.user._id,
    });

    await habit.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Habit and all associated completion history deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
};
