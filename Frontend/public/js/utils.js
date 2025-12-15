/**
 * Utility Functions Module
 * Provides helper functions for data formatting, localStorage, and notifications
 */

/**
 * LocalStorage utilities
 */
const storage = {
  /**
   * Set item in localStorage with JSON serialization
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  set: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  /**
   * Get item from localStorage with JSON parsing
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Parsed value or default
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  /**
   * Clear all items from localStorage
   */
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
  
  /**
   * Check if key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Date formatting utilities
 */
const dateFormat = {
  /**
   * Format date to Czech locale string
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date (DD.MM.YYYY)
   */
  toCzechDate: (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  },
  
  /**
   * Format date to Czech locale with time
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date and time (DD.MM.YYYY HH:MM)
   */
  toCzechDateTime: (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  },
  
  /**
   * Format date for input[type="date"]
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date (YYYY-MM-DD)
   */
  toInputDate: (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },
  
  /**
   * Get relative time string (e.g., "před 2 dny")
   * @param {Date|string} date - Date to format
   * @returns {string} Relative time string
   */
  toRelativeTime: (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'právě teď';
    if (diffMin < 60) return `před ${diffMin} ${diffMin === 1 ? 'minutou' : 'minutami'}`;
    if (diffHour < 24) return `před ${diffHour} ${diffHour === 1 ? 'hodinou' : 'hodinami'}`;
    if (diffDay < 7) return `před ${diffDay} ${diffDay === 1 ? 'dnem' : 'dny'}`;
    
    return dateFormat.toCzechDate(d);
  }
};

/**
 * String formatting utilities
 */
const stringFormat = {
  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string}
   */
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  /**
   * Format full name from user object
   * @param {Object} user - User object with degree, name, surname
   * @returns {string} Formatted full name
   */
  formatFullName: (user) => {
    if (!user) return '';
    
    const parts = [];
    if (user.degree) parts.push(user.degree);
    if (user.name) parts.push(user.name);
    if (user.seccond_name) parts.push(user.seccond_name);
    if (user.surname) parts.push(user.surname);
    if (user.second_surname) parts.push(user.second_surname);
    
    return parts.join(' ');
  },
  
  /**
   * Format author name
   * @param {Object} author - Author object
   * @returns {string} Formatted author name
   */
  formatAuthorName: (author) => {
    if (!author) return '';
    
    const parts = [];
    if (author.name) parts.push(author.name);
    if (author.second_name) parts.push(author.second_name);
    if (author.surname) parts.push(author.surname);
    if (author.second_surname) parts.push(author.second_surname);
    
    return parts.join(' ');
  },
  
  /**
   * Truncate string to specified length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string}
   */
  truncate: (str, maxLength = 50) => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
};

/**
 * Notification system
 */
const notification = {
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (0 = permanent)
   */
  show: (message, type = 'info', duration = 5000) => {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Zavřít">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notif);
    
    // Animate in
    setTimeout(() => notif.classList.add('show'), 10);
    
    // Close button handler
    const closeBtn = notif.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.hide(notif);
    });
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        notification.hide(notif);
      }, duration);
    }
    
    return notif;
  },
  
  /**
   * Hide notification
   * @param {HTMLElement} notif - Notification element
   */
  hide: (notif) => {
    notif.classList.remove('show');
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 300);
  },
  
  /**
   * Show success notification
   * @param {string} message - Message
   * @param {number} duration - Duration in milliseconds
   */
  success: (message, duration = 5000) => {
    return notification.show(message, 'success', duration);
  },
  
  /**
   * Show error notification
   * @param {string} message - Message
   * @param {number} duration - Duration in milliseconds
   */
  error: (message, duration = 5000) => {
    return notification.show(message, 'error', duration);
  },
  
  /**
   * Show warning notification
   * @param {string} message - Message
   * @param {number} duration - Duration in milliseconds
   */
  warning: (message, duration = 5000) => {
    return notification.show(message, 'warning', duration);
  },
  
  /**
   * Show info notification
   * @param {string} message - Message
   * @param {number} duration - Duration in milliseconds
   */
  info: (message, duration = 5000) => {
    return notification.show(message, 'info', duration);
  }
};

/**
 * DOM utilities
 */
const dom = {
  /**
   * Show element
   * @param {HTMLElement|string} element - Element or selector
   */
  show: (element) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.style.display = '';
  },
  
  /**
   * Hide element
   * @param {HTMLElement|string} element - Element or selector
   */
  hide: (element) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.style.display = 'none';
  },
  
  /**
   * Toggle element visibility
   * @param {HTMLElement|string} element - Element or selector
   */
  toggle: (element) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    }
  },
  
  /**
   * Enable element
   * @param {HTMLElement|string} element - Element or selector
   */
  enable: (element) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.disabled = false;
  },
  
  /**
   * Disable element
   * @param {HTMLElement|string} element - Element or selector
   */
  disable: (element) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.disabled = true;
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export utilities
window.utils = {
  storage,
  dateFormat,
  stringFormat,
  notification,
  dom,
  debounce,
  throttle
};

