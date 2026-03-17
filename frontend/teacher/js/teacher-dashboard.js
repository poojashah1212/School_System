// SmartSchool Teacher Dashboard JavaScript

// Global state
let currentUser = null;
const ACADEMIC_API_BASE = '/api/academic';
const TEACHER_API_BASE = '/api/teachers';
const TEACHER_VIEW_API_BASE = '/api/teachers/view';
const TIMETABLE_API_BASE = '/api/timetable';

document.addEventListener('DOMContentLoaded', function () {
    // Check if teacher is logged in
    const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
    const teacherData = JSON.parse(localStorage.getItem('teacherData') || localStorage.getItem('userData') || '{}');

    if (!token) {
        window.location.href = '../../html/login.html';
        return;
    }

    currentUser = teacherData;

    // Initialize UI
    initDashboard();
    setupNavigation();
    setupSidebar();
    loadDashboardStats();
    loadTodaySchedule();
    loadRecentAnnouncements();
});

function initDashboard() {
    // Set teacher name in profile
    const nameDisplay = document.getElementById('teacher-name-display');
    if (nameDisplay && currentUser.fullName) {
        nameDisplay.textContent = currentUser.fullName;
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const sections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title-text');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Show current section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `page-${pageId}`) {
                    section.classList.add('active');
                }
            });

            // Update page title
            if (pageTitle) {
                const span = this.querySelector('span');
                pageTitle.textContent = span ? span.textContent : 'Dashboard';
            }

            // Load page specific data
            loadPageData(pageId);

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
}

function loadPageData(pageId) {
    switch (pageId) {
        case 'dashboard':
            loadDashboardStats();
            loadTodaySchedule();
            break;
        case 'view-profile':
            loadProfileData();
            break;
        case 'students-list':
            loadStudentsList();
            break;
        case 'assigned-classes':
            loadAssignedClasses();
            break;
        case 'view-calendar':
            loadAcademicCalendar();
            break;
        case 'weekly-schedule':
            loadWeeklyTimetable();
            break;
        case 'view-announcements':
            loadTeacherAnnouncements();
            break;
        case 'post-announcement':
            initAnnouncementForm();
            loadTeacherOwnAnnouncements();
            break;
        case 'upload-materials':
            initUploadMaterialForm();
            break;
        case 'manage-materials':
            loadMaterials();
            break;
        case 'manage-assignments':
            loadAssignments();
            break;
        case 'submissions-marks':
            initSubmissionsPage();
            break;
        case 'evaluate-assignment':
            initEvaluationPage();
            break;
    }
}

// ────────────────────────────────────────────────
// Announcement Management
// ────────────────────────────────────────────────

const ANNOUNCEMENT_API = '/api/teachers/announcements';

async function loadTeacherAnnouncements() {
    const container = document.getElementById('teacher-notices-list');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-cell" style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3b82f6; margin-bottom: 16px;"></i>
            <p style="color: #64748b;">Loading announcements...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="fas fa-bullhorn" style="font-size: 48px; margin-bottom: 16px; opacity: 0.2;"></i>
                    <p>No announcements found.</p>
                </div>
            `;
            return;
        }

        renderAnnouncementsList(result.data, container, false);
    } catch (err) {
        console.error('Error loading announcements:', err);
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444;">Failed to load announcements.</div>`;
    }
}

async function loadTeacherOwnAnnouncements() {
    const container = document.getElementById('teacher-own-notices');
    if (!container) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        // Filter only announcements authored by this teacher
        const currentUserId = currentUser._id || currentUser.id || currentUser.userId;
        const myAnnouncements = result.data ? result.data.filter(a => {
            const authorId = (a.author && a.author._id) ? a.author._id : (a.author && a.author.id ? a.author.id : a.author);
            return authorId && currentUserId && (authorId.toString() === currentUserId.toString());
        }) : [];

        if (myAnnouncements.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <p style="font-size: 13px;">You haven't posted any announcements yet.</p>
                </div>
            `;
            return;
        }

        renderAnnouncementsList(myAnnouncements, container, true);
    } catch (err) {
        console.error('Error loading my announcements:', err);
    }
}

function renderAnnouncementsList(announcements, container, showDelete = false) {
    container.innerHTML = announcements.map(notice => {
        const categoryColors = {
            'Urgent': '#ef4444',
            'Academic': '#3b82f6',
            'Event': '#f59e0b',
            'Holiday': '#10b981',
            'General': '#64748b'
        };
        const categoryColor = categoryColors[notice.category] || '#64748b';
        const date = new Date(notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="notice-card" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; position: relative; border-left: 4px solid ${categoryColor}; transition: all 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">${notice.title}</h4>
                    <div style="display: flex; gap: 8px;">
                        ${showDelete ? `
                            <button onclick="deleteAnnouncement('${notice._id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 4px; transition: all 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                    <span style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-user-tie" style="color: #3b82f6;"></i> ${notice.author.fullName || 'Admin'}</span>
                    <span style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-calendar-alt"></i> ${date}</span>
                    <span style="padding: 2px 8px; border-radius: 12px; background: ${categoryColor}15; color: ${categoryColor}; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">${notice.category || 'General'}</span>
                </div>
                <div style="font-size: 13px; color: #475569; line-height: 1.6; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 8px;">${notice.content}</div>
            </div>
        `;
    }).join('');
}

async function populateAnnouncementClasses() {
    const classSelect = document.getElementById('teacher-notice-class');
    if (!classSelect) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success && result.data) {
            // Keep the "All My Students" option
            let options = '<option value="">All My Students</option>';

            result.data.forEach(cls => {
                options += `<option value="${cls._id}">${cls.name} (${cls.grade})</option>`;
            });

            classSelect.innerHTML = options;
        }
    } catch (err) {
        console.error('Error fetching classes for announcement:', err);
    }
}

function initAnnouncementForm() {
    const form = document.getElementById('teacher-post-notice-form');
    if (!form) return;

    // Populate the classes dropdown
    populateAnnouncementClasses();

    const textarea = document.getElementById('teacher-notice-content');
    const charCount = document.getElementById('teacher-char-count');

    if (textarea && charCount) {
        textarea.addEventListener('input', function () {
            const count = this.value.length;
            charCount.textContent = `${count} / 500`;
            charCount.style.color = count > 450 ? '#ef4444' : '#94a3b8';
        });
    }

    form.onsubmit = async function (e) {
        e.preventDefault();

        const title = document.getElementById('teacher-notice-title').value;
        const content = document.getElementById('teacher-notice-content').value;
        const targetClass = document.getElementById('teacher-notice-class').value;
        const category = document.getElementById('teacher-notice-category').value;

        if (!title || !content) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
            const response = await fetch(ANNOUNCEMENT_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    targetClass: targetClass || null,
                    targetAudience: targetClass ? 'class' : 'students'
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Announcement broadcasted successfully!', 'success');
                clearTeacherNoticeForm();
                loadTeacherOwnAnnouncements();
            } else {
                showToast(result.message || 'Failed to post announcement', 'danger');
            }
        } catch (err) {
            console.error('Error posting announcement:', err);
            showToast('Server error while posting', 'danger');
        }
    };
}

// ────────────────────────────────────────────────
// Materials Management
// ────────────────────────────────────────────────

const MATERIALS_API = '/api/materials';

async function initUploadMaterialForm() {
    const form = document.getElementById('upload-material-form');
    if (!form) return;

    // Handle type change
    const typeSelect = document.getElementById('mat-type');
    const urlGroup = document.getElementById('url-group');
    const fileGroup = document.getElementById('file-group');
    const fileInput = document.getElementById('mat-file');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const filePreview = document.getElementById('filePreview');
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const fileTypeIcon = document.getElementById('fileTypeIcon');

    if (typeSelect && urlGroup && fileGroup) {
        // Set initial state based on default value
        if (typeSelect.value === 'VIDEO') {
            urlGroup.style.display = 'block';
            fileGroup.style.display = 'none';
        } else {
            urlGroup.style.display = 'none';
            fileGroup.style.display = 'block';
        }

        typeSelect.addEventListener('change', function () {
            if (this.value === 'VIDEO') {
                urlGroup.style.display = 'block';
                fileGroup.style.display = 'none';
            } else {
                urlGroup.style.display = 'none';
                fileGroup.style.display = 'block';
            }
        });
    }

    // File upload area click handler
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', function (e) {
            if (e.target !== removeFileBtn && !removeFileBtn?.contains(e.target)) {
                fileInput.click();
            }
        });

        // Drag and drop support
        fileUploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = 'var(--primary-blue)';
            fileUploadArea.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
        });

        fileUploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = '#cbd5e1';
            fileUploadArea.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
        });

        fileUploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            fileUploadArea.style.borderColor = '#cbd5e1';
            fileUploadArea.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                updateFilePreview(fileInput.files[0]);
            }
        });
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                updateFilePreview(this.files[0]);
            }
        });
    }

    // Remove file button handler
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            fileInput.value = '';
            uploadPlaceholder.style.display = 'block';
            filePreview.style.display = 'none';
        });
    }

    function updateFilePreview(file) {
        const size = (file.size / (1024 * 1024)).toFixed(2);
        const extension = file.name.split('.').pop().toLowerCase();
        
        let iconClass = 'fa-file-alt';
        if (extension === 'pdf') iconClass = 'fa-file-pdf';
        else if (['doc', 'docx'].includes(extension)) iconClass = 'fa-file-word';
        else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) iconClass = 'fa-file-video';
        
        fileTypeIcon.className = `fas ${iconClass}`;
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = `${size} MB`;
        uploadPlaceholder.style.display = 'none';
        filePreview.style.display = 'block';
    }

    // Populate the classes dropdown
    const classSelect = document.getElementById('mat-class');
    if (classSelect) {
        try {
            const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
            const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                let options = '<option value="">Select Class</option>';
                result.data.forEach(cls => {
                    options += `<option value="${cls._id}">${cls.name} (${cls.grade})</option>`;
                });
                classSelect.innerHTML = options;
            }
        } catch (err) {
            console.error('Error fetching classes for materials:', err);
        }
    }

    form.onsubmit = async function (e) {
        e.preventDefault();

        const type = document.getElementById('mat-type').value;

        // Create FormData from form - it will automatically pick up all named fields
        const formData = new FormData(form);
        
        // Handle file vs URL based on type
        if (type === 'VIDEO') {
            // Ensure file input is not included when using URL
            formData.delete('materialFile');
            const fileUrl = document.getElementById('mat-file-url').value;
            if (!fileUrl) {
                showToast('Please provide a video URL', 'warning');
                return;
            }
        } else {
            // Ensure URL is not included when using file upload
            formData.delete('fileUrl');
            const file = document.getElementById('mat-file').files[0];
            if (!file) {
                showToast('Please select a file to upload', 'warning');
                return;
            }
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
            const response = await fetch(MATERIALS_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Form data handles content-type automatically
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast('Material uploaded successfully!', 'success');
                form.reset();
                if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                if (filePreview) filePreview.style.display = 'none';
                // Redirect to manage materials
                document.querySelector('[data-page="manage-materials"]').click();
            } else {
                showToast(result.message || 'Failed to upload material', 'danger');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        } catch (err) {
            console.error('Error uploading material:', err);
            showToast('Server error during upload', 'danger');
        }
    };
}

async function loadMaterials() {
    const container = document.getElementById('materials-list-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-blue);"></i>
            <p>Loading materials...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${MATERIALS_API}/teacher`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.materials && result.materials.length > 0) {
            renderMaterials(result.materials, container);
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; grid-column: 1/-1; color: #94a3b8;">
                    <i class="fas fa-book-open" style="font-size: 4rem; opacity: 0.1; margin-bottom: 20px;"></i>
                    <p>No study materials found. Start by uploading some!</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading materials:', err);
        container.innerHTML = `<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: #ef4444;">Failed to load materials.</div>`;
    }
}

function renderMaterials(materials, container) {
    container.className = 'materials-grid';
    container.innerHTML = materials.map(mat => {
        let icon = 'fa-file-pdf';
        let typeClass = 'type-pdf';

        if (mat.type === 'MP4' || mat.type === 'VIDEO') {
            icon = 'fa-video';
            typeClass = 'type-video';
        } else if (mat.type === 'DOC') {
            icon = 'fa-file-word';
            typeClass = 'type-doc';
        }

        return `
        <div class="material-card">
            <div class="material-card-header">
                <div class="material-type-icon ${typeClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="material-actions">
                    <button class="action-btn delete" onclick="deleteMaterial('${mat._id}')" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <h4 class="material-title">${mat.title}</h4>
            <div class="material-meta">
                <span class="meta-badge"><i class="fas fa-chalkboard"></i> ${mat.class ? mat.class.name : 'N/A'}</span>
                <span class="meta-badge"><i class="fas fa-book"></i> ${mat.subject}</span>
            </div>
            <p class="material-desc">${mat.description || 'No description provided.'}</p>
            <div class="material-footer">
                <a href="${mat.fileUrl}" target="_blank" class="btn-view-material">
                    <i class="fas fa-external-link-alt"></i> View Material
                </a>
            </div>
        </div>
    `;
    }).join('');
}

window.deleteMaterial = async function (id) {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${MATERIALS_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showToast('Material deleted successfully', 'success');
            loadMaterials();
        } else {
            showToast(result.message || 'Failed to delete material', 'danger');
        }
    } catch (err) {
        console.error('Error deleting material:', err);
        showToast('Error deleting material', 'danger');
    }
};

async function loadRecentAnnouncements() {
    const container = document.getElementById('recent-announcements-container');
    if (!container) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #94a3b8;">
                    <i class="fas fa-bullhorn" style="font-size: 32px; margin-bottom: 12px; opacity: 0.2;"></i>
                    <p style="font-size: 13px;">No recent announcements from administration.</p>
                </div>
            `;
            return;
        }

        // Show only newest 3 announcements for dashboard
        const dashboardAnnouncements = result.data.slice(0, 3);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${dashboardAnnouncements.map(notice => {
            const categoryColors = {
                'Urgent': '#ef4444',
                'Academic': '#3b82f6',
                'Event': '#f59e0b',
                'Holiday': '#10b981',
                'General': '#64748b'
            };
            const categoryColor = categoryColors[notice.category] || '#64748b';
            const date = new Date(notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

            return `
                        <div class="recent-announcement-item" style="padding: 12px; border-radius: 12px; background: #f8fafc; border-left: 4px solid ${categoryColor}; transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'" onclick="document.querySelector('[data-page=\\'view-announcements\\']').click()">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                                <h5 style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${notice.title}</h5>
                                <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${date}</span>
                            </div>
                            <p style="font-size: 12px; color: #64748b; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${notice.content}</p>
                        </div>
                    `;
        }).join('')}
                <button onclick="document.querySelector('[data-page=\\'view-announcements\\']').click()" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px dashed #e2e8f0; border-radius: 8px; background: transparent; color: #3b82f6; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#eff6ff'; this.style.borderColor='#3b82f6'" onmouseout="this.style.background='transparent'; this.style.borderColor='#e2e8f0'">
                    View All Announcements
                </button>
            </div>
        `;
    } catch (err) {
        console.error('Error loading recent announcements:', err);
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">Failed to load.</div>`;
    }
}

window.clearTeacherNoticeForm = function () {
    const form = document.getElementById('teacher-post-notice-form');
    if (form) {
        form.reset();
        const charCount = document.getElementById('teacher-char-count');
        if (charCount) charCount.textContent = '0 / 500';
    }
};

window.deleteAnnouncement = async function (id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${ANNOUNCEMENT_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            showToast('Announcement deleted', 'success');
            loadTeacherOwnAnnouncements();
        } else {
            showToast(result.message || 'Failed to delete', 'danger');
        }
    } catch (err) {
        console.error('Error deleting announcement:', err);
        showToast('Error deleting announcement', 'danger');
    }
};

// ────────────────────────────────────────────────
// Assigned Classes & Integrated Timetable
// ────────────────────────────────────────────────

async function loadAssignedClasses() {
    const grid = document.getElementById('assigned-classes-grid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = `
        <div class="loading-cell" style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 16px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #3b82f6; margin-bottom: 16px;"></i>
            <p style="color: #64748b;">Loading your assigned classes...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 80px 40px; background: white; border-radius: 16px; border: 2px dashed #e2e8f0;">
                    <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-chalkboard" style="font-size: 32px; color: #94a3b8;"></i>
                    </div>
                    <h4 style="color: #475569; font-size: 18px; margin-bottom: 8px;">No assigned classes found</h4>
                    <p style="color: #94a3b8; font-size: 14px; max-width: 400px; margin: 0 auto;">You are not currently assigned to any classes or subjects.</p>
                </div>
            `;
            const classCountEl = document.getElementById('teacher-class-count');
            const studentCountEl = document.getElementById('teacher-student-count');
            if (classCountEl) classCountEl.textContent = '0';
            if (studentCountEl) studentCountEl.textContent = '0';
            return;
        }

        window.assignedClassesData = result.data;

        const totalStudents = result.data.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
        const classCountEl = document.getElementById('teacher-class-count');
        const studentCountEl = document.getElementById('teacher-student-count');
        if (classCountEl) classCountEl.textContent = result.data.length;
        if (studentCountEl) studentCountEl.textContent = totalStudents;

        renderAssignedClasses(result.data);

        // Auto-select first class if available
        if (result.data.length > 0) {
            const firstClass = result.data[0];
            loadClassTimetableInPanel(firstClass._id, firstClass.name);
        }

    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 16px;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; color: #ef4444; margin-bottom: 16px;"></i>
                <p style="color: #64748b;">Failed to load assigned classes. Please try again.</p>
            </div>
        `;
        showToast('Failed to load assigned classes', 'danger');
    }
}

function renderAssignedClasses(classes) {
    const grid = document.getElementById('assigned-classes-grid');
    if (!grid) return;

    if (!classes || classes.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <p style="font-size: 13px;">No classes found.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = classes.map((c) => {
        const roleClass = c.isClassTeacher ? 'role-class' : 'role-subject';
        const roleLabel = c.isClassTeacher ? 'Class Teacher' : 'Subject Teacher';
        const subjectLabel = c.subjects && c.subjects.length > 0 ? c.subjects[0] : 'No Subject';

        return `
            <div class="compact-class-card" id="class-card-${c._id}"
                onclick="loadClassTimetableInPanel('${c._id}', '${c.name}')">
                <div class="card-grade-icon">${c.grade}</div>
                <div class="card-main-info">
                    <div class="card-top-line">
                        <span class="card-title">${c.name}</span>
                        <span class="card-role-badge ${roleClass}">${roleLabel}</span>
                    </div>
                    <div class="card-sub-info">
                        <span>${subjectLabel}</span>
                        <span><i class="fas fa-users"></i> ${c.studentCount || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load timetable in the right panel
window.loadClassTimetableInPanel = async function (classId, className) {
    const container = document.getElementById('class-timetable-content');
    const titleEl = document.getElementById('timetable-class-name');
    const subtitleEl = document.getElementById('timetable-subtitle');

    if (titleEl) titleEl.textContent = `${className} - Timetable`;
    if (subtitleEl) subtitleEl.textContent = 'Loading schedule...';

    // Highlight selected class
    document.querySelectorAll('.compact-class-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.getElementById(`class-card-${classId}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #3b82f6; margin-bottom: 16px;"></i>
            <p style="color: #64748b;">Loading timetable...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes/${classId}/timetable`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="font-size: 14px;">No timetable scheduled for this class</p>
                </div>
            `;
            if (subtitleEl) subtitleEl.textContent = 'No schedule available';
            return;
        }

        if (subtitleEl) subtitleEl.textContent = `${result.data.length} sessions scheduled`;
        renderClassTimetableInPanel(result.data);

    } catch (err) {
        console.error('Error loading timetable:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p style="font-size: 14px;">Failed to load timetable</p>
            </div>
        `;
    }
};

function renderClassTimetableInPanel(sessions) {
    const container = document.getElementById('class-timetable-content');
    const sessionCountEl = document.getElementById('session-count-display');
    if (!container) return;

    if (sessionCountEl) sessionCountEl.textContent = `${sessions.length} Sessions Total`;

    if (!sessions || sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-tt-state">
                <i class="fas fa-calendar-times"></i>
                <p>No sessions found for this class</p>
            </div>
        `;
        return;
    }

    // Grouping logic remains similar but UI structure is upgraded to the grid
    const slots = {};
    const timeKeysSet = new Set();
    const daysMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        if (timeStr.includes(':')) {
            const [h, m] = timeStr.split(':');
            const hours = parseInt(h);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h12 = hours % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
        }
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    sessions.forEach(item => {
        const startTimeDisplay = formatTime(item.startTime);
        const endTimeDisplay = formatTime(item.endTime);
        const timeKey = `${startTimeDisplay}`; // Use only start time for slot keying
        timeKeysSet.add(timeKey);

        if (!slots[timeKey]) slots[timeKey] = {};
        const dayIdx = (item.dayOfWeek !== null && item.dayOfWeek !== undefined) ? item.dayOfWeek : daysMap[item.dayName || item.day];
        if (dayIdx !== undefined) slots[timeKey][dayIdx] = item;
    });

    const sortedTimeKeys = Array.from(timeKeysSet).sort((a, b) => {
        const getMinutes = (time) => {
            const parts = time.split(/[:\s]/);
            let h = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            const ampm = parts[2];
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return h * 60 + m;
        };
        return getMinutes(a) - getMinutes(b);
    });

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayIndices = [1, 2, 3, 4, 5, 6];

    let html = `
        <table class="tt-grid-table">
            <thead>
                <tr>
                    <th class="tt-time-col">TIME</th>
                    ${days.map(d => `<th>${d}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    sortedTimeKeys.forEach((timeKey) => {
        html += `<tr><td class="tt-time-col">${timeKey}</td>`;
        dayIndices.forEach(dayIdx => {
            const session = slots[timeKey][dayIdx];
            if (session) {
                const isMySession = session.teacherId === currentUser._id ||
                    (session.teacherId && (session.teacherId._id === currentUser._id || session.teacherId === currentUser._id)) ||
                    session.teacherId === currentUser.userId ||
                    (session.teacherName === currentUser.fullName);

                const chipClass = isMySession ? 'logged-in' : 'other';

                html += `
                    <td>
                        <div class="tt-session-chip ${chipClass}">
                            <div class="chip-subject">${session.title || session.subjectName}</div>
                            <div class="chip-teacher">${isMySession ? 'You' : (session.teacherName || 'Teacher')}</div>
                        </div>
                    </td>
                `;
            } else {
                html += `<td></td>`;
            }
        });
        html += '</tr>';
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}




function filterAssignedClasses() {
    const searchTerm = document.getElementById('assigned-class-search').value.toLowerCase();

    if (!window.assignedClassesData) return;

    let filtered = window.assignedClassesData.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        c.grade.toLowerCase().includes(searchTerm) ||
        (c.section && c.section.toLowerCase().includes(searchTerm))
    );

    renderAssignedClasses(filtered);
}

function sortAssignedClasses() {
    const sortBy = document.getElementById('assigned-class-sort').value;

    if (!window.assignedClassesData) return;

    let sorted = [...window.assignedClassesData];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'grade':
            sorted.sort((a, b) => a.grade.localeCompare(b.grade));
            break;
        case 'students':
            sorted.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
            break;
    }

    renderAssignedClasses(sorted);
}

window.viewFullClassTimetable = async function (classId, className) {
    const pageTitle = document.getElementById('page-title-text');
    const sections = document.querySelectorAll('.page-section');
    const container = document.querySelector('#page-weekly-schedule');

    if (pageTitle) pageTitle.textContent = `Full Timetable - ${className}`;

    sections.forEach(s => s.classList.remove('active'));
    container.classList.add('active');

    container.innerHTML = `
        <div class="dashboard-card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <div>
                    <h3 style="color: #1e293b;"><i class="fas fa-calendar-alt"></i> Complete Schedule: ${className}</h3>
                    <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Viewing all subjects and sessions for this class only.</p>
                </div>
                <button class="btn-secondary" onclick="document.querySelector('[data-page=\\'assigned-classes\\']').click()" style="background: white; border: 1px solid #cbd5e1;">
                    <i class="fas fa-arrow-left"></i> Back to My Classes
                </button>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
                <div class="activities-table" id="full-class-timetable-container">
                    <div style="text-align: center; padding: 60px;"><i class="fas fa-spinner fa-spin"></i> Loading timetable...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes/${classId}/timetable`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const tableContainer = document.getElementById('full-class-timetable-container');

        if (!result.success || !result.data || result.data.length === 0) {
            tableContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">No sessions found for this class.</div>';
            return;
        }

        renderClassTimetableInElement(result.data, tableContainer);

    } catch (err) {
        console.error('Error:', err);
        showToast('Error loading timetable', 'danger');
    }
};

function renderClassTimetableInElement(sessions, element) {
    const slots = {};
    const timeKeysSet = new Set();
    const daysMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

    sessions.forEach(item => {
        let startTimeDisplay = '';
        let endTimeDisplay = '';

        if (item.startTime && item.startTime.includes(':')) {
            const [h, m] = item.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m), 0);
            startTimeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const [eh, em] = item.endTime.split(':');
            const edate = new Date();
            edate.setHours(parseInt(eh), parseInt(em), 0);
            endTimeDisplay = edate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (item.startTime) {
            startTimeDisplay = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            endTimeDisplay = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        const timeKey = `${startTimeDisplay} - ${endTimeDisplay}`;
        timeKeysSet.add(timeKey);

        if (!slots[timeKey]) slots[timeKey] = {};
        const dayIdx = item.dayOfWeek !== null && item.dayOfWeek !== undefined ? item.dayOfWeek : daysMap[item.dayName || item.day];
        if (dayIdx !== undefined) slots[timeKey][dayIdx] = item;
    });

    const sortedTimeKeys = Array.from(timeKeysSet).sort((a, b) => {
        const getMinutes = (timeStr) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
        };
        return getMinutes(a.split(' - ')[0]) - getMinutes(b.split(' - ')[0]);
    });

    let html = `
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
                <tr style="background: #f8fafc;">
                    <th style="width: 140px; text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Time Slot</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Monday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Tuesday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Wednesday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Thursday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Friday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Saturday</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedTimeKeys.forEach(timeKey => {
        html += `<tr><td style="font-weight:600; color:#475569; background:#f8fafc; text-align:center; border: 1px solid #e2e8f0; vertical-align: middle; font-size: 13px; padding: 12px;">${timeKey}</td>`;
        for (let day = 1; day <= 6; day++) {
            const session = slots[timeKey][day];
            if (session) {
                const isMySession = session.teacherId === currentUser._id || (session.teacherId && session.teacherId._id === currentUser._id) || session.teacherId === currentUser.userId;
                const cardStyle = isMySession
                    ? 'background: #eff6ff; border-left: 4px solid #3b82f6;'
                    : 'background: white; border: 1px solid #e2e8f0;';
                const titleColor = isMySession ? '#1e40af' : '#475569';

                html += `
                    <td style="padding: 12px; ${cardStyle} vertical-align: top;">
                        <div style="font-weight: 700; font-size: 13px; color: ${titleColor}; margin-bottom: 4px;">${session.title || session.subjectName}</div>
                        <div style="font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-user-tie" style="font-size: 10px;"></i> ${isMySession ? '<strong>You</strong>' : session.teacherName}
                        </div>
                    </td>
                `;
            } else {
                html += `<td style="background: #fafafa; color: #cbd5e1; text-align: center; font-size: 11px; vertical-align: middle; border: 1px solid #e2e8f0;">—</td>`;
            }
        }
        html += '</tr>';
    });

    html += `</tbody></table>`;
    element.innerHTML = html;
}


window.viewClassTimetableInCard = async function (classId, className) {
    // This function is now superseded by viewFullClassTimetable
};

window.viewClassStudents = async function (classId, className) {
    const pageTitle = document.getElementById('page-title-text');
    const sections = document.querySelectorAll('.page-section');
    const container = document.querySelector('#page-students-list');

    if (pageTitle) pageTitle.textContent = `Students - ${className}`;

    sections.forEach(s => s.classList.remove('active'));
    container.classList.add('active');

    // Update students list page for this specific class
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="card-header">
                <h3><i class="fas fa-users"></i> Students of ${className}</h3>
                <button class="btn-secondary" onclick="document.querySelector('[data-page=\\'assigned-classes\\']').click()">
                    <i class="fas fa-arrow-left"></i> Back to Classes
                </button>
            </div>
            <div class="card-body" style="padding: 0;">
                <div class="activities-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Roll No</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="class-students-table-body">
                            <tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading students...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes/${classId}/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const tbody = document.getElementById('class-students-table-body');

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No students found in this class.</td></tr>';
            return;
        }

        tbody.innerHTML = result.data.map(s => `
            <tr>
                <td>
                    <div class="student-name-cell">
                        <div class="student-avatar">${s.fullName.charAt(0).toUpperCase()}</div>
                        <div class="name-info">
                            <div class="student-name">${s.fullName}</div>
                            <div class="student-location">${s.city || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="student-id-badge">${s.userId}</span></td>
                <td>${s.email}</td>
                <td>${s.mobileNo || 'N/A'}</td>
                <td>
                    <div class="student-list-actions">
                        <button class="btn-profile" onclick="viewStudentProfile('${s._id}', '${s.userId}')">
                            <i class="fas fa-user-circle"></i> Profile
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading class students:', err);
        showToast('Failed to load students', 'danger');
    }
};

// ════════════════════════════════════════════════════════════════════
// Student Profile Modal - View & Edit Functions
// ════════════════════════════════════════════════════════════════════

let currentProfileStudentId = null;
let currentProfileData = null;
let isEditMode = false;

/**
 * Open student profile modal and fetch student data
 */
async function viewStudentProfile(studentId, fallbackUserId = null) {
    currentProfileStudentId = studentId;
    const modal = document.getElementById('student-profile-modal');

    // Show loading state, hide others
    document.getElementById('profile-loading-state').style.display = 'block';
    document.getElementById('profile-view-mode').style.display = 'none';
    document.getElementById('profile-edit-mode').style.display = 'none';
    document.getElementById('profile-error-state').style.display = 'none';

    openStudentProfileModal();

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const candidateIds = [...new Set([studentId, fallbackUserId].filter(Boolean))];

        let result = null;
        let lastErrorMessage = 'Failed to fetch student data';

        for (const candidateId of candidateIds) {
            const response = await fetch(`${TEACHER_API_BASE}/students/${encodeURIComponent(candidateId)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (_) {
                payload = null;
            }

            if (response.ok && payload && payload.success) {
                result = payload;
                break;
            }

            lastErrorMessage = (payload && payload.message) || `Failed to fetch student data (${response.status})`;

            if (response.status !== 404) {
                throw new Error(lastErrorMessage);
            }
        }

        if (!result) {
            throw new Error(lastErrorMessage);
        }

        currentProfileData = result.data;
        // Prefer stable Mongo _id for updates, fallback to business userId when needed.
        currentProfileStudentId = result.data._id || result.data.userId || studentId;
        renderStudentProfileView(result.data);
    } catch (err) {
        console.error('Error loading student profile:', err);
        document.getElementById('profile-loading-state').style.display = 'none';
        document.getElementById('profile-error-state').style.display = 'block';
        document.getElementById('profile-error-detail').textContent = err.message || 'Please try again later.';
    }
}

/**
 * Open the student profile modal
 */
function openStudentProfileModal() {
    const modal = document.getElementById('student-profile-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Close on outside click (optional)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeStudentProfileModal();
        }
    });
}

/**
 * Close the student profile modal
 */
function closeStudentProfileModal() {
    const modal = document.getElementById('student-profile-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';

    // Reset to view mode
    switchToViewMode();
    currentProfileStudentId = null;
    currentProfileData = null;
    isEditMode = false;
}

/**
 * Render student profile data in view mode
 */
function renderStudentProfileView(studentData) {
    const viewMode = document.getElementById('profile-view-mode');
    const fullName = studentData.fullName || 'Unknown';
    const firstName = fullName.charAt(0).toUpperCase();

    // Populate all detail fields
    document.getElementById('profile-avatar-initials').textContent = firstName;
    document.getElementById('profile-name-display').textContent = fullName;
    document.getElementById('profile-id-display').textContent = `ID: ${studentData.userId || 'N/A'}`;

    document.getElementById('detail-student-id').textContent = studentData.userId || 'N/A';
    document.getElementById('detail-email').textContent = studentData.email || 'N/A';
    document.getElementById('detail-phone').textContent = studentData.mobileNo || 'N/A';
    document.getElementById('detail-class').textContent = studentData.className || studentData.class || 'N/A';
    document.getElementById('detail-address').textContent = studentData.address || `${studentData.city || ''}, ${studentData.state || ''}`.trim() || 'N/A';

    // Show view mode, hide others
    document.getElementById('profile-loading-state').style.display = 'none';
    document.getElementById('profile-error-state').style.display = 'none';
    viewMode.style.display = 'block';
    document.getElementById('profile-edit-mode').style.display = 'none';
    isEditMode = false;
}

/**
 * Switch to view mode (show profile info, hide edit form)
 */
function switchToViewMode() {
    document.getElementById('profile-loading-state').style.display = 'none';
    document.getElementById('profile-error-state').style.display = 'none';
    document.getElementById('profile-view-mode').style.display = 'block';
    document.getElementById('profile-edit-mode').style.display = 'none';
    isEditMode = false;
}

/**
 * Switch to edit mode
 */
function switchToEditMode() {
    if (!currentProfileData) return;

    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');

    // Populate form fields with current data
    document.getElementById('edit-full-name').value = currentProfileData.fullName || '';
    document.getElementById('edit-student-id').value = currentProfileData.userId || '';
    document.getElementById('edit-class').value = currentProfileData.className || currentProfileData.class || '';
    document.getElementById('edit-email').value = currentProfileData.email || '';
    document.getElementById('edit-phone').value = currentProfileData.mobileNo || '';
    document.getElementById('edit-address').value = currentProfileData.address || '';

    // Clear any previous error messages
    document.getElementById('profile-error-msg').style.display = 'none';
    document.getElementById('profile-error-msg').textContent = '';

    viewMode.style.display = 'none';
    editMode.style.display = 'block';
    isEditMode = true;
}

/**
 * Cancel edit and return to view mode
 */
function cancelEdit() {
    isEditMode = false;
    document.getElementById('profile-view-mode').style.display = 'block';
    document.getElementById('profile-edit-mode').style.display = 'none';

    // Clear error message
    document.getElementById('profile-error-msg').style.display = 'none';
    document.getElementById('profile-error-msg').textContent = '';
}

/**
 * Save student profile changes
 */
async function saveStudentProfile() {
    const errorMsg = document.getElementById('profile-error-msg');
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';

    // Get form data
    const fullName = document.getElementById('edit-full-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const address = document.getElementById('edit-address').value.trim();

    // Validation
    if (!fullName || fullName.length < 2) {
        showErrorMessage(errorMsg, 'Please enter a valid full name (at least 2 characters).');
        return;
    }

    if (!email || !validateEmail(email)) {
        showErrorMessage(errorMsg, 'Please enter a valid email address.');
        return;
    }

    if (phone && !validatePhone(phone)) {
        showErrorMessage(errorMsg, 'Please enter a valid phone number.');
        return;
    }

    // Show saving state
    const saveBtn = document.querySelector('#profile-edit-mode .btn-primary');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Saving...';
    saveBtn.disabled = true;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const updateData = {
            fullName: fullName,
            email: email,
            mobileNo: phone,
            address: address
        };

        const candidateIds = [...new Set([
            currentProfileStudentId,
            currentProfileData && currentProfileData.userId
        ].filter(Boolean))];

        let result = null;
        let lastErrorMessage = 'Failed to update student profile';

        for (const candidateId of candidateIds) {
            const response = await fetch(`${TEACHER_API_BASE}/students/update/${encodeURIComponent(candidateId)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (_) {
                payload = null;
            }

            if (response.ok) {
                result = payload;
                break;
            }

            lastErrorMessage = (payload && payload.message) || `Failed to update student profile (${response.status})`;

            if (response.status !== 404) {
                throw new Error(lastErrorMessage);
            }
        }

        if (!result || result.success === false) {
            throw new Error((result && result.message) || lastErrorMessage);
        }

        // Update current data
        currentProfileData = { ...currentProfileData, ...updateData };

        // Show success
        showToast('Student profile updated successfully!', 'success');

        // Return to view mode
        renderStudentProfileView(currentProfileData);
        cancelEdit();
    } catch (err) {
        console.error('Error saving student profile:', err);
        showErrorMessage(errorMsg, err.message || 'Failed to update profile. Please try again.');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

/**
 * Display error message in modal
 */
function showErrorMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number (basic - at least 10 digits)
 */
function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

// ────────────────────────────────────────────────
// Dashboard Stats & Schedule
// ────────────────────────────────────────────────

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');

        // Fetch assigned classes & subjects count (Strictly Class Teacher role)
        const assignedRes = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const assignedResult = await assignedRes.json();

        if (assignedResult.success) {
            const classCount = assignedResult.data.length;

            // UI elements
            const classCountEl = document.getElementById('assigned-classes-count');
            const dashboardClassCountEl = document.getElementById('teacher-class-count');
            const subjectCountEl = document.getElementById('assigned-subjects-count');
            const dashboardSubjectCountEl = document.getElementById('teacher-subject-count');
            const studentCountEl = document.getElementById('teacher-student-count');
            const mainStudentCountEl = document.getElementById('my-students-count');

            if (classCountEl) classCountEl.textContent = classCount;
            if (dashboardClassCountEl) dashboardClassCountEl.textContent = classCount;

            // Calculate unique subjects and total students for assigned classes
            const subjectCodes = new Set();
            let totalStudentsCount = 0;

            assignedResult.data.forEach(cls => {
                totalStudentsCount += cls.studentCount || 0;
                cls.subjects.forEach(sub => {
                    if (typeof sub === 'string') subjectCodes.add(sub);
                    else if (sub.code) subjectCodes.add(sub.code);
                    else if (sub.name) subjectCodes.add(sub.name);
                });
            });

            if (subjectCountEl) subjectCountEl.textContent = subjectCodes.size;
            if (dashboardSubjectCountEl) dashboardSubjectCountEl.textContent = subjectCodes.size;
            if (studentCountEl) studentCountEl.textContent = totalStudentsCount;
            if (mainStudentCountEl) mainStudentCountEl.textContent = totalStudentsCount;
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadTodaySchedule() {
    const tbody = document.getElementById('today-schedule-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    setTimeout(() => {
        const schedule = [
            { time: '09:00 AM - 10:00 AM', class: 'Grade 10-A', subject: 'Mathematics', status: 'Upcoming' },
            { time: '11:00 AM - 12:00 PM', class: 'Grade 11-B', subject: 'Physics', status: 'Upcoming' }
        ];

        tbody.innerHTML = schedule.map(item => `
            <tr>
                <td style="font-weight: 600; color: var(--primary-blue);">${item.time}</td>
                <td><span class="badge" style="background: #f1f5f9; color: #475569;">${item.class}</span></td>
                <td>${item.subject}</td>
                <td><span class="badge badge-warning">${item.status}</span></td>
            </tr>
        `).join('');
    }, 500);
}

// ────────────────────────────────────────────────
// Academic Calendar Logic (Simpler)
// ────────────────────────────────────────────────

let tcAllEvents = [];
let tcCurrentDate = new Date();

async function loadAcademicCalendar() {
    tcCurrentDate = new Date();
    await tcFetchEvents();
}

async function tcFetchEvents() {
    const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
    try {
        const response = await fetch('/api/academic-year/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        tcAllEvents = result.success ? result.data : [];
    } catch (err) {
        console.error('Error:', err);
        tcAllEvents = [];
    }
    tcRenderCalendar();
    tcRenderEventsList();
}

window.tcNavigateMonth = function (dir) {
    tcCurrentDate = new Date(tcCurrentDate.getFullYear(), tcCurrentDate.getMonth() + dir, 1);
    tcRenderCalendar();
    tcRenderEventsList();
};

function tcRenderCalendar() {
    const titleEl = document.getElementById('tc-month-title');
    const headersEl = document.getElementById('tc-day-headers');
    const gridEl = document.getElementById('tc-calendar-grid');
    if (!titleEl || !gridEl) return;

    const year = tcCurrentDate.getFullYear();
    const month = tcCurrentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    titleEl.textContent = `${monthNames[month]} ${year}`;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    headersEl.innerHTML = days.map(d => `<div style="text-align:center;font-size:12px;font-weight:600;color:#64748b;padding:6px 0;">${d}</div>`).join('');

    const coloredDays = {};
    tcAllEvents.forEach(e => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!coloredDays[key] || e.type === 'holiday') coloredDays[key] = e.type;
        }
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const today = new Date();
    let cells = '';

    for (let i = firstDay - 1; i >= 0; i--) {
        cells += `<div style="min-height:48px;padding:6px;border:1px solid #f1f5f9;border-radius:6px;background:#fafafa;"><span style="font-size:13px;color:#cbd5e1;">${prevMonthDays - i}</span></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const type = coloredDays[dateKey];
        const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        let bg = 'white', borderColor = '#e2e8f0', numColor = '#334155';
        if (type === 'holiday') { bg = '#fee2e2'; borderColor = '#fca5a5'; numColor = '#991b1b'; }
        else if (type === 'event') { bg = '#dbeafe'; borderColor = '#93c5fd'; numColor = '#1e40af'; }
        const todayStyle = isToday ? 'background:#fef9c3;font-weight:700;' : `background:${bg};`;
        cells += `<div style="min-height:48px;padding:6px;border:1px solid ${borderColor};border-radius:6px;${todayStyle}"><span style="font-size:13px;color:${type && !isToday ? numColor : (isToday ? '#92400e' : '#334155')};">${day}</span></div>`;
    }

    gridEl.innerHTML = cells;
}

function tcRenderEventsList() {
    const listEl = document.getElementById('tc-events-list');
    if (!listEl) return;
    const year = tcCurrentDate.getFullYear();
    const month = tcCurrentDate.getMonth();
    const monthEvents = tcAllEvents.filter(e => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return (start.getFullYear() === year && start.getMonth() === month) || (end.getFullYear() === year && end.getMonth() === month);
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (monthEvents.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px; font-size: 13px;">No events scheduled for this month.</p>`;
        return;
    }

    const formatDayMonth = (dateStr) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}-${month}`;
    };

    const displayDate = (start, end) => {
        const s = formatDayMonth(start);
        const e = formatDayMonth(end);

        // Compare date strings to handle single day vs range
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const isSameDay = startDateObj.getFullYear() === endDateObj.getFullYear() &&
            startDateObj.getMonth() === endDateObj.getMonth() &&
            startDateObj.getDate() === endDateObj.getDate();

        return isSameDay ? s : `${s} to ${e}`;
    };

    listEl.innerHTML = `
        <div style="padding: 0; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <th style="text-align: left; padding: 10px 15px; color: #64748b; font-weight: 600;">Date</th>
                        <th style="text-align: left; padding: 10px 15px; color: #64748b; font-weight: 600;">Name</th>
                        <th style="text-align: right; padding: 10px 15px; color: #64748b; font-weight: 600;">Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthEvents.map(e => {
        const isHoliday = e.type === 'holiday';
        const badgeColor = isHoliday ? '#ef4444' : '#3b82f6';
        const badgeBg = isHoliday ? `${badgeColor}15` : `${badgeColor}15`; // 15% opacity

        return `
                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 8px 15px; color: #475569; font-family: monospace; font-size: 12px; white-space: nowrap;">${displayDate(e.startDate, e.endDate)}</td>
                            <td style="padding: 8px 15px; color: #1e293b; font-weight: 500;">${e.title}</td>
                            <td style="padding: 8px 15px; text-align: right;">
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${badgeBg}; color: ${badgeColor}; letter-spacing: 0.5px;">
                                    ${e.type}
                                </span>
                            </td>
                        </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// ────────────────────────────────────────────────
// General Utilities
// ────────────────────────────────────────────────

function setupSidebar() {
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (window.innerWidth <= 768) sidebar.classList.toggle('active');
        else { sidebar.classList.toggle('collapsed'); mainContent.classList.toggle('expanded'); }
    };
    window.toggleNavGroup = function (element) { element.parentElement.classList.toggle('active'); };
    window.toggleProfileDropdown = function () { document.getElementById('profile-dropdown').classList.toggle('show'); };
}

function handleLogout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = '../../html/login.html';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.className = `notification-toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 5000);
}

function hideToast() {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

function loadProfileData() {
    const container = document.querySelector('#page-view-profile .placeholder-page');
    if (!container) return;
    container.innerHTML = `<div class="dashboard-card"><h3>${currentUser.fullName}</h3><p>${currentUser.email}</p></div>`;
}

async function loadStudentsList() {
    const container = document.querySelector('#page-students-list');
    if (!container) return;

    container.innerHTML = `
        <div class="dashboard-card" style="background: transparent; box-shadow: none;">
            <div class="card-header" style="background: white; border-radius: var(--radius-lg); margin-bottom: 20px; border-bottom: none; box-shadow: var(--shadow-sm);">
                <div>
                    <h3 style="font-size: 20px;"><i class="fas fa-users"></i> My Students</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin-top: 5px;">A complete list of all students across your assigned classes.</p>
                </div>
                <div class="card-actions">
                    <div class="search-box" style="position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                        <input type="text" id="student-search-input" placeholder="Search by name or ID..." oninput="filterTeacherStudents()" style="padding: 10px 10px 10px 35px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; width: 250px;">
                    </div>
                </div>
            </div>

            <div class="dashboard-card" style="background: white; border-radius: 16px; border: 1px solid #f1f5f9; padding: 0; overflow: hidden;">
                <div class="activities-table">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
                                <th style="text-align: left; padding: 16px 24px; color: #64748b; font-weight: 600; font-size: 13px;">Student Detail</th>
                                <th style="text-align: left; padding: 16px 24px; color: #64748b; font-weight: 600; font-size: 13px;">Student ID</th>
                                <th style="text-align: left; padding: 16px 24px; color: #64748b; font-weight: 600; font-size: 13px;">Class / Grade</th>
                                <th style="text-align: left; padding: 16px 24px; color: #64748b; font-weight: 600; font-size: 13px;">Contact Info</th>
                                <th style="text-align: right; padding: 16px 24px; color: #64748b; font-weight: 600; font-size: 13px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="all-students-table-body">
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 60px 0; color: #94a3b8;">
                                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                                    Loading student directory...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const tbody = document.getElementById('all-students-table-body');

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 80px 20px;">
                        <div style="width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #cbd5e1;">
                            <i class="fas fa-user-slash" style="font-size: 24px;"></i>
                        </div>
                        <h4 style="color: #64748b; margin-bottom: 5px;">No students found</h4>
                        <p style="color: #94a3b8; font-size: 13px;">Students will appear here once they are enrolled in your assigned classes.</p>
                    </td>
                </tr>`;
            return;
        }

        // Store globally for filtering
        window.allTeacherStudents = result.data;
        renderTeacherStudents(result.data);

    } catch (err) {
        console.error('Error loading students:', err);
        showToast('Failed to load student list', 'danger');
    }
}

function renderTeacherStudents(students) {
    const tbody = document.getElementById('all-students-table-body');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No matching students found</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr style="border-bottom: 1px solid #f8fafc; transition: all 0.2s ease;" class="student-row-hover">
            <td style="padding: 16px 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: #eff6ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #2563eb; font-weight: 700; border: 1px solid #dbeafe;">
                        ${s.fullName.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${s.fullName}</div>
                        <div style="font-size: 12px; color: #64748b;">${s.city || 'N/A'}, ${s.state || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td style="padding: 16px 24px;">
                <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; color: #475569; font-family: 'Courier New', monospace; font-size: 12px; font-weight: 600;">${s.userId}</code>
            </td>
            <td style="padding: 16px 24px;">
                <span class="badge" style="background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; font-weight: 600; padding: 5px 10px;">${s.class}</span>
            </td>
            <td style="padding: 16px 24px;">
                <div style="font-size: 13px; color: #1e293b;">${s.email}</div>
                <div style="font-size: 12px; color: #64748b;">${s.mobileNo || 'No phone'}</div>
            </td>
            <td style="padding: 16px 24px; text-align: right;">
                <button class="btn-primary" style="padding: 8px 16px; font-size: 12px; background: #2563eb; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s;" onclick="viewStudentProfile('${s._id}', '${s.userId}')">
                    <i class="fas fa-user-circle"></i> Profile
                </button>
            </td>
        </tr>
    `).join('');
}

window.filterTeacherStudents = function () {
    const query = document.getElementById('student-search-input').value.toLowerCase();
    if (!window.allTeacherStudents) return;

    const filtered = window.allTeacherStudents.filter(s =>
        s.fullName.toLowerCase().includes(query) ||
        s.userId.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
    renderTeacherStudents(filtered);
};

window.viewFullClassTimetable = async function (classId, className) {
    const pageTitle = document.getElementById('page-title-text');
    const sections = document.querySelectorAll('.page-section');
    const container = document.querySelector('#page-weekly-schedule');

    if (pageTitle) pageTitle.textContent = `Full Timetable - ${className}`;

    sections.forEach(s => s.classList.remove('active'));
    container.classList.add('active');

    container.innerHTML = `
        <div class="dashboard-card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <div>
                    <h3 style="color: #1e293b;"><i class="fas fa-calendar-alt"></i> Complete Schedule: ${className}</h3>
                    <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Viewing all subjects and sessions for this class only.</p>
                </div>
                <button class="btn-secondary" onclick="document.querySelector('[data-page=\\'assigned-classes\\']').click()" style="background: white; border: 1px solid #cbd5e1;">
                    <i class="fas fa-arrow-left"></i> Back to My Classes
                </button>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
                <div class="activities-table" id="full-class-timetable-container">
                    <div style="text-align: center; padding: 60px;"><i class="fas fa-spinner fa-spin"></i> Loading timetable...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes/${classId}/timetable`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const tableContainer = document.getElementById('full-class-timetable-container');

        if (!result.success || !result.data || result.data.length === 0) {
            tableContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">No sessions found for this class.</div>';
            return;
        }

        renderClassTimetableInElement(result.data, tableContainer);

    } catch (err) {
        console.error('Error:', err);
        showToast('Error loading timetable', 'danger');
    }
};

function renderClassTimetableInElement(sessions, element) {
    const slots = {};
    const timeKeysSet = new Set();
    const daysMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

    sessions.forEach(item => {
        let startTimeDisplay = '';
        let endTimeDisplay = '';

        if (item.startTime && item.startTime.includes(':')) {
            const [h, m] = item.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m), 0);
            startTimeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const [eh, em] = item.endTime.split(':');
            const edate = new Date();
            edate.setHours(parseInt(eh), parseInt(em), 0);
            endTimeDisplay = edate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (item.startTime) {
            startTimeDisplay = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            endTimeDisplay = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        const timeKey = `${startTimeDisplay} - ${endTimeDisplay}`;
        timeKeysSet.add(timeKey);

        if (!slots[timeKey]) slots[timeKey] = {};
        const dayIdx = item.dayOfWeek !== null && item.dayOfWeek !== undefined ? item.dayOfWeek : daysMap[item.dayName || item.day];
        if (dayIdx !== undefined) slots[timeKey][dayIdx] = item;
    });

    const sortedTimeKeys = Array.from(timeKeysSet).sort((a, b) => {
        const getMinutes = (timeStr) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
        };
        return getMinutes(a.split(' - ')[0]) - getMinutes(b.split(' - ')[0]);
    });

    let html = `
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
                <tr style="background: #f8fafc;">
                    <th style="width: 140px; text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Time Slot</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Monday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Tuesday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Wednesday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Thursday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Friday</th>
                    <th style="text-align: center; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; padding: 12px;">Saturday</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedTimeKeys.forEach(timeKey => {
        html += `<tr><td style="font-weight:600; color:#475569; background:#f8fafc; text-align:center; border: 1px solid #e2e8f0; vertical-align: middle; font-size: 13px; padding: 12px;">${timeKey}</td>`;
        for (let day = 1; day <= 6; day++) {
            const session = slots[timeKey][day];
            if (session) {
                const isMySession = session.teacherId === currentUser._id || (session.teacherId && session.teacherId._id === currentUser._id) || session.teacherId === currentUser.userId;
                const cardStyle = isMySession
                    ? 'background: #eff6ff; border-left: 4px solid #3b82f6;'
                    : 'background: white; border: 1px solid #e2e8f0;';
                const titleColor = isMySession ? '#1e40af' : '#475569';

                html += `
                    <td style="padding: 12px; ${cardStyle} vertical-align: top;">
                        <div style="font-weight: 700; font-size: 13px; color: ${titleColor}; margin-bottom: 4px;">${session.title || session.subjectName}</div>
                        <div style="font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-user-tie" style="font-size: 10px;"></i> ${isMySession ? '<strong>You</strong>' : session.teacherName}
                        </div>
                    </td>
                `;
            } else {
                html += `<td style="background: #fafafa; color: #cbd5e1; text-align: center; font-size: 11px; vertical-align: middle; border: 1px solid #e2e8f0;">—</td>`;
            }
        }
        html += '</tr>';
    });

    html += `</tbody></table>`;
    element.innerHTML = html;
}

async function loadWeeklyTimetable() {
    const container = document.querySelector('#page-weekly-schedule');
    if (!container) return;

    container.innerHTML = `
        <div class="dashboard-card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <div>
                    <h3 style="color: #1e293b;"><i class="fas fa-calendar-week"></i> My Weekly Teaching Schedule</h3>
                    <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Comprehensive view of all your assigned sessions across the week.</p>
                </div>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
                <div class="activities-table" id="weekly-timetable-container">
                    <div style="text-align: center; padding: 60px;"><i class="fas fa-spinner fa-spin"></i> Loading schedule...</div>
                </div>
            </div>
        </div>
    `;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/all-timetables`.trim(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const tableContainer = document.getElementById('weekly-timetable-container');

        if (!result.success || !result.data || result.data.length === 0) {
            tableContainer.innerHTML = '<div style="padding: 60px; text-align: center; color: #94a3b8;"><i class="fas fa-calendar-times" style="font-size: 30px; display: block; margin-bottom: 10px;"></i>No sessions scheduled for you this week.</div>';
            return;
        }

        renderMyWeeklyTimetable(result.data, tableContainer);

    } catch (err) {
        console.error('Error loading weekly timetable:', err);
        showToast('Failed to load full timetable', 'danger');
    }
}

function renderMyWeeklyTimetable(sessions, element) {
    const slots = {};
    const timeKeysSet = new Set();
    const daysMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

    sessions.forEach(item => {
        let startTimeDisplay = '';
        let endTimeDisplay = '';

        if (item.startTime && item.startTime.includes(':')) {
            const [h, m] = item.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m), 0);
            startTimeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const [eh, em] = item.endTime.split(':');
            const edate = new Date();
            edate.setHours(parseInt(eh), parseInt(em), 0);
            endTimeDisplay = edate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (item.startTime) {
            startTimeDisplay = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            endTimeDisplay = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        const timeKey = `${startTimeDisplay} - ${endTimeDisplay}`;
        timeKeysSet.add(timeKey);

        if (!slots[timeKey]) slots[timeKey] = {};
        const dayIdx = item.dayOfWeek !== null && item.dayOfWeek !== undefined ? item.dayOfWeek : daysMap[item.dayName || item.day];
        if (dayIdx) {
            if (!slots[timeKey][dayIdx]) slots[timeKey][dayIdx] = [];
            slots[timeKey][dayIdx].push(item);
        }
    });

    const sortedTimeKeys = Array.from(timeKeysSet).sort((a, b) => {
        const getMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)/i);
            if (!match) return 0;
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };
        return getMinutes(a.split(' - ')[0]) - getMinutes(b.split(' - ')[0]);
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let html = `
        <table class="weekly-schedule-grid">
            <thead>
                <tr>
                    <th style="width: 120px;">TIME</th>
                    ${days.map(d => `<th>${d.toUpperCase()}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    sortedTimeKeys.forEach(timeKey => {
        html += `<tr><td class="time-column">${timeKey}</td>`;
        for (let day = 1; day <= 6; day++) {
            const sessionsAtTime = slots[timeKey][day];
            if (sessionsAtTime && sessionsAtTime.length > 0) {
                html += `<td>`;
                sessionsAtTime.forEach(s => {
                    const isMySession = s.teacherId === currentUser._id ||
                        (s.teacherId && s.teacherId._id === currentUser._id) ||
                        s.teacherId === currentUser.userId;

                    const myClass = isMySession ? 'my-session' : '';

                    html += `
                        <div class="schedule-session-card ${myClass}">
                            <div class="session-subject">${s.subjectName || s.title}</div>
                            <div class="session-grade">${s.className}</div>
                        </div>
                    `;
                });
                html += `</td>`;
            } else {
                html += `<td><div class="empty-grid-slot">-</div></td>`;
            }
        }
        html += '</tr>';
    });

    html += `</tbody></table>`;
    element.innerHTML = html;
}

// ────────────────────────────────────────────────
// Assignment Management
// ────────────────────────────────────────────────

const ASSIGNMENTS_API = '/api/teacher/assignments';

async function loadAssignments() {
    const tbody = document.getElementById('assignments-list-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading assignments...</td></tr>';

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ASSIGNMENTS_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            renderAssignments(result.data, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No assignments found.</td></tr>';
        }
    } catch (err) {
        console.error('Error loading assignments:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load assignments.</td></tr>';
    }
}

function renderAssignments(assignments, tbody) {
    tbody.innerHTML = assignments.map(assign => `
        <tr>
            <td><strong>${assign.title}</strong></td>
            <td><span class="badge" style="background: #eff6ff; color: #3b82f6;">${assign.class ? assign.class.name : 'N/A'}</span></td>
            <td>${assign.subject}</td>
            <td><span style="font-size: 13px; color: #64748b;"><i class="far fa-clock"></i> ${new Date(assign.deadline).toLocaleString()}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn" onclick="openAssignmentModal('edit', '${assign._id}')" title="Edit" style="color: #3b82f6; background: transparent; border: none; cursor: pointer;"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" onclick="deleteAssignment('${assign._id}')" title="Delete" style="color: #ef4444; background: transparent; border: none; cursor: pointer;"><i class="fas fa-trash"></i></button>
                    ${assign.fileUrl ? `<a href="${assign.fileUrl}" target="_blank" class="action-btn" title="View File" style="color: #10b981;"><i class="fas fa-file-download"></i></a>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}


// ────────────────────────────────────────────────
// Submissions & Marks Page Logic (API Refined)
// ────────────────────────────────────────────────

async function initSubmissionsPage() {
    const select = document.getElementById('submissions-assign-select');
    if (!select) return;

    select.innerHTML = '<option value="">Loading assignments...</option>';
    
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ASSIGNMENTS_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            let options = '<option value="">-- Select Assignment --</option>';
            // Store globally for lookup
            window.teacherAssignments = result.data;
            
            result.data.forEach(assign => {
                options += `<option value="${assign._id}">${assign.title} (${assign.class ? assign.class.name : 'N/A'})</option>`;
            });
            select.innerHTML = options;
            
            // Clear table
            const tbody = document.getElementById('submissions-list-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Please select an assignment to view submissions.</td></tr>';
        } else {
            select.innerHTML = '<option value="">No assignments found</option>';
        }
    } catch (err) {
        console.error('Error initializing submissions page:', err);
    }
}

window.loadSubmissionsForSelectedAssignment = async function() {
    const assignId = document.getElementById('submissions-assign-select').value;
    const tbody = document.getElementById('submissions-list-body');
    if (!tbody) return;

    if (!assignId) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Please select an assignment.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading students and submissions...</td></tr>';

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const assignment = window.teacherAssignments.find(a => a._id === assignId);
        
        if (!assignment || !assignment.class) {
            showToast('Assignment or class information missing', 'danger');
            return;
        }

        const classId = assignment.class._id;

        // 1. Fetch ALL students for this class using the specific API
        const studentsResp = await fetch(`/api/teacher/assigned-classes/${classId}/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const studentsResult = await studentsResp.json();

        // 2. Fetch submissions for this assignment specifically
        // Although the old endpoint exists, it's better to filter or have a specific one
        const submissionsResp = await fetch(`${ASSIGNMENTS_API}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const submissionsResult = await submissionsResp.json();

        if (studentsResult.success && submissionsResult.success) {
            const allStudents = studentsResult.data;
            const assignmentSubmissions = submissionsResult.data.filter(s => s.assignmentId === assignId);
            
            // Merge Data
            const mergedList = allStudents.map(student => {
                const sub = assignmentSubmissions.find(s => 
                    (s.studentId && s.studentId.toString() === student._id.toString()) || 
                    s.studentName === student.fullName
                );

                if (sub) {
                    return {
                        ...sub,
                        studentName: student.fullName
                    };
                } else {
                    return {
                        assignmentId: assignId,
                        assignmentTitle: assignment.title,
                        studentName: student.fullName,
                        submissionDate: null,
                        status: 'Pending',
                        marks: null,
                        submissionId: null
                    };
                }
            });

            renderSubmissions(mergedList, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Failed to load data.</td></tr>';
        }
    } catch (err) {
        console.error('Error in loadSubmissionsForSelectedAssignment:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Server error.</td></tr>';
    }
};

async function loadSubmissions() {
    // Legacy support or fallback to all submissions if needed
    // But we now prefer selection-based loading
    initSubmissionsPage();
}

function renderSubmissions(submissions, tbody) {
    tbody.innerHTML = submissions.map(sub => {
        let statusClass = 'badge-success'; // Submitted
        let statusText = sub.status;
        let isPending = sub.status === 'Pending';
        
        if (isPending) {
            statusClass = 'badge-danger';
        } else if (sub.marks !== null && sub.marks !== undefined) {
            statusClass = 'badge-info'; // Optional: show marked as info, or keep as success
            statusText = 'Submitted'; // Requirements says "Submitted"
        }

        return `
            <tr>
                <td><strong>${sub.studentName}</strong></td>
                <td>${sub.assignmentTitle}</td>
                <td>${sub.submissionDate ? new Date(sub.submissionDate).toLocaleString() : '<span style="color: #94a3b8;">-</span>'}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td><strong style="color: #2563eb;">${sub.marks !== undefined && sub.marks !== null ? sub.marks : '-'}</strong></td>
                <td>
                    ${isPending ? `
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 6px; cursor: not-allowed;" disabled>
                            <i class="fas fa-clock"></i> Pending
                        </button>
                    ` : `
                        <button class="btn-primary" style="padding: 6px 12px; font-size: 11px; border-radius: 6px;" onclick="openEvaluationForStudent('${sub.assignmentId}', '${sub.submissionId || ''}', '${sub.studentName}')">
                            <i class="fas fa-check-circle"></i> Evaluate
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

window.openAssignmentModal = async function(mode, id = null, submissionId = null) {
    const modal = document.getElementById('assignment-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('assignment-form');
    const assignFields = document.getElementById('assignment-fields');
    const evalFields = document.getElementById('evaluation-fields');
    const submitBtn = document.getElementById('modal-submit-btn');

    form.reset();
    document.getElementById('assign-id').value = id || '';
    document.getElementById('submission-id').value = submissionId || '';

    // Load classes for the dropdown
    await populateAssignmentModelClasses();

    if (mode === 'create') {
        title.textContent = 'Create New Assignment';
        assignFields.style.display = 'block';
        evalFields.style.display = 'none';
        submitBtn.textContent = 'Create Assignment';
    } else if (mode === 'edit') {
        title.textContent = 'Edit Assignment';
        assignFields.style.display = 'block';
        evalFields.style.display = 'none';
        submitBtn.textContent = 'Save Changes';
        // Fetch assignment data
        loadAssignmentForEdit(id);
    } else if (mode === 'evaluate') {
        title.textContent = 'Evaluate Submission';
        assignFields.style.display = 'none';
        evalFields.style.display = 'block';
        submitBtn.textContent = 'Submit Evaluation';
        // Fetch submission data
        loadSubmissionForEval(id, submissionId);
    }

    modal.style.display = 'flex';
};

window.closeAssignmentModal = function() {
    document.getElementById('assignment-modal').style.display = 'none';
};

async function populateAssignmentModelClasses() {
    const classSelect = document.getElementById('assign-class');
    if (!classSelect) return;

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${TEACHER_VIEW_API_BASE}/assigned-classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success && result.data) {
            let options = '<option value="">Select Class</option>';
            result.data.forEach(cls => {
                options += `<option value="${cls._id}">${cls.name} (${cls.grade})</option>`;
            });
            classSelect.innerHTML = options;
        }
    } catch (err) {
        console.error('Error fetching classes:', err);
    }
}

async function loadAssignmentForEdit(id) {
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${ASSIGNMENTS_API}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const assign = result.data.find(a => a._id === id);
        
        if (assign) {
            document.getElementById('assign-title').value = assign.title;
            document.getElementById('assign-class').value = assign.class ? (assign.class._id || assign.class) : '';
            document.getElementById('assign-subject').value = assign.subject;
            document.getElementById('assign-desc').value = assign.description;
            // Format date for datetime-local
            if (assign.deadline) {
               const deadline = new Date(assign.deadline).toISOString().slice(0, 16);
               document.getElementById('assign-deadline').value = deadline;
            }
        }
    } catch (err) {
        console.error('Error loading assignment:', err);
    }
}

async function loadSubmissionForEval(assignmentId, submissionId) {
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${ASSIGNMENTS_API}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const sub = result.data.find(s => s.assignmentId === assignmentId && s.submissionId === submissionId);
        
        if (sub) {
            document.getElementById('eval-student-name').value = sub.studentName;
            document.getElementById('eval-marks').value = sub.marks || '';
            document.getElementById('eval-feedback').value = sub.feedback || '';
            const fileLink = document.getElementById('eval-file-link');
            if (sub.fileUrl) {
                fileLink.innerHTML = `<a href="${sub.fileUrl}" target="_blank" style="color: var(--primary-blue); text-decoration: none; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-file-pdf"></i> View Submitted File
                                      </a>`;
            } else {
                fileLink.innerHTML = '<span style="color: var(--text-muted);">No file uploaded</span>';
            }
        }
    } catch (err) {
        console.error('Error loading submission:', err);
    }
}

document.getElementById('assignment-form').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('assign-id').value;
    const submissionId = document.getElementById('submission-id').value;
    const isEval = document.getElementById('evaluation-fields').style.display === 'block';
    
    const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
    
    let url = ASSIGNMENTS_API;
    let method = 'POST';

    if (isEval) {
        url = `${ASSIGNMENTS_API}/${id}/submissions/${submissionId}/evaluate`;
        method = 'PUT';
        const marks = document.getElementById('eval-marks').value;
        const feedback = document.getElementById('eval-feedback').value;
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ marks, feedback })
            });
            const result = await response.json();
            handleAssignmentResponse(result, true);
        } catch (err) {
            console.error('Error submitting evaluation:', err);
            showToast('Error submitting evaluation', 'danger');
        }
    } else {
        const formData = new FormData();
        formData.append('title', document.getElementById('assign-title').value);
        formData.append('classId', document.getElementById('assign-class').value);
        formData.append('subject', document.getElementById('assign-subject').value);
        formData.append('description', document.getElementById('assign-desc').value);
        formData.append('deadline', document.getElementById('assign-deadline').value);
        
        const fileInput = document.getElementById('assign-file');
        if (fileInput.files[0]) {
            formData.append('assignmentFile', fileInput.files[0]);
        }

        if (id) {
            url = `${ASSIGNMENTS_API}/${id}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            handleAssignmentResponse(result, false);
        } catch (err) {
            console.error('Error saving assignment:', err);
            showToast('Error saving assignment', 'danger');
        }
    }
};

function handleAssignmentResponse(result, isEval) {
    if (result.success) {
        showToast(result.message || 'Action completed successfully', 'success');
        closeAssignmentModal();
        if (isEval) loadSubmissions();
        else loadAssignments();
    } else {
        showToast(result.message || 'Operation failed', 'danger');
    }
}

window.deleteAssignment = async function(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(`${ASSIGNMENTS_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            showToast('Assignment deleted', 'success');
            loadAssignments();
        } else {
            showToast(result.message || 'Failed to delete', 'danger');
        }
    } catch (err) {
        console.error('Error deleting assignment:', err);
        showToast('Error deleting assignment', 'danger');
    }
};


// ────────────────────────────────────────────────
// Evaluate Assignment Page Logic
// ────────────────────────────────────────────────

async function initEvaluationPage() {
    const select = document.getElementById('eval-assign-select');
    if (!select) return;

    select.innerHTML = '<option value="">Loading assignments...</option>';
    
    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        const response = await fetch(ASSIGNMENTS_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            let options = '<option value="">-- Select Assignment --</option>';
            result.data.forEach(assign => {
                options += `<option value="${assign._id}">${assign.title} (${assign.class ? assign.class.name : 'N/A'})</option>`;
            });
            select.innerHTML = options;
            
            // Reset UI
            document.getElementById('eval-students-list').innerHTML = `
                <div style="padding: 30px; text-align: center; color: #94a3b8;">
                    <i class="fas fa-user-friends" style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                    <p style="font-size: 13px;">Please select an assignment above</p>
                </div>
            `;
            document.getElementById('evaluation-viewer-content').style.display = 'none';
            document.getElementById('evaluation-viewer-empty').style.display = 'flex';
        } else {
            select.innerHTML = '<option value="">No assignments found</option>';
        }
    } catch (err) {
        console.error('Error initializing evaluation page:', err);
    }
}

window.loadStudentsForEvaluation = async function() {
    const assignId = document.getElementById('eval-assign-select').value;
    const listContainer = document.getElementById('eval-students-list');
    
    if (!assignId) {
        listContainer.innerHTML = '<div style="padding: 30px; text-align: center; color: #94a3b8;">Select an assignment first</div>';
        return;
    }

    listContainer.innerHTML = '<div style="padding: 24px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading students...</div>';

    try {
        const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
        // We use the same submissions endpoint as it already returns all students for all assignments
        const response = await fetch(`${ASSIGNMENTS_API}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data) {
            // Filter submissions for the selected assignment
            const assignmentSubmissions = result.data.filter(s => s.assignmentId === assignId);
            
            if (assignmentSubmissions.length === 0) {
                listContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">No students found for this class.</div>';
                return;
            }

            // Store globally for quick access
            window.currentAssignmentSubmissions = assignmentSubmissions;

            listContainer.innerHTML = assignmentSubmissions.map(sub => {
                const isSubmitted = sub.status === 'Submitted';
                const hasMarks = sub.marks !== null && sub.marks !== undefined;
                const statusColor = isSubmitted ? '#10b981' : '#ef4444';
                const statusDot = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; margin-right: 8px;"></span>`;
                
                return `
                    <div class="eval-student-item" onclick="selectStudentForEvaluation('${sub.assignmentId}', '${sub.submissionId || ''}', '${sub.studentName}')" 
                         style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px;"
                         onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <div style="width: 36px; height: 36px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: 700; font-size: 14px;">
                            ${sub.studentName.charAt(0)}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${sub.studentName}</div>
                            <div style="font-size: 11px; color: #64748b; display: flex; align-items: center;">
                                ${statusDot} ${sub.status} ${hasMarks ? `• Marked: ${sub.marks}` : ''}
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: #cbd5e1; font-size: 12px;"></i>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error('Error loading students for evaluation:', err);
    }
};

window.selectStudentForEvaluation = function(assignId, subId, studentName) {
    const submission = window.currentAssignmentSubmissions.find(s => 
        s.assignmentId === assignId && (s.submissionId === subId || (!subId && s.studentName === studentName))
    );

    if (!submission) return;

    // UI Updates
    document.getElementById('evaluation-viewer-empty').style.display = 'none';
    const content = document.getElementById('evaluation-viewer-content');
    content.style.display = 'block';

    document.getElementById('view-student-name').textContent = submission.studentName;
    document.getElementById('view-assign-title').textContent = submission.assignmentTitle;
    
    const statusBadge = document.getElementById('view-status-badge');
    const isSubmitted = submission.status === 'Submitted';
    statusBadge.innerHTML = `<span class="badge ${isSubmitted ? 'badge-success' : 'badge-danger'}" style="padding: 6px 12px; font-size: 12px;">${submission.status}</span>`;

    const fileArea = document.getElementById('view-submission-file');
    if (submission.fileUrl) {
        fileArea.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <i class="fas fa-file-pdf" style="font-size: 48px; color: #ef4444;"></i>
                <div>
                    <p style="font-weight: 600; margin-bottom: 8px;">Assignment Submission File</p>
                    <a href="${submission.fileUrl}" target="_blank" class="btn-primary" style="padding: 8px 16px; font-size: 13px; text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i> Open File in New Tab
                    </a>
                </div>
            </div>
        `;
    } else {
        fileArea.innerHTML = `
            <div style="color: #94a3b8;">
                <i class="fas fa-file-excel" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3;"></i>
                <p>No file submitted yet</p>
            </div>
        `;
    }

    // Populate form
    document.getElementById('direct-eval-assign-id').value = assignId;
    document.getElementById('direct-eval-sub-id').value = subId;
    document.getElementById('direct-eval-marks').value = submission.marks || '';
    document.getElementById('direct-eval-feedback').value = submission.feedback || '';

    // If pending, disable marks input but maybe allow notes?
    const marksInput = document.getElementById('direct-eval-marks');
    const submitBtn = document.querySelector('#direct-eval-form button');
    
    if (!isSubmitted) {
        marksInput.disabled = true;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.innerHTML = '<i class="fas fa-clock"></i> Waiting for Submission';
    } else {
        marksInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Evaluation';
    }
};

// Handle Evaluate 버튼 from Submissions & Marks table
window.openEvaluationForStudent = function(assignId, subId, studentName) {
    // Switch page
    const navItem = document.querySelector('[data-page="evaluate-assignment"]');
    if (navItem) {
        navItem.click();
        
        // Polling or timeout to wait for page initialization
        setTimeout(() => {
            const select = document.getElementById('eval-assign-select');
            if (select) {
                select.value = assignId;
                loadStudentsForEvaluation().then(() => {
                    selectStudentForEvaluation(assignId, subId, studentName);
                });
            }
        }, 300);
    }
};

// Direct Eval Form submission
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'direct-eval-form') {
        e.preventDefault();
        submitDirectEvaluation();
    }
});

async function submitDirectEvaluation() {
    const id = document.getElementById('direct-eval-assign-id').value;
    const submissionId = document.getElementById('direct-eval-sub-id').value;
    const marks = document.getElementById('direct-eval-marks').value;
    const feedback = document.getElementById('direct-eval-feedback').value;

    if (!submissionId) {
        showToast('Cannot evaluate a pending submission', 'warning');
        return;
    }

    const token = localStorage.getItem('teacherToken') || localStorage.getItem('token');
    
    try {
        const response = await fetch(`${ASSIGNMENTS_API}/${id}/submissions/${submissionId}/evaluate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ marks, feedback })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('Evaluation saved successfully', 'success');
            // Refresh student list to show updated marks/status
            loadStudentsForEvaluation();
        } else {
            showToast(result.message || 'Failed to save evaluation', 'danger');
        }
    } catch (err) {
        console.error('Error saving evaluation:', err);
        showToast('Server error while saving evaluation', 'danger');
    }
}
