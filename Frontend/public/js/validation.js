/**
 * Client-side Validation Module
 * Provides validation rules for forms
 * Requirements: 8.5
 */

/**
 * Validation rules and error messages
 */
const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Prosím zadejte platný email'
  },
  password: {
    minLength: 6,
    message: 'Heslo musí mít alespoň 6 znaků'
  },
  name: {
    pattern: /^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s\-']+$/,
    minLength: 2,
    maxLength: 50,
    message: 'Jméno musí obsahovat pouze písmena a mít 2-50 znaků'
  },
  required: {
    message: 'Toto pole je povinné'
  }
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, message: VALIDATION_RULES.required.message };
  }
  
  if (!VALIDATION_RULES.email.pattern.test(email)) {
    return { valid: false, message: VALIDATION_RULES.email.message };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.trim() === '') {
    return { valid: false, message: VALIDATION_RULES.required.message };
  }
  
  if (password.length < VALIDATION_RULES.password.minLength) {
    return { valid: false, message: VALIDATION_RULES.password.message };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate name (first name, last name, etc.)
 * @param {string} name - Name to validate
 * @param {boolean} required - Whether the field is required
 * @returns {Object} { valid: boolean, message: string }
 */
function validateName(name, required = true) {
  if (!name || name.trim() === '') {
    if (required) {
      return { valid: false, message: VALIDATION_RULES.required.message };
    }
    return { valid: true, message: '' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.name.minLength) {
    return { valid: false, message: VALIDATION_RULES.name.message };
  }
  
  if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
    return { valid: false, message: VALIDATION_RULES.name.message };
  }
  
  if (!VALIDATION_RULES.name.pattern.test(trimmedName)) {
    return { valid: false, message: VALIDATION_RULES.name.message };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { valid: boolean, message: string }
 */
function validateRequired(value, fieldName = 'Toto pole') {
  if (!value || value.toString().trim() === '') {
    return { valid: false, message: `${fieldName} je povinné` };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate number
 * @param {string|number} value - Value to validate
 * @param {Object} options - Validation options { min, max, required }
 * @returns {Object} { valid: boolean, message: string }
 */
function validateNumber(value, options = {}) {
  const { min, max, required = true } = options;
  
  if (!value && value !== 0) {
    if (required) {
      return { valid: false, message: VALIDATION_RULES.required.message };
    }
    return { valid: true, message: '' };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, message: 'Prosím zadejte platné číslo' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, message: `Hodnota musí být alespoň ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, message: `Hodnota nesmí být větší než ${max}` };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate year
 * @param {string|number} year - Year to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validateYear(year) {
  const currentYear = new Date().getFullYear();
  return validateNumber(year, {
    min: 2000,
    max: currentYear + 10,
    required: true
  });
}

/**
 * Validate date
 * @param {string} dateString - Date string to validate
 * @returns {Object} { valid: boolean, message: string }
 */
function validateDate(dateString, required = true) {
  if (!dateString || dateString.trim() === '') {
    if (required) {
      return { valid: false, message: VALIDATION_RULES.required.message };
    }
    return { valid: true, message: '' };
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Prosím zadejte platné datum' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate form field and display error
 * @param {HTMLElement} input - Input element
 * @param {Function} validationFn - Validation function
 * @param {Array} args - Additional arguments for validation function
 * @returns {boolean} Whether the field is valid
 */
function validateField(input, validationFn, ...args) {
  const result = validationFn(input.value, ...args);
  
  // Find or create error message element
  let errorElement = input.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }
  
  if (!result.valid) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    errorElement.textContent = result.message;
    errorElement.style.display = 'block';
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  return result.valid;
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form element
 * @param {Object} validationRules - Object mapping field names to validation functions
 * @returns {boolean} Whether the form is valid
 */
function validateForm(form, validationRules) {
  let isValid = true;
  
  for (const [fieldName, validationFn] of Object.entries(validationRules)) {
    const input = form.elements[fieldName];
    if (input) {
      const fieldValid = validateField(input, validationFn);
      isValid = isValid && fieldValid;
    }
  }
  
  return isValid;
}

/**
 * Clear validation errors from form
 * @param {HTMLFormElement} form - Form element
 */
function clearValidationErrors(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.classList.remove('invalid', 'valid');
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  });
}

/**
 * Add real-time validation to input
 * @param {HTMLElement} input - Input element
 * @param {Function} validationFn - Validation function
 * @param {Array} args - Additional arguments for validation function
 */
function addRealtimeValidation(input, validationFn, ...args) {
  input.addEventListener('blur', () => {
    validateField(input, validationFn, ...args);
  });
  
  input.addEventListener('input', () => {
    // Clear error on input if field was invalid
    if (input.classList.contains('invalid')) {
      const result = validationFn(input.value, ...args);
      if (result.valid) {
        validateField(input, validationFn, ...args);
      }
    }
  });
}

// Export validation functions
window.validation = {
  validateEmail,
  validatePassword,
  validateName,
  validateRequired,
  validateNumber,
  validateYear,
  validateDate,
  validateField,
  validateForm,
  clearValidationErrors,
  addRealtimeValidation
};

