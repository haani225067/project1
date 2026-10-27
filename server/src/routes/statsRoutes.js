const express = require('express');
const { query } = require('express-validator');
const {
  getTodayOverview,
  getWeeklyStats,
  getHeatmapData,
} = require('../controllers/statsController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { isValidDateString } = require('../utils/dates');

const router = express.Router();

// All stats routes are protected
router.use(protect);

const optionalDateValidation = [
  query('date')
    .optional()
    .custom((val) => {
      if (!isValidDateString(val)) {
        throw new Error('Date must be formatted as YYYY-MM-DD');
      }
      return true;
    }),
];

const heatmapValidation = [
  query('days')
    .optional()
    .isInt({ min: 7, max: 365 })
    .withMessage('Days must be an integer between 7 and 365'),
  query('date')
    .optional()
    .custom((val) => {
      if (!isValidDateString(val)) {
        throw new Error('Date must be formatted as YYYY-MM-DD');
      }
      return true;
    }),
  query('habitId')
    .optional()
    .isMongoId()
    .withMessage('habitId must be a valid ObjectId'),
];

router.get('/today', validate(optionalDateValidation), getTodayOverview);
router.get('/weekly', validate(optionalDateValidation), getWeeklyStats);
router.get('/heatmap', validate(heatmapValidation), getHeatmapData);

module.exports = router;
