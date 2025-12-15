const { body, param, validationResult } = require('express-validator');
const PeriodRepository = require('../repositories/PeriodRepository');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const periodRepository = new PeriodRepository();

/**
 * Get all periods
 * GET /api/periods
 */
const getAllPeriods = asyncHandler(async (req, res) => {
  const periods = await periodRepository.findAll();

  res.json({
    success: true,
    count: periods.length,
    data: periods
  });
});

/**
 * Get period by ID
 * GET /api/periods/:id
 */
const getPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const period = await periodRepository.findById(id);

  if (!period) {
    throw new AppError('Period not found', 404);
  }

  res.json({
    success: true,
    data: period
  });
});

/**
 * Create period validation rules
 */
const createPeriodValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Period name is required'),
  body('min_request')
    .isInt({ min: 0 })
    .withMessage('Minimum request must be a non-negative integer'),
  body('max_request')
    .isInt({ min: 0 })
    .withMessage('Maximum request must be a non-negative integer')
    .custom((value, { req }) => {
      if (value < req.body.min_request) {
        throw new Error('Maximum request must be greater than or equal to minimum request');
      }
      return true;
    })
];

/**
 * Create a new period (admin only)
 * POST /api/periods
 */
const createPeriod = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { name, min_request, max_request } = req.body;

  // Check if period name already exists
  const existingPeriod = await periodRepository.findByName(name);
  if (existingPeriod) {
    throw new AppError('Period name already exists', 409);
  }

  // Create period data object
  const periodData = {
    name,
    min_request,
    max_request
  };

  // Create period
  const newPeriod = await periodRepository.create(periodData);

  res.status(201).json({
    success: true,
    message: 'Period created successfully',
    data: newPeriod
  });
});

/**
 * Update period validation rules
 */
const updatePeriodValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Period ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Period name cannot be empty'),
  body('min_request')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum request must be a non-negative integer'),
  body('max_request')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum request must be a non-negative integer')
    .custom((value, { req }) => {
      const minRequest = req.body.min_request;
      if (minRequest !== undefined && value < minRequest) {
        throw new Error('Maximum request must be greater than or equal to minimum request');
      }
      return true;
    })
];

/**
 * Update period (admin only)
 * PUT /api/periods/:id
 */
const updatePeriod = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if period exists
  const existingPeriod = await periodRepository.findById(id);
  if (!existingPeriod) {
    throw new AppError('Period not found', 404);
  }

  // If name is being updated, check if it's already taken
  if (updateData.name && updateData.name !== existingPeriod.name) {
    const nameExists = await periodRepository.findByName(updateData.name);
    if (nameExists) {
      throw new AppError('Period name already exists', 409);
    }
  }

  // Validate min/max relationship if only one is being updated
  if (updateData.max_request !== undefined && updateData.min_request === undefined) {
    if (updateData.max_request < existingPeriod.min_request) {
      throw new AppError('Maximum request must be greater than or equal to minimum request', 400);
    }
  }
  if (updateData.min_request !== undefined && updateData.max_request === undefined) {
    if (updateData.min_request > existingPeriod.max_request) {
      throw new AppError('Minimum request must be less than or equal to maximum request', 400);
    }
  }

  // Update period
  const updated = await periodRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Failed to update period', 500);
  }

  // Get updated period
  const updatedPeriod = await periodRepository.findById(id);

  res.json({
    success: true,
    message: 'Period updated successfully',
    data: updatedPeriod
  });
});

/**
 * Delete period (admin only)
 * DELETE /api/periods/:id
 */
const deletePeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if period exists
  const period = await periodRepository.findById(id);
  if (!period) {
    throw new AppError('Period not found', 404);
  }

  // Check if period has books
  const hasBooks = await periodRepository.hasBooks(id);
  if (hasBooks) {
    throw new AppError('Cannot delete period with associated books', 400);
  }

  // Delete period
  const deleted = await periodRepository.delete(id);

  if (!deleted) {
    throw new AppError('Failed to delete period', 500);
  }

  res.json({
    success: true,
    message: 'Period deleted successfully'
  });
});

module.exports = {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  createPeriodValidation,
  updatePeriod,
  updatePeriodValidation,
  deletePeriod
};
