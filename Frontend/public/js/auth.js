/**
 * Authentication module
 * Handles login, logout, and JWT token management
 * Requirements: 4.1, 4.2
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Get DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');
const googleLoginButton = document.getElementById('googleLoginButton');

/**
 * Display error message to user
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.style.display = 'none';
}

/**
 * Set loading state for login button
 */
function setLoading(isLoading) {
  if (isLoading) {
    loginButton.disabled = true;
    loginButton.textContent = 'Přihlašování...';
  } else {
    loginButton.disabled = false;
    loginButton.textContent = 'Přihlásit se';
  }
}

/**
 * Store JWT token in localStorage
 */
function storeToken(token) {
  localStorage.setItem('authToken', token);
}

/**
 * Store user data in localStorage
 */
function storeUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Get stored token from localStorage
 */
function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Get stored user from localStorage
 */
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Clear authentication data
 */
function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Redirect based on user role
 */
function redirectToDashboard(user) {
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else if (user.role === 'teacher') {
    window.location.href = 'teacher.html';
  } else if (user.role === 'student') {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = 'dashboard.html'; // Default
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();
  hideError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Basic validation
  if (!email || !password) {
    showError('Prosím vyplňte email i heslo');
    return;
  }

  if (!email.includes('@')) {
    showError('Prosím zadejte platný email');
    return;
  }

  setLoading(true);

  try {
    // Call login API
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error response
      const errorMsg = data.error?.message || 'Přihlášení se nezdařilo';
      showError(errorMsg);
      setLoading(false);
      return;
    }

    // Success - store token and user data
    if (data.success && data.token) {
      storeToken(data.token);
      storeUser(data.user);

      // Show success message briefly
      loginButton.textContent = 'Úspěch! Přesměrování...';
      
      // Redirect to appropriate dashboard
      setTimeout(() => {
        redirectToDashboard(data.user);
      }, 500);
    } else {
      showError('Neplatná odpověď ze serveru');
      setLoading(false);
    }

  } catch (error) {
    console.error('Login error:', error);
    showError('Chyba připojení k serveru. Zkuste to prosím znovu.');
    setLoading(false);
  }
}

/**
 * Handle Google OAuth login
 * Redirects to backend OAuth endpoint
 */
function handleGoogleLogin() {
  // Redirect to backend Google OAuth endpoint
  window.location.href = `${API_BASE_URL}/auth/google`;
}

/**
 * Check URL for token or error from OAuth callback
 */
function checkOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  if (error) {
    // Show error from OAuth
    showError(decodeURIComponent(error));
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  if (token) {
    // Store token
    storeToken(token);

    // Fetch user data using the token
    fetchUserData(token);
  }
}

/**
 * Fetch user data after OAuth login
 */
async function fetchUserData(token) {
  try {
    setLoading(true);
    
    // Fetch full user data from API
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Nepodařilo se získat uživatelská data');
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      storeUser(data.user);
      
      // Show success message briefly
      loginButton.textContent = 'Úspěch! Přesměrování...';
      
      // Clean URL and redirect
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        redirectToDashboard(data.user);
      }, 500);
    } else {
      throw new Error('Neplatná uživatelská data');
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
    showError('Chyba při načítání uživatelských dat');
    clearAuth();
    setLoading(false);
  }
}

/**
 * Check if already logged in and redirect
 * ONLY call this on login page!
 */
function checkExistingAuth() {
  if (isAuthenticated()) {
    const user = getUser();
    if (user) {
      redirectToDashboard(user);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check for OAuth callback first
  checkOAuthCallback();
  
  // Check if already logged in - ONLY on login page
  // We detect login page by checking if loginForm exists
  if (loginForm) {
    checkExistingAuth();
    loginForm.addEventListener('submit', handleLogin);
  }

  // Attach event listeners
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', handleGoogleLogin);
  }

  // Focus email input
  if (emailInput) {
    emailInput.focus();
  }
});

// Export functions for use in other modules
window.auth = {
  getToken,
  getUser,
  clearAuth,
  isAuthenticated,
  logout: async function() {
    try {
      const token = getToken();
      if (token) {
        // Call logout endpoint
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Chyba při odhlášení:', error);
    } finally {
      // Clear local storage regardless of API call result
      clearAuth();
      window.location.href = 'login.html';
    }
  }
};
