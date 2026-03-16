# Frontend Utilities Guide

This document describes the shared utility modules created for the Povinná četba application.

## Files Created

1. **`public/js/api.js`** - API wrapper with JWT authentication
2. **`public/js/validation.js`** - Client-side form validation
3. **`public/js/utils.js`** - General utility functions

## Usage

### 1. API Module (`api.js`)

Provides a centralized interface for all API calls with automatic JWT token handling.

**Requirements:** 8.1, 10.2

#### Basic Usage

```javascript
// GET request
const books = await api.get('/books', { literary_class: 1 });

// POST request
const newBook = await api.post('/books', {
  name: 'Kniha',
  author_id: 1,
  period: 2,
  literary_class: 1
});

// PUT request
const updated = await api.put('/books/1', { name: 'Nový název' });

// DELETE request
await api.delete('/books/1');

// File upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
await api.postFormData('/users/bulk', formData);

// Download file (PDF)
const blob = await api.downloadFile('/reading-lists/my/pdf');
const url = URL.createObjectURL(blob);
window.open(url);
```

#### Features

- Automatic JWT token injection from localStorage
- Automatic redirect to login on 401 errors
- 30-second timeout on requests
- Consistent error handling
- JSON parsing

#### Error Handling

```javascript
try {
  const data = await api.get('/books');
} catch (error) {
  console.error(error.message); // User-friendly message
  console.error(error.status);  // HTTP status code
  console.error(error.data);    // Full error response
}
```

### 2. Validation Module (`validation.js`)

Provides client-side form validation with Czech error messages.

**Requirements:** 8.5

#### Available Validators

```javascript
// Email validation
const result = validation.validateEmail('test@example.com');
// Returns: { valid: true/false, message: 'error message' }

// Password validation (min 6 characters)
validation.validatePassword('heslo123');

// Name validation (Czech characters, 2-50 chars)
validation.validateName('Jan', true); // true = required

// Required field
validation.validateRequired(value, 'Jméno');

// Number validation
validation.validateNumber(value, { min: 0, max: 100, required: true });

// Year validation (2000 - current+10)
validation.validateYear(2024);

// Date validation
validation.validateDate('2024-12-04');
```

#### Form Validation

```javascript
// Validate single field with visual feedback
const input = document.getElementById('email');
const isValid = validation.validateField(input, validation.validateEmail);

// Validate entire form
const form = document.getElementById('myForm');
const isValid = validation.validateForm(form, {
  email: validation.validateEmail,
  password: validation.validatePassword,
  name: validation.validateName
});

// Clear validation errors
validation.clearValidationErrors(form);

// Add real-time validation
validation.addRealtimeValidation(input, validation.validateEmail);
```

#### Visual Feedback

- Invalid fields get `.invalid` class and red border
- Valid fields get `.valid` class and green border
- Error messages appear below fields with `.error-message` class

### 3. Utils Module (`utils.js`)

General utility functions for common tasks.

#### LocalStorage

```javascript
// Store data (auto JSON serialization)
utils.storage.set('user', { name: 'Jan', role: 'student' });

// Get data (auto JSON parsing)
const user = utils.storage.get('user', null); // null = default value

// Remove item
utils.storage.remove('user');

// Clear all
utils.storage.clear();

// Check existence
if (utils.storage.has('authToken')) { ... }
```

#### Date Formatting

```javascript
// Czech date format (DD.MM.YYYY)
utils.dateFormat.toCzechDate(new Date()); // "04.12.2024"

// Czech date and time (DD.MM.YYYY HH:MM)
utils.dateFormat.toCzechDateTime(new Date()); // "04.12.2024 14:30"

// Input date format (YYYY-MM-DD)
utils.dateFormat.toInputDate(new Date()); // "2024-12-04"

// Relative time
utils.dateFormat.toRelativeTime(pastDate); // "před 2 hodinami"
```

#### String Formatting

```javascript
// Capitalize first letter
utils.stringFormat.capitalize('hello'); // "Hello"

// Format full name from user object
utils.stringFormat.formatFullName({
  degree: 'Mgr.',
  name: 'Jan',
  surname: 'Novák'
}); // "Mgr. Jan Novák"

// Format author name
utils.stringFormat.formatAuthorName(author);

// Truncate string
utils.stringFormat.truncate('Long text...', 20); // "Long text..."
```

#### Notifications

```javascript
// Show notifications
utils.notification.success('Úspěšně uloženo!');
utils.notification.error('Chyba při ukládání!');
utils.notification.warning('Varování!');
utils.notification.info('Informace');

// Custom notification
utils.notification.show('Message', 'success', 5000); // 5 seconds
utils.notification.show('Message', 'error', 0); // Permanent (0 = no auto-hide)
```

#### DOM Utilities

```javascript
// Show/hide elements
utils.dom.show('#myElement');
utils.dom.hide(element);
utils.dom.toggle('.modal');

// Enable/disable elements
utils.dom.enable('#submitButton');
utils.dom.disable(button);
```

#### Performance Utilities

```javascript
// Debounce (wait for user to stop typing)
const debouncedSearch = utils.debounce((query) => {
  // Search API call
}, 300);

// Throttle (limit execution rate)
const throttledScroll = utils.throttle(() => {
  // Handle scroll
}, 100);
```

## Integration in HTML

Include the scripts in your HTML pages:

```html
<!-- In <head> or before </body> -->
<link rel="stylesheet" href="/public/css/style.css">

<script src="/public/js/utils.js"></script>
<script src="/public/js/validation.js"></script>
<script src="/public/js/api.js"></script>
<script src="/public/js/auth.js"></script>
```

## Notes

- All modules are exposed on the `window` object for easy access
- JWT token is automatically read from localStorage key `authToken`
- User data is stored in localStorage key `user`
- API base URL is `http://localhost:3000/api`
- All error messages are in Czech
- Notification styles are included in `style.css`

