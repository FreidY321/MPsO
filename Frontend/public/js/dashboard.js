/**
 * Student Dashboard Module
 * Handles reading list display, statistics, and PDF generation
 * Requirements: 5.2, 5.3, 6.3, 6.4, 7.1
 */

// State
let currentUser = null;
let readingList = [];
let readingListStatus = null;

// DOM Elements
const userName = document.getElementById('userName');
const userClass = document.getElementById('userClass');
const totalBooksEl = document.getElementById('totalBooks');
const literaryClassProgress = document.getElementById('literaryClassProgress');
const periodProgress = document.getElementById('periodProgress');
const authorCounts = document.getElementById('authorCounts');
const readingListContainer = document.getElementById('readingListContainer');
const emptyState = document.getElementById('emptyState');
const listStatus = document.getElementById('listStatus');
const printPdfBtn = document.getElementById('printPdfBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

/**
 * Initialize dashboard
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

  // Display user info
  displayUserInfo();

  // Load reading list and statistics
  await loadReadingList();

  // Attach event listeners
  attachEventListeners();
}

/**
 * Display user information
 */
function displayUserInfo() {
  const fullName = window.utils.stringFormat.formatFullName(currentUser);
  userName.textContent = fullName || 'Žák';
  
  // Display class info - just show class_id if name not available
  if (currentUser.class_name) {
    userClass.textContent = currentUser.class_name;
  } else if (currentUser.class_id) {
    userClass.textContent = `Třída ${currentUser.class_id}`;
  } else {
    userClass.textContent = 'Nepřiřazeno';
  }
}

/**
 * Load reading list from API
 * Requirements: 5.3
 */
async function loadReadingList() {
  showLoading();
  
  try {
    // Check if we have auth token
    if (!window.auth.getToken()) {
      throw new Error('Chybí autentizační token');
    }

    // Fetch reading list
    const response = await window.api.get('/reading-lists/my');
    
    if (response.success) {
      // Backend returns data directly as array of books
      readingList = Array.isArray(response.data) ? response.data : [];
      
      // Calculate status from the books we have
      readingListStatus = calculateStatusFromBooks(readingList);
      
      // Display data
      displayStatistics();
      displayReadingList();
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se načíst seznam četby');
    }
  } catch (error) {
    console.error('Error loading reading list:', error);
    
    // If it's an auth error, redirect to login
    if (error.message.includes('token') || error.message.includes('401') || error.message.includes('fetch')) {
      window.utils.notification.error('Platnost přihlášení vypršela. Přihlaste se prosím znovu.');
      setTimeout(() => {
        window.auth.clearAuth();
        window.location.href = 'login.html';
      }, 2000);
    } else {
      window.utils.notification.error('Chyba při načítání seznamu četby: ' + error.message);
    }
  } finally {
    hideLoading();
  }
}

/**
 * Calculate reading list status from books
 * This creates a simple status object from the books array
 */
function calculateStatusFromBooks(books) {
  const totalBooks = books.length;
  
  // Count by literary class
  const literaryClassCounts = {};
  const periodCounts = {};
  const authorCounts = {};
  
  books.forEach(book => {
    // Count literary classes
    const lcKey = book.literary_class || book.literary_class_name || 'Nezařazeno';
    literaryClassCounts[lcKey] = (literaryClassCounts[lcKey] || 0) + 1;
    
    // Count periods
    const periodKey = book.period || book.period_name || 'Nezařazeno';
    periodCounts[periodKey] = (periodCounts[periodKey] || 0) + 1;
    
    // Count authors
    const authorKey = book.author_id || 'unknown';
    const authorName = book.author_name || 'Neznámý autor';
    if (!authorCounts[authorKey]) {
      authorCounts[authorKey] = {
        fullName: authorName,
        count: 0,
        canAddMore: true
      };
    }
    authorCounts[authorKey].count++;
    authorCounts[authorKey].canAddMore = authorCounts[authorKey].count < 2;
  });
  
  // Convert to arrays for display
  const literaryClassProgress = Object.entries(literaryClassCounts).map(([name, count]) => ({
    name,
    currentCount: count,
    minRequired: 0,
    maxAllowed: 999,
    isSatisfied: true,
    isOverLimit: false
  }));
  
  const periodProgress = Object.entries(periodCounts).map(([name, count]) => ({
    name,
    currentCount: count,
    minRequired: 0,
    maxAllowed: 999,
    isSatisfied: true,
    isOverLimit: false
  }));
  
  return {
    totalBooks,
    literaryClassProgress,
    periodProgress,
    authorCounts,
    isComplete: false,
    violations: []
  };
}

/**
 * Display statistics
 * Requirements: 6.3, 6.4
 */
function displayStatistics() {
  if (!readingListStatus) return;
  
  // Total books
  totalBooksEl.textContent = readingListStatus.totalBooks || 0;
  
  // Literary class progress
  displayLiteraryClassProgress();
  
  // Period progress
  displayPeriodProgress();
  
  // Author counts
  displayAuthorCounts();
  
  // List completion status
  displayListStatus();
}

/**
 * Display literary class progress
 * Requirements: 6.3, 6.4
 */
function displayLiteraryClassProgress() {
  if (!readingListStatus.literaryClassProgress) {
    literaryClassProgress.innerHTML = '<p style="color: #666; font-size: 13px;">Žádná data</p>';
    return;
  }
  
  literaryClassProgress.innerHTML = '';
  
  readingListStatus.literaryClassProgress.forEach(item => {
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item';
    
    const percentage = item.maxAllowed > 0 
      ? Math.min((item.currentCount / item.maxAllowed) * 100, 100)
      : 0;
    
    let fillClass = '';
    if (item.isOverLimit) {
      fillClass = 'over-limit';
    } else if (item.isSatisfied) {
      fillClass = 'complete';
    } else if (item.currentCount > 0) {
      fillClass = 'warning';
    }
    
    progressItem.innerHTML = `
      <div class="progress-header">
        <span class="progress-name">${item.name}</span>
        <span class="progress-count">${item.currentCount} / ${item.minRequired}-${item.maxAllowed}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width: ${percentage}%"></div>
      </div>
    `;
    
    literaryClassProgress.appendChild(progressItem);
  });
}

/**
 * Display period progress
 * Requirements: 6.3, 6.4
 */
function displayPeriodProgress() {
  if (!readingListStatus.periodProgress) {
    periodProgress.innerHTML = '<p style="color: #666; font-size: 13px;">Žádná data</p>';
    return;
  }
  
  periodProgress.innerHTML = '';
  
  readingListStatus.periodProgress.forEach(item => {
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item';
    
    const percentage = item.maxAllowed > 0 
      ? Math.min((item.currentCount / item.maxAllowed) * 100, 100)
      : 0;
    
    let fillClass = '';
    if (item.isOverLimit) {
      fillClass = 'over-limit';
    } else if (item.isSatisfied) {
      fillClass = 'complete';
    } else if (item.currentCount > 0) {
      fillClass = 'warning';
    }
    
    progressItem.innerHTML = `
      <div class="progress-header">
        <span class="progress-name">${item.name}</span>
        <span class="progress-count">${item.currentCount} / ${item.minRequired}-${item.maxAllowed}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width: ${percentage}%"></div>
      </div>
    `;
    
    periodProgress.appendChild(progressItem);
  });
}

/**
 * Display author counts
 * Requirements: 6.3
 */
function displayAuthorCounts() {
  if (!readingListStatus.authorCounts || Object.keys(readingListStatus.authorCounts).length === 0) {
    authorCounts.innerHTML = '<p style="color: #666; font-size: 13px;">Zatím žádní autoři</p>';
    return;
  }
  
  authorCounts.innerHTML = '';
  
  // Convert to array and sort by count descending
  const authors = Object.entries(readingListStatus.authorCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count);
  
  authors.forEach(author => {
    const authorItem = document.createElement('div');
    authorItem.className = 'author-item';
    
    let countClass = '';
    if (author.count >= 2) {
      countClass = 'limit-reached';
    } else if (author.count === 1) {
      countClass = 'warning';
    }
    
    authorItem.innerHTML = `
      <span class="author-name">${author.fullName}</span>
      <span class="author-count ${countClass}">${author.count}</span>
    `;
    
    authorCounts.appendChild(authorItem);
  });
}

/**
 * Display list completion status
 * Requirements: 6.4
 */
function displayListStatus() {
  if (!readingListStatus) return;
  
  if (readingListStatus.isComplete) {
    listStatus.className = 'list-status complete';
    listStatus.textContent = '✓ Seznam je kompletní';
  } else {
    listStatus.className = 'list-status incomplete';
    const violationCount = readingListStatus.violations?.length || 0;
    listStatus.textContent = `⚠ Nesplněno (${violationCount} problémů)`;
  }
}

/**
 * Display reading list grouped by categories
 * Requirements: 5.3
 */
function displayReadingList() {
  if (!readingList || readingList.length === 0) {
    readingListContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  readingListContainer.style.display = 'block';
  emptyState.style.display = 'none';
  readingListContainer.innerHTML = '';
  
  // Group books by literary class and period
  const grouped = groupBooksByCategories(readingList);
  
  // Display each group
  grouped.forEach(group => {
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'category-group';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.innerHTML = `
      <div class="category-title">${group.category}</div>
    `;
    
    const bookList = document.createElement('div');
    bookList.className = 'book-list';
    
    group.books.forEach(book => {
      const bookItem = createBookItem(book);
      bookList.appendChild(bookItem);
    });
    
    categoryGroup.appendChild(categoryHeader);
    categoryGroup.appendChild(bookList);
    readingListContainer.appendChild(categoryGroup);
  });
}

/**
 * Group books by literary class and period
 * Requirements: 5.3
 */
function groupBooksByCategories(books) {
  const groups = {};
  
  books.forEach(book => {
    const literaryClass = book.literary_class_name || 'Nezařazeno';
    const period = book.period_name || 'Nezařazeno';
    const key = `${literaryClass} - ${period}`;
    
    if (!groups[key]) {
      groups[key] = {
        category: key,
        literaryClass,
        period,
        books: []
      };
    }
    
    groups[key].books.push(book);
  });
  
  // Convert to array and sort
  return Object.values(groups).sort((a, b) => {
    // Sort by literary class, then by period
    if (a.literaryClass !== b.literaryClass) {
      return a.literaryClass.localeCompare(b.literaryClass, 'cs');
    }
    return a.period.localeCompare(b.period, 'cs');
  });
}

/**
 * Create book item element
 */
function createBookItem(book) {
  const bookItem = document.createElement('div');
  bookItem.className = 'book-item';
  bookItem.dataset.bookId = book.id;
  
  const authorName = book.author_name || 'Neznámý autor';
  const periodName = book.period_name || 'Neznámé období';
  
  bookItem.innerHTML = `
    <div class="book-info">
      <div class="book-title">${book.name}</div>
      <div class="book-meta">
        <span class="book-author">${authorName}</span>
        <span class="book-period">${periodName}</span>
      </div>
    </div>
    <div class="book-actions">
      ${book.url_book ? `<a href="${book.url_book}" target="_blank" class="btn-icon" title="Zobrazit informace">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </a>` : ''}
      <button class="btn-icon btn-delete" onclick="removeBook(${book.id})" title="Odebrat knihu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  
  return bookItem;
}

/**
 * Remove book from reading list
 * Requirements: 5.2
 */
async function removeBook(bookId) {
  // Confirm deletion
  if (!confirm('Opravdu chcete odebrat tuto knihu ze seznamu?')) {
    return;
  }
  
  showLoading();
  
  try {
    const response = await window.api.delete(`/reading-lists/books/${bookId}`);
    
    if (response.success) {
      window.utils.notification.success('Kniha byla odebrána ze seznamu');
      
      // Reload reading list
      await loadReadingList();
    } else {
      throw new Error(response.error?.message || 'Nepodařilo se odebrat knihu');
    }
  } catch (error) {
    console.error('Error removing book:', error);
    window.utils.notification.error('Chyba při odebírání knihy: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Generate and download PDF
 * Requirements: 7.1
 */
async function generatePdf() {
  showLoading();
  
  try {
    const blob = await window.api.downloadFile('/reading-lists/my/pdf');
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seznam-cetby-${currentUser.surname || 'student'}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    window.utils.notification.success('PDF bylo vygenerováno a staženo');
  } catch (error) {
    console.error('Error generating PDF:', error);
    window.utils.notification.error('Chyba při generování PDF: ' + error.message);
  } finally {
    hideLoading();
  }
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
  if (printPdfBtn) {
    printPdfBtn.addEventListener('click', generatePdf);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Make removeBook available globally for onclick handlers
window.removeBook = removeBook;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
