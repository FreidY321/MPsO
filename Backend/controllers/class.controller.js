const { body, param, validationResult } = require('express-validator');
const ClassRepository = require('../repositories/ClassRepository');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const classRepository = new ClassRepository();

/**
 * Get all classes
 * GET /api/classes
 */
const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await classRepository.findAll();

  res.json({
    success: true,
    count: classes.length,
    data: classes
  });
});

/**
 * Get class by ID with students
 * GET /api/classes/:id
 */
const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await classRepository.findById(id);

  if (!classData) {
    throw new AppError('Class not found', 404);
  }

  // Get students in this class
  const students = await classRepository.getStudentsByClassId(id);

  // Remove passwords from students
  const studentsWithoutPasswords = students.map(student => {
    const { password, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  });

  res.json({
    success: true,
    data: {
      ...classData,
      students: studentsWithoutPasswords
    }
  });
});

/**
 * Create class validation rules
 */
const createClassValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required'),
  body('year_ended')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year ended must be a valid year between 2000 and 2100'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('cj_teacher')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (Number.isInteger(value) && value >= 1) return true;
      throw new Error('Teacher ID must be a positive integer or null');
    })
];

/**
 * Create a new class (admin only)
 * POST /api/classes
 */
const createClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { name, year_ended, deadline, cj_teacher } = req.body;

  // Check if class name already exists
  const existingClass = await classRepository.findByName(name);
  if (existingClass) {
    throw new AppError('Class name already exists', 409);
  }

  // Create class data object
  const classData = {
    name,
    year_ended
  };

  // Add optional fields
  if (deadline) classData.deadline = deadline;
  if (cj_teacher) classData.cj_teacher = cj_teacher;

  // Create class
  const newClass = await classRepository.create(classData);

  // Fetch the complete class with teacher info
  const createdClass = await classRepository.findById(newClass.id);

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: createdClass
  });
});

/**
 * Update class validation rules
 */
const updateClassValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class name cannot be empty'),
  body('year_ended')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year ended must be a valid year between 2000 and 2100'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('cj_teacher')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (Number.isInteger(value) && value >= 1) return true;
      throw new Error('Teacher ID must be a positive integer or null');
    })
];

/**
 * Update class (admin only)
 * PUT /api/classes/:id
 */
const updateClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if class exists
  const existingClass = await classRepository.findById(id);
  if (!existingClass) {
    throw new AppError('Class not found', 404);
  }

  // If name is being updated, check if it's already taken
  if (updateData.name && updateData.name !== existingClass.name) {
    const nameExists = await classRepository.findByName(updateData.name);
    if (nameExists) {
      throw new AppError('Class name already exists', 409);
    }
  }

  // Update class
  const updated = await classRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Failed to update class', 500);
  }

  // Get updated class with teacher info
  const updatedClass = await classRepository.findById(id);

  res.json({
    success: true,
    message: 'Class updated successfully',
    data: updatedClass
  });
});

/**
 * Delete class (admin only)
 * DELETE /api/classes/:id
 */
const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if class exists
  const classData = await classRepository.findById(id);
  if (!classData) {
    throw new AppError('Class not found', 404);
  }

  // Check if class has students
  const students = await classRepository.getStudentsByClassId(id);
  if (students.length > 0) {
    throw new AppError('Cannot delete class with assigned students', 400);
  }

  // Delete class
  const deleted = await classRepository.delete(id);

  if (!deleted) {
    throw new AppError('Failed to delete class', 500);
  }

  res.json({
    success: true,
    message: 'Class deleted successfully'
  });
});

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  createClassValidation,
  updateClass,
  updateClassValidation,
  deleteClass
};
