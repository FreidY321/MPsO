const { body, param, validationResult } = require('express-validator');
const LiteraryClassRepository = require('../repositories/LiteraryClassRepository');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const literaryClassRepository = new LiteraryClassRepository();

/**
 * Get all literary classes
 * GET /api/literary-classes
 */
const getAllLiteraryClasses = asyncHandler(async (req, res) => {
  const literaryClasses = await literaryClassRepository.findAll();

  res.json({
    success: true,
    count: literaryClasses.length,
    data: literaryClasses
  });
});

/**
 * Get literary class by ID
 * GET /api/literary-classes/:id
 */
const getLiteraryClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const literaryClass = await literaryClassRepository.findById(id);

  if (!literaryClass) {
    throw new AppError('Literary class not found', 404);
  }

  res.json({
    success: true,
    data: literaryClass
  });
});

/**
 * Create literary class validation rules
 */
const createLiteraryClassValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Literary class name is required'),
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
 * Create a new literary class (admin only)
 * POST /api/literary-classes
 */
const createLiteraryClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { name, min_request, max_request } = req.body;

  // Check if literary class name already exists
  const existingLiteraryClass = await literaryClassRepository.findByName(name);
  if (existingLiteraryClass) {
    throw new AppError('Literary class name already exists', 409);
  }

  // Create literary class data object
  const literaryClassData = {
    name,
    min_request,
    max_request
  };

  // Create literary class
  const newLiteraryClass = await literaryClassRepository.create(literaryClassData);

  res.status(201).json({
    success: true,
    message: 'Literary class created successfully',
    data: newLiteraryClass
  });
});

/**
 * Update literary class validation rules
 */
const updateLiteraryClassValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Literary class ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Literary class name cannot be empty'),
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
 * Update literary class (admin only)
 * PUT /api/literary-classes/:id
 */
const updateLiteraryClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if literary class exists
  const existingLiteraryClass = await literaryClassRepository.findById(id);
  if (!existingLiteraryClass) {
    throw new AppError('Literary class not found', 404);
  }

  // If name is being updated, check if it's already taken
  if (updateData.name && updateData.name !== existingLiteraryClass.name) {
    const nameExists = await literaryClassRepository.findByName(updateData.name);
    if (nameExists) {
      throw new AppError('Literary class name already exists', 409);
    }
  }

  // Validate min/max relationship if only one is being updated
  if (updateData.max_request !== undefined && updateData.min_request === undefined) {
    if (updateData.max_request < existingLiteraryClass.min_request) {
      throw new AppError('Maximum request must be greater than or equal to minimum request', 400);
    }
  }
  if (updateData.min_request !== undefined && updateData.max_request === undefined) {
    if (updateData.min_request > existingLiteraryClass.max_request) {
      throw new AppError('Minimum request must be less than or equal to maximum request', 400);
    }
  }

  // Update literary class
  const updated = await literaryClassRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Failed to update literary class', 500);
  }

  // Get updated literary class
  const updatedLiteraryClass = await literaryClassRepository.findById(id);

  res.json({
    success: true,
    message: 'Literary class updated successfully',
    data: updatedLiteraryClass
  });
});

/**
 * Delete literary class (admin only)
 * DELETE /api/literary-classes/:id
 */
const deleteLiteraryClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if literary class exists
  const literaryClass = await literaryClassRepository.findById(id);
  if (!literaryClass) {
    throw new AppError('Literary class not found', 404);
  }

  // Check if literary class has books
  const hasBooks = await literaryClassRepository.hasBooks(id);
  if (hasBooks) {
    throw new AppError('Cannot delete literary class with associated books', 400);
  }

  // Delete literary class
  const deleted = await literaryClassRepository.delete(id);

  if (!deleted) {
    throw new AppError('Failed to delete literary class', 500);
  }

  res.json({
    success: true,
    message: 'Literary class deleted successfully'
  });
});

module.exports = {
  getAllLiteraryClasses,
  getLiteraryClassById,
  createLiteraryClass,
  createLiteraryClassValidation,
  updateLiteraryClass,
  updateLiteraryClassValidation,
  deleteLiteraryClass
};
