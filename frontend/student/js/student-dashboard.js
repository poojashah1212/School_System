// SmartSchool Student Dashboard JavaScript

// Global state
let currentUser = null;
let tcAllEvents = [];
let tcCurrentDate = new Date();
const ACADEMIC_API_BASE = '/api/academic';
const USER_API_BASE = '/api/users';
const TIMETABLE_API_BASE = '/api/timetable';
const ANNOUNCEMENT_API = '/api/admin/announcements';

document.addEventListener('DOMContentLoaded', function () {
    // Check if student is logged in
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (!token) {
        window.location.href = '../../html/login.html';
        return;
    }

    currentUser = userData;

    // Initialize UI
    initDashboard();
    setupNavigation();
    setupSidebar();
    loadDashboardStats();
    loadTodaySchedule();
    loadRecentAnnouncements();
});

function initDashboard() {
    // Set student name in profile
    const nameDisplay = document.getElementById('student-name-display');
    if (nameDisplay && currentUser.fullName) {
        nameDisplay.textContent = currentUser.fullName;
    }
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const menuToggle = document.getElementById('menu-toggle');

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            (!sidebarToggle || !sidebarToggle.contains(e.target)) &&
            (!menuToggle || !menuToggle.contains(e.target))) {
            sidebar.classList.remove('active');
        }
    });
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
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        });
    });
}

function loadPageData(pageId) {
    switch (pageId) {
        case 'dashboard':
            loadDashboardStats();
            loadTodaySchedule();
            loadRecentAnnouncements();
            break;
        case 'view-profile':
            loadProfileData();
            break;
        case 'view-calendar':
            loadAcademicCalendar();
            break;
        case 'weekly-schedule':
            loadStudentTimetable();
            break;
        case 'view-announcements':
            loadAnnouncements();
            break;
        case 'view-attendance':
            loadAttendanceData();
            break;
        case 'pending-assignments':
            loadAssignments('pending');
            break;
        case 'submitted-assignments':
            loadAssignments('submitted');
            break;
        case 'view-materials':
            loadStudyMaterials();
            break;
        case 'join-session':
            loadLiveSessions();
            break;
        case 'view-results':
            loadResults();
            break;
        case 'change-password':
            initChangePassword();
            break;
    }
}

// ────────────────────────────────────────────────
// Dashboard Stats & Schedule
// ────────────────────────────────────────────────

function loadDashboardStats() {
    const stats = {
        subjects: 8,
        lessons: 4,
        attendance: '95%',
        assignments: 3
    };

    const mapping = {
        'student-subject-count': stats.subjects,
        'student-lesson-count': stats.lessons,
        'student-attendance-rate': stats.attendance,
        'student-assignment-count': stats.assignments
    };

    for (const [id, value] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

async function loadTodaySchedule() {
    const container = document.getElementById('today-schedule-container');
    if (!container) return;

    // Placeholder data
    const schedule = [
        { time: '08:00 AM', subject: 'Mathematics', grade: 'Grade 10-A', type: 'Live' },
        { time: '09:30 AM', subject: 'Physics', grade: 'Grade 10-A', type: 'Class' },
        { time: '11:00 AM', subject: 'English', grade: 'Grade 10-A', type: 'Lab' }
    ];

    container.innerHTML = schedule.map(item => `
        <div class="schedule-item" style="display: flex; align-items: center; gap: 16px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px;">
            <div class="schedule-time" style="min-width: 80px; font-weight: 700; color: #3b82f6; font-size: 13px;">${item.time}</div>
            <div class="schedule-info">
                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.subject}</div>
                <div style="color: #64748b; font-size: 12px;">${item.grade} • ${item.type}</div>
            </div>
            <button class="btn-join" style="margin-left: auto; padding: 4px 12px; border-radius: 20px; border: none; background: #3b82f6; color: white; font-size: 12px; cursor: pointer;">Join</button>
        </div>
    `).join('');
}

// ────────────────────────────────────────────────
// Announcements
// ────────────────────────────────────────────────

async function loadAnnouncements() {
    const container = document.getElementById('student-announcements-list');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;">No announcements found.</div>`;
            return;
        }

        renderAnnouncementsList(result.data, container);
    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444;">Failed to load.</div>`;
    }
}

async function loadRecentAnnouncements() {
    const container = document.getElementById('recent-announcements-container');
    if (!container) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-info-circle" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px;"></i>
                    <p style="font-size: 13px; color: #94a3b8; margin: 0;">No recent announcements.</p>
                </div>`;
            return;
        }

        const recent = result.data.slice(0, 3);
        container.innerHTML = recent.map(notice => {
            const config = getCategoryConfig(notice.category);
            return `
                <div class="recent-announcement-item" 
                    style="padding: 14px; border-radius: 12px; background: #fff; border: 1px solid #f1f5f9; border-left: 4px solid ${config.color}; margin-bottom: 10px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
                    onclick="document.querySelector('[data-page=\\'view-announcements\\']').click()"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)';"
                    onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="${config.icon}" style="color: ${config.color}; font-size: 12px;"></i>
                            <h5 style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 0;">${notice.title}</h5>
                        </div>
                        <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${formatAnnouncementDate(notice.createdAt)}</span>
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${notice.content}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = `<p style="font-size: 12px; color: #ef4444; text-align: center;">Failed to load announcements.</p>`;
    }
}

function renderAnnouncementsList(announcements, container) {
    container.innerHTML = announcements.map(notice => {
        const config = getCategoryConfig(notice.category);
        const date = new Date(notice.createdAt).toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        return `
            <div class="notice-card" style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 16px; border-left: 5px solid ${config.color}; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${config.color}15; display: flex; align-items: center; justify-content: center; color: ${config.color};">
                            <i class="${config.icon}" style="font-size: 18px;"></i>
                        </div>
                        <div>
                            <h4 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0;">${notice.title}</h4>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                                <span style="font-size: 11px; font-weight: 600; color: ${config.color}; text-transform: uppercase;">${notice.category || 'General'}</span>
                                <span style="color: #cbd5e1;">•</span>
                                <span style="font-size: 12px; color: #64748b;">By ${notice.author ? notice.author.fullName : 'Administration'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #94a3b8;"><i class="fas fa-calendar-alt"></i> ${date}</div>
                    </div>
                </div>
                <div style="font-size: 14px; color: #475569; line-height: 1.6; padding-left: 52px;">
                    ${notice.content}
                </div>
            </div>
        `;
    }).join('');
}

function getCategoryConfig(category) {
    const configs = {
        'Urgent': { icon: 'fas fa-exclamation-circle', color: '#ef4444' },
        'Holiday': { icon: 'fas fa-umbrella-beach', color: '#f59e0b' },
        'Event': { icon: 'fas fa-star', color: '#8b5cf6' },
        'Academic': { icon: 'fas fa-book-open', color: '#3b82f6' },
        'General': { icon: 'fas fa-info-circle', color: '#10b981' }
    };
    return configs[category] || configs['General'];
}

function formatAnnouncementDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ────────────────────────────────────────────────
// Timetable
// ────────────────────────────────────────────────

async function loadStudentTimetable() {
    const container = document.getElementById('student-weekly-timetable-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #3b82f6; margin-bottom: 16px;"></i>
            <p style="color: #64748b;">Loading your weekly schedule...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/student/timetable', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: #94a3b8;">
                    <i class="fas fa-calendar-times" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h4 style="color: #64748b; margin-bottom: 8px;">No Schedule Found</h4>
                    <p style="font-size: 14px;">Your class timetable hasn't been generated yet. Please contact the administrator.</p>
                </div>
            `;
            return;
        }

        renderStudentTimetableGrid(result.data, container);

    } catch (err) {
        console.error('Error loading timetable:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Failed to load your timetable. Please try again later.</p>
            </div>
        `;
    }
}

function renderStudentTimetableGrid(sessions, container) {
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
        return timeStr;
    };

    sessions.forEach(item => {
        const startTimeDisplay = formatTime(item.startTime);
        const timeKey = `${startTimeDisplay}`;
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
        <div class="timetable-image-style" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                <thead>
                    <tr style="background: #2563eb;">
                        <th style="padding: 18px 12px; color: white; font-weight: 600; font-size: 14px; text-align: center; border: 1px solid rgba(255,255,255,0.2); width: 140px;">Time Slot</th>
                        ${days.map(d => `<th style="padding: 18px 12px; color: white; font-weight: 600; font-size: 14px; text-align: center; border: 1px solid rgba(255,255,255,0.2);">${d === 'MON' ? 'Monday' : d === 'TUE' ? 'Tuesday' : d === 'WED' ? 'Wednesday' : d === 'THU' ? 'Thursday' : d === 'FRI' ? 'Friday' : d === 'SAT' ? 'Saturday' : d}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    sortedTimeKeys.forEach((timeKey) => {
        // Find the end time for this slot from the first session found
        let endTimeDisplay = '';
        for (let di of dayIndices) {
            if (slots[timeKey][di]) {
                endTimeDisplay = formatTime(slots[timeKey][di].endTime);
                break;
            }
        }
        
        const slotDisplay = endTimeDisplay ? `${timeKey} - ${endTimeDisplay}` : timeKey;

        html += `
            <tr>
                <td style="padding: 24px 12px; font-weight: 700; color: #1e293b; font-size: 13px; text-align: center; border: 1px solid #e2e8f0; background: #fff;">
                    ${slotDisplay}
                </td>
        `;

        dayIndices.forEach(dayIdx => {
            const session = slots[timeKey][dayIdx];
            if (session) {
                html += `
                    <td style="padding: 15px 12px; border: 1px solid #e2e8f0; vertical-align: top; background: #fff;">
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                            <div style="font-weight: 400; color: #475569; font-size: 13px;">${session.subjectName || session.title}</div>
                            <div style="font-size: 12px; color: #64748b; font-weight: 400;">${session.teacherName || 'TBA'}</div>
                        </div>
                    </td>
                `;
            } else {
                html += `<td style="border: 1px solid #e2e8f0; text-align: center; color: #cbd5e1; font-size: 16px;">—</td>`;
            }
        });
        html += '</tr>';
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

// ────────────────────────────────────────────────
// Assignments & Materials
// ────────────────────────────────────────────────

function loadAssignments(status) {
    const container = document.getElementById(`${status}-assignments-list`);
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;">No ${status} assignments found.</div>`;
}

async function loadStudyMaterials() {
    const container = document.getElementById('study-materials-container');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-cell" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3b82f6; margin-bottom: 16px;"></i>
            <p style="color: #64748b;">Loading study materials...</p>
        </div>
    `;

    try {
        // Use the new dedicated student materials API via apiService
        const result = await apiService.get('/api/student/materials');

        if (!result.success || !result.materials || result.materials.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 100px 20px; color: #94a3b8; background: white; border-radius: 24px; border: 2px dashed #e2e8f0;">
                    <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #cbd5e1;">
                        <i class="fas fa-book-open" style="font-size: 32px;"></i>
                    </div>
                    <h3 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-bottom: 8px;">No Materials Yet</h3>
                    <p style="font-size: 14px; max-width: 300px; margin: 0 auto 24px; line-height: 1.6;">Your teachers haven't uploaded any study materials for your class yet.</p>
                    <button onclick="loadStudyMaterials()" class="btn-primary" style="padding: 10px 24px; border-radius: 12px; font-weight: 600;">
                        <i class="fas fa-sync-alt" style="margin-right: 8px;"></i> Check Again
                    </button>
                </div>
            `;
            return;
        }

        // Store globally for searching
        window.allStudyMaterials = result.materials;
        renderMaterialsList(result.materials);

    } catch (err) {
        console.error('Error loading study materials:', err);
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 100px 20px; color: #ef4444; background: #fffcfc; border-radius: 24px; border: 1px solid #fee2e2;">
                <div style="width: 80px; height: 80px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                </div>
                <h3 style="color: #991b1b; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Failed to Load</h3>
                <p style="color: #b91c1c; font-size: 14px; max-width: 300px; margin: 0 auto 24px; line-height: 1.6;">We couldn't retrieve your study materials. This might be a connection issue.</p>
                <button onclick="loadStudyMaterials()" class="btn-primary" style="background: #ef4444; padding: 10px 24px; border-radius: 12px; font-weight: 600;">
                    <i class="fas fa-redo" style="margin-right: 8px;"></i> Try Again
                </button>
            </div>
        `;
    }
}

function renderMaterialsList(materials) {
    const container = document.getElementById('study-materials-container');
    if (!container) return;

    if (materials.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">No matching materials found.</div>`;
        return;
    }

    container.innerHTML = materials.map(material => {
        // Determine icon and color based on type
        let typeIcon = 'fa-file-alt';
        let typeColor = '#64748b';
        
        if (material.type === 'PDF') {
            typeIcon = 'fa-file-pdf';
            typeColor = '#ef4444';
        } else if (material.type === 'VIDEO' || material.type === 'MP4') {
            typeIcon = 'fa-file-video';
            typeColor = '#3b82f6';
        } else if (material.type === 'DOC') {
            typeIcon = 'fa-file-word';
            typeColor = '#2563eb';
        }

        return `
            <div class="material-card">
                <div class="material-card-header">
                    <div class="material-type-icon" style="background: ${typeColor}15; color: ${typeColor};">
                        <i class="fas ${typeIcon}" style="font-size: 24px;"></i>
                    </div>
                    <div style="flex-grow: 1; overflow: hidden;">
                        <h4 class="material-title" title="${material.title}">${material.title}</h4>
                        <div class="material-meta">
                            <span class="material-type-badge" style="color: ${typeColor}; background: ${typeColor}10;">${material.type}</span>
                            <span class="material-subject"><i class="fas fa-circle" style="font-size: 4px; vertical-align: middle; margin-right: 6px; opacity: 0.5;"></i>${material.subject || 'General'}</span>
                        </div>
                    </div>
                </div>
                
                <p class="material-description">
                    ${material.description || 'No description provided.'}
                </p>
                
                <div class="material-footer">
                    <div class="material-teacher-info">
                        <span class="material-teacher-label">Uploaded By</span>
                        <span class="material-teacher-name">${material.teacher ? (material.teacher.fullName || material.teacher) : 'Teacher'}</span>
                    </div>
                    <a href="${material.fileUrl}" target="_blank" class="btn-view-material">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

window.filterMaterials = function(query) {
    if (!window.allStudyMaterials) return;
    
    const filtered = window.allStudyMaterials.filter(m => 
        m.title.toLowerCase().includes(query.toLowerCase()) || 
        (m.subject && m.subject.toLowerCase().includes(query.toLowerCase())) ||
        (m.description && m.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    renderMaterialsList(filtered);
};


// ────────────────────────────────────────────────
// Attendance & Results
// ────────────────────────────────────────────────

function loadAttendanceData() {
    const container = document.getElementById('attendance-data-container');
    if (!container) return;
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px;">
            <div class="dashboard-card" style="text-align: center; padding: 40px;">
                <h2 style="font-size: 48px; color: #10b981; margin-bottom: 10px;">95%</h2>
                <p style="color: #64748b;">Overall Attendance Rate</p>
            </div>
            <div class="dashboard-card" style="padding: 20px;">
                <h4 style="margin-bottom: 15px;">Monthly Summary</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Present</span>
                    <span style="color: #10b981; font-weight: 600;">22 Days</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Absent</span>
                    <span style="color: #ef4444; font-weight: 600;">1 Day</span>
                </div>
            </div>
        </div>
    `;
}

function loadResults() {
    const container = document.getElementById('results-data-container');
    if (!container) return;
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;">No exam results published yet.</div>`;
}

// ────────────────────────────────────────────────
// Live Sessions
// ────────────────────────────────────────────────

function loadLiveSessions() {
    const container = document.getElementById('live-sessions-container');
    if (!container) return;
    container.innerHTML = `
        <div class="dashboard-card" style="text-align: center; padding: 60px;">
            <i class="fas fa-video-slash" style="font-size: 48px; color: #cbd5e1; margin-bottom: 20px;"></i>
            <h3>No Active Live Sessions</h3>
            <p style="color: #64748b;">When a teacher starts a live class, it will appear here.</p>
        </div>
    `;
}

// ────────────────────────────────────────────────
// Profile & Auth
// ────────────────────────────────────────────────

async function loadProfileData() {
    // Fill profile fields with currentUser data
    const mapping = {
        'profile-fullName': currentUser.fullName,
        'profile-email': currentUser.email,
        'profile-userId': currentUser.userId || currentUser.id,
        'profile-role': currentUser.role,
        'profile-city': currentUser.city,
        'profile-state': currentUser.state,
        'profile-mobile': currentUser.mobileNo
    };

    for (const [id, value] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || 'N/A';
    }
}

async function loadAcademicCalendar() {
    tcCurrentDate = new Date();
    await tcFetchEvents();
}

async function tcFetchEvents() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/academic-year/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        tcAllEvents = result.success ? result.data : [];
    } catch (err) {
        console.error('Error fetching calendar events:', err);
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
        return (start.getFullYear() === year && start.getMonth() === month) ||
            (end.getFullYear() === year && end.getMonth() === month);
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (monthEvents.length === 0) {
        listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;font-size:13px;">No events or holidays this month.</p>`;
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
                        const badgeBg = isHoliday ? `${badgeColor}15` : `${badgeColor}15`;

                        return `
                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 8px 15px; color: #475569; font-family: monospace; font-size: 12px; white-space: nowrap;">${displayDate(e.startDate, e.endDate)}</td>
                                <td style="padding: 8px 15px; color: #1e293b; font-weight: 500;">${e.title || e.name}</td>
                                <td style="padding: 8px 15px; text-align: right;">
                                    <span style="font-size: 10px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${e.type}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ────────────────────────────────────────────────
// Change Password
// ────────────────────────────────────────────────

function initChangePassword() {
    const form = document.getElementById('student-change-password-form');
    if (!form) return;

    // Remove existing listener to avoid duplicates if page reloaded
    form.removeEventListener('submit', handleChangePassword);
    form.addEventListener('submit', handleChangePassword);
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'danger');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Password updated successfully! Logging out...', 'success');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showToast(result.message || 'Failed to update password', 'danger');
        }
    } catch (err) {
        console.error('Change password error:', err);
        showToast('An error occurred. Please try again.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    }
}

// Util functions
window.showToast = function (message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) {
        // Fallback to simple toast if element not found
        const fallbackToast = document.createElement('div');
        fallbackToast.className = `toast toast-${type}`;
        fallbackToast.style = `
            position: fixed; top: 20px; right: 20px; padding: 12px 24px; 
            background: ${type === 'danger' ? '#ef4444' : '#10b981'}; color: white;
            border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        fallbackToast.textContent = message;
        document.body.appendChild(fallbackToast);
        setTimeout(() => fallbackToast.remove(), 3000);
        return;
    }
    msgEl.textContent = message;
    toast.className = `notification-toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 5000);
};

window.hideToast = function () {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        toast.classList.remove('show');
    }
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '../../html/login.html';
};

// Missing UI Utility Functions
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    if (sidebar) sidebar.classList.toggle('active');
    if (mainContent) mainContent.classList.toggle('expanded');
};

window.toggleNavGroup = function(el) {
    const navGroup = el.closest('.nav-group');
    if (navGroup) {
        navGroup.classList.toggle('active');
    }
};

window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        window.logout();
    }
};

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    // Profile Dropdown
    const profile = document.querySelector('.navbar-profile');
    const dropdown = document.getElementById('profile-dropdown');
    if (profile && dropdown && !profile.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});
