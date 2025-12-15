/**
 * Books Browser Module
 * Handles book browsing, filtering, and adding books to reading list
 * Requirements: 5.1, 6.1, 6.2, 2.5
 */

// State
let currentUser = null;
let allBooks = [];
let filteredBooks = [];
let literaryClasses = [];
let periods = [];
let authors = [];
let readingListStatus = null;
let readingListBooks = [];

// DOM Elements
const literaryClassFilter = document.getElementById('literaryClassFilter');
const periodFilter = document.getElementById('periodFilter');
const authorFilter = document.getElementById('authorFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const booksCount = document.getElementById('booksCount');
const booksContainer = document.getElementById('booksContainer');
const emptyState = document.getElementById('emptyState');
const logoutBtn = document.getElementById('logoutBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

/**
 * Initialize books browser
 */
async function init() {
  // Check authentication
  if (!window.auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = window.auth.getUser();
  
  // Check if user is a student
  if (currentUser.role !== 'student') {
    window.utils.notification.error('Tato stránka je pouze pro žáky');
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 2000);
    return;
  }

  // Load initial data
  await loadInitialData();

  // Attach event listeners
  attachEventListeners();
}

/**
 * Load all initial data
 */
async function loadInitialData() {
  showLoading();
  
  try {
    // Load all data in parallel
    await Promise.all([
      loadLiteraryClasses(),
      loadPeriods(),
      loadAuthors(),
      loadReadingListStatus(),
      loadReadingList(),
      loadBooks()
    ]);
    
    // Populate filters
    populateFilters();
    
    // Display books
    displayBooks();
  } catch (error) {
    console.error('Error loading initial data:', error);
    window.utils.notification.error('Chyba při načítání dat: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Load literary classes from API
 */
async function loadLiteraryClasses() {
  try {
    const response = await window.api.get('/literary-classes');
    
    if (response.success) {
      literaryClasses = response.data || [];
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst literární druhy');
    }
  } catch (error) {
    console.error('Error loading literary classes:', error);
    throw error;
  }
}

/**
 * Load periods from API
 */
async function loadPeriods() {
  try {
    const response = await window.api.get('/periods');
    
    if (response.success) {
      periods = response.data || [];
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst období');
    }
  } catch (error) {
    console.error('Error loading periods:', error);
    throw error;
  }
}

/**
 * Load authors from API
 */
async function loadAuthors() {
  try {
    const response = await window.api.get('/authors');
    
    if (response.success) {
      authors = response.data || [];
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst autory');
    }
  } catch (error) {
    console.error('Error loading authors:', error);
    throw error;
  }
}

/**
 * Load reading list status from API
 * Requirements: 6.1, 6.2
 */
async function loadReadingListStatus() {
  try {
    const response = await window.api.get('/reading-lists/my/status');
    
    if (response.success) {
      readingListStatus = response.data || null;
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst stav seznamu četby');
    }
  } catch (error) {
    console.error('Error loading reading list status:', error);
    throw error;
  }
}

/**
 * Load reading list books from API
 */
async function loadReadingList() {
  try {
    const response = await window.api.get('/reading-lists/my');
    
    if (response.success) {
      readingListBooks = response.data.books || [];
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst seznam četby');
    }
  } catch (error) {
    console.error('Error loading reading list:', error);
    throw error;
  }
}

/**
 * Load books from API with filters
 * Requirements: 2.5
 */
async function loadBooks() {
  try {
    // Build query parameters from filters
    const params = new URLSearchParams();
    
    const literaryClassValue = literaryClassFilter.value;
    const periodValue = periodFilter.value;
    const authorValue = authorFilter.value;
    
    if (literaryClassValue) {
      params.append('literary_class', literaryClassValue);
    }
    
    if (periodValue) {
      params.append('period', periodValue);
    }
    
    if (authorValue) {
      params.append('author_id', authorValue);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/books?${queryString}` : '/books';
    
    const response = await window.api.get(endpoint);
    
    if (response.success) {
      allBooks = response.data || [];
      filteredBooks = [...allBooks];
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst knihy');
    }
  } catch (error) {
    console.error('Error loading books:', error);
    throw error;
  }
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
  // Populate literary class filter
  literaryClassFilter.innerHTML = '<option value="">Všechny</option>';
  literaryClasses.forEach(lc => {
    const option = document.createElement('option');
    option.value = lc.id;
    option.textContent = lc.name;
    literaryClassFilter.appendChild(option);
  });
  
  // Populate period filter
  periodFilter.innerHTML = '<option value="">Všechny</option>';
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period.id;
    option.textContent = period.name;
    periodFilter.appendChild(option);
  });
  
  // Populate author filter
  authorFilter.innerHTML = '<option value="">Všichni</option>';
  authors.forEach(author => {
    const option = document.createElement('option');
    option.value = author.id;
    const fullName = window.utils.stringFormat.formatFullName(author);
    option.textContent = fullName;
    authorFilter.appendChild(option);
  });
}

/**
 * Display books in grid
 */
function displayBooks() {
  // Update count
  booksCount.textContent = filteredBooks.length;
  
  // Check if empty
  if (filteredBooks.length === 0) {
    booksContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  booksContainer.style.display = 'grid';
  emptyState.style.display = 'none';
  booksContainer.innerHTML = '';
  
  // Create book cards
  filteredBooks.forEach(book => {
    const bookCard = createBookCard(book);
    booksContainer.appendChild(bookCard);
  });
}

/**
 * Create book card element
 */
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';
  card.dataset.bookId = book.id;
  
  const authorName = book.author_name || 'Neznámý autor';
  const literaryClassName = book.literary_class_name || 'Nezařazeno';
  const periodName = book.period_name || 'Nezařazeno';
  
  // Check if book is already in reading list
  const isInList = isBookInReadingList(book.id);
  
  // Check if author limit is reached
  const authorLimitReached = isAuthorLimitReached(book.author_id);
  
  // Determine if add button should be disabled
  const canAdd = !isInList && !authorLimitReached;
  
  // Create status message
  let statusHtml = '';
  if (isInList) {
    statusHtml = '<div class="book-card-status in-list">✓ V seznamu</div>';
  } else if (authorLimitReached) {
    statusHtml = '<div class="book-card-status author-limit">⚠ Limit autora (2/2)</div>';
  }
  
  card.innerHTML = `
    <div class="book-card-header">
      <div class="book-card-title">${book.name}</div>
      <div class="book-card-author">${authorName}</div>
    </div>
    
    <div class="book-card-meta">
      <div class="book-card-meta-item">
        <span class="book-card-meta-label">Literární druh:</span>
        <span>${literaryClassName}</span>
      </div>
      <div class="book-card-meta-item">
        <span class="book-card-meta-label">Období:</span>
        <span>${periodName}</span>
      </div>
      ${book.translator_name ? `
        <div class="book-card-meta-item">
          <span class="book-card-meta-label">Překladatel:</span>
          <span>${book.translator_name}</span>
        </div>
      ` : ''}
    </div>
    
    ${statusHtml}
    
    <div class="book-card-footer">
      <button 
        class="btn btn-add" 
        onclick="addBookToList(${book.id})"
        ${!canAdd ? 'disabled' : ''}
      >
        ${isInList ? '✓ Přidáno' : '+ Přidat do seznamu'}
      </button>
      ${book.url_book ? `
        <a href="${book.url_book}" target="_blank" class="btn btn-info" title="Zobrazit informace">
          ℹ️
        </a>
      ` : ''}
    </div>
  `;
  
  return card;
}

/**
 * Check if book is already in reading list
 */
function isBookInReadingList(bookId) {
  if (!readingListBooks || readingListBooks.length === 0) {
    return false;
  }
  
  return readingListBooks.some(book => book.id === bookId);
}

/**
 * Check if author limit is reached (2 books max)
 * Requirements: 6.1, 6.2
 */
function isAuthorLimitReached(authorId) {
  if (!readingListStatus || !readingListStatus.authorCounts) {
    return false;
  }
  
  const authorCount = readingListStatus.authorCounts[authorId];
  
  if (!authorCount) {
    return false;
  }
  
  return authorCount.count >= 2;
}

/**
 * Add book to reading list
 * Requirements: 5.1, 6.1, 6.2
 */
async function addBookToList(bookId) {
  showLoading();
  
  try {
    const response = await window.api.post('/reading-lists/books', {
      bookId: bookId
    });
    
    if (response.success) {
      window.utils.notification.success('Kniha byla přidána do seznamu');
      
      // Reload reading list status and books
      await loadReadingListStatus();
      await loadReadingList();
      displayBooks();
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se přidat knihu');
    }
  } catch (error) {
    console.error('Error adding book:', error);
    
    // Display specific error message
    let errorMessage = 'Chyba při přidávání knihy';
    
    if (error.message.includes('author')) {
      errorMessage = 'Nemůžete přidat více než 2 knihy od stejného autora';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    window.utils.notification.error(errorMessage);
  } finally {
    hideLoading();
  }
}

/**
 * Handle filter change
 */
async function handleFilterChange() {
  showLoading();
  
  try {
    // Reload books with new filters
    await loadBooks();
    
    // Display updated books
    displayBooks();
  } catch (error) {
    console.error('Error applying filters:', error);
    window.utils.notification.error('Chyba při filtrování knih: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Clear all filters
 */
async function clearFilters() {
  literaryClassFilter.value = '';
  periodFilter.value = '';
  authorFilter.value = '';
  
  await handleFilterChange();
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (confirm('Opravdu se chcete odhlásit?')) {
    await window.auth.logout();
  }
}

/**
 * Show loading overlay
 */
function showLoading() {
  loadingOverlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  loadingOverlay.style.display = 'none';
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  if (literaryClassFilter) {
    literaryClassFilter.addEventListener('change', handleFilterChange);
  }
  
  if (periodFilter) {
    periodFilter.addEventListener('change', handleFilterChange);
  }
  
  if (authorFilter) {
    authorFilter.addEventListener('change', handleFilterChange);
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Make addBookToList available globally for onclick handlers
window.addBookToList = addBookToList;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
