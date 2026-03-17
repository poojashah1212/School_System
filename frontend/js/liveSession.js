/**
 * Live Session Module for Teacher Dashboard
 * Handles today's classes, creating/joining live sessions with Zoom integration
 */

class LiveSessionManager {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || 'http://localhost:5001/api';
        this.token = localStorage.getItem('token');
    }

    /**
     * Load today's classes from teacher's timetable
     */
    async loadTodayClasses() {
        const grid = document.getElementById('today-classes-grid');
        const loading = document.getElementById('live-classes-loading');
        const empty = document.getElementById('live-classes-empty');
        const dateDisplay = document.getElementById('today-date-display');

        if (!grid) return;

        // Show loading, hide others
        grid.innerHTML = '';
        loading.style.display = 'block';
        empty.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/live-session/today-classes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update date display
                if (dateDisplay && result.date) {
                    const today = new Date();
                    const dd = String(today.getDate()).padStart(2, '0');
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const yyyy = today.getFullYear();
                    const dayName = result.day || today.toLocaleDateString('en-US', { weekday: 'long' });
                    
                    const formattedDate = `${dd}/${mm}/${yyyy} - ${dayName}`;
                    dateDisplay.innerHTML = `<i class="fas fa-calendar-alt" style="margin-right: 6px; color: var(--primary-blue);"></i>${formattedDate}`;
                }

                const classes = result.data || [];

                if (classes.length === 0) {
                    loading.style.display = 'none';
                    empty.style.display = 'block';
                    return;
                }

                // Render class cards
                grid.innerHTML = classes.map(cls => this.renderClassCard(cls)).join('');
                loading.style.display = 'none';
            } else {
                loading.style.display = 'none';
                empty.style.display = 'block';
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage(result.message || 'Failed to load classes', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading today\'s classes:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
            if (window.teacherDashboard) {
                window.teacherDashboard.showMessage('Network error. Please try again.', 'error');
            }
        }
    }

    /**
     * Render a class card HTML
     */
    renderClassCard(cls) {
        const hasActiveSession = cls.session && cls.session.status === 'active';
        const sessionStatus = hasActiveSession ? 'active' : 'pending';
        const statusText = hasActiveSession ? 'Live' : 'Not Started';
        const buttonText = hasActiveSession ? 'Join' : 'Start';
        const buttonIcon = hasActiveSession ? 'fa-sign-in-alt' : 'fa-play';
        const buttonClass = hasActiveSession ? 'btn-join' : 'btn-start';
        const buttonAction = hasActiveSession 
            ? `joinLiveSession('${cls.session._id}')` 
            : `startLiveSession('${cls.timetableEntryId}', '${cls.classId}', '${cls.subjectName}', '${cls.className}', '${cls.grade}', '${cls.startTime}', '${cls.endTime}')`;

        return `
            <div class="live-card-compact">
                <div class="card-header-compact">
                    <span class="status-badge ${sessionStatus}">${statusText}</span>
                    <span class="grade-badge">Gr ${cls.grade}</span>
                </div>
                <div class="card-body-compact">
                    <h4 class="subject-title">${cls.subjectName}</h4>
                    <div class="info-row">
                        <span class="class-name">${cls.className}</span>
                    </div>
                    <div class="time-range">
                        <i class="fas fa-clock"></i>
                        <span>${cls.startTime} – ${cls.endTime}</span>
                    </div>
                </div>
                <div class="card-footer-compact">
                    <button onclick="${buttonAction}" class="btn-action-compact ${buttonClass}">
                        <i class="fas ${buttonIcon}"></i> ${buttonText}
                    </button>
                </div>
                ${hasActiveSession ? `
                <div class="card-extra">
                    <button onclick="copyMeetingLink('${cls.session.meetingLink}')" class="btn-link-action">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                    <button onclick="endLiveSession('${cls.session._id}')" class="btn-link-action danger">
                        <i class="fas fa-stop-circle"></i> End
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Start a new live session
     */
    async startLiveSession(timetableEntryId, classId, subjectName, className, grade, startTime, endTime) {
        if (window.teacherDashboard) {
            window.teacherDashboard.showLoading();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/live-session/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timetableEntryId,
                    classId,
                    subjectName,
                    className,
                    grade,
                    startTime,
                    endTime
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage(result.message || 'Live session started successfully!', 'success');
                }

                // Open the meeting in a new tab
                if (result.data && result.data.startUrl) {
                    window.open(result.data.startUrl, '_blank');
                } else if (result.data && result.data.meetingLink) {
                    window.open(result.data.meetingLink, '_blank');
                }

                // Reload the classes to show updated status
                this.loadTodayClasses();
            } else {
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage(result.message || 'Failed to start live session', 'error');
                }
            }
        } catch (error) {
            console.error('Error starting live session:', error);
            if (window.teacherDashboard) {
                window.teacherDashboard.showMessage('Network error. Please try again.', 'error');
            }
        } finally {
            if (window.teacherDashboard) {
                window.teacherDashboard.hideLoading();
            }
        }
    }

    /**
     * Join an existing live session
     */
    async joinLiveSession(sessionId) {
        if (window.teacherDashboard) {
            window.teacherDashboard.showLoading();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/live-session/${sessionId}/join`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Open the meeting in a new tab (use startUrl for teacher)
                const meetingUrl = result.data.startUrl || result.data.meetingLink;
                if (meetingUrl) {
                    window.open(meetingUrl, '_blank');
                } else {
                    if (window.teacherDashboard) {
                        window.teacherDashboard.showMessage('Meeting link not found', 'error');
                    }
                }
            } else {
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage(result.message || 'Failed to join session', 'error');
                }
            }
        } catch (error) {
            console.error('Error joining live session:', error);
            if (window.teacherDashboard) {
                window.teacherDashboard.showMessage('Network error. Please try again.', 'error');
            }
        } finally {
            if (window.teacherDashboard) {
                window.teacherDashboard.hideLoading();
            }
        }
    }

    /**
     * Load active sessions for the teacher
     */
    async loadActiveSessions() {
        const grid = document.getElementById('active-sessions-grid');
        const loading = document.getElementById('active-sessions-loading');
        const empty = document.getElementById('active-sessions-empty');

        if (!grid) return;

        grid.innerHTML = '';
        loading.style.display = 'block';
        empty.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/live-session/active`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const sessions = result.data || [];

                if (sessions.length === 0) {
                    loading.style.display = 'none';
                    empty.style.display = 'block';
                    return;
                }

                grid.innerHTML = sessions.map(session => this.renderActiveSessionCard(session)).join('');
                loading.style.display = 'none';
            } else {
                loading.style.display = 'none';
                empty.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading active sessions:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
        }
    }

    /**
     * Render an active session card
     */
    renderActiveSessionCard(session) {
        const duration = Math.floor((new Date() - new Date(session.startedAt)) / 60000);
        const durationText = duration < 60 ? `${duration} min` : `${Math.floor(duration/60)}h ${duration%60}m`;

        return `
            <div class="live-class-card" style="border-color: var(--success);">
                <div class="live-class-header">
                    <div class="live-class-subject">
                        <div class="live-class-icon" style="color: var(--success);">
                            <i class="fas fa-video"></i>
                        </div>
                        <div class="live-class-info">
                            <h4 class="live-class-title">${session.subjectName}</h4>
                            <span class="live-class-subtitle">${session.className} (Grade ${session.grade})</span>
                        </div>
                    </div>
                    <div class="live-class-badge active">
                        <span class="dot" style="animation: pulse 1.5s infinite;"></span>LIVE
                    </div>
                </div>

                <div class="live-class-body">
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <div style="flex: 1; padding: 8px; background: var(--light-bg); border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
                            <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px;">Schedule</p>
                            <p style="font-weight: 600; color: var(--text-dark); font-size: 0.85rem;">${session.startTime} - ${session.endTime}</p>
                        </div>
                        <div style="flex: 1; padding: 8px; background: var(--light-bg); border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
                            <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px;">Duration</p>
                            <p style="font-weight: 600; color: var(--success); font-size: 0.85rem;">${durationText}</p>
                        </div>
                    </div>

                    <div class="live-class-banner">
                        <p style="margin: 0; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-check-circle"></i>
                            ${session.isZoomMeeting ? 'Zoom Meeting Active' : 'Video Meeting Active'}
                        </p>
                        ${session.meetingPassword ? `<p style="font-size: 0.75rem; color: #047857; margin: 4px 0 0 0;">Password: ${session.meetingPassword}</p>` : ''}
                    </div>
                </div>

                <div class="live-class-footer">
                    <div style="display: flex; gap: 8px;">
                        <button onclick="joinLiveSession('${session._id}')" class="live-class-btn btn-join" style="flex: 2;">
                            <i class="fas fa-sign-in-alt"></i>Join
                        </button>
                        <button onclick="copyMeetingLink('${session.meetingLink}')" class="live-class-btn-secondary" style="flex: 1;">
                            <i class="fas fa-copy"></i>Copy
                        </button>
                    </div>
                    <button onclick="endLiveSession('${session._id}')" class="live-class-btn-secondary" style="border-color: #fecaca; color: var(--danger); background: #fef2f2; margin-top: 4px;">
                        <i class="fas fa-stop-circle"></i>End Session
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * End a live session
     */
    async endLiveSession(sessionId) {
        if (!confirm('Are you sure you want to end this session? Students will no longer be able to join.')) {
            return;
        }

        if (window.teacherDashboard) {
            window.teacherDashboard.showLoading();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/live-session/${sessionId}/end`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage('Session ended successfully', 'success');
                }
                // Reload active sessions
                this.loadActiveSessions();
                // Also reload today's classes if on that page
                this.loadTodayClasses();
            } else {
                if (window.teacherDashboard) {
                    window.teacherDashboard.showMessage(result.message || 'Failed to end session', 'error');
                }
            }
        } catch (error) {
            console.error('Error ending session:', error);
            if (window.teacherDashboard) {
                window.teacherDashboard.showMessage('Network error. Please try again.', 'error');
            }
        } finally {
            if (window.teacherDashboard) {
                window.teacherDashboard.hideLoading();
            }
        }
    }
}

// Create global instance
const liveSessionManager = new LiveSessionManager();

// Global helper functions for onclick handlers
function loadTodayClasses() {
    liveSessionManager.loadTodayClasses();
}

function loadActiveSessions() {
    liveSessionManager.loadActiveSessions();
}

function startLiveSession(timetableEntryId, classId, subjectName, className, grade, startTime, endTime) {
    liveSessionManager.startLiveSession(timetableEntryId, classId, subjectName, className, grade, startTime, endTime);
}

function joinLiveSession(sessionId) {
    liveSessionManager.joinLiveSession(sessionId);
}

function endLiveSession(sessionId) {
    liveSessionManager.endLiveSession(sessionId);
}

function copyMeetingLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        if (window.teacherDashboard) {
            window.teacherDashboard.showMessage('Meeting link copied to clipboard!', 'success');
        }
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (window.teacherDashboard) {
            window.teacherDashboard.showMessage('Meeting link copied to clipboard!', 'success');
        }
    });
}

// Page load handlers
document.addEventListener('DOMContentLoaded', () => {
    // Add pulse animation for live indicator
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // Watch for page visibility changes to load data when Manage Class page is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const liveSessionsPage = document.getElementById('page-live-sessions');
                if (liveSessionsPage && liveSessionsPage.classList.contains('active')) {
                    loadTodayClasses();
                    loadActiveSessions();
                }
            }
        });
    });

    // Observe both pages for class changes
    const liveSessionsPage = document.getElementById('page-live-sessions');
    
    if (liveSessionsPage) {
        observer.observe(liveSessionsPage, { attributes: true });
        if (liveSessionsPage.classList.contains('active') || getComputedStyle(liveSessionsPage).display !== 'none') {
            loadTodayClasses();
            loadActiveSessions();
        }
    }
});
