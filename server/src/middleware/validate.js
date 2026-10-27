const { validationResult, param, body, query } = require('express-validator');
const mongoose = require('mongoose');
const { isValidDateString } = require('../utils/dates');

/**
 * Middleware that inspects express-validator results.
 * If any validations fail, returns a 400 response with error details.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message || 'Validation failed',
      data: { errors: formattedErrors },
    });
  };
};

/**
 * Validator for MongoDB ObjectId parameter
 */
const validateObjectId = (paramName = 'id') => {
  return param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`Parameter ${paramName} is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid identifier format for ${paramName}`);
      }
      return true;
    });
};

/**
 * Validator for YYYY-MM-DD date parameter or body field
 */
const validateDateString = (fieldLocation = 'body', fieldName = 'date') => {
  const checkTarget = fieldLocation === 'param' ? param : fieldLocation === 'query' ? query : body;
  return checkTarget(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .custom((value) => {
      if (!isValidDateString(value)) {
        throw new Error(`${fieldName} must be a valid calendar date in YYYY-MM-DD format`);
      }
      return true;
    });
};

module.exports = {
  validate,
  validateObjectId,
  validateDateString,
};
