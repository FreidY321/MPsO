/**
 * Student Dashboard Module
 * Handles reading list display, statistics, and PDF generation
 * Requirements: 5.2, 5.3, 6.3, 6.4, 7.1
 */

// State
let currentUser = null;
let readingList = [];
let readingListStatus = null;
let classDeadline = null;

// DOM Elements
const userName = document.getElementById('userName');
const userClass = document.getElementById('userClass');
const totalBooksEl = document.getElementById('totalBooks');
const literaryClassesCompleted = document.getElementById('literaryClassesCompleted');
const periodsCompleted = document.getElementById('periodsCompleted');
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

  // Load class deadline
  await loadClassDeadline();

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
  
  // Display deadline info
  if (classDeadline) {
    const deadlineDate = new Date(classDeadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let deadlineText = '';
    let deadlineClass = 'deadline-info';
    
    // Format deadline date to Czech format using utils
    const formattedDate = window.utils.dateFormat.toCzechDate(deadlineDate);
    
    if (diffDays < 0) {
      deadlineText = `Deadline: ${formattedDate} (vypršel)`;
      deadlineClass += ' expired';
    } else if (diffDays === 0) {
      deadlineText = `Deadline: Dnes (${formattedDate})`;
      deadlineClass += ' today';
    } else if (diffDays === 1) {
      deadlineText = `Deadline: Zítra (${formattedDate})`;
      deadlineClass += ' active';
    } else {
      deadlineText = `Deadline: ${formattedDate} (za ${diffDays} dní)`;
      deadlineClass += ' active';
    }
    
    userDeadline.textContent = deadlineText;
    userDeadline.className = deadlineClass;
    userDeadline.style.display = 'block';
  }
}

/**
 * Load class deadline from API
 */
async function loadClassDeadline() {
  if (!currentUser.class_id) {
    return;
  }
  
  try {
    const response = await window.api.get(`/classes/${currentUser.class_id}/deadline`);
    
    if (response.success) {
      classDeadline = response.data.deadline;
    }
  } catch (error) {
    console.error('Error loading class deadline:', error);
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

    // Fetch reading list status from API
    const statusResponse = await window.api.get('/reading-lists/my/status');
    
    if (statusResponse.success) {
      readingListStatus = statusResponse.data;
    } else {
      throw new Error(statusResponse.error?.message || 'Nepodařilo se načíst status četby');
    }

    // Fetch reading list books for display
    const booksResponse = await window.api.get('/reading-lists/my');
    if (booksResponse.success) {
      readingList = Array.isArray(booksResponse.data) ? booksResponse.data : [];
    }
    
    // Display data
    displayStatistics();
    displayReadingList();
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

function displayStatistics() {
  if (!readingListStatus) return;
  
  // Count completed literary classes and periods
  const completedLiteraryClasses = readingListStatus.literaryClassProgress?.filter(lc => lc.isSatisfied && !lc.isOverLimit).length || 0;
  const totalLiteraryClasses = readingListStatus.literaryClassProgress?.length || 0;
  const completedPeriods = readingListStatus.periodProgress?.filter(p => p.isSatisfied && !p.isOverLimit).length || 0;
  const totalPeriods = readingListStatus.periodProgress?.length || 0;
  
  // Display completed counts
  literaryClassesCompleted.textContent = `${completedLiteraryClasses}/${totalLiteraryClasses}`;
  periodsCompleted.textContent = `${completedPeriods}/${totalPeriods}`;
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
      : (item.isSatisfied ? 100 : Math.min((item.currentCount / item.minRequired) * 100, 100));
    
    let fillClass = '';
    let statusText = '';
    
    if (item.isOverLimit) {
      fillClass = 'over-limit';
      statusText = `${item.currentCount - item.maxAllowed} přebytek`;
    } else if (item.isSatisfied) {
      fillClass = 'complete';
      statusText = 'Splněno';
    } else {
      fillClass = 'warning';
      statusText = `${item.minRequired - item.currentCount} chybí`;
    }
    
    progressItem.innerHTML = `
      <div class="progress-header">
        <span class="progress-name">${item.name}</span>
        <span class="progress-status ${fillClass}">${statusText}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-count">${item.currentCount} / ${item.maxAllowed ? item.minRequired :'min. ' +  item.minRequired}${item.maxAllowed ? '-' + item.maxAllowed : ''}</div>
    `;
    
    literaryClassProgress.appendChild(progressItem);
  });
}

function displayPeriodProgress() {
  if (!readingListStatus.periodProgress) {
    periodProgress.innerHTML = '<p style="color: #666; font-size: 13px;">Žádná data</p>';
    return;
  }
  
  periodProgress.innerHTML = '';
  
  readingListStatus.periodProgress.forEach(item => {
    const progressItem = document.createElement('a');
    console.log(item);
    progressItem.className = 'progress-item';
    progressItem.href =`#${item.name}`;
    
    const percentage = item.maxAllowed > 0 
      ? Math.min((item.currentCount / item.maxAllowed) * 100, 100)
      : (item.isSatisfied ? 100 : Math.min((item.currentCount / item.minRequired) * 100, 100));
    
    let fillClass = '';
    let statusText = '';
    
    if (item.isOverLimit) {
      fillClass = 'over-limit';
      statusText = `${item.currentCount - item.maxAllowed} přebytek`;
    } else if (item.isSatisfied) {
      fillClass = 'complete';
      statusText = 'Splněno';
    } else {
      fillClass = 'warning';
      statusText = `${item.minRequired - item.currentCount} chybí`;
    }
    
    progressItem.innerHTML = `
      <div class="progress-header">
        <span class="progress-name">${item.name}</span>
        <span class="progress-status ${fillClass}">${statusText}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-count">${item.currentCount} / ${item.maxAllowed ? item.minRequired :'min. ' +  item.minRequired}${item.maxAllowed ? '-' + item.maxAllowed : ''}</div>
    `;
    
    periodProgress.appendChild(progressItem);
  });
}

function displayAuthorCounts() {
  if (!readingListStatus.authorCounts || Object.keys(readingListStatus.authorCounts).length === 0) {
    authorCounts.innerHTML = '<p style="color: #666; font-size: 13px;">Zatím žádní autoři</p>';
    return;
  }
  
  authorCounts.innerHTML = '';
  
  // Convert to array and sort by count descending
  const authors = Object.entries(readingListStatus.authorCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => a.count - b.count);
  
  authors.forEach(author => {
    const authorItem = document.createElement('div');
    authorItem.className = 'author-item';
    
    let countClass = '';
    let statusText = '';
    
    if (author.count == 2) {
      countClass = 'warning';
      statusText = 'Max';
    } else if (author.canAddMore) {
      countClass = 'complete';
      statusText = `Lze přidat`;
    } else {
      countClass = 'limit-reached';
      statusText = `Přebytek knih`;
    }
    
    authorItem.innerHTML = `
      <div class="author-name" title="${author.fullName}">${author.fullName}</div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <span class="author-count ${countClass}">${author.count}</span>
        <span class="author-status">${statusText}</span>
      </div>
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
    
    // Show violations in a tooltip or details
    if (violationCount > 0) {
      const violationsContainer = document.createElement('div');
      violationsContainer.style.marginTop = '8px';
      violationsContainer.style.fontSize = '13px';
      violationsContainer.style.color = '#92400e';
      
      readingListStatus.violations.forEach(violation => {
        const violationEl = document.createElement('div');
        violationEl.textContent = `• ${violation}`;
        violationsContainer.appendChild(violationEl);
      });
      
      listStatus.appendChild(violationsContainer);
    }
  }
}

function displayReadingList() {
  if (!readingList || readingList.length === 0) {
    readingListContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  readingListContainer.style.display = 'block';
  emptyState.style.display = 'none';
  readingListContainer.innerHTML = '';
  
  // Group books by period first, then by literary class
  const grouped = groupBooksByPeriodAndClass(readingList);
  
  // Display each period group
  grouped.forEach(periodGroup => {
    const periodSection = document.createElement('div');
    periodSection.className = 'period-section';
    
    const periodHeader = document.createElement('div');
    periodHeader.className = 'period-header';
    periodHeader.id = periodGroup.period
    periodHeader.innerHTML = `<div class="period-title">${periodGroup.period}</div>`;
    
    const categoryList = document.createElement('div');
    categoryList.className = 'category-list';
    
    // Display each literary class within this period
    periodGroup.categories.forEach(category => {
      const summary = document.createElement('details');
      summary.className = 'category-group';
      
      const summaryHeader = document.createElement('summary');
      summaryHeader.className = 'category-header';
      summaryHeader.innerHTML = `
        <div class="category-title">${category.literaryClass}</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="book-count">${category.books.length} knih</span>
          <span class="toggle-icon">▶</span>
        </div>
      `;
      
      const bookList = document.createElement('div');
      bookList.className = 'book-list';
      
      category.books.forEach(book => {
        const bookItem = createBookItem(book);
        bookList.appendChild(bookItem);
      });
      
      summary.appendChild(summaryHeader);
      summary.appendChild(bookList);
      categoryList.appendChild(summary);
    });
    
    periodSection.appendChild(periodHeader);
    periodSection.appendChild(categoryList);
    readingListContainer.appendChild(periodSection);
  });
}

function groupBooksByPeriodAndClass(books) {
  const periodGroups = {};
  
  books.forEach(book => {
    const period = book.period_name || 'Nezařazeno';
    const literaryClass = book.literary_class_name || 'Nezařazeno';
    
    if (!periodGroups[period]) {
      periodGroups[period] = {
        period,
        categories: {}
      };
    }
    
    if (!periodGroups[period].categories[literaryClass]) {
      periodGroups[period].categories[literaryClass] = {
        literaryClass,
        books: []
      };
    }
    
    periodGroups[period].categories[literaryClass].books.push(book);
  });
  
  // Convert to array and sort
  return Object.entries(periodGroups)
    .map(([period, data]) => ({
      period,
      categories: Object.values(data.categories).sort((a, b) => 
        a.literaryClass.localeCompare(b.literaryClass, 'cs')
      )
    }))
    .sort((a, b) => a.period.localeCompare(b.period, 'cs'));
}

/**
 * Create book item element
 */
function createBookItem(book) {
  const bookItem = document.createElement('div');
  bookItem.className = 'book-item';
  bookItem.dataset.bookId = book.id;
  const fullName = [book.author_name, book.author_second_name, book.author_surname, book.author_second_surname]
        .filter(Boolean)
        .join(' ');
  const authorName = fullName || 'Neznámý autor';
  const periodName = book.period_name || 'Neznámé období';
  
  bookItem.innerHTML = `
    <div class="book-info">
      <div class="book-title">${book.book_name}</div>
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
      <button class="btn-icon btn-delete" onclick="removeBook(${book.id_book})" title="Odebrat knihu">
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

async function generatePdf() {
  showLoading();
  
  try {
    const blob = await window.api.downloadFile('/reading-lists/my/pdf');
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seznam-cetby.pdf`;
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
