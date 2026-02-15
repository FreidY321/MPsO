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
    throw new AppError('Třída nenalezena', 404);
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
    .withMessage('Jméno třídy je povinné.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Jméno třídy musí mít 3 znaky.')
    .matches(/^[IE][1-4][A-D]$/)
    .withMessage('Jméno třídy nesmí obsahovat nic kromě číslic a písmen.'),
  body('year_ended')
    .notEmpty()
    .withMessage('Rok ukončení je povinný.')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Rok ukončení musí být mezi rokem 2000 a 2100.'),
  body('deadline')
    .optional({values: 'null'})
    .isISO8601()
    .withMessage('Deadline musí být datum ve formátu (YYYY-MM-DD).')
    .isAfter(new Date().toISOString().split('T')[0])
    .withMessage('Deadline musí být v budoucnosti.'),
  body('cj_teacher')
    .optional({values: 'null'})
    .isInt({ min: 1 })
    .withMessage('ID učitele musí být přirozené číslo.')
];

/**
 * Create a new class (admin only)
 * POST /api/classes
 */
const createClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { name, year_ended, deadline, cj_teacher } = req.body;

  // Check if class name already exists
  const existingClass = await classRepository.findByName(name);
  if (existingClass) {
    throw new AppError('Takový název třídy již existuje', 409);
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
    message: 'Třída byla úspěšně vytvořena',
    data: createdClass
  });
});

/**
 * Update class validation rules
 */
const updateClassValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID třídy musí být přirozené číslo.'),
  body('name')
    .optional({values: 'null'})
    .trim()
    .notEmpty()
    .withMessage('Jméno třídy je povinné.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Jméno třídy musí mít 3 znaky.')
    .matches(/^[IE][1-4][A-D]$/)
    .withMessage('Jméno třídy nesmí obsahovat nic kromě číslic a písmen.'),
  body('year_ended')
    .optional({values: 'null'})
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Rok ukončení musí být mezi rokem 2000 a 2100.'),
  body('deadline')
    .optional({values: 'null'})
    .isISO8601()
    .withMessage('Deadline musí být datum ve formátu (YYYY-MM-DD).')
    .isAfter(new Date().toISOString().split('T')[0])
    .withMessage('Deadline musí být v budoucnosti.'),
  body('cj_teacher')
    .optional({values: 'null'})
    .isInt({ min: 1 })
    .withMessage('ID učitele musí být přirozené číslo.')
];

/**
 * Update class (admin, teachers only)
 * PUT /api/classes/:id
 */
const updateClass = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if class exists
  const existingClass = await classRepository.findById(id);
  if (!existingClass) {
    throw new AppError('Třída nenalezena', 404);
  }

  // If user is a teacher, only allow updating deadline for their own class
  if (req.user.role === 'teacher') {
    if (existingClass.cj_teacher !== req.user.id) {
      throw new AppError('Můžeš upravovat pouze své vlastní třídy', 403);
    }
    // Teachers can only update deadline
    if (Object.keys(updateData).some(key => key !== 'deadline')) {
      throw new AppError('Učitelé mohou měnit pouze deadline', 403);
    }
  }

  // If name is being updated, check if it's already taken
  if (updateData.name && updateData.name !== existingClass.name) {
    const nameExists = await classRepository.findByName(updateData.name);
    if (nameExists) {
      throw new AppError('Takový název třídy již existuje', 409);
    }
  }

  // Update class
  const updated = await classRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Třídu se nepodařilo upravit', 500);
  }

  // Get updated class with teacher info
  const updatedClass = await classRepository.findById(id);

  res.json({
    success: true,
    message: 'Třída byla úspěšně upravena',
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
    throw new AppError('Třída nebyla nelezena', 404);
  }

  // Check if class has students
  const students = await classRepository.getStudentsByClassId(id);
  if (students.length > 0) {
    throw new AppError('Nemohu vymazat třídu, dokud v ní jsou žáci', 400);
  }

  // Delete class
  const deleted = await classRepository.delete(id);

  if (!deleted) {
    throw new AppError('Chyba při mazání třídy', 500);
  }

  res.json({
    success: true,
    message: 'Třída byla vymazána'
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
