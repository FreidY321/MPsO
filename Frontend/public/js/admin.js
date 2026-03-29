// Admin Dashboard JavaScript

// State management
const state = {
    currentSection: 'classes',
    classes: [],
    users: [],
    books: [],
    authors: [],
    literaryClasses: [],
    periods: [],
    teachers: []
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
        // Fallback to alert if utils not available
        alert(message);
    }
}

// Handle logout
async function handleLogout() {
    if (confirm('Opravdu se chcete odhlásit?')) {
        if (window.auth && window.auth.logout) {
            await window.auth.logout();
        } else {
            // Fallback if auth module not available
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

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!window.auth || !window.auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is admin
    const user = window.auth.getUser();
    if (!user || user.role !== 'admin') {
        if (window.utils && window.utils.notification) {
            window.utils.notification.error('Nemáte oprávnění k přístupu do administrace');
        }
        setTimeout(() => {
            if (user && user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else if (user && user.role === 'student') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'login.html';
            }
        }, 2000);
        return;
    }

    // Setup navigation
    setupNavigation();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Load initial section
    await loadSection('classes');
});

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
        case 'users':
            await loadUsers();
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
        // Load classes
        const classesResponse = await apiRequest('/classes');
        state.classes = classesResponse.data || [];
        
        // Load teachers for dropdown
        const usersResponse = await apiRequest('/users');
        state.teachers = (usersResponse.data || []).filter(u => u.role === 'teacher');
        
        // Render classes table
        renderClassesTable();
        
        // Setup event listeners
        document.getElementById('addClassBtn').addEventListener('click', () => showClassModal());
        
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
                <td colspan="7" class="table-empty">
                    <p>Zatím nejsou vytvořeny žádné třídy</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.classes.map(cls => {
        const teacher = state.teachers.find(t => t.id === cls.cj_teacher);
        const teacherName = teacher ? `${teacher.name} ${teacher.surname}` : '-';
        const deadline = cls.deadline ? new Date(cls.deadline).toLocaleDateString('cs-CZ') : '-';
        
        return `
            <tr>
                <td><strong>${escapeHtml(cls.name)}</strong></td>
                <td>${cls.year_ended}</td>
                <td>${deadline}</td>
                <td>${escapeHtml(teacherName)}</td>
                <td>${cls.student_count || 0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-view" onclick="viewClassStudents(${cls.id})">
                            Žáci
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="downloadClassXlsx(${cls.id})">
                            XLSX
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="editClass(${cls.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteClass(${cls.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showClassModal(classId = null) {
    const cls = classId ? state.classes.find(c => c.id === classId) : null;
    const isEdit = !!cls;
    
    const teacherOptions = state.teachers.map(t => 
        `<option value="${t.id}" ${cls && cls.cj_teacher === t.id ? 'selected' : ''}>
            ${escapeHtml(t.name)} ${escapeHtml(t.surname)}
        </option>`
    ).join('');
    
    const deadlineValue = cls && cls.deadline 
        ? new Date(cls.deadline).toISOString().slice(0, 16) 
        : '';
    
    const modal = createModal({
        title: isEdit ? 'Upravit třídu' : 'Přidat třídu',
        content: `
            <form id="classForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="className">Název třídy *</label>
                        <input type="text" id="className" name="name" 
                               value="${cls ? escapeHtml(cls.name) : ''}" 
                               placeholder="např. I4C" required>
                    </div>
                    <div class="form-group">
                        <label for="classYear">Rok maturity *</label>
                        <input type="number" id="classYear" name="year_ended" 
                               value="${cls ? cls.year_ended : new Date().getFullYear() + 1}" 
                               min="2020" max="2100" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="classDeadline">Deadline</label>
                        <input type="datetime-local" id="classDeadline" name="deadline" 
                               value="${deadlineValue}">
                    </div>
                    <div class="form-group">
                        <label for="classTeacher">Učitel češtiny</label>
                        <select id="classTeacher" name="cj_teacher">
                            <option value="">Nepřiřazen</option>
                            ${teacherOptions}
                        </select>
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
                onClick: () => saveClass(classId)
            }
        ]
    });
    
    showModal(modal);
}

async function saveClass(classId) {
    const form = document.getElementById('classForm');
    const formData = new FormData(form);
    
    const teacherId = formData.get('cj_teacher');
    const newData = {
        name: formData.get('name'),
        year_ended: parseInt(formData.get('year_ended')),
        deadline: formData.get('deadline') || null,
        cj_teacher: (teacherId && teacherId !== '') ? parseInt(teacherId) : null
    };
    
    // Validation
    if (!newData.name || !newData.year_ended) {
        showNotification('Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (classId) {
        const originalClass = state.classes.find(c => c.id === classId);
        data = {};
        
        // Compare each field and include only changed ones
        if (newData.name !== originalClass.name) {
            data.name = newData.name;
        }
        if (newData.year_ended !== originalClass.year_ended) {
            data.year_ended = newData.year_ended;
        }
        if ((newData.deadline || null) !== (originalClass.deadline || null)) {
            data.deadline = newData.deadline;
        }
        if ((newData.cj_teacher || null) !== (originalClass.cj_teacher || null)) {
            data.cj_teacher = newData.cj_teacher;
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
        if (classId) {
            await apiRequest(`/classes/${classId}`, 'PUT', data);
            showNotification('Třída byla úspěšně aktualizována', 'success');
        } else {
            await apiRequest('/classes', 'POST', newData);
            showNotification('Třída byla úspěšně vytvořena', 'success');
        }
        
        closeModal();
        await loadClasses();
        
    } catch (error) {
        showNotification('Chyba při ukládání třídy: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function viewClassStudents(classId) {
    showLoading();
    
    try {
        const response = await apiRequest(`/classes/${classId}`);
        const cls = response.data;
        const students = cls.students || [];
        
        const studentsHtml = students.length > 0 
            ? students.map(s => `
                <div class="result-item">
                    <strong>${escapeHtml(s.name)} ${escapeHtml(s.surname)}</strong>
                    <div>${escapeHtml(s.email)}</div>
                </div>
            `).join('')
            : '<p style="text-align: center; color: #999;">Ve třídě nejsou žádní žáci</p>';
        
        const modal = createModal({
            title: `Žáci třídy ${escapeHtml(cls.name)}`,
            content: `
                <div class="results-container">
                    ${studentsHtml}
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
        showNotification('Chyba při načítání žáků: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteClass(classId) {
    const cls = state.classes.find(c => c.id === classId);
    if (!cls) return;
    
    const modal = createModal({
        title: 'Smazat třídu',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat třídu <strong>${escapeHtml(cls.name)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Tato akce je nevratná. Žáci ve třídě nebudou smazáni, ale ztratí přiřazení ke třídě.
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
                        await apiRequest(`/classes/${classId}`, 'DELETE');
                        showNotification('Třída byla úspěšně smazána', 'success');
                        closeModal();
                        await loadClasses();
                    } catch (error) {
                        showNotification('Chyba při mazání třídy: ' + error.message, 'error');
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
window.editClass = showClassModal;
window.viewClassStudents = viewClassStudents;
window.deleteClass = deleteClass;


// ============================================================================
// USERS MANAGEMENT
// ============================================================================

async function loadUsers() {
    showLoading();
    
    try {
        // Load users
        const usersResponse = await apiRequest('/users');
        state.users = usersResponse.data || [];
        
        // Load classes for filters and dropdowns
        if (state.classes.length === 0) {
            const classesResponse = await apiRequest('/classes');
            state.classes = classesResponse.data || [];
        }
        
        // Populate class filter
        populateClassFilter();
        
        // Render users table
        renderUsersTable();
        
        // Setup event listeners
        document.getElementById('addUserBtn').addEventListener('click', () => showUserModal());
        document.getElementById('bulkRegisterBtn').addEventListener('click', () => showBulkRegisterModal());
        document.getElementById('userRoleFilter').addEventListener('change', renderUsersTable);
        document.getElementById('userClassFilter').addEventListener('change', renderUsersTable);
        
    } catch (error) {
        showNotification('Chyba při načítání uživatelů: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function populateClassFilter() {
    const select = document.getElementById('userClassFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Všechny třídy</option>' +
        state.classes.map(c => 
            `<option value="${c.id}">${escapeHtml(c.name)}</option>`
        ).join('');
    
    if (currentValue) {
        select.value = currentValue;
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const roleFilter = document.getElementById('userRoleFilter').value;
    const classFilter = document.getElementById('userClassFilter').value;
    
    // Filter users
    let filteredUsers = state.users;
    
    if (roleFilter) {
        filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
    }
    
    if (classFilter) {
        filteredUsers = filteredUsers.filter(u => u.class_id === parseInt(classFilter));
    }
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    <p>Nebyli nalezeni žádní uživatelé</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => {
        const cls = state.classes.find(c => c.id === user.class_id);
        const className = cls ? cls.name : '-';
        const fullName = `${user.degree || ''} ${user.name} ${user.surname}`.trim();
        
        const roleBadge = {
            'student': '<span class="badge badge-student">Žák</span>',
            'teacher': '<span class="badge badge-teacher">Učitel</span>',
            'admin': '<span class="badge badge-admin">Admin</span>'
        }[user.role] || user.role;
        
        return `
            <tr>
                <td><strong>${escapeHtml(fullName)}</strong></td>
                <td>${escapeHtml(user.email)}</td>
                <td>${roleBadge}</td>
                <td>${escapeHtml(className)}</td>
                <td>
                    <div class="table-actions">
                        ${user.role === 'student' ? `
                            <button class="btn btn-sm btn-reset" onclick="resetUserPassword(${user.id})">
                                Reset hesla
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-edit" onclick="editUser(${user.id})">
                            Upravit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteUser(${user.id})">
                            Smazat
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showUserModal(userId = null) {
    const user = userId ? state.users.find(u => u.id === userId) : null;
    const isEdit = !!user;
    
    const classOptions = state.classes.map(c => 
        `<option value="${c.id}" ${user && user.class_id === c.id ? 'selected' : ''}>
            ${escapeHtml(c.name)}
        </option>`
    ).join('');
    
    const modal = createModal({
        title: isEdit ? 'Upravit uživatele' : 'Přidat uživatele',
        content: `
            <form id="userForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="userRole">Role *</label>
                        <select id="userRole" name="role" required ${isEdit ? 'readonly style="pointer-events: none; background-color: #f5f5f5;"' : ''}>
                            <option value="student" ${user && user.role === 'student' ? 'selected' : ''}>Žák</option>
                            <option value="teacher" ${user && user.role === 'teacher' ? 'selected' : ''}>Učitel</option>
                            <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Administrátor</option>
                        </select>
                        ${isEdit ? '<p class="form-help">Roli nelze změnit po vytvoření</p>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="userDegree">Titul</label>
                        <input type="text" id="userDegree" name="degree" 
                               value="${user && user.degree ? escapeHtml(user.degree) : ''}" 
                               placeholder="např. Mgr.">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="userName">Jméno *</label>
                        <input type="text" id="userName" name="name" 
                               value="${user ? escapeHtml(user.name) : ''}" 
                               placeholder="Jan" required>
                    </div>
                    <div class="form-group">
                        <label for="userSurname">Příjmení *</label>
                        <input type="text" id="userSurname" name="surname" 
                               value="${user ? escapeHtml(user.surname) : ''}" 
                               placeholder="Novák" required>
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label for="userEmail">Email *</label>
                        <input type="email" id="userEmail" name="email" 
                               value="${user ? escapeHtml(user.email) : ''}" 
                               placeholder="jan.novak@example.com" required>
                    </div>
                </div>
                <div class="form-row single" id="classFieldRow">
                    <div class="form-group">
                        <label for="userClass">Třída</label>
                        <select id="userClass" name="class_id">
                            <option value="null">Nepřiřazen</option>
                            ${classOptions}
                        </select>
                    </div>
                </div>
                ${!isEdit ? `
                    <div class="form-row single">
                        <div class="form-group">
                            <label for="userPassword">Heslo </label>
                            <input type="password" id="userPassword" name="password" 
                                   placeholder="Minimálně 8 znaků">
                            <p class="form-help">Pokud nevyplníte, uživatel se přihlásí pouze přes Google</p>
                        </div>
                    </div>
                ` : ''}
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
                onClick: () => saveUser(userId)
            }
        ]
    });
    
    showModal(modal);
    
    // Toggle class field based on role
    if (!isEdit) {
        document.getElementById('userRole').addEventListener('change', (e) => {
            const classRow = document.getElementById('classFieldRow');
            classRow.style.display = e.target.value === 'student' ? 'grid' : 'none';
        });
    }
}

async function saveUser(userId) {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);
    
    const newData = {
        role: formData.get('role'),
        degree: formData.get('degree') || null,
        name: formData.get('name'),
        surname: formData.get('surname'),
        email: formData.get('email'),
        class_id: formData.get('class_id') ? parseInt(formData.get('class_id')) : null
    };
    
    if (!userId) {
        newData.password = formData.get('password').trim() || null;
    }
    
    // Validation
    if (!newData.name || !newData.surname || !newData.email) {
        showNotification('Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    if (!userId && (newData.password && newData.password.length < 8)) {
        showNotification('Heslo musí mít minimálně 8 znaků', 'error');
        return;
    }
    
    // Confirm password creation if no password provided for new user
    if (!userId && !newData.password) {
        const confirmMessage = `Vytvořit uživatele bez hesla? Uživatel bude moci přihlásit pouze přes Google účet.\n\nEmail: ${newData.email}`;
        if (!confirm(confirmMessage)) {
            return;
        }
    }
    
    // If editing, send only changed fields
    let data = newData;
    if (userId) {
        const originalUser = state.users.find(u => u.id === userId);
        data = {};
        
        // Compare each field and include only changed ones
        if (newData.role !== originalUser.role) {
            data.role = newData.role;
        }
        if ((newData.degree || null) !== (originalUser.degree || null)) {
            data.degree = newData.degree;
        }
        if (newData.name !== originalUser.name) {
            data.name = newData.name;
        }
        if (newData.surname !== originalUser.surname) {
            data.surname = newData.surname;
        }
        if (newData.email !== originalUser.email) {
            data.email = newData.email;
        }
        if ((newData.class_id || null) !== (originalUser.class_id || null)) {
            data.class_id = newData.class_id;
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
        if (userId) {
            await apiRequest(`/users/${userId}`, 'PUT', data);
            showNotification('Uživatel byl úspěšně aktualizován', 'success');
        } else {
            await apiRequest('/users', 'POST', newData);
            showNotification('Uživatel byl úspěšně vytvořen', 'success');
        }
        
        closeModal();
        await loadUsers();
        
    } catch (error) {
        showNotification('Chyba při ukládání uživatele: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function showBulkRegisterModal() {    
    const modal = createModal({
        title: 'Hromadná registrace žáků',
        content: `
            <form id="bulkRegisterForm">
                <div class="form-row single">
                    <div class="form-group">
                        <label>CSV soubor nebo JSON data</label>
                        <div class="file-upload" id="fileUploadArea">
                            <input type="file" id="csvFile" accept=".csv,.json">
                            <div class="file-upload-icon">📄</div>
                            <div class="file-upload-text">Klikněte pro výběr souboru</div>
                            <div class="file-upload-hint">CSV nebo JSON formát</div>
                        </div>
                        <div id="fileSelected" class="file-selected" style="display: none;">
                            <span class="file-name"></span>
                            <button type="button" class="file-remove" onclick="clearFile()">×</button>
                        </div>
                    </div>
                </div>
                <div class="form-row single">
                    <div class="form-group">
                        <label for="bulkData">Nebo vložte JSON data</label>
                        <textarea id="bulkData" name="data" rows="8" 
                                  placeholder='[{"name": "Jan", "surname": "Novák", "email": "jan.novak@example.com"}]'></textarea>
                        <p class="form-help">Formát: pole objektů s name, surname, email</p>
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
                text: 'Registrovat',
                className: 'btn btn-primary',
                onClick: () => processBulkRegister()
            }
        ]
    });
    
    showModal(modal);
    
    // File upload handling with drag and drop
    const fileInput = document.getElementById('csvFile');
    const uploadArea = document.getElementById('fileUploadArea');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            const file = files[0];
            if (file) {
                document.getElementById('fileSelected').style.display = 'flex';
                document.querySelector('.file-name').textContent = file.name;
            }
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileSelected').style.display = 'flex';
            document.querySelector('.file-name').textContent = file.name;
        }
    });
}

window.clearFile = function() {
    document.getElementById('csvFile').value = '';
    document.getElementById('fileSelected').style.display = 'none';
};

async function processBulkRegister() {   
    const fileInput = document.getElementById('csvFile');
    const dataTextarea = document.getElementById('bulkData');
    
    let students = [];
    
    // Parse from file or textarea
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        let text;
        if (file.name.toLowerCase().endsWith('.csv')) {
            text = await readFileWithEncoding(file, 'windows-1250');
            students = parseCSV(text);
        } else if (file.name.toLowerCase().endsWith('.json')) {
            text = await file.text();
            try {
                students = JSON.parse(text);
            } catch (e) {
                showNotification('Neplatný JSON formát', 'error');
                return;
            }
        }
    } else if (dataTextarea.value.trim()) {
        try {
            students = JSON.parse(dataTextarea.value);
        } catch (e) {
            showNotification('Neplatný JSON formát', 'error');
            return;
        }
    } else {
        showNotification('Vložte data nebo vyberte soubor', 'error');
        return;
    }
    
    if (!Array.isArray(students) || students.length === 0) {
        showNotification('Žádná data k registraci', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await apiRequest('/users/bulk', 'POST', {
            students: students
        });
        
        // Show results
        showBulkRegisterResults(response.credentials);
        
        await loadUsers();
        
    } catch (error) {
        showNotification('Chyba při hromadné registraci: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function readFileWithEncoding(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const decoder = new TextDecoder(encoding, { fatal: true });
            try {
                resolve(decoder.decode(arrayBuffer));
            } catch (err) {
                // Fallback to UTF-8 if decoding fails
                resolve(new TextDecoder('utf-8').decode(arrayBuffer));
            }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

function parseCSV(text) {
    const classMap = state.classes.reduce((map, c) => {
        map[c.name] = c.id;
        return map;
    }, {});
    const lines = text.trim().split('\n');
    const students = [];
    if (lines.length === 0) return students;
    
    // Parse header to find column indices
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const colIndices = {
        name: headers.findIndex(h => h.includes('name') || h.includes('jmeno')),
        surname: headers.findIndex(h => h.includes('surname') || h.includes('last') || h.includes('prijmeni')),
        email: headers.findIndex(h => h.includes('email')),
        class: headers.findIndex(h => h.includes('class') || h.includes('trida')),
        password: headers.findIndex(h => h.includes('password') || h.includes('heslo'))
    };
    
    // Skip header row
    const startIndex = 1;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted CSV fields
        const parts = line.split(",");
        const student = {
            name: parts[colIndices.name] || null,
            surname: parts[colIndices.surname] || null,
            email: parts[colIndices.email] || null,
            class_id: classMap[parts[colIndices.class]] || null,
            password: parts[colIndices.password] || null
        };
        
        // Only add if we have at least name and email
        if (student.name && student.surname &&  student.email) {
            students.push(student);
        }
    }

    return students;
}

function showBulkRegisterResults(results) {
    const resultsHtml = results.map(r => `
        <div class="result-item">
            <strong>${escapeHtml(r.email)}</strong>
            <div>Heslo: <code>${escapeHtml(r.password)}</code></div>
        </div>
    `).join('');
    
    const modal = createModal({
        title: 'Výsledky hromadné registrace',
        content: `
            <p style="margin-bottom: 16px;">
                Úspěšně vytvořeno ${results.length} účtů. Uložte si přihlašovací údaje:
            </p>
            <div class="results-container">
                ${resultsHtml}
            </div>
            <p style="margin-top: 16px; font-size: 13px; color: #666;">
                Tyto údaje se již nezobrazí. Předejte je žákům.
            </p>
        `,
        buttons: [
            {
                text: 'Zavřít',
                className: 'btn btn-primary',
                onClick: () => closeModal()
            }
        ]
    });
    
    showModal(modal);
}

async function resetUserPassword(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const modal = createModal({
        title: 'Reset hesla',
        content: `
            <div class="confirm-message">
                Opravdu chcete resetovat heslo pro uživatele 
                <strong>${escapeHtml(user.name)} ${escapeHtml(user.surname)}</strong>?
            </div>
            <p style="margin-top: 12px; font-size: 14px; color: #666;">
                Bude vygenerováno nové dočasné heslo.
            </p>
        `,
        buttons: [
            {
                text: 'Zrušit',
                className: 'btn btn-secondary',
                onClick: () => closeModal()
            },
            {
                text: 'Resetovat',
                className: 'btn btn-reset',
                onClick: async () => {
                    showLoading();
                    try {
                        const response = await apiRequest(`/users/${userId}/reset-password`, 'POST', {});
                        
                        // Show new password
                        const passwordModal = createModal({
                            title: 'Nové heslo',
                            content: `
                                <p style="margin-bottom: 16px;">
                                    Heslo bylo úspěšně resetováno. Nové heslo:
                                </p>
                                <div class="result-item">
                                    <strong>Email:</strong> ${escapeHtml(user.email)}<br>
                                    <strong>Heslo:</strong> <code style="font-size: 16px;">${escapeHtml(response.newPassword)}</code>
                                </div>
                                <p style="margin-top: 16px; font-size: 13px; color: #666;">
                                    Toto heslo se již nezobrazí. Předejte ho žákovi.
                                </p>
                            `,
                            buttons: [
                                {
                                    text: 'Zavřít',
                                    className: 'btn btn-primary',
                                    onClick: () => closeModal()
                                }
                            ]
                        });
                        
                        showModal(passwordModal);
                        
                    } catch (error) {
                        showNotification('Chyba při resetování hesla: ' + error.message, 'error');
                    } finally {
                        hideLoading();
                    }
                }
            }
        ]
    });
    
    showModal(modal);
}

async function deleteUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const modal = createModal({
        title: 'Smazat uživatele',
        content: `
            <div class="confirm-message">
                Opravdu chcete smazat uživatele 
                <strong>${escapeHtml(user.name)} ${escapeHtml(user.surname)}</strong>?
            </div>
            <div class="confirm-warning">
                Upozornění: Tato akce je nevratná. Všechna data uživatele budou smazána.
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
                        await apiRequest(`/users/${userId}`, 'DELETE');
                        showNotification('Uživatel byl úspěšně smazán', 'success');
                        closeModal();
                        await loadUsers();
                    } catch (error) {
                        showNotification('Chyba při mazání uživatele: ' + error.message, 'error');
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
window.editUser = showUserModal;
window.resetUserPassword = resetUserPassword;
window.deleteUser = deleteUser;


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
            const fullName = `${a.name} ${a.surname}`.toLowerCase();
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
        const fullName = [author.name, author.second_name, author.surname, author.second_surname]
            .filter(Boolean)
            .join(' ');
        
        return `
            <tr>
                <td>${escapeHtml(author.name)}${author.second_name ? ' ' + escapeHtml(author.second_name) : ''}</td>
                <td><strong>${escapeHtml(author.surname)}${author.second_surname ? ' ' + escapeHtml(author.second_surname) : ''}</strong></td>
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
                               value="${author ? escapeHtml(author.name) : ''}" 
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
                               value="${author ? escapeHtml(author.surname) : ''}" 
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
        name: formData.get('name'),
        second_name: formData.get('second_name') || null,
        surname: formData.get('surname'),
        second_surname: formData.get('second_surname') || null
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
        </tr>`
        }
    ).join('');
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
        if (newData.max_request !== originalLC.max_request) {
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
                        <label for="periodMinRequest">Minimální počet knih</label>
                        <input type="number" id="periodMinRequest" name="min_request" 
                               value="${period ? period.min_request : ''}" 
                               min="0" max="100" placeholder="volitelné">
                    </div>
                    <div class="form-group">
                        <label for="periodMaxRequest">Maximální počet knih</label>
                        <input type="number" id="periodMaxRequest" name="max_request" 
                               value="${period ? period.max_request : ''}" 
                               min="0" max="100" placeholder="volitelné">
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
    const name = formData.get('name');
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
// BOOKS MANAGEMENT
// ============================================================================

async function loadBooks() {
    showLoading();
    
    try {
        // Load books
        const booksResponse = await apiRequest('/books');
        state.books = booksResponse.data || [];
        
        // Load authors if not loaded
        if (state.authors.length === 0) {
            const authorsResponse = await apiRequest('/authors');
            state.authors = authorsResponse.data || [];
        }
        
        // Load literary classes if not loaded
        if (state.literaryClasses.length === 0) {
            const literaryResponse = await apiRequest('/literary-classes');
            state.literaryClasses = literaryResponse.data || [];
        }
        
        // Load periods if not loaded
        if (state.periods.length === 0) {
            const periodsResponse = await apiRequest('/periods');
            state.periods = periodsResponse.data || [];
        }
        
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
                    <p>Zatím nejsou přidány žádné knihy</p>
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
        const literaryClassName = literaryClass ? literaryClass.name : '-';
        
        const period = state.periods.find(p => p.id === book.period);
        const periodName = period ? period.name : '-';
        
        return `
            <tr>
                <td><strong>${escapeHtml(book.name)}</strong></td>
                <td>${escapeHtml(authorName)}</td>
                <td>${escapeHtml(literaryClassName)}</td>
                <td>${escapeHtml(periodName)}</td>
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
        const fullName = `${a.name} ${a.surname}`;
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
                               placeholder="např. R.U.R." required>
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
                            <option value="">Vyberte literární druh</option>
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
                               placeholder="https://example.com/book">
                        <p class="form-help">Odkaz na informace o knize</p>
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
        name: formData.get('name'),
        author_id: parseInt(formData.get('author_id')),
        translator_name: formData.get('translator_name') || '',
        literary_class: parseInt(formData.get('literary_class')),
        period: parseInt(formData.get('period')),
        url_book: formData.get('url_book') || ''
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
        if ((newData.translator_name || '') !== (originalBook.translator_name || '')) {
            data.translator_name = newData.translator_name;
        }
        if (newData.literary_class !== originalBook.literary_class) {
            data.literary_class = newData.literary_class;
        }
        if (newData.period !== originalBook.period) {
            data.period = newData.period;
        }
        if ((newData.url_book || '') !== (originalBook.url_book || '')) {
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
    // This is a workaround to pass button configs to event listeners
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

// Download class XLSX
async function downloadClassXlsx(classId) {
    showLoading();

    try {
        const blob = await window.api.downloadFile(`/reading-lists/class/${classId}/xlsx`);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `četba-${classId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('Seznam četby byl úspěšně stažen', 'success');

    } catch (error) {
        showNotification('Chyba při stahování seznamu četby: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}