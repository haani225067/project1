const express = require('express');
const { body, query } = require('express-validator');
const {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
} = require('../controllers/habitsController');
const {
  markCompleted,
  undoCompleted,
  getCompletions,
} = require('../controllers/completionsController');
const { getHabitStats } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');
const {
  validate,
  validateObjectId,
  validateDateString,
} = require('../middleware/validate');

const router = express.Router();

// All habit routes are protected
router.use(protect);

// -------------------------------------------------------------
// Habit CRUD Validations
// -------------------------------------------------------------
const createHabitValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Habit name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Habit name must be between 2 and 60 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#([0-9a-fA-F]{3}){1,2}$/)
    .withMessage('Color must be a valid hex code (e.g. #6366f1)'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
];

const updateHabitValidation = [
  validateObjectId('id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Habit name must be between 2 and 60 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#([0-9a-fA-F]{3}){1,2}$/)
    .withMessage('Color must be a valid hex code (e.g. #6366f1)'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
];

const listHabitsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('archived')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('Archived filter must be true, false, or all'),
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),
];

// -------------------------------------------------------------
// Habit Routes
// -------------------------------------------------------------
router.route('/')
  .get(validate(listHabitsValidation), getHabits)
  .post(validate(createHabitValidation), createHabit);

router.route('/:id')
  .get(validate([validateObjectId('id')]), getHabitById)
  .put(validate(updateHabitValidation), updateHabit)
  .delete(validate([validateObjectId('id')]), deleteHabit);

// -------------------------------------------------------------
// Habit Completions Routes
// -------------------------------------------------------------
router.post(
  '/:id/completions',
  validate([validateObjectId('id'), validateDateString('body', 'date')]),
  markCompleted
);

router.delete(
  '/:id/completions/:date',
  validate([validateObjectId('id'), validateDateString('param', 'date')]),
  undoCompleted
);

router.get(
  '/:id/completions',
  validate([validateObjectId('id')]),
  getCompletions
);

// -------------------------------------------------------------
// Habit Stats Route
// -------------------------------------------------------------
router.get(
  '/:id/stats',
  validate([validateObjectId('id')]),
  getHabitStats
);

module.exports = router;
