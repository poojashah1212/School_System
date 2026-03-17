// Admin Dashboard JavaScript

// --- Configuration & Constants ---
const ACADEMIC_API_BASE = (() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'http://localhost:5001/api/academic'
        : 'https://smartschool-je18.onrender.com/api/academic';
})();

const ASSIGN_API_BASE = (() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'http://localhost:5001/api/assign'
        : 'https://smartschool-je18.onrender.com/api/assign';
})();

const GENERAL_API_BASE = (() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'http://localhost:5001/api'
        : 'https://smartschool-je18.onrender.com/api';
})();

let allClasses = [];
let allSubjects = [];
let allAssignments = [];
let allSubjectAssignments = [];
let allAcademicEvents = [];
let academicCalendar = null;

// --- Utility Functions ---
function naturalSort(a, b, key) {
    return a[key].localeCompare(b[key], undefined, { numeric: true, sensitivity: 'base' });
}

// --- Academic Management Functions ---
async function loadClasses() {
    const tableBody = document.getElementById('classes-table-body');
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            allClasses = result.data;
            renderClasses(allClasses);
        } else {
            showToast('Failed to load classes', 'error');
        }
    } catch (err) {
        console.error('Error loading classes:', err);
        showToast('Error connecting to server', 'error');
    }
}

function renderClasses(classes) {
    const tableBody = document.getElementById('classes-table-body');
    if (!tableBody) return;

    if (!classes || classes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-cell">No classes found</td></tr>';
        return;
    }

    tableBody.innerHTML = classes.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.grade}</td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" onclick="openEditClassModal('${c._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteClass('${c._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openEditClassModal(id) {
    const c = allClasses.find(item => item._id === id);
    if (!c) return;

    document.getElementById('edit-class-id').value = c._id;
    document.getElementById('edit-class-name').value = c.name;
    document.getElementById('edit-class-grade').value = c.grade;

    document.getElementById('edit-class-modal').classList.add('show');
}

function closeEditClassModal() {
    document.getElementById('edit-class-modal').classList.remove('show');
}

async function saveClassEdit() {
    const id = document.getElementById('edit-class-id').value;
    const token = localStorage.getItem('adminToken');
    const data = {
        name: document.getElementById('edit-class-name').value,
        grade: document.getElementById('edit-class-grade').value
    };

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showToast('Class updated successfully', 'success');
            closeEditClassModal();
            loadClasses();
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        console.error('Error updating class:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function deleteClass(id) {
    if (!confirm('Are you sure you want to delete this class?')) return;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            showToast('Class deleted', 'success');
            loadClasses();
        } else {
            showToast(result.message || 'Delete failed', 'error');
        }
    } catch (err) {
        console.error('Error deleting class:', err);
        showToast('Error connecting to server', 'error');
    }
}

// Subject Functions
async function loadSubjects() {
    const tableBody = document.getElementById('subjects-table-body');
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            allSubjects = result.data;
            populateClassFilter();
            renderSubjects(allSubjects);
        } else {
            showToast('Failed to load subjects', 'error');
        }
    } catch (err) {
        console.error('Error loading subjects:', err);
        showToast('Error connecting to server', 'error');
    }
}

function populateClassFilter() {
    const filter = document.getElementById('subject-class-filter');
    if (!filter) return;

    // Get unique classes from allSubjects and sort numerically (Grade 1, Grade 2...)
    const uniqueClasses = [...new Set(allSubjects.map(s => s.className))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const currentVal = filter.value;
    filter.innerHTML = '<option value="">All Classes</option>' +
        uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('');
    filter.value = currentVal;
}

function filterSubjectsByClass() {
    const filterVal = document.getElementById('subject-class-filter').value;
    if (!filterVal) {
        renderSubjects(allSubjects);
    } else {
        const filtered = allSubjects.filter(s => s.className === filterVal);
        renderSubjects(filtered);
    }
}

function openAddSubjectModal() {
    const classSelect = document.getElementById('add-subject-class-id');
    if (classSelect) {
        // Sort allClasses numerically by grade
        const sortedClasses = [...allClasses].sort((a, b) =>
            a.grade.localeCompare(b.grade, undefined, { numeric: true })
        );
        classSelect.innerHTML = sortedClasses.map(c =>
            `<option value="${c._id}">${c.name}</option>`
        ).join('');
    }

    // Clear fields
    document.getElementById('add-subject-name').value = '';
    document.getElementById('add-subject-code').value = '';
    document.getElementById('add-subject-credits').value = '3';

    document.getElementById('add-subject-modal').classList.add('show');
}

function closeAddSubjectModal() {
    document.getElementById('add-subject-modal').classList.remove('show');
}

async function saveAddSubject() {
    const classId = document.getElementById('add-subject-class-id').value;
    const token = localStorage.getItem('adminToken');
    const data = {
        name: document.getElementById('add-subject-name').value,
        code: document.getElementById('add-subject-code').value,
        credits: document.getElementById('add-subject-credits').value
    };

    if (!data.name || !data.code) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes/${classId}/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showToast('Subject added successfully', 'success');
            closeAddSubjectModal();
            loadSubjects();
        } else {
            showToast(result.message || 'Failed to add subject', 'error');
        }
    } catch (err) {
        console.error('Error adding subject:', err);
        showToast('Error connecting to server', 'error');
    }
}

function renderSubjects(subjects) {
    const tableBody = document.getElementById('subjects-table-body');
    if (!tableBody) return;

    if (!subjects || subjects.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No subjects found</td></tr>';
        return;
    }

    tableBody.innerHTML = subjects.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.code}</td>
            <td>${s.className} (${s.classGrade})</td>
            <td>${s.credits}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" onclick="openEditSubjectModal('${s.classId}', '${s._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteSubject('${s.classId}', '${s._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openEditSubjectModal(classId, subjectId) {
    const s = allSubjects.find(item => item._id === subjectId && item.classId === classId);
    if (!s) return;

    document.getElementById('edit-subject-class-id').value = classId;
    document.getElementById('edit-subject-id').value = subjectId;
    document.getElementById('edit-subject-name').value = s.name;
    document.getElementById('edit-subject-code').value = s.code;
    document.getElementById('edit-subject-credits').value = s.credits;

    document.getElementById('edit-subject-modal').classList.add('show');
}

function closeEditSubjectModal() {
    document.getElementById('edit-subject-modal').classList.remove('show');
}

async function saveSubjectEdit() {
    const classId = document.getElementById('edit-subject-class-id').value;
    const subjectId = document.getElementById('edit-subject-id').value;
    const token = localStorage.getItem('adminToken');
    const data = {
        name: document.getElementById('edit-subject-name').value,
        code: document.getElementById('edit-subject-code').value,
        credits: document.getElementById('edit-subject-credits').value
    };

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes/${classId}/subjects/${subjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showToast('Subject updated successfully', 'success');
            closeEditSubjectModal();
            loadSubjects();
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        console.error('Error updating subject:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function deleteSubject(classId, subjectId) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes/${classId}/subjects/${subjectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            showToast('Subject deleted', 'success');
            loadSubjects();
        } else {
            showToast(result.message || 'Delete failed', 'error');
        }
    } catch (err) {
        console.error('Error deleting subject:', err);
        showToast('Error connecting to server', 'error');
    }
}

// Global error handler
window.onerror = function (message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at line', lineno);
    return false;
};

// Check admin authentication
function checkAuth() {
    const adminToken = localStorage.getItem('adminToken');
    console.log('Admin token:', adminToken ? 'exists' : 'missing');
    if (!adminToken) {
        window.location.href = '/login';
        return false;
    }
    // Check if token is the old static token
    if (adminToken === 'admin-static-token') {
        console.log('Old static token detected, redirecting to login');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin dashboard initializing...');
    try {
        console.log('Admin token:', localStorage.getItem('adminToken') ? 'exists' : 'missing');
        console.log('Admin email:', localStorage.getItem('adminEmail'));

        if (!checkAuth()) {
            console.log('Auth check failed, redirecting to login');
            return;
        }
        console.log('Auth check passed, initializing dashboard');
        initializeDashboard();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading dashboard. Check console for details.');
    }
});

function initializeDashboard() {
    setupNavigation();

    // Show dashboard by default
    const dashboardPage = document.getElementById('page-dashboard');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
        dashboardPage.style.display = 'block';
    }

    loadDashboardStats();
    loadApplications();
    loadPendingCount();
    loadRecentApplications();
}

async function loadRecentApplications() {
    const tbody = document.getElementById('dashboard-recent-applications');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE}/admissions?limit=5`);
        const result = await response.json();

        if (result.success) {
            const recent = result.data.slice(0, 5);
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No recent applications</td></tr>';
                return;
            }

            tbody.innerHTML = recent.map(app => `
                <tr>
                    <td><strong>${app.studentName}</strong></td>
                    <td><span class="badge badge-primary">${app.grade || '-'}</span></td>
                    <td style="color:#64748b; font-size:0.85rem;">${formatDate(app.submissionDate)}</td>
                    <td>
                        <span class="badge badge-${app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'danger'}" style="font-size: 10px;">
                            ${app.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent applications:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="error-cell">Error loading data</td></tr>';
    }
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // Total Students
        const studentRes = await fetch(`${ADMIN_API_BASE}/student-list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const studentResult = await studentRes.json();
        if (studentResult.success) {
            document.getElementById('total-students').textContent = studentResult.data.length;
        }

        // Total Teachers
        const teacherRes = await fetch(`${ADMIN_API_BASE}/teachers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const teacherResult = await teacherRes.json();
        if (teacherResult.success) {
            // Find the stat card for teachers - looking at html, it doesn't have an ID
            const teacherValueEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
            if (teacherValueEl) {
                teacherValueEl.textContent = teacherResult.data.length;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    const pageTitleText = document.getElementById('page-title-text');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the parent nav-group if exists and make it active
            const parentGroup = this.closest('.nav-group');
            if (parentGroup) {
                document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('active'));
                parentGroup.classList.add('active');
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const pageName = this.dataset.page;
            console.log('Navigating to page:', pageName);
            if (pageName) {
                // Hide all pages
                document.querySelectorAll('.page-section').forEach(page => {
                    page.classList.remove('active');
                    page.style.display = 'none';
                });
                // Show selected page
                const targetPage = document.getElementById('page-' + pageName);
                if (targetPage) {
                    targetPage.classList.add('active');
                    targetPage.style.display = 'block';
                    console.log('Page found and shown:', 'page-' + pageName);
                } else {
                    console.error('Page not found:', 'page-' + pageName);
                }
                pageTitleText.textContent = formatPageTitle(pageName);

                // Load applications if check-applications page
                if (pageName === 'check-applications') {
                    loadApplications();
                }
                // Load teacher applications if teacher-application page
                if (pageName === 'teacher-application') {
                    loadTeacherApplications();
                }
                // Load registered teachers if view-teachers page
                if (pageName === 'view-teachers') {
                    loadTeachers();
                }
                // Load students if view-students page
                if (pageName === 'view-students') {
                    loadStudents();
                }
                // Load classes if manage-classes page
                if (pageName === 'manage-classes') {
                    loadClasses();
                }
                // Load subjects and classes if manage-subjects page
                if (pageName === 'manage-subjects') {
                    loadClasses();
                    loadSubjects();
                }
                // Load class assignments if assign-class page
                if (pageName === 'assign-class') {
                    loadAssignments();
                }
                // Load subject assignments if assign-subject page
                if (pageName === 'assign-subject') {
                    loadSubjectAssignments();
                }
                // Load academic calendar if academic-year page
                if (pageName === 'academic-year') {
                    loadAcademicCalendar();
                }
                // Initialize timetable if timetable page
                if (pageName === 'timetable') {
                    initializeTimetablePage();
                }
                // Initialize fees if define-fees page
                // Load payments if update-payments page
                if (pageName === 'update-payments') {
                    loadAllPayments();
                }

                if (pageName === 'define-fees') {
                    initializeFeesPage();
                }
            }
        });
    });
}

function formatPageTitle(pageName) {
    return pageName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

function toggleNavGroup(element) {
    const group = element.parentElement;
    group.classList.toggle('active');

    const icon = element.querySelector('.fa-chevron-down');
    if (icon) {
        icon.classList.toggle('fa-rotate-180');
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
}

function showNotificationPanel() {
    alert('Notification panel would open here');
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    window.location.href = '/login';
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const profile = document.querySelector('.navbar-profile');
    const dropdown = document.getElementById('profile-dropdown');

    if (profile && !profile.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Quick actions navigation
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        const page = this.dataset.page;
        const pageTitleText = document.getElementById('page-title-text');
        pageTitleText.textContent = formatPageTitle(page);
    });
});

// Application Management Functions
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/applications'
    : 'https://smartschool-je18.onrender.com/api/applications';

const ADMIN_API_BASE = (() => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    return hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'http://localhost:5001/api/admin'
        : 'https://smartschool-je18.onrender.com/api/admin';
})();

console.log('Admin API Base URL:', ADMIN_API_BASE);

let allApplications = [];
let allTeacherApplications = [];

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadApplications() {
    const tbody = document.getElementById('applications-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading applications...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_BASE}/admissions?limit=50`);
        const result = await response.json();

        if (result.success) {
            allApplications = result.data;
            renderApplications(allApplications);
            updateStats(result.data);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="error-cell">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Failed to load applications</span>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error-cell">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error loading applications. Please try again.</span>
                </td>
            </tr>
        `;
    }
}

async function loadTeacherApplications() {
    try {
        const response = await fetch(`${API_BASE}/teachers?limit=50`);
        const result = await response.json();

        if (result.success) {
            allTeacherApplications = result.data;
            renderTeacherApplications(allTeacherApplications);
            updateTeacherStats(allTeacherApplications);
        }
    } catch (error) {
        console.error('Error loading teacher applications:', error);
    }
}

function renderTeacherApplications(applications) {
    const tbody = document.getElementById('teacher-applications-table-body');

    if (!tbody) return;

    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <i class="fas fa-inbox"></i>
                    <span>No teacher applications found</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td><strong>${app.applicationId || app._id}</strong></td>
            <td>${app.fullName || app.name}</td>
            <td>${app.position || 'Teacher'}</td>
            <td>${app.email}</td>
            <td>${app.phone || '-'}</td>
            <td>${formatDate(app.submissionDate || app.createdAt)}</td>
            <td>
                <span class="badge badge-${app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'danger'}">
                    ${app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewTeacherApplication('${app._id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="approveTeacherApplication('${app._id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="rejectTeacherApplication('${app._id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderApplications(applications) {
    const tbody = document.getElementById('applications-table-body');

    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <i class="fas fa-inbox"></i>
                    <span>No applications found</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td><strong>${app.applicationId}</strong></td>
            <td>${app.studentName}</td>
            <td>${app.grade || '-'}</td>
            <td>${app.parentName}</td>
            <td>${app.phone}</td>
            <td>${formatDate(app.submissionDate)}</td>
            <td>
                <span class="badge badge-${app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'danger'}">
                    ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewApplication('${app._id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="approveApplication('${app._id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-reject" onclick="rejectApplication('${app._id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function filterApplications() {
    const status = document.getElementById('application-status-filter').value;
    const searchTerm = document.getElementById('application-search').value.toLowerCase();

    let filtered = allApplications;

    if (status) {
        filtered = filtered.filter(app => app.status === status);
    }

    if (searchTerm) {
        filtered = filtered.filter(app =>
            app.studentName.toLowerCase().includes(searchTerm) ||
            app.parentName.toLowerCase().includes(searchTerm) ||
            app.applicationId.toLowerCase().includes(searchTerm) ||
            app.phone.includes(searchTerm)
        );
    }

    renderApplications(filtered);
}

function searchApplications() {
    filterApplications();
}

function updateStats(applications) {
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const rejectedCount = applications.filter(a => a.status === 'rejected').length;

    // Update dashboard stat
    const pendingStatValue = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (pendingStatValue) {
        pendingStatValue.textContent = pendingCount;
    }

    // Update check applications page stats
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-approved').textContent = approvedCount;
    document.getElementById('stat-rejected').textContent = rejectedCount;

    // Update sidebar badge
    updatePendingBadge(pendingCount);
}

function updatePendingBadge(count) {
    const badge = document.getElementById('pending-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function loadPendingCount() {
    try {
        const response = await fetch(`${API_BASE}/admissions?limit=100`);
        const result = await response.json();

        if (result.success) {
            const pendingCount = result.data.filter(a => a.status === 'pending').length;

            // Update dashboard
            const pendingStatValue = document.getElementById('pending-applications-count');
            if (pendingStatValue) {
                pendingStatValue.textContent = pendingCount;
            }

            // Update badge
            updatePendingBadge(pendingCount);
        }
    } catch (error) {
        console.error('Error loading pending count:', error);
    }
}

async function viewApplication(id) {
    const app = allApplications.find(a => a._id === id);
    if (!app) return;

    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalBody.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-user"></i> Student Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Application ID</label>
                    <span>${app.applicationId}</span>
                </div>
                <div class="detail-item">
                    <label>Student Name</label>
                    <span>${app.studentName}</span>
                </div>
                <div class="detail-item">
                    <label>Date of Birth</label>
                    <span>${app.dob ? new Date(app.dob).toLocaleDateString() : '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Gender</label>
                    <span>${app.gender ? app.gender.charAt(0).toUpperCase() + app.gender.slice(1) : '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Grade/Class</label>
                    <span>${app.grade || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Student Email</label>
                    <span>${app.studentEmail || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Student Phone</label>
                    <span>${app.studentPhone || '-'}</span>
                </div>
            </div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-user-friends"></i> Parent/Guardian Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Parent Name</label>
                    <span>${app.parentName}</span>
                </div>
                <div class="detail-item">
                    <label>Relationship</label>
                    <span>${app.relation ? app.relation.charAt(0).toUpperCase() + app.relation.slice(1) : '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Phone Number</label>
                    <span>${app.phone}</span>
                </div>
                <div class="detail-item">
                    <label>Email Address</label>
                    <span>${app.email}</span>
                </div>
                <div class="detail-item">
                    <label>Occupation</label>
                    <span>${app.occupation || '-'}</span>
                </div>
            </div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-home"></i> Address Information</h4>
            <div class="detail-grid">
                <div class="detail-item full-width">
                    <label>Street Address</label>
                    <span>${app.address || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>City</label>
                    <span>${app.city || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>State</label>
                    <span>${app.state || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>ZIP Code</label>
                    <span>${app.zip || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Country</label>
                    <span>${app.country || '-'}</span>
                </div>
            </div>
        </div>
    `;

    if (app.status === 'pending') {
        modalFooter.innerHTML = `
            <button class="btn-modal btn-reject" onclick="rejectApplication('${app._id}')">
                <i class="fas fa-times"></i> Reject
            </button>
            <button class="btn-modal btn-approve" onclick="approveApplication('${app._id}')">
                <i class="fas fa-check"></i> Approve
            </button>
        `;
    } else {
        modalFooter.innerHTML = `
            <span class="status-display">
                Status: <strong>${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</strong>
            </span>
            <button class="btn-modal btn-close" onclick="closeModal()">Close</button>
        `;
    }

    document.getElementById('application-modal').classList.add('show');
}

async function approveApplication(id) {
    if (!confirm('Are you sure you want to approve this application?')) return;

    try {
        const adminEmail = localStorage.getItem('adminEmail') || 'admin@gmail.com';
        const response = await fetch(`${API_BASE}/admissions/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'approved',
                adminId: adminEmail
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Application approved successfully! Student credentials have been sent.');
            closeModal();
            loadApplications();
            loadPendingCount(); // Refresh the badge count
        } else {
            alert('Failed to approve application: ' + result.message);
        }
    } catch (error) {
        console.error('Error approving application:', error);
        alert('Error approving application. Please try again.');
    }
}

async function rejectApplication(id) {
    const notes = prompt('Please provide a reason for rejection (optional):');

    try {
        const response = await fetch(`${API_BASE}/admissions/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', notes: notes || '' })
        });

        const result = await response.json();
        if (result.success) {
            alert('Application rejected successfully!');
            closeModal();
            loadApplications();
        } else {
            alert('Failed to reject application: ' + result.message);
        }
    } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Error rejecting application. Please try again.');
    }
}

function closeModal() {
    document.getElementById('application-modal').classList.remove('show');
}

function searchTeacherApplications() {
    const searchTerm = document.getElementById('teacher-application-search').value.toLowerCase();
    const status = document.getElementById('teacher-application-status-filter').value;

    let filtered = allTeacherApplications;

    if (status) {
        filtered = filtered.filter(app => app.status === status);
    }

    if (searchTerm) {
        filtered = filtered.filter(app =>
            (app.fullName || app.name || '').toLowerCase().includes(searchTerm) ||
            (app.email || '').toLowerCase().includes(searchTerm) ||
            (app.applicationId || '').toLowerCase().includes(searchTerm) ||
            (app.phone || '').includes(searchTerm)
        );
    }

    renderTeacherApplications(filtered);
}

function filterTeacherApplications() {
    filterApplications();
}

function updateTeacherStats(applications) {
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const rejectedCount = applications.filter(a => a.status === 'rejected').length;

    document.getElementById('teacher-pending-count').textContent = pendingCount;
    document.getElementById('teacher-approved-count').textContent = approvedCount;
    document.getElementById('teacher-rejected-count').textContent = rejectedCount;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Close modal when clicking outside
const appModal = document.getElementById('application-modal');
if (appModal) {
    appModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Teacher Application Functions
async function viewTeacherApplication(id) {
    const app = allTeacherApplications.find(a => a._id === id);
    if (!app) return;

    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalBody.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-user-tie"></i> Teacher Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Application ID</label>
                    <span>${app.applicationId || app._id}</span>
                </div>
                <div class="detail-item">
                    <label>Full Name</label>
                    <span>${app.fullName || app.name}</span>
                </div>
                <div class="detail-item">
                    <label>Email Address</label>
                    <span>${app.email}</span>
                </div>
                <div class="detail-item">
                    <label>Phone Number</label>
                    <span>${app.phone || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Position Applied</label>
                    <span>${app.position || 'Teacher'}</span>
                </div>
                <div class="detail-item">
                    <label>Experience</label>
                    <span>${app.experience || '-'}</span>
                </div>
            </div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-graduation-cap"></i> Education & Qualifications</h4>
            <div class="detail-grid">
                <div class="detail-item full-width">
                    <label>Highest Qualification</label>
                    <span>${app.qualification || '-'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Specialization</label>
                    <span>${app.specialization || '-'}</span>
                </div>
            </div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-file-alt"></i> Application Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Submission Date</label>
                    <span>${formatDate(app.submissionDate || app.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <span>${app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}</span>
                </div>
            </div>
        </div>
    `;

    if (app.status === 'pending') {
        modalFooter.innerHTML = `
            <button class="btn-modal btn-reject" onclick="rejectTeacherApplication('${app._id}')">
                <i class="fas fa-times"></i> Reject
            </button>
            <button class="btn-modal btn-approve" onclick="approveTeacherApplication('${app._id}')">
                <i class="fas fa-check"></i> Approve
            </button>
        `;
    } else {
        modalFooter.innerHTML = `
            <span class="status-display">
                Status: <strong>${app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}</strong>
            </span>
            <button class="btn-modal btn-close" onclick="closeModal()">Close</button>
        `;
    }

    document.getElementById('application-modal').classList.add('show');
}

async function approveTeacherApplication(id) {
    if (!confirm('Are you sure you want to approve this teacher application?')) return;

    try {
        const response = await fetch(`${API_BASE}/teachers/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });

        const result = await response.json();
        if (result.success) {
            alert('Teacher application approved successfully!');
            closeModal();
            loadTeacherApplications();
        } else {
            alert('Failed to approve application: ' + result.message);
        }
    } catch (error) {
        console.error('Error approving teacher application:', error);
        alert('Error approving application. Please try again.');
    }
}

async function rejectTeacherApplication(id) {
    const notes = prompt('Please provide a reason for rejection (optional):');

    try {
        const response = await fetch(`${API_BASE}/teachers/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', notes: notes || '' })
        });

        const result = await response.json();
        if (result.success) {
            alert('Teacher application rejected successfully!');
            closeModal();
            loadTeacherApplications();
        } else {
            alert('Failed to reject application: ' + result.message);
        }
    } catch (error) {
        console.error('Error rejecting teacher application:', error);
        alert('Error rejecting application. Please try again.');
    }
}

// ============================================================
// VIEW TEACHERS — CRUD Functions
// ============================================================

let allTeachers = [];

async function loadTeachers() {
    const tbody = document.getElementById('teachers-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading teachers...</span>
                </div>
            </td>
        </tr>`;

    try {
        const response = await fetch(`${ADMIN_API_BASE}/teachers`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            tbody.innerHTML = `<tr><td colspan="7" class="error-cell"><i class="fas fa-lock"></i> <span>Unauthorized — please log in again.</span></td></tr>`;
            return;
        }

        const result = await response.json();

        if (result.success) {
            allTeachers = result.data;
            renderTeachers(allTeachers);
            updateTeacherPageStats(allTeachers);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="error-cell"><i class="fas fa-exclamation-circle"></i> <span>${result.message || 'Failed to load teachers'}</span></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="error-cell"><i class="fas fa-exclamation-circle"></i> <span>Network error. Please try again.</span></td></tr>`;
    }
}

function getAvatarColor(name) {
    const colors = [
        '#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706',
        '#0891b2', '#16a34a', '#9333ea', '#e11d48', '#0284c7'
    ];
    let hash = 0;
    for (let c of (name || 'T')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function renderTeachers(teachers) {
    const tbody = document.getElementById('teachers-table-body');
    if (!tbody) return;

    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    <i class="fas fa-inbox"></i>
                    <span>No teachers found</span>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = teachers.map(t => {
        const initials = (t.fullName || 'T').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const avatarColor = getAvatarColor(t.fullName);
        const location = [t.city, t.state].filter(Boolean).join(', ') || '—';
        const joined = t.createdAt ? formatDate(t.createdAt) : '—';

        return `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:38px; height:38px; border-radius:50%; background:${avatarColor}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.85rem; flex-shrink:0;">
                        ${initials}
                    </div>
                    <div>
                        <div style="font-weight:600; color:#1e293b; font-size:0.9rem;">${t.fullName || '—'}</div>
                        <div style="font-size:0.75rem; color:#64748b;">ID: ${t.userId || t._id.slice(-6)}</div>
                    </div>
                </div>
            </td>
            <td><a href="mailto:${t.email}" style="color:#2563eb; text-decoration:none;">${t.email || '—'}</a></td>
            <td>${t.mobileNo || '—'}</td>
            <td><i class="fas fa-map-marker-alt" style="color:#6b7280; margin-right:4px; font-size:0.75rem;"></i>${location}</td>
            <td style="color:#6b7280; font-size:0.83rem;">${joined}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="openEditTeacherModal('${t._id}')" title="Edit Teacher" style="background:#eff6ff; color:#2563eb;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-reject" onclick="deleteTeacher('${t._id}', '${(t.fullName || '').replace(/'/g, "\\'")}'" title="Delete Teacher">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateTeacherPageStats(teachers) {
    const totalEl = document.getElementById('teachers-total-count');
    const activeEl = document.getElementById('teachers-active-count');
    const subjectsEl = document.getElementById('teachers-subjects-count');

    if (totalEl) totalEl.textContent = teachers.length;
    if (activeEl) activeEl.textContent = teachers.length; // All registered = active

    // Also update main dashboard stat card
    const dashTeachersEl = document.getElementById('total-teachers-stat');
    if (dashTeachersEl) dashTeachersEl.textContent = teachers.length;
}


function searchTeachers() {
    filterTeachers();
}

function filterTeachers() {
    const search = (document.getElementById('teachers-search')?.value || '').toLowerCase();
    let filtered = allTeachers;

    if (search) {
        filtered = filtered.filter(t =>
            (t.fullName || '').toLowerCase().includes(search) ||
            (t.email || '').toLowerCase().includes(search) ||
            (t.city || '').toLowerCase().includes(search) ||
            (t.mobileNo || '').includes(search)
        );
    }

    renderTeachers(filtered);
}

function openEditTeacherModal(id) {
    const teacher = allTeachers.find(t => t._id === id);
    if (!teacher) return;

    document.getElementById('edit-teacher-id').value = teacher._id;
    document.getElementById('edit-teacher-fullName').value = teacher.fullName || '';
    document.getElementById('edit-teacher-email').value = teacher.email || '';
    document.getElementById('edit-teacher-mobileNo').value = teacher.mobileNo || '';
    document.getElementById('edit-teacher-city').value = teacher.city || '';
    document.getElementById('edit-teacher-state').value = teacher.state || '';

    document.getElementById('edit-teacher-modal').classList.add('show');
}

function closeEditTeacherModal() {
    document.getElementById('edit-teacher-modal').classList.remove('show');
}

async function saveTeacherEdit() {
    const id = document.getElementById('edit-teacher-id').value;
    const body = {
        fullName: document.getElementById('edit-teacher-fullName').value.trim(),
        email: document.getElementById('edit-teacher-email').value.trim(),
        mobileNo: document.getElementById('edit-teacher-mobileNo').value.trim(),
        city: document.getElementById('edit-teacher-city').value.trim(),
        state: document.getElementById('edit-teacher-state').value.trim()
    };

    try {
        const response = await fetch(`${ADMIN_API_BASE}/teachers/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (result.success) {
            closeEditTeacherModal();
            loadTeachers();
            showToast('Teacher updated successfully!', 'success');
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Error updating teacher:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function deleteTeacher(id, name) {
    if (!confirm(`Are you sure you want to delete teacher "${name}"? This action cannot be undone.`)) return;

    try {
        const response = await fetch(`${ADMIN_API_BASE}/teachers/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        if (result.success) {
            loadTeachers();
            showToast('Teacher deleted successfully!', 'success');
        } else {
            showToast(result.message || 'Delete failed', 'error');
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Close edit modal on outside click
document.addEventListener('click', function (e) {
    const modal = document.getElementById('edit-teacher-modal');
    if (modal && e.target === modal) closeEditTeacherModal();
});

// Toast notification helper
function showToast(message, type = 'success') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:99999;
        padding:14px 22px; border-radius:10px; font-size:0.9rem; font-weight:600;
        color:#fff; display:flex; align-items:center; gap:10px;
        box-shadow:0 8px 24px rgba(0,0,0,0.2);
        background:${type === 'success' ? 'linear-gradient(135deg,#059669,#065f46)' : 'linear-gradient(135deg,#dc2626,#991b1b)'};
        animation: slideInToast 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;

    if (!document.getElementById('admin-toast-style')) {
        const style = document.createElement('style');
        style.id = 'admin-toast-style';
        style.textContent = `@keyframes slideInToast { from { transform: translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
// --- Student Management Functions ---

let allStudents = [];

async function loadStudents() {
    console.log('Fetching students...');
    const tableBody = document.getElementById('students-table-body');
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ADMIN_API_BASE}/student-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log('Students result:', result);

        if (result.success) {
            allStudents = result.data;
            renderStudents(allStudents);
            updateStudentStats(allStudents);
        } else {
            showToast('Failed to load students: ' + (result.message || 'Unknown error'), 'error');
            tableBody.innerHTML = '<tr><td colspan="7" class="error-cell">Failed to load students</td></tr>';
        }
    } catch (err) {
        console.error('Error loading students:', err);
        showToast('Error connecting to server', 'error');
        tableBody.innerHTML = '<tr><td colspan="7" class="error-cell">Error connecting to server</td></tr>';
    }
}

function renderStudents(students) {
    const tableBody = document.getElementById('students-table-body');

    if (!students || students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No students found</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>
                <div class="user-info">
                    <div class="user-avatar" style="background-color: #dbeafe; color: #3b82f6;">
                        ${student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-details">
                        <span class="user-name">${student.fullName}</span>
                        <span class="user-id">ID: ${student.userId || 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td>${student.email}</td>
            <td>${student.mobileNo || 'N/A'}</td>
            <td><span class="badge badge-primary">${student.class || 'N/A'}</span></td>
            <td>${student.city || 'N/A'}</td>
            <td>${new Date(student.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" title="Edit" onclick="openEditStudentModal('${student._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteStudent('${student._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStudentStats(students) {
    document.getElementById('students-total-count').textContent = students.length;

    // For now, assume active means they have a userId/id assigned or just count all as active
    document.getElementById('students-active-count').textContent = students.length;

    // Calculate Average Age
    const ages = students.filter(s => s.age).map(s => parseInt(s.age));
    const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;
    document.getElementById('students-avg-age').textContent = avgAge;
}

function searchStudents() {
    const searchTerm = document.getElementById('students-search').value.toLowerCase();
    const filtered = allStudents.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        (student.userId && student.userId.toLowerCase().includes(searchTerm)) ||
        (student.class && student.class.toLowerCase().includes(searchTerm))
    );
    renderStudents(filtered);
}

function openEditStudentModal(id) {
    const student = allStudents.find(s => s._id === id);
    if (!student) return;

    document.getElementById('edit-student-id').value = student._id;
    document.getElementById('edit-student-fullName').value = student.fullName || '';
    document.getElementById('edit-student-email').value = student.email || '';
    document.getElementById('edit-student-mobileNo').value = student.mobileNo || '';
    document.getElementById('edit-student-class').value = student.class || '';
    document.getElementById('edit-student-age').value = student.age || '';
    document.getElementById('edit-student-userId').value = student.userId || '';
    document.getElementById('edit-student-city').value = student.city || '';
    document.getElementById('edit-student-state').value = student.state || '';

    const modal = document.getElementById('edit-student-modal');
    modal.classList.add('show');
}

function closeEditStudentModal() {
    const modal = document.getElementById('edit-student-modal');
    modal.classList.remove('show');
}

async function saveStudentEdit() {
    const id = document.getElementById('edit-student-id').value;
    const updateData = {
        fullName: document.getElementById('edit-student-fullName').value,
        email: document.getElementById('edit-student-email').value,
        mobileNo: document.getElementById('edit-student-mobileNo').value,
        class: document.getElementById('edit-student-class').value,
        age: document.getElementById('edit-student-age').value,
        userId: document.getElementById('edit-student-userId').value,
        city: document.getElementById('edit-student-city').value,
        state: document.getElementById('edit-student-state').value
    };

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${ADMIN_API_BASE}/student-list/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();
        if (result.success) {
            showToast('Student updated successfully', 'success');
            closeEditStudentModal();
            loadStudents(); // Reload list
        } else {
            showToast('Update failed: ' + result.message, 'error');
        }
    } catch (err) {
        console.error('Error updating student:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${ADMIN_API_BASE}/student-list/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showToast('Student deleted successfully', 'success');
            loadStudents(); // Reload list
        } else {
            showToast('Delete failed: ' + result.message, 'error');
        }
    } catch (err) {
        console.error('Error deleting student:', err);
        showToast('Error connecting to server', 'error');
    }
}

// --- Class/Teacher Assignment Functions ---

async function loadAssignments() {
    const tableBody = document.getElementById('assignments-table-body');
    const token = localStorage.getItem('adminToken');

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading assignments...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            allAssignments = result.data.sort((a, b) => naturalSort(a, b, 'grade'));
            renderAssignments(allAssignments);
            updateAssignmentStats(allAssignments);
        } else {
            showToast('Failed to load assignments', 'error');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load assignments</td></tr>';
            }
        }
    } catch (err) {
        console.error('Error loading assignments:', err);
        showToast('Error connecting to server', 'error');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Error connecting to server</td></tr>';
        }
    }
}

function updateAssignmentStats(assignments) {
    const total = assignments.length;
    const assigned = assignments.filter(a => a.assignedTeacher).length;
    const pending = total - assigned;

    const totalEl = document.getElementById('assign-total-classes');
    const assignedEl = document.getElementById('assign-assigned-classes');
    const pendingEl = document.getElementById('assign-pending-classes');

    if (totalEl) totalEl.textContent = total;
    if (assignedEl) assignedEl.textContent = assigned;
    if (pendingEl) pendingEl.textContent = pending;
}

function filterAssignments() {
    const searchTerm = document.getElementById('assign-class-search').value.toLowerCase();
    const statusFilter = document.getElementById('assign-status-filter').value;

    let filtered = allAssignments;

    if (statusFilter === 'assigned') {
        filtered = filtered.filter(a => a.assignedTeacher);
    } else if (statusFilter === 'unassigned') {
        filtered = filtered.filter(a => !a.assignedTeacher);
    }

    if (searchTerm) {
        filtered = filtered.filter(a =>
            a.name.toLowerCase().includes(searchTerm) ||
            a.grade.toLowerCase().includes(searchTerm) ||
            (a.assignedTeacher && a.assignedTeacher.fullName.toLowerCase().includes(searchTerm))
        );
    }

    renderAssignments(filtered);
}

function renderAssignments(assignments) {
    const tableBody = document.getElementById('assignments-table-body');
    if (!tableBody) return;

    // Show all classes (used to be filtered to show only assigned ones)
    const displayClasses = assignments;

    if (!displayClasses || displayClasses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No classes found</td></tr>';
        return;
    }

    tableBody.innerHTML = displayClasses.map(a => {
        const teacher = a.assignedTeacher;
        const assignmentDate = a.assignmentDate ? new Date(a.assignmentDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : '—';

        return `
            <tr>
                <td><strong>${a.name}</strong></td>
                <td><span class="badge badge-primary">${a.grade}</span></td>
                <td>
                    ${teacher ? `
                        <div class="user-info">
                            <div class="user-details">
                                <span class="user-name">${teacher.fullName}</span>
                                <span class="user-id">ID: ${teacher.userId}</span>
                            </div>
                        </div>
                    ` : '<span style="color:#94a3b8; font-style:italic;">Not Assigned</span>'}
                </td>
                <td style="color:#64748b;">
                    ${teacher ? `<i class="far fa-calendar-alt" style="margin-right:6px;"></i>${assignmentDate}` : '—'}
                </td>
                <td>
                    <div class="action-buttons">
                        ${teacher ? `
                            <button class="btn-action btn-reject" onclick="handleUnassign('${a._id}')" title="Unassign Teacher">
                                <i class="fas fa-unlink"></i>
                            </button>
                        ` : `
                            <button class="btn-action btn-view" onclick="openAssignModal('${a._id}')" title="Assign Teacher">
                                <i class="fas fa-link"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function openAssignModal(classId) {
    document.getElementById('assign-teacher-class-id').value = classId;
    const select = document.getElementById('assign-teacher-select');
    const token = localStorage.getItem('adminToken');

    // Load teachers if select is empty (primitive cache)
    if (select.options.length <= 1) {
        try {
            const response = await fetch(`${ADMIN_API_BASE}/teachers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                select.innerHTML = '<option value="">Choose a teacher...</option>' +
                    result.data.map(t => `<option value="${t._id}">${t.fullName} (${t.userId})</option>`).join('');
            }
        } catch (err) {
            console.error('Error loading teachers:', err);
            showToast('Failed to load teachers', 'error');
        }
    }

    document.getElementById('assign-teacher-modal').classList.add('show');
}

function closeAssignTeacherModal() {
    document.getElementById('assign-teacher-modal').classList.remove('show');
}

async function saveAssignment() {
    const classId = document.getElementById('assign-teacher-class-id').value;
    const teacherId = document.getElementById('assign-teacher-select').value;
    const token = localStorage.getItem('adminToken');

    if (!teacherId) {
        showToast('Please select a teacher', 'warning');
        return;
    }

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ classId, teacherId })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Teacher assigned successfully', 'success');
            closeAssignTeacherModal();
            loadAssignments();
        } else {
            showToast(result.message || 'Assignment failed', 'error');
        }
    } catch (err) {
        console.error('Error assigning teacher:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function handleUnassign(classId) {
    if (!confirm('Are you sure you want to unassign this teacher?')) return;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/unassign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ classId })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Teacher unassigned', 'success');
            loadAssignments();
        } else {
            showToast(result.message || 'Unassign failed', 'error');
        }
    } catch (err) {
        console.error('Error unassigning teacher:', err);
        showToast('Error connecting to server', 'error');
    }
}

// --- Subject Assignment Functions ---

async function loadSubjectAssignments() {
    const tableBody = document.getElementById('subject-assignments-table-body');
    const token = localStorage.getItem('adminToken');

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading subject assignments...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            allSubjectAssignments = result.data.sort((a, b) => naturalSort(a, b, 'classGrade'));
            renderSubjectAssignments(allSubjectAssignments);
            updateSubjectAssignmentStats(allSubjectAssignments);
        } else {
            showToast('Failed to load subject assignments', 'error');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load subject assignments</td></tr>';
            }
        }
    } catch (err) {
        console.error('Error loading subject assignments:', err);
        showToast('Error connecting to server', 'error');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Error connecting to server</td></tr>';
        }
    }
}

function updateSubjectAssignmentStats(assignments) {
    const total = assignments.length;
    const assigned = assignments.filter(a => a.assignedTeacher).length;
    const pending = total - assigned;

    const totalEl = document.getElementById('assign-total-subjects');
    const assignedEl = document.getElementById('assign-assigned-subjects');
    const pendingEl = document.getElementById('assign-pending-subjects');

    if (totalEl) totalEl.textContent = total;
    if (assignedEl) assignedEl.textContent = assigned;
    if (pendingEl) pendingEl.textContent = pending;
}

function filterSubjectAssignments() {
    const searchTerm = document.getElementById('assign-subject-search').value.toLowerCase();
    const statusFilter = document.getElementById('assign-subject-status-filter').value;

    let filtered = allSubjectAssignments;

    if (statusFilter === 'assigned') {
        filtered = filtered.filter(a => a.assignedTeacher);
    } else if (statusFilter === 'unassigned') {
        filtered = filtered.filter(a => !a.assignedTeacher);
    }

    if (searchTerm) {
        filtered = filtered.filter(a =>
            a.name.toLowerCase().includes(searchTerm) ||
            a.code.toLowerCase().includes(searchTerm) ||
            a.className.toLowerCase().includes(searchTerm) ||
            a.classGrade.toLowerCase().includes(searchTerm) ||
            (a.assignedTeacher && a.assignedTeacher.fullName.toLowerCase().includes(searchTerm))
        );
    }

    renderSubjectAssignments(filtered);
}

function renderSubjectAssignments(assignments) {
    const tableBody = document.getElementById('subject-assignments-table-body');
    if (!tableBody) return;

    if (!assignments || assignments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No subject assignments found</td></tr>';
        return;
    }

    tableBody.innerHTML = assignments.map(a => {
        const teacher = a.assignedTeacher;
        const assignmentDate = a.assignmentDate ? new Date(a.assignmentDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : '—';

        return `
            <tr>
                <td>
                    <div>
                        <strong>${a.name}</strong>
                        <div style="font-size: 0.75rem; color: #64748b;">Code: ${a.code} | Credits: ${a.credits}</div>
                    </div>
                </td>
                <td><span class="badge badge-primary">${a.className} (${a.classGrade})</span></td>
                <td>
                    ${teacher ? `
                        <div class="user-info">
                            <div class="user-details">
                                <span class="user-name">${teacher.fullName}</span>
                                <span class="user-id">ID: ${teacher.userId}</span>
                            </div>
                        </div>
                    ` : '<span style="color:#94a3b8; font-style:italic;">Not Assigned</span>'}
                </td>
                <td style="color:#64748b;">
                    ${teacher ? `<i class="far fa-calendar-alt" style="margin-right:6px;"></i>${assignmentDate}` : '—'}
                </td>
                <td>
                    <div class="action-buttons">
                        ${teacher ? `
                            <button class="btn-action btn-reject" onclick="handleUnassignSubject('${a.classId}', '${a._id}')" title="Unassign Teacher">
                                <i class="fas fa-unlink"></i>
                            </button>
                        ` : `
                            <button class="btn-action btn-view" onclick="openAssignSubjectModal('${a.classId}', '${a._id}')" title="Assign Teacher">
                                <i class="fas fa-link"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function openAssignSubjectModal(classId, subjectId) {
    document.getElementById('assign-subject-class-id').value = classId;
    document.getElementById('assign-subject-id').value = subjectId;

    const subject = allSubjectAssignments.find(s => s._id === subjectId && s.classId === classId);
    if (subject) {
        document.getElementById('assign-subject-info').innerHTML = `
            <strong>Subject:</strong> ${subject.name} (${subject.code})<br>
            <strong>Class:</strong> ${subject.className} (${subject.classGrade})
        `;
    }

    const select = document.getElementById('assign-subject-teacher-select');
    const token = localStorage.getItem('adminToken');

    // Load teachers
    try {
        const response = await fetch(`${ADMIN_API_BASE}/teachers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            select.innerHTML = '<option value="">Choose a teacher...</option>' +
                result.data.map(t => `<option value="${t._id}">${t.fullName} (${t.userId})</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading teachers:', err);
        showToast('Failed to load teachers', 'error');
    }

    document.getElementById('assign-subject-teacher-modal').classList.add('show');
}

function closeAssignSubjectTeacherModal() {
    document.getElementById('assign-subject-teacher-modal').classList.remove('show');
}

async function saveSubjectAssignment() {
    const classId = document.getElementById('assign-subject-class-id').value;
    const subjectId = document.getElementById('assign-subject-id').value;
    const teacherId = document.getElementById('assign-subject-teacher-select').value;
    const token = localStorage.getItem('adminToken');

    if (!teacherId) {
        showToast('Please select a teacher', 'warning');
        return;
    }

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/assign-subject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ classId, subjectId, teacherId })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Teacher assigned to subject successfully', 'success');
            closeAssignSubjectTeacherModal();
            loadSubjectAssignments();
        } else {
            showToast(result.message || 'Assignment failed', 'error');
        }
    } catch (err) {
        console.error('Error assigning teacher to subject:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function handleUnassignSubject(classId, subjectId) {
    if (!confirm('Are you sure you want to unassign the teacher from this subject?')) return;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${ASSIGN_API_BASE}/unassign-subject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ classId, subjectId })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Teacher unassigned from subject', 'success');
            loadSubjectAssignments();
        } else {
            showToast(result.message || 'Unassign failed', 'error');
        }
    } catch (err) {
        console.error('Error unassigning teacher from subject:', err);
        showToast('Error connecting to server', 'error');
    }
}

// --- Academic Year Configuration ---

async function loadAcademicCalendar() {
    const calendarEl = document.getElementById('academic-calendar');
    if (!calendarEl) return;

    // Inject styles to hide time and day headers in list view to fulfill "not date wise" requirement
    if (!document.getElementById('fc-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'fc-custom-styles';
        style.textContent = `
            .fc-list-day { display: none !important; }
            .fc-list-event-time { display: none !important; }
            .fc-event-time { display: none !important; }
            .fc-list-event { border-bottom: 1px dashed var(--border-color) !important; }
            .fc-list-event:hover td { background-color: var(--light-bg) !important; }
        `;
        document.head.appendChild(style);
    }

    if (!academicCalendar) {
        academicCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'title',
                center: '',
                right: 'prev,next' // Added nav icons here, removed month button
            },
            themeSystem: 'standard',
            height: 'auto',
            displayEventTime: false,
            events: [],
            datesSet: function () {
                // When month changes (via prev/next), update the list
                renderMonthlyEventList();
            }
        });
        academicCalendar.render();
    }

    fetchCalendarEvents();
}

async function fetchCalendarEvents() {
    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${GENERAL_API_BASE}/academic-year/events`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            allAcademicEvents = result.data; // Store for dynamic list

            const events = result.data.map(e => {
                return {
                    id: e._id,
                    start: e.startDate,
                    end: e.endDate,
                    allDay: true,
                    display: 'background', // This highlights the entire box
                    backgroundColor: e.type === 'holiday' ? '#fca5a5' : '#93c5fd', // Darker soft red / blue
                    extendedProps: {
                        type: e.type,
                        title: e.title // Keep title in props for the side list
                    }
                };
            });

            academicCalendar.removeAllEvents();
            academicCalendar.addEventSource(events);

            // Update stats
            const totalHolidaysEl = document.getElementById('total-holidays');
            const totalEventsEl = document.getElementById('total-events');
            if (totalHolidaysEl) totalHolidaysEl.textContent = result.data.filter(e => e.type === 'holiday').length;
            if (totalEventsEl) totalEventsEl.textContent = result.data.filter(e => e.type === 'event').length;

            renderMonthlyEventList(); // Initial render of dynamic list
        }
    } catch (err) {
        console.error('Error fetching calendar events:', err);
        showToast('Failed to load calendar data', 'error');
    }
}

async function downloadSample(type) {
    const token = localStorage.getItem('adminToken');
    window.location.href = `${GENERAL_API_BASE}/academic-year/download-sample?type=${type}&token=${token}`;
}

async function handleFileUpload(type) {
    const fileInput = document.getElementById(`${type}-csv`);
    const file = fileInput.files[0];
    if (!file) return;

    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${GENERAL_API_BASE}/academic-year/upload-csv?type=${type}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            fetchCalendarEvents();
        } else {
            showToast(result.message || 'Upload failed', 'error');
        }
    } catch (err) {
        console.error('Error uploading CSV:', err);
        showToast('Error connecting to server', 'error');
    } finally {
        fileInput.value = ''; // Reset input
    }
}

async function clearCalendar() {
    if (!confirm('Are you sure you want to clear all data from the calendar?')) return;
    const token = localStorage.getItem('adminToken');

    try {
        const response = await fetch(`${GENERAL_API_BASE}/academic-year/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            fetchCalendarEvents();
        } else {
            showToast(result.message || 'Clear failed', 'error');
        }
    } catch (err) {
        console.error('Error clearing calendar:', err);
        showToast('Error connecting to server', 'error');
    }
}

// --- Timetable Management Functions ---

// Natural sort helper for class names (e.g., Grade 1, Grade 2... Grade 10)
function sortClassesByName(classes) {
    return classes.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
}

async function initializeTimetablePage() {
    const select = document.getElementById('timetable-class-select');
    if (!select) return;

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            const sortedClasses = sortClassesByName(result.data);
            select.innerHTML = '<option value="">Choose Class...</option>' +
                sortedClasses.map(c => `<option value="${c._id}">${c.name} (${c.grade})</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading classes for timetable:', err);
    }
}

async function generateTimetable() {
    const classId = document.getElementById('timetable-class-select').value;
    const startTime = document.getElementById('timetable-start').value;
    const endTime = document.getElementById('timetable-end').value;
    const duration = document.getElementById('timetable-duration').value;
    const token = localStorage.getItem('adminToken');

    // Enhanced Validation
    if (!classId) {
        showToast('Please select a class', 'warning');
        return;
    }
    if (!startTime || !endTime) {
        showToast('Please specify start and end times', 'warning');
        return;
    }
    if (!duration || parseInt(duration) < 20) {
        showToast('Duration must be at least 20 minutes', 'warning');
        return;
    }

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diffMinutes = (end - start) / (1000 * 60);

    if (diffMinutes <= 0) {
        showToast('End time must be after start time', 'warning');
        return;
    }
    if (diffMinutes < parseInt(duration)) {
        showToast('Total duration is too short for even one period', 'warning');
        return;
    }

    if (!confirm('This will regenerate the timetable and overwrite any existing schedule for this class. Continue?')) {
        return;
    }

    showToast('Generating timetable...', 'info');

    try {
        const response = await fetch(`${GENERAL_API_BASE}/timetable/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                classId,
                startTime,
                endTime,
                duration: parseInt(duration)
            })
        });
        const result = await response.json();

        if (result.success) {
            if (result.conflicts > 0) {
                showToast(`Timetable generated with ${result.conflicts} empty slots due to teacher conflicts`, 'warning');
            } else {
                showToast('Timetable generated successfully!', 'success');
            }
            loadClassTimetable();
        } else {
            showToast(result.message || 'Generation failed', 'error');
        }
    } catch (err) {
        showToast('Error connecting to server', 'error');
    }
}

async function generateAllTimetables() {
    const startTime = document.getElementById('timetable-start').value;
    const endTime = document.getElementById('timetable-end').value;
    const duration = document.getElementById('timetable-duration').value;
    const token = localStorage.getItem('adminToken');

    if (!startTime || !endTime) {
        showToast('Please specify start and end times', 'warning');
        return;
    }
    if (!duration || parseInt(duration) < 20) {
        showToast('Duration must be at least 20 minutes', 'warning');
        return;
    }

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diffMinutes = (end - start) / (1000 * 60);

    if (diffMinutes <= 0) {
        showToast('End time must be after start time', 'warning');
        return;
    }

    if (!confirm('This will generate timetables for ALL classes and overwrite existing schedules. Continue?')) {
        return;
    }

    showToast('Generating timetables for all classes...', 'info');

    try {
        const response = await fetch(`${GENERAL_API_BASE}/timetable/generate-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                startTime,
                endTime,
                durationPerPeriod: parseInt(duration),
                daysPerWeek: 6
            })
        });
        const result = await response.json();

        if (result.success) {
            const { successful, failed, totalClasses } = result.results;
            if (failed.length > 0) {
                const failedMsg = failed.map(f => `${f.className}: ${f.reason}`).join('\n');
                showToast(`Generated for ${successful.length}/${totalClasses} classes.\nFailed: ${failedMsg}`, 'warning');
            } else {
                showToast(`Successfully generated timetables for all ${totalClasses} classes!`, 'success');
            }
            loadClassTimetable();
        } else {
            showToast(result.message || 'Generation failed', 'error');
        }
    } catch (err) {
        console.error('Error generating all timetables:', err);
        showToast('Error connecting to server', 'error');
    }
}

let currentTimetableData = [];

async function openEditSessionModal(session, timeKey) {
    const classId = document.getElementById('timetable-class-select').value;
    if (!classId) {
        showToast('Please select a class first', 'warning');
        return;
    }

    document.getElementById('edit-session-id').value = session._id;
    document.getElementById('edit-session-day').value = session.dayOfWeek;

    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    document.getElementById('edit-session-start').value = startTime.toTimeString().slice(0, 5);
    document.getElementById('edit-session-end').value = endTime.toTimeString().slice(0, 5);

    const subjectSelect = document.getElementById('edit-session-subject');
    subjectSelect.innerHTML = '<option value="">Loading subjects...</option>';

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${GENERAL_API_BASE}/timetable/subjects/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            subjectSelect.innerHTML = result.data.map(s =>
                `<option value="${s._id}" ${s._id === session.subjectId._id ? 'selected' : ''}>${s.name}</option>`
            ).join('');
        } else {
            subjectSelect.innerHTML = '<option value="">Failed to load subjects</option>';
        }
    } catch (err) {
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }

    document.getElementById('edit-session-modal').style.display = 'flex';
}

function closeEditSessionModal() {
    document.getElementById('edit-session-modal').style.display = 'none';
}

async function saveSessionEdit() {
    const sessionId = document.getElementById('edit-session-id').value;
    const subjectId = document.getElementById('edit-session-subject').value;
    const dayOfWeek = parseInt(document.getElementById('edit-session-day').value);
    const startTime = document.getElementById('edit-session-start').value;
    const endTime = document.getElementById('edit-session-end').value;
    const token = localStorage.getItem('adminToken');

    if (!subjectId || !startTime || !endTime) {
        showToast('Please fill all fields', 'warning');
        return;
    }

    try {
        const response = await fetch(`${GENERAL_API_BASE}/timetable/session/${sessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                subjectId,
                dayOfWeek,
                startTime,
                endTime
            })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Session updated successfully!', 'success');
            closeEditSessionModal();
            loadClassTimetable();
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        console.error('Error saving session:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function deleteSession() {
    const sessionId = document.getElementById('edit-session-id').value;
    const token = localStorage.getItem('adminToken');

    if (!confirm('Are you sure you want to delete this session?')) {
        return;
    }

    try {
        const response = await fetch(`${GENERAL_API_BASE}/timetable/session/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            showToast('Session deleted successfully!', 'success');
            closeEditSessionModal();
            loadClassTimetable();
        } else {
            showToast(result.message || 'Delete failed', 'error');
        }
    } catch (err) {
        console.error('Error deleting session:', err);
        showToast('Error connecting to server', 'error');
    }
}

async function loadClassTimetable() {
    const classId = document.getElementById('timetable-class-select').value;
    const tbody = document.getElementById('timetable-body');
    const token = localStorage.getItem('adminToken');

    if (!classId) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-cell" style="padding: 60px 0; color: #64748b; text-align: center;"><i class="fas fa-info-circle" style="font-size: 24px; display: block; margin-bottom: 12px; color: #cbd5e1;"></i>Please select a class to view its weekly timetable</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell" style="padding: 60px 0; text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-blue);"></i><div style="margin-top: 10px;">Loading timetable...</div></td></tr>';

    try {
        const response = await fetch(`${GENERAL_API_BASE}/timetable/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            renderTimetableTable(result.data.timetable);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="error-cell" style="padding: 60px 0; color: #ef4444; text-align: center;"><i class="fas fa-exclamation-triangle" style="font-size: 24px; display: block; margin-bottom: 12px;"></i>Failed to load timetable: ' + (result.message || 'Unknown error') + '</td></tr>';
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="error-cell" style="padding: 60px 0; color: #ef4444; text-align: center;"><i class="fas fa-wifi" style="font-size: 24px; display: block; margin-bottom: 12px;"></i>Error connecting to server</td></tr>';
    }
}

function renderTimetableTable(data) {
    const tbody = document.getElementById('timetable-body');
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-cell" style="padding: 60px 0; color: #64748b; text-align: center; border: 1px solid #e2e8f0;"><i class="fas fa-calendar-times" style="font-size: 24px; display: block; margin-bottom: 12px; color: #cbd5e1;"></i>No timetable generated for this class yet. Click "Auto Generate" above.</td></tr>';
        return;
    }

    // Group by time slots
    const slots = {};
    const timeKeysSet = new Set();
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    data.forEach(item => {
        const timeKey = `${item.startTime} - ${item.endTime}`;
        timeKeysSet.add(timeKey);

        if (!slots[timeKey]) slots[timeKey] = {};
        slots[timeKey][item.day] = item;
    });

    const sortedTimeKeys = Array.from(timeKeysSet).sort((a, b) => {
        const timeA = new Date(`1970-01-01 ${a.split(' - ')[0]}`);
        const timeB = new Date(`1970-01-01 ${b.split(' - ')[0]}`);
        return timeA - timeB;
    });

    currentTimetableData = data;

    tbody.innerHTML = sortedTimeKeys.map(timeKey => {
        let row = `<tr><td class="time-slot-cell" style="font-weight:600; color:#475569; background:#f8fafc; text-align:center; border: 1px solid #e2e8f0; vertical-align: middle; font-size: 13px;">${timeKey}</td>`;
        days.forEach(day => {
            const session = slots[timeKey][day];
            if (session) {
                const sessionJson = JSON.stringify(session).replace(/"/g, '&quot;');
                row += `
                    <td class="session-cell" style="padding: 8px; background: white; border: 1px solid #e2e8f0; vertical-align: top; cursor: pointer; position: relative;" onclick='openEditSessionModal(${sessionJson}, "${timeKey}")' title="Click to edit">
                        <div class="subject-name" style="font-weight: 600; font-size: 13px; color: #1e293b; margin-bottom: 2px;">${session.subjectName || 'No Subject'}</div>
                        <div class="teacher-name" style="font-size: 11px; color: #64748b;">${session.teacherName || 'No Teacher'}</div>
                        <i class="fas fa-pencil-alt" style="position: absolute; top: 6px; right: 6px; font-size: 10px; color: #94a3b8;"></i>
                    </td>
                `;
            } else {
                row += `<td class="empty-session-cell" style="background: #fafafa; color: #cbd5e1; text-align: center; font-size: 11px; vertical-align: middle; border: 1px solid #e2e8f0;">—</td>`;
            }
        });
        row += '</tr>';
        return row;
    }).join('');
}

function downloadTimetablePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const classSelect = document.getElementById('timetable-class-select');

    if (!classSelect.value) {
        showToast('Please select a class first', 'warning');
        return;
    }

    const className = classSelect.options[classSelect.selectedIndex].text;
    const table = document.getElementById('timetable-display-table');

    if (table.querySelector('.empty-cell') || table.querySelector('.loading-cell')) {
        showToast('No timetable data to download', 'warning');
        return;
    }

    // Prepare data for AutoTable manually to ensure perfect formatting
    const head = [["Time Slot", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]];
    const body = [];

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(tr => {
        const rowData = [];
        const cells = tr.querySelectorAll('td');
        cells.forEach((td, index) => {
            if (index === 0) {
                rowData.push(td.innerText.trim());
            } else if (td.classList.contains('empty-session-cell') || td.innerText.trim() === '—') {
                rowData.push('—');
            } else {
                const subject = td.querySelector('.subject-name')?.innerText.trim() || '';
                const teacher = td.querySelector('.teacher-name')?.innerText.trim() || '';
                // Format: Subject Name \n Teacher Name
                rowData.push(`${subject}\n${teacher}`);
            }
        });
        body.push(rowData);
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header: SmartSchool in Blue
    doc.setFontSize(28);
    doc.setTextColor(37, 99, 235); // #2563eb
    doc.setFont("helvetica", "bold");
    doc.text("SmartSchool", pageWidth / 2, 20, { align: 'center' });

    // Sub-header: Time Table Grade X
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85); // #334155
    doc.setFont("helvetica", "normal");
    doc.text(`Time Table - ${className}`, pageWidth / 2, 30, { align: 'center' });

    // Draw a simple line below header
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 35, pageWidth - 15, 35);

    doc.autoTable({
        head: head,
        body: body,
        startY: 45,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 5,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [203, 213, 225],
            font: "helvetica",
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: {
                fillColor: [248, 250, 252],
                fontStyle: 'bold',
                textColor: [30, 41, 59],
                cellWidth: 35
            }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index > 0) {
                if (data.cell.raw === '—') {
                    data.cell.styles.textColor = [148, 163, 184];
                } else {
                    data.cell.styles.halign = 'left';
                }
            }
        },
        margin: { top: 45, left: 15, right: 15, bottom: 20 }
    });

    // Simple Footer
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, finalY);
    doc.text("Academic Session 2024-2025", pageWidth - 15, finalY, { align: 'right' });

    doc.save(`SmartSchool_Timetable_${className.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF downloaded successfully!', 'success');
}

// --- Fees Management Functions ---

async function initializeFeesPage() {
    const select = document.getElementById('fees-class-select');
    if (!select) return;

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${ACADEMIC_API_BASE}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            const sortedClasses = sortClassesByName(result.data);
            select.innerHTML = '<option value="">Choose Class...</option>' +
                sortedClasses.map(c => `<option value="${c._id}">${c.name} (${c.grade})</option>`).join('');
        }

        loadClassFeesList();
    } catch (err) {
        console.error('Error loading classes for fees:', err);
    }
}

async function loadClassFeesList() {
    const tbody = document.getElementById('fees-table-body');
    const token = localStorage.getItem('adminToken');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading fees structure...</td></tr>';

    try {
        const response = await fetch(`${GENERAL_API_BASE}/fees/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No fees structures defined yet.</td></tr>';
                return;
            }

            tbody.innerHTML = result.data.map(item => `
                <tr>
                    <td>
                        <div style="font-weight: 600; color: var(--text-dark);">${item.classId?.name || 'Unknown Class'}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Grade: ${item.classId?.grade || 'N/A'}</div>
                    </td>
                    <td>₹${(item.annualFees || 0).toLocaleString()}</td>
                    <td>₹${(item.examFees || 0).toLocaleString()}</td>
                    <td style="font-weight: 700; color: var(--primary-blue); background: #f0f9ff;">₹${(item.totalFees || 0).toLocaleString()}</td>
                    <td style="font-size: 12px; color: var(--text-light);">${new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="editFees('${item.classId?._id}', ${item.annualFees || 0}, ${item.examFees || 0})" title="Edit Structure">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading fees list:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="error-cell">Error connecting to server</td></tr>';
    }
}

async function saveClassFees() {
    const classId = document.getElementById('fees-class-select').value;
    const annualFees = document.getElementById('annual-fees').value;
    const examFees = document.getElementById('exam-fees').value;
    const token = localStorage.getItem('adminToken');

    if (!classId) {
        showToast('Please select a class', 'warning');
        return;
    }

    try {
        const response = await fetch(`${GENERAL_API_BASE}/fees/define`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                classId,
                annualFees: parseFloat(annualFees),
                examFees: parseFloat(examFees)
            })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Class fees updated successfully', 'success');
            document.getElementById('fees-form').reset();
            document.getElementById('total-fees-display').value = '0.00';
            loadClassFeesList();
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        console.error('Error saving fees:', err);
        showToast('Error connecting to server', 'error');
    }
}

function calculateTotalFees() {
    const annual = parseFloat(document.getElementById('annual-fees').value) || 0;
    const exam = parseFloat(document.getElementById('exam-fees').value) || 0;
    document.getElementById('total-fees-display').value = (annual + exam).toFixed(2);
}

function editFees(classId, annual, exam) {
    document.getElementById('fees-class-select').value = classId;
    document.getElementById('annual-fees').value = annual;
    document.getElementById('exam-fees').value = exam;
    calculateTotalFees();
    document.getElementById('fees-class-select').focus();
    // Smooth scroll to form
    document.getElementById('fees-form').scrollIntoView({ behavior: 'smooth' });
}

function renderMonthlyEventList() {
    const listContainer = document.getElementById('academic-events-list');
    if (!listContainer || !academicCalendar) return;

    // Get current month and year from the calendar view
    const viewDate = academicCalendar.getDate();
    const currentMonth = viewDate.getMonth(); // 0-indexed
    const currentYear = viewDate.getFullYear();

    // Filter events that fall within this month (even if they start/end outside)
    const filtered = allAcademicEvents.filter(e => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);

        // Simple check: does start date or end date fall into current month/year?
        const startInMonth = start.getMonth() === currentMonth && start.getFullYear() === currentYear;
        const endInMonth = end.getMonth() === currentMonth && end.getFullYear() === currentYear;

        return startInMonth || endInMonth;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px; font-size: 13px;">No events scheduled for this month.</p>';
        return;
    }

    const formatDayMonth = (dStr) => {
        const d = new Date(dStr);
        return d.getDate().toString().padStart(2, '0') + '-' + (d.getMonth() + 1).toString().padStart(2, '0');
    };

    const monthsNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const monthHeader = `${monthsNames[currentMonth]} ${currentYear}`;

    const eventItems = filtered
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .map(e => {
            const startStr = formatDayMonth(e.startDate);
            const endStr = formatDayMonth(e.endDate);
            const range = startStr === endStr ? startStr : `${startStr} to ${endStr}`;
            const color = e.type === 'holiday' ? '#991b1b' : '#1e40af';
            const bgColor = e.type === 'holiday' ? '#fee2e2' : '#dbeafe';

            return `
                <div style="display: flex; gap: 15px; padding: 12px 15px; border-bottom: 1px dashed var(--border-color); align-items: center;">
                    <div style="width: 110px; font-weight: 600; color: ${color}; font-size: 12px; background: ${bgColor}; padding: 4px 6px; border-radius: 4px; text-align: center; flex-shrink: 0;">
                        ${range}
                    </div>
                    <div style="flex: 1; font-size: 13px; font-weight: 500; color: var(--text-dark);">
                        ${e.title}
                    </div>
                    <div style="font-size: 9px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; border: 1px solid var(--border-color); padding: 2px 5px; border-radius: 3px;">
                        ${e.type}
                    </div>
                </div>
            `;
        }).join('');

    listContainer.innerHTML = `
        <div class="month-group">
            <h4 style="font-size: 12px; color: var(--primary-blue); background: var(--accent-blue); padding: 10px 15px; margin: 0; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color);">
                <i class="fas fa-calendar-day"></i> ${monthHeader}
            </h4>
            <div style="background: #fff;">
                ${eventItems}
            </div>
        </div>
    `;
}

async function loadAllPayments() {
    const tableBody = document.getElementById('admin-payments-table-body');
    const token = localStorage.getItem('adminToken');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">Loading payments history...</td></tr>';

    try {
        const response = await fetch(`${GENERAL_API_BASE}/fees/list-all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            if (result.data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No payments recorded yet.</td></tr>';
                return;
            }

            tableBody.innerHTML = result.data.map(p => {
                const date = new Date(p.paymentDate).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const student = p.studentId || { fullName: 'Unknown', email: 'N/A', class: 'N/A' };

                return `
                    <tr>
                        <td style="font-size: 13px;">${date}</td>
                        <td>
                            <div style="font-weight: 600; color: var(--primary-blue);">${student.fullName}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${student.email}</div>
                        </td>
                        <td><span class="badge" style="background: #f1f5f9; color: #475569;">${student.class}</span></td>
                        <td style="font-weight: 600; color: #059669;">${p.localCurrency} ${(p.localAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style="color: #64748b; font-size: 13px;">₹${(p.amountINR || 0).toLocaleString()}</td>
                        <td style="font-family: monospace; font-size: 12px; color: #64748b;">${p.transactionId}</td>
                        <td>
                            <span class="badge" style="background: #ecfdf5; color: #059669; font-weight: 600;">
                                <i class="fas fa-check-circle" style="font-size: 10px; margin-right: 4px;"></i> ${p.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-cell" style="color: #ef4444;">Error: ${result.message}</td></tr>`;
        }
    } catch (err) {
        console.error('Error loading all payments:', err);
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell" style="color: #ef4444;">Connection error while fetching payments</td></tr>';
    }
}

