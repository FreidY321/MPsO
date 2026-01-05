const { body, param, validationResult } = require('express-validator');
const UserRepository = require('../repositories/UserRepository');
const { hashPassword } = require('../utils/password');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const userRepository = new UserRepository();

/**
 * Get all users (admin only)
 * GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userRepository.findAll();
  
  // Remove passwords from response
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  res.json({
    success: true,
    count: usersWithoutPasswords.length,
    data: usersWithoutPasswords
  });
});

/**
 * Get current user (authenticated user's own profile)
 * GET /api/users/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  // If user is a student with a class, fetch class name
  let userData = { ...user };
  if (user.role === 'student' && user.class_id) {
    const ClassRepository = require('../repositories/ClassRepository');
    const classRepository = new ClassRepository();
    const classData = await classRepository.findById(user.class_id);
    if (classData) {
      userData.class_name = classData.name;
    }
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = userData;

  res.json({
    success: true,
    user: userWithoutPassword
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await userRepository.findById(id);
  
  if (!user) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: userWithoutPassword
  });
});

/**
 * Create user validation rules
 */
const createUserValidation = [
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role musí být student, teacher, nebo admin.'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Jméno je povinné.'),
  body('surname')
    .trim()
    .notEmpty()
    .withMessage('Příjmení je povinné.'),
  body('email')
    .isEmail()
    .withMessage('Validní email je povinný.')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Heslo musí mít minimálně 8 znaků.'),
  body('class_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('ID třídy musí být přirozené číslo.')
];

/**
 * Create a new user (admin only)
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { role, degree, name, second_name, surname, second_surname, email, class_id, password, google_id } = req.body;

  // Check if email already exists
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError('Uživatel s tímto emailem již existuje', 409);
  }

  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    hashedPassword = await hashPassword(password);
  }

  // Create user data object
  const userData = {
    role,
    name,
    surname,
    email
  };

  // Add optional fields
  if (degree) userData.degree = degree;
  if (second_name) userData.second_name = second_name;
  if (second_surname) userData.second_surname = second_surname;
  if (class_id) userData.class_id = class_id;
  if (hashedPassword) userData.password = hashedPassword;
  if (google_id) userData.google_id = google_id;

  // Create user
  const newUser = await userRepository.create(userData);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    message: 'Uživatel byl vytvořen',
    data: userWithoutPassword
  });
});

/**
 * Update user validation rules
 */
const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID uživatele musí být přirozené číslo.'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role musí být student, teacher, nebo admin.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Jméno je povinné.'),
  body('surname')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Přijmení je povinné.'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Validní email je povinný.')
    .normalizeEmail(),
  body('class_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('ID třídy musí být přirozené číslo.')
];

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if user exists
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  // If email is being updated, check if it's already taken
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await userRepository.emailExists(updateData.email, id);
    if (emailExists) {
      throw new AppError('Uživatel s tímto emailem již existuje', 409);
    }
  }

  // Don't allow password updates through this endpoint
  delete updateData.password;

  // Update user
  const updated = await userRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Uživatele se nepodařilo upravit', 500);
  }

  // Get updated user
  const updatedUser = await userRepository.findById(id);
  const { password, ...userWithoutPassword } = updatedUser;

  res.json({
    success: true,
    message: 'Uživatel byl úspěšně upraven',
    data: userWithoutPassword
  });
});

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  // Delete user
  const deleted = await userRepository.delete(id);

  if (!deleted) {
    throw new AppError('Nepodařilo se vymazat uživatele', 500);
  }

  res.json({
    success: true,
    message: 'Uživatel byl vymazán'
  });
});

/**
 * Get students by class ID
 * GET /api/users/class/:classId
 */
const getStudentsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const students = await userRepository.findByClassId(classId);

  // Remove passwords from response
  const studentsWithoutPasswords = students.map(student => {
    const { password, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  });

  res.json({
    success: true,
    count: studentsWithoutPasswords.length,
    data: studentsWithoutPasswords
  });
});

/**
 * Reset password endpoint (admin only)
 * POST /api/users/:id/reset-password
 * Generates a new temporary password for the user
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  const { generateRandomPassword } = require('../utils/password');

  // Generate new temporary password
  const newPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await userRepository.update(id, { password: hashedPassword });

  res.json({
    success: true,
    message: 'Heslo byl resetováno',
    userId: id,
    newPassword: newPassword // Return plain text password for admin to give to user
  });
});

/**
 * Bulk registration validation rules
 */
const bulkRegistrationValidation = [
  body('students')
    .isArray({ min: 1 })
    .withMessage('Pole "students" je povinné a musí obsahovat alespoň jednoho studenta.'),
  body('students.*.name')
    .trim()
    .notEmpty()
    .withMessage('Jméno studenta je povinné.'),
  body('students.*.surname')
    .trim()
    .notEmpty()
    .withMessage('Přijmení studenta je povinné.'),
  body('students.*.email')
    .isEmail()
    .withMessage('Validní email je povinný pro každého studenta.')
    .normalizeEmail(),
  body('class_id')
    .isInt({ min: 1 })
    .withMessage('ID třídy musí být přirozené číslo')
];

/**
 * Bulk registration endpoint
 * POST /api/users/bulk
 * Creates multiple student accounts at once
 * Supports JSON format with array of students
 */
const bulkRegistration = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { students, class_id } = req.body;
  const { generateRandomPassword } = require('../utils/password');

  // Validate all students before creating any accounts
  const validationErrors = [];
  const emailSet = new Set();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    // Check for duplicate emails within the batch
    if (emailSet.has(student.email)) {
      validationErrors.push({
        index: i,
        email: student.email,
        error: 'Stejný email u dvou či více studentů v poli'
      });
    }
    emailSet.add(student.email);

    // Check if email already exists in database
    const existingUser = await userRepository.findByEmail(student.email);
    if (existingUser) {
      validationErrors.push({
        index: i,
        email: student.email,
        error: 'Uživatel s tímto emailem již existuje'
      });
    }
  }

  // If there are validation errors, return them without creating any accounts
  if (validationErrors.length > 0) {
    throw new AppError('Validace selhala pro některé studenty', 400, validationErrors);
  }

  // All validations passed, create all student accounts
  const createdStudents = [];
  const credentials = [];

  for (const student of students) {
    // Generate random password
    const plainPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Create student data
    const studentData = {
      role: 'student',
      name: student.name,
      surname: student.surname,
      email: student.email,
      password: hashedPassword,
      class_id: class_id
    };

    // Add optional fields
    if (student.degree) studentData.degree = student.degree;
    if (student.second_name) studentData.second_name = student.second_name;
    if (student.second_surname) studentData.second_surname = student.second_surname;

    // Create student
    const newStudent = await userRepository.create(studentData);
    
    // Remove password from response
    const { password: _, ...studentWithoutPassword } = newStudent;
    createdStudents.push(studentWithoutPassword);

    // Store credentials for response
    credentials.push({
      id: newStudent.id,
      email: student.email,
      password: plainPassword,
      name: student.name,
      surname: student.surname
    });
  }

  res.status(201).json({
    success: true,
    message: `Bylo vytvořeno ${createdStudents.length} studentských účtů`,
    count: createdStudents.length,
    data: createdStudents,
    credentials: credentials
  });
});

module.exports = {
  getCurrentUser,
  getAllUsers,
  getUserById,
  createUser,
  createUserValidation,
  updateUser,
  updateUserValidation,
  deleteUser,
  getStudentsByClass,
  resetPassword,
  bulkRegistration,
  bulkRegistrationValidation
};
