// Teacher Dashboard JavaScript

// State management
const state = {
    currentSection: 'classes',
    classes: [],
    books: [],
    authors: [],
    literaryClasses: [],
    periods: [],
    infoSettings: null
};

// Helper function for notifications
function showNotification(message, type = 'info') {
    if (window.utils && window.utils.notification) {
        if (type === 'error') {
            window.utils.notification.error(message);
        } else if (type === 'success') {
            window.utils.notification.success(message);
        } else {
            window.utils.notification.info(message);
        }
    } else {
        alert(message);
    }
}

// Handle logout
async function handleLogout() {
    if (confirm('Opravdu se chcete odhlásit?')) {
        if (window.auth && window.auth.logout) {
            await window.auth.logout();
        } else {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// API request wrapper
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        let response;
        
        switch (method.toUpperCase()) {
            case 'GET':
                response = await window.api.get(endpoint);
                break;
            case 'POST':
                response = await window.api.post(endpoint, data);
                break;
            case 'PUT':
                response = await window.api.put(endpoint, data);
                break;
            case 'DELETE':
                response = await window.api.delete(endpoint);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
        
        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize teacher dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!window.auth || !window.auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is teacher
    const user = window.auth.getUser();
    if (!user || user.role !== 'teacher') {
        if (window.utils && window.utils.notification) {
            window.utils.notification.error('Nemáte oprávnění k přístupu do učitelské sekce');
        }
        setTimeout(() => {
            if (user && user.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (user && user.role === 'student') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'login.html';
            }
        }, 2000);
        return;
    }

    // Load info settings
    await loadInfoSettings();

    // Setup navigation
    setupNavigation();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Load initial section
    await loadSection('classes');
});

// Load info settings
async function loadInfoSettings() {
    try {
        const response = await apiRequest('/info');
        const info = response.data;
        
        // Store in state
        state.infoSettings = {
            schoolName: info.school?.name || 'SPŠEI Ostrava',
            totalBooks: info.readingSettings?.totalBooks || 20,
            maxPerAuthor: info.readingSettings?.maxPerAutor || 2
        };
        
        // Store globally for other functions
        window.infoSettings = state.infoSettings;
        
    } catch (error) {
        console.error('Error loading info settings:', error);
    }
}

// Navigation setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', async () => {
            const section = item.dataset.section;
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Load section
            await loadSection(section);
        });
    });
}

// Load section
async function loadSection(section) {
    state.currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show current section
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Load section data
    switch (section) {
        case 'classes':
            await loadClasses();
            break;
        case 'books':
            await loadBooks();
            break;
        case 'authors':
            await loadAuthors();
            break;
        case 'categories':
            await loadCategories();
            break;
    }
}

// ============================================================================
// CLASSES MANAGEMENT
// ============================================================================

async function loadClasses() {
    showLoading();
    
    try {
        // Load all classes with reading list status for current teacher
        const response = await apiRequest('/reading-lists/classes/my/status');
        state.classes = response.data.classes || [];
        
        // Render classes table
        renderClassesTable();
        
    } catch (error) {
        showNotification('Chyba při načítání tříd: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderClassesTable() {
    const tbody = document.getElementById('classesTableBody');
    
    if (state.classes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    <p>Nemáte přiřazeny žádné třídy</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.classes.map(cls => {
        const deadline = cls.deadline ? new Date(cls.deadline).toLocaleDateString('cs-CZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';
        
        const progressText = `${cls.completedStudents} z ${cls.totalStudents} hotovo (${cls.completionPercentage}%)`;
        
        return `
            <tr>
                <td><strong>${escapeHtml(cls.name)}</strong></td>
                <td>${cls.year_ended}</td>
                <td>${deadline}</td>
                <td>${progressText}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-view" onclick="viewClassStudents(${cls.classId || cls.id})">
                            Žáci
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="editClassDeadline(${cls.classId || cls.id})">
                            Změnit deadline
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewClassStudents(classId) {
    showLoading();
    
    try {
        // Get class with students and their reading list status
        const response = await apiRequest(`/reading-lists/class/${classId}/status`);
        const classData = response.data;
        const studentStatuses = classData.studentStatuses || [];
        
        // Separate completed and pending students
        const completedStudents = studentStatuses.filter(s => s.isComplete);
        const pendingStudents = studentStatuses.filter(s => !s.isComplete);
        
        let studentsHtml = '';
        
        if (studentStatuses.length === 0) {
            studentsHtml = '<p style="text-align: center; color: #999;">Ve třídě nejsou žádní žáci</p>';
        } else {
            studentsHtml = '<div style="margin-bottom: 16px; padding: 12px; background: #e8f5e9; border-radius: 8px; font-size: 14px;">';
            studentsHtml += `<strong>Celkem:</strong> ${classData.totalStudents} žáků | <strong>Hotovo:</strong> ${classData.completedStudents} | <strong>Čeká:</strong> ${classData.pendingStudents}`;
            studentsHtml += '</div>';
            if (completedStudents.length > 0) {
                studentsHtml += '<div style="margin-bottom: 16px;"><h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2e7d32;">Hotovo:</h4>';
                studentsHtml += completedStudents.map(s => `
                    <div class="result-item" style="cursor: pointer; transition: background 0.2s; border-left: 3px solid #2e7d32;" 
                         onclick="viewStudentReadingList(${s.studentId}, '${escapeHtml(s.name)} ${escapeHtml(s.surname)}')">
                        <strong>${escapeHtml(s.name)} ${escapeHtml(s.surname)}</strong>
                        <div>${s.totalBooks} / ${infoSettings?.totalBooks} knih</div>
                    </div>
                `).join('');
                studentsHtml += '</div>';
            }
            
            if (pendingStudents.length > 0) {
                studentsHtml += '<div><h4 style="margin: 0 0 8px 0; font-size: 14px; color: #c62828;">Nemají hotovo:</h4>';
                studentsHtml += pendingStudents.map(s => `
                    <div class="result-item" style="cursor: pointer; transition: background 0.2s; border-left: 3px solid #c62828;" 
                         onclick="viewStudentReadingList(${s.studentId}, '${escapeHtml(s.name)} ${escapeHtml(s.surname)}')">
                        <strong>${escapeHtml(s.name)} ${escapeHtml(s.surname)}</strong>
                        <div>${s.totalBooks} / ${infoSettings?.totalBooks} knih</div>
                    </div>
                `).join('');
                studentsHtml += '</div>';
            }
        }
        
        const modal = createModal({
            title: `Žáci třídy ${escapeHtml(classData.name)}`,
            content: `
                <div class="results-container">
                    ${studentsHtml}
                </div>
                ${studentStatuses.length > 0 ? '<p style="margin-top: 16px; font-size: 13px; color: #666;">Klikněte na žáka pro zobrazení jeho maturitního listu</p>' : ''}
            `,
            buttons: [
                {
                    text: 'Zavřít',
                    className: 'btn btn-secondary',
                    onClick: () => closeModal()
                }
            ]
        });
        
        showModal(modal);
        
    } catch (error) {
        showNotification('Chyba při načítání žáků: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function viewStudentReadingList(studentId, studentName) {
    showLoading();
    
    try {
        const response = await apiRequest(`/reading-lists/${studentId}`);
        const readingList = response.data;
        if (!readingList || readingList.length === 0) {
            showNotification(`${studentName} zatím nemá vytvořený maturitní list`, 'info');
            hideLoading();
            return;
        }
        const booksHtml = readingList.map(book => {
            const authorName = window.utils.stringFormat.formatAuthorName({
                name: book.author_name,
                second_name: book.author_second_name,
                surname: book.author_surname,
                second_surname: book.author_second_surname
            });
            return `
            <div class="result-item">
                <strong>${escapeHtml(book.book_name)}</strong>
                <div>Autor: ${escapeHtml(authorName)}</div>
                <div>Druh: ${escapeHtml(book.literary_class_name)} | Období: ${escapeHtml(book.period_name)}</div>
            </div>
        `}).join('');
        
        const modal = createModal({
            title: `Maturitní list - ${studentName}`,
            content: `
                <div class="results-container">
                    ${booksHtml}
                </div>
                <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                    <strong>Celkem knih:</strong> ${readingList.length}
                </div>
            `,
            buttons: [
                {
                    text: 'Zavřít',
                    className: 'btn btn-secondary',
                    onClick: () => closeModal()
                }
            ]
        });
        
        showModal(modal);
        
    } catch (error) {
        showNotification('Chyba při načítání maturitního listu: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function editClassDeadline(classId) {
    const cls = state.classes.find(c => c.id === classId);
    if (!cls) return;
    
    const deadlineValue = cls.deadline 
        ? new Date(cls.deadline).toISOString().slice(0, 16) 
        : '';
    
    const modal = createModal({
        title: `Změnit deadline - ${escapeHtml(cls.name)}`,
        content: `
            <form id="deadlineForm">
                <div class="form-row single">
                    <div class="form-group">
                        <label for="classDeadline">Nový deadline</label>
                        <input type="datetime-local" id="classDeadline" name="deadline" 
                               value="${deadlineValue}" required>
                        <p class="form-help">Deadline pro odevzdání maturitních listů</p>
                    </div>
                </div>
            </form>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Uložit',
                className: 'btn btn-primary',
                onClick: () => saveClassDeadline(classId)
            }
        ]
    });
    
    showModal(modal);
}

async function saveClassDeadline(classId) {
    const form = document.getElementById('deadlineForm');
    const formData = new FormData(form);
    
    const deadline = formData.get('deadline');
    
    if (!deadline) {
        showNotification('Vyplňte deadline', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await apiRequest(`/classes/${classId}`, 'PUT', { deadline });
        showNotification('Deadline byl úspěšně změněn', 'success');
        closeModal();
        await loadClasses();
    } catch (error) {
        showNotification('Chyba při změně deadline: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Make functions globally available
window.viewClassStudents = viewClassStudents;
window.viewStudentReadingList = viewStudentReadingList;
window.editClassDeadline = editClassDeadline;


// ============================================================================
// BOOKS MANAGEMENT
// ============================================================================

async function loadBooks() {
    showLoading();
    
    try {
        // Load books
        const booksResponse = await apiRequest('/books');
        state.books = booksResponse.data || [];
        
        // Load authors for display and dropdowns
        const authorsResponse = await apiRequest('/authors');
        state.authors = authorsResponse.data || [];
        
        // Load literary classes
        const literaryClassesResponse = await apiRequest('/literary-classes');
        state.literaryClasses = literaryClassesResponse.data || [];
        
        // Load periods
        const periodsResponse = await apiRequest('/periods');
        state.periods = periodsResponse.data || [];
        
        // Render books table
        renderBooksTable();
        
        // Setup event listeners
        document.getElementById('addBookBtn').addEventListener('click', () => showBookModal());
        
    } catch (error) {
        showNotification('Chyba při načítání knih: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderBooksTable() {
    const tbody = document.getElementById('booksTableBody');
    
    if (state.books.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    <p>Zatím nejsou vytvořeny žádné knihy</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.books.map(book => {
        const author = state.authors.find(a => a.id === book.author_id);
        const authorName = author 
            ? [author.name, author.second_name, author.surname, author.second_surname]
                .filter(Boolean)
                .join(' ')
            : '-';
        
        const literaryClass = state.literaryClasses.find(lc => lc.id === book.literary_class);
        const period = state.periods.find(p => p.id === book.period);
        
        return `
            <tr>
                <td><strong>${escapeHtml(book.name)}</strong></td>
                <td>${escapeHtml(authorName)}</td>
                <td>${literaryClass ? escapeHtml(literaryClass.name) : '-'}</td>
                <td>${period ? escapeHtml(period.name) : '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-edit" onclick="editBook(${book.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteBook(${book.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showBookModal(bookId = null) {
    const book = bookId ? state.books.find(b => b.id === bookId) : null;
    const isEdit = !!book;
    
    const authorOptions = state.authors.map(a => {
        const fullName = [a.name, a.second_name, a.surname, a.second_surname]
            .filter(Boolean)
            .join(' ');
        return `<option value="${a.id}" ${book && book.author_id === a.id ? 'selected' : ''}>
            ${escapeHtml(fullName)}
        </option>`;
    }).join('');
    
    const literaryClassOptions = state.literaryClasses.map(lc => 
        `<option value="${lc.id}" ${book && book.literary_class === lc.id ? 'selected' : ''}>
            ${escapeHtml(lc.name)}
        </option>`
    ).join('');
    
    const periodOptions = state.periods.map(p => 
        `<option value="${p.id}" ${book && book.period === p.id ? 'selected' : ''}>
            ${escapeHtml(p.name)}
        </option>`
    ).join('');
    
    const modal = createModal({
        title: isEdit ? 'Upravit knihu' : 'Přidat knihu',
        content: `
            <form id="bookForm">
                <div class="form-row single">
                    <div class="form-group">
                        <label for="bookName">Název knihy *</label>
                        <input type="text" id="bookName" name="name" 
                               value="${book ? escapeHtml(book.name) : ''}" 
                               placeholder="např. Babička" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="bookAuthor">Autor *</label>
                        <select id="bookAuthor" name="author_id" required>
                            <option value="">Vyberte autora</option>
                            ${authorOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bookTranslator">Překladatel</label>
                        <input type="text" id="bookTranslator" name="translator_name" 
                               value="${book && book.translator_name ? escapeHtml(book.translator_name) : ''}" 
                               placeholder="Volitelné">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="bookLiteraryClass">Literární druh *</label>
                        <select id="bookLiteraryClass" name="literary_class" required>
                            <option value="">Vyberte druh</option>
                            ${literaryClassOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bookPeriod">Období *</label>
                        <select id="bookPeriod" name="period" required>
                            <option value="">Vyberte období</option>
                            ${periodOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label for="bookUrl">URL knihy</label>
                        <input type="url" id="bookUrl" name="url_book" 
                               value="${book && book.url_book ? escapeHtml(book.url_book) : ''}" 
                               placeholder="https://...">
                    </div>
                </div>
            </form>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: isEdit ? 'Uložit' : 'Vytvořit',
                className: 'btn btn-primary',
                onClick: () => saveBook(bookId)
            }
        ]
    });
    
    showModal(modal);
}

async function saveBook(bookId) {
    const form = document.getElementById('bookForm');
    const formData = new FormData(form);
    
    const newData = {
        name: window.utils.stringFormat.sanitize(formData.get('name')),
        author_id: parseInt(formData.get('author_id')),
        literary_class: parseInt(formData.get('literary_class')),
        period: parseInt(formData.get('period')),
        translator_name: window.utils.stringFormat.sanitize(formData.get('translator_name')),
        url_book: window.utils.stringFormat.sanitize(formData.get('url_book'))
    };
    
    // Validation
    if (!newData.name || !newData.author_id || !newData.literary_class || !newData.period) {
        showNotification('Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (bookId) {
        const originalBook = state.books.find(b => b.id === bookId);
        data = {};
        
        // Compare each field and include only changed ones
        if (newData.name !== originalBook.name) {
            data.name = newData.name;
        }
        if (newData.author_id !== originalBook.author_id) {
            data.author_id = newData.author_id;
        }
        if ((newData.translator_name || null) !== (originalBook.translator_name || null)) {
            data.translator_name = newData.translator_name;
        }
        if (newData.literary_class !== originalBook.literary_class) {
            data.literary_class = newData.literary_class;
        }
        if (newData.period !== originalBook.period) {
            data.period = newData.period;
        }
        if ((newData.url_book || null) !== (originalBook.url_book || null)) {
            data.url_book = newData.url_book;
        }
        
        // If nothing changed, don't send request
        if (Object.keys(data).length === 0) {
            showNotification('Nebyly provedeny žádné změny', 'info');
            closeModal();
            return;
        }
    }
    
    showLoading();
    
    try {
        if (bookId) {
            await apiRequest(`/books/${bookId}`, 'PUT', data);
            showNotification('Kniha byla úspěšně aktualizována', 'success');
        } else {
            await apiRequest('/books', 'POST', newData);
            showNotification('Kniha byla úspěšně vytvořena', 'success');
        }
        
        closeModal();
        await loadBooks();
        
    } catch (error) {
        showNotification('Chyba při ukládání knihy: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteBook(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;
    
    const modal = createModal({
        title: 'Smazat knihu',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat knihu <strong>${escapeHtml(book.name)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Knihu nelze smazat, pokud je použita v nějakém seznamu četby.
            </div>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Smazat',
                className: 'btn btn-delete',
                onClick: async () => {
                    showLoading();
                    try {
                        await apiRequest(`/books/${bookId}`, 'DELETE');
                        showNotification('Kniha byla úspěšně smazána', 'success');
                        closeModal();
                        await loadBooks();
                    } catch (error) {
                        showNotification('Chyba při mazání knihy: ' + error.message, 'error');
                    } finally {
                        hideLoading();
                    }
                }
            }
        ]
    });
    
    showModal(modal);
}

// Make functions globally available
window.editBook = showBookModal;
window.deleteBook = deleteBook;

// ============================================================================
// AUTHORS MANAGEMENT
// ============================================================================

async function loadAuthors() {
    showLoading();
    
    try {
        const response = await apiRequest('/authors');
        state.authors = response.data || [];
        
        // Render authors table
        renderAuthorsTable();
        
        // Setup event listeners
        document.getElementById('addAuthorBtn').addEventListener('click', () => showAuthorModal());
        document.getElementById('authorSearch').addEventListener('input', renderAuthorsTable);
        
    } catch (error) {
        showNotification('Chyba při načítání autorů: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderAuthorsTable() {
    const tbody = document.getElementById('authorsTableBody');
    const searchTerm = document.getElementById('authorSearch').value.toLowerCase();
    
    // Filter authors by search
    let filteredAuthors = state.authors;
    
    if (searchTerm) {
        filteredAuthors = filteredAuthors.filter(a => {
            const fullName = `${a.name || ''} ${a.second_name || ''} ${a.surname || ''} ${a.second_surname || ''}`.toLowerCase();
            return fullName.includes(searchTerm);
        });
    }
    
    if (filteredAuthors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="table-empty">
                    <p>${searchTerm ? 'Nebyli nalezeni žádní autoři' : 'Zatím nejsou přidáni žádní autoři'}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredAuthors.map(author => {
        const fullName = `${author.name || ''} ${author.second_name || ''} ${author.surname || ''} ${author.second_surname || ''}`;
        return `
            <tr>
                <td>${fullName}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-edit" onclick="editAuthor(${author.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteAuthor(${author.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showAuthorModal(authorId = null) {
    const author = authorId ? state.authors.find(a => a.id === authorId) : null;
    const isEdit = !!author;
    
    const modal = createModal({
        title: isEdit ? 'Upravit autora' : 'Přidat autora',
        content: `
            <form id="authorForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="authorName">Jméno</label>
                        <input type="text" id="authorName" name="name" 
                               value="${author ? escapeHtml(author.name || '') : ''}" 
                               placeholder="Karel" required>
                    </div>
                    <div class="form-group">
                        <label for="authorSecondName">Druhé jméno</label>
                        <input type="text" id="authorSecondName" name="second_name" 
                               value="${author && author.second_name ? escapeHtml(author.second_name) : ''}" 
                               placeholder="Volitelné">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="authorSurname">Příjmení *</label>
                        <input type="text" id="authorSurname" name="surname" 
                               value="${author ? escapeHtml(author.surname || '') : ''}" 
                               placeholder="Čapek" required>
                    </div>
                    <div class="form-group">
                        <label for="authorSecondSurname">Druhé příjmení</label>
                        <input type="text" id="authorSecondSurname" name="second_surname" 
                               value="${author && author.second_surname ? escapeHtml(author.second_surname) : ''}" 
                               placeholder="Volitelné">
                    </div>
                </div>
            </form>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: isEdit ? 'Uložit' : 'Vytvořit',
                className: 'btn btn-primary',
                onClick: () => saveAuthor(authorId)
            }
        ]
    });
    
    showModal(modal);
}

async function saveAuthor(authorId) {
    const form = document.getElementById('authorForm');
    const formData = new FormData(form);
    
    const newData = {
        surname: window.utils.stringFormat.sanitize(formData.get('surname')),
        name: window.utils.stringFormat.sanitize(formData.get('name')),
        second_name: window.utils.stringFormat.sanitize(formData.get('second_name')),
        second_surname: window.utils.stringFormat.sanitize(formData.get('second_surname'))
    };
    
    // Validation
    if (!newData.surname) {
        showNotification('Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (authorId) {
        const originalAuthor = state.authors.find(a => a.id === authorId);
        data = {};
        
        // Compare each field and include only changed ones
        if ((newData.name || null) !== (originalAuthor.name || null)) {
            data.name = newData.name;
        }
        if ((newData.second_name || null) !== (originalAuthor.second_name || null)) {
            data.second_name = newData.second_name;
        }
        if (newData.surname !== originalAuthor.surname) {
            data.surname = newData.surname;
        }
        if ((newData.second_surname || null) !== (originalAuthor.second_surname || null)) {
            data.second_surname = newData.second_surname;
        }
        
        // If nothing changed, don't send request
        if (Object.keys(data).length === 0) {
            showNotification('Nebyly provedeny žádné změny', 'info');
            closeModal();
            return;
        }
    }
    
    showLoading();
    
    try {
        if (authorId) {
            await apiRequest(`/authors/${authorId}`, 'PUT', data);
            showNotification('Autor byl úspěšně aktualizován', 'success');
        } else {
            await apiRequest('/authors', 'POST', newData);
            showNotification('Autor byl úspěšně vytvořen', 'success');
        }
        
        closeModal();
        await loadAuthors();
        
    } catch (error) {
        showNotification('Chyba při ukládání autora: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteAuthor(authorId) {
    const author = state.authors.find(a => a.id === authorId);
    if (!author) return;
    
    const fullName = [author.name, author.second_name, author.surname, author.second_surname]
        .filter(Boolean)
        .join(' ');
    
    const modal = createModal({
        title: 'Smazat autora',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat autora <strong>${escapeHtml(fullName)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Autora nelze smazat, pokud má přiřazené knihy.
            </div>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Smazat',
                className: 'btn btn-delete',
                onClick: async () => {
                    showLoading();
                    try {
                        await apiRequest(`/authors/${authorId}`, 'DELETE');
                        showNotification('Autor byl úspěšně smazán', 'success');
                        closeModal();
                        await loadAuthors();
                    } catch (error) {
                        showNotification('Chyba při mazání autora: ' + error.message, 'error');
                    } finally {
                        hideLoading();
                    }
                }
            }
        ]
    });
    
    showModal(modal);
}

// Make functions globally available
window.editAuthor = showAuthorModal;
window.deleteAuthor = deleteAuthor;


// ============================================================================
// CATEGORIES MANAGEMENT (Literary Classes & Periods)
// ============================================================================

async function loadCategories() {
    showLoading();
    
    try {
        // Load literary classes
        const literaryResponse = await apiRequest('/literary-classes');
        state.literaryClasses = literaryResponse.data || [];
        
        // Load periods
        const periodsResponse = await apiRequest('/periods');
        state.periods = periodsResponse.data || [];
        
        // Render tables
        renderLiteraryClassesTable();
        renderPeriodsTable();
        
        // Setup event listeners
        document.getElementById('addLiteraryClassBtn').addEventListener('click', () => showLiteraryClassModal());
        document.getElementById('addPeriodBtn').addEventListener('click', () => showPeriodModal());
        
    } catch (error) {
        showNotification('Chyba při načítání kategorií: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderLiteraryClassesTable() {
    const tbody = document.getElementById('literaryClassesTableBody');
    
    if (state.literaryClasses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="table-empty">
                    <p>Zatím nejsou vytvořeny žádné literární druhy</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.literaryClasses.map(lc => {
        const maxRequest = lc.max_request != null ? lc.max_request : '-';
        const minRequest = lc.min_request != null ? lc.min_request : '-';
        return `
            <tr>
                <td><strong>${escapeHtml(lc.name)}</strong></td>
                <td>${minRequest}</td>
                <td>${maxRequest}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-edit" onclick="editLiteraryClass(${lc.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteLiteraryClass(${lc.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPeriodsTable() {
    const tbody = document.getElementById('periodsTableBody');
    
    if (state.periods.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="table-empty">
                    <p>Zatím nejsou vytvořena žádná období</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.periods.map(period => {
        const maxRequest = period.max_request != null ? period.max_request : '-';
        const minRequest = period.min_request != null ? period.min_request : '-';
        return `
            <tr>
                <td><strong>${escapeHtml(period.name)}</strong></td>
                <td>${minRequest}</td>
                <td>${maxRequest}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-edit" onclick="editPeriod(${period.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deletePeriod(${period.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showLiteraryClassModal(literaryClassId = null) {
    const lc = literaryClassId ? state.literaryClasses.find(l => l.id === literaryClassId) : null;
    const isEdit = !!lc;
    
    const modal = createModal({
        title: isEdit ? 'Upravit literární druh' : 'Přidat literární druh',
        content: `
            <form id="literaryClassForm">
                <div class="form-row single">
                    <div class="form-group">
                        <label for="lcName">Název *</label>
                        <input type="text" id="lcName" name="name" 
                               value="${lc ? escapeHtml(lc.name) : ''}" 
                               placeholder="např. Próza" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="lcMinRequest">Minimální počet knih</label>
                        <input type="number" id="lcMinRequest" name="min_request" 
                               value="${lc ? lc.min_request : ''}" 
                               min="0" max="100" placeholder="Volitelné">
                    </div>
                    <div class="form-group">
                        <label for="lcMaxRequest">Maximální počet knih</label>
                        <input type="number" id="lcMaxRequest" name="max_request" 
                               value="${lc ? lc.max_request : ''}" 
                               min="0" max="100" placeholder="Volitelné">
                    </div>
                </div>
            </form>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: isEdit ? 'Uložit' : 'Vytvořit',
                className: 'btn btn-primary',
                onClick: () => saveLiteraryClass(literaryClassId)
            }
        ]
    });
    
    showModal(modal);
}

async function saveLiteraryClass(literaryClassId) {
    const form = document.getElementById('literaryClassForm');
    const formData = new FormData(form);
    
    const name = window.utils.stringFormat.sanitize(formData.get('name'));
    const minRequestValue = formData.get('min_request');
    const maxRequestValue = formData.get('max_request');

    const newData = {
        name: name,
        min_request: minRequestValue === '' ? null : parseInt(minRequestValue),
        max_request: maxRequestValue === '' ? null : parseInt(maxRequestValue)
    };
    
    // Validation
    if (!name) {
        showNotification('Název literárního druhu je povinný', 'error');
        return;
    }

    // If both min and max are provided, validate relationship
    if (newData.min_request !== null && newData.max_request !== null) {
        if (newData.min_request > newData.max_request) {
            showNotification('Minimální počet nemůže být větší než maximální', 'error');
            return;
        }
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (literaryClassId) {
        const originalLC = state.literaryClasses.find(lc => lc.id === literaryClassId);
        data = {};
        
        // Compare each field and include only changed ones
        if (newData.name !== originalLC.name) {
            data.name = newData.name;
        }
        if (newData.min_request !== originalLC.min_request) {
            data.min_request = newData.min_request;
        }
        if ((newData.max_request || null) !== (originalLC.max_request || null)) {
            data.max_request = newData.max_request;
        }
        
        // If nothing changed, don't send request
        if (Object.keys(data).length === 0) {
            showNotification('Nebyly provedeny žádné změny', 'info');
            closeModal();
            return;
        }
    }
    
    showLoading();
    
    try {
        if (literaryClassId) {
            await apiRequest(`/literary-classes/${literaryClassId}`, 'PUT', data);
            showNotification('Literární druh byl úspěšně aktualizován', 'success');
        } else {
            await apiRequest('/literary-classes', 'POST', newData);
            showNotification('Literární druh byl úspěšně vytvořen', 'success');
        }
        
        closeModal();
        await loadCategories();
        
    } catch (error) {
        showNotification('Chyba při ukládání literárního druhu: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteLiteraryClass(literaryClassId) {
    const lc = state.literaryClasses.find(l => l.id === literaryClassId);
    if (!lc) return;
    
    const modal = createModal({
        title: 'Smazat literární druh',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat literární druh <strong>${escapeHtml(lc.name)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Literární druh nelze smazat, pokud má přiřazené knihy.
            </div>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Smazat',
                className: 'btn btn-delete',
                onClick: async () => {
                    showLoading();
                    try {
                        await apiRequest(`/literary-classes/${literaryClassId}`, 'DELETE');
                        showNotification('Literární druh byl úspěšně smazán', 'success');
                        closeModal();
                        await loadCategories();
                    } catch (error) {
                        showNotification('Chyba při mazání literárního druhu: ' + error.message, 'error');
                    } finally {
                        hideLoading();
                    }
                }
            }
        ]
    });
    
    showModal(modal);
}

function showPeriodModal(periodId = null) {
    const period = periodId ? state.periods.find(p => p.id === periodId) : null;
    const isEdit = !!period;
    
    const modal = createModal({
        title: isEdit ? 'Upravit období' : 'Přidat období',
        content: `
            <form id="periodForm">
                <div class="form-row single">
                    <div class="form-group">
                        <label for="periodName">Název *</label>
                        <input type="text" id="periodName" name="name" 
                               value="${period ? escapeHtml(period.name) : ''}" 
                               placeholder="např. Česká literatura 20. a 21. století" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="periodMin">Minimální počet</label>
                        <input type="number" id="periodMin" name="min_request" 
                               value="${period ? period.min_request : ''}" 
                               min="0" placeholder="Volitelné">
                    </div>
                    <div class="form-group">
                        <label for="periodMax">Maximální počet</label>
                        <input type="number" id="periodMax" name="max_request" 
                               value="${period && period.max_request ? period.max_request : ''}" 
                               min="0" placeholder="Volitelné">
                    </div>
                </div>
            </form>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: isEdit ? 'Uložit' : 'Vytvořit',
                className: 'btn btn-primary',
                onClick: () => savePeriod(periodId)
            }
        ]
    });
    
    showModal(modal);
}

async function savePeriod(periodId) {
    const form = document.getElementById('periodForm');
    const formData = new FormData(form);
    
    // Get values - use null if empty
    const name = window.utils.stringFormat.sanitize(formData.get('name'));
    const minRequestValue = formData.get('min_request');
    const maxRequestValue = formData.get('max_request');
    
    const newData = {
        name: name,
        min_request: minRequestValue === '' ? null : parseInt(minRequestValue),
        max_request: maxRequestValue === '' ? null : parseInt(maxRequestValue)
    };
    
    // Validation - name is required
    if (!name) {
        showNotification('Název období je povinný', 'error');
        return;
    }
    
    // If both min and max are provided, validate relationship
    if (newData.min_request !== null && newData.max_request !== null) {
        if (newData.min_request > newData.max_request) {
            showNotification('Minimální počet nemůže být větší než maximální', 'error');
            return;
        }
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (periodId) {
        const originalPeriod = state.periods.find(p => p.id === periodId);
        data = {};
        
        // Compare each field and include only changed ones
        if (newData.name !== originalPeriod.name) {
            data.name = newData.name;
        }
        if (newData.min_request !== originalPeriod.min_request) {
            data.min_request = newData.min_request;
        }
        if (newData.max_request !== originalPeriod.max_request) {
            data.max_request = newData.max_request;
        }
        
        // If nothing changed, don't send request
        if (Object.keys(data).length === 0) {
            showNotification('Nebyly provedeny žádné změny', 'info');
            closeModal();
            return;
        }
    }
    
    showLoading();
    
    try {
        if (periodId) {
            await apiRequest(`/periods/${periodId}`, 'PUT', data);
            showNotification('Období bylo úspěšně aktualizováno', 'success');
        } else {
            await apiRequest('/periods', 'POST', newData);
            showNotification('Období bylo úspěšně vytvořeno', 'success');
        }
        
        closeModal();
        await loadCategories();
        
    } catch (error) {
        showNotification('Chyba při ukládání období: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deletePeriod(periodId) {
    const period = state.periods.find(p => p.id === periodId);
    if (!period) return;
    
    const modal = createModal({
        title: 'Smazat období',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat období <strong>${escapeHtml(period.name)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Období nelze smazat, pokud má přiřazené knihy.
            </div>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Smazat',
                className: 'btn btn-delete',
                onClick: async () => {
                    showLoading();
                    try {
                        await apiRequest(`/periods/${periodId}`, 'DELETE');
                        showNotification('Období bylo úspěšně smazáno', 'success');
                        closeModal();
                        await loadCategories();
                    } catch (error) {
                        showNotification('Chyba při mazání období: ' + error.message, 'error');
                    } finally {
                        hideLoading();
                    }
                }
            }
        ]
    });
    
    showModal(modal);
}

// Make functions globally available
window.editLiteraryClass = showLiteraryClassModal;
window.deleteLiteraryClass = deleteLiteraryClass;
window.editPeriod = showPeriodModal;
window.deletePeriod = deletePeriod;

// ============================================================================
// MODAL UTILITIES
// ============================================================================

function createModal({ title, content, buttons }) {
    const buttonsHtml = buttons.map(btn => 
        `<button class="${btn.className}" data-action="${btn.text}">${btn.text}</button>`
    ).join('');
    
    return `
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttonsHtml}
                </div>
            </div>
        </div>
    `;
}

function showModal(modalHtml) {
    const container = document.getElementById('modalContainer');
    container.innerHTML = modalHtml;
    
    // Add event listeners to buttons
    const modal = container.querySelector('.modal-overlay');
    const buttons = modal.querySelectorAll('.modal-footer button');
    
    buttons.forEach(btn => {
        const action = btn.dataset.action;
        const buttonConfig = getCurrentModalButtons().find(b => b.text === action);
        if (buttonConfig && buttonConfig.onClick) {
            btn.addEventListener('click', buttonConfig.onClick);
        }
    });
    
    // Store button configs for later use
    modal._buttonConfigs = getCurrentModalButtons();
}

function getCurrentModalButtons() {
    return window._currentModalButtons || [];
}

function closeModal() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
}

// Store button configs temporarily
const originalCreateModal = createModal;
createModal = function(config) {
    window._currentModalButtons = config.buttons;
    return originalCreateModal(config);
};

