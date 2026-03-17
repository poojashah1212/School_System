/**
 * Student Live Session Module
 * Handles viewing and joining live sessions for students
 */

class StudentLiveSessionManager {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || 'http://localhost:5001/api';
        this.token = localStorage.getItem('token');
    }

    /**
     * Load live sessions available for the student
     */
    async loadStudentLiveSessions() {
        const grid = document.getElementById('student-sessions-grid');
        const loading = document.getElementById('student-sessions-loading');
        const empty = document.getElementById('student-sessions-empty');

        if (!grid) return;

        // Show loading
        grid.innerHTML = '';
        loading.style.display = 'block';
        empty.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/student/live-sessions`, {
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

                // Render session cards
                grid.innerHTML = sessions.map(session => this.renderSessionCard(session)).join('');
                loading.style.display = 'none';
            } else {
                loading.style.display = 'none';
                empty.style.display = 'block';
                if (window.studentDashboard) {
                    window.studentDashboard.showMessage(result.message || 'Failed to load sessions', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading live sessions:', error);
            loading.style.display = 'none';
            empty.style.display = 'block';
            if (window.studentDashboard) {
                window.studentDashboard.showMessage('Network error. Please try again.', 'error');
            }
        }
    }

    /**
     * Render a session card for student view
     */
    renderSessionCard(session) {
        const duration = Math.floor((new Date() - new Date(session.startedAt)) / 60000);
        const durationText = duration < 60 ? `${duration} min` : `${Math.floor(duration/60)}h ${duration%60}m`;

        return `
            <div class="student-session-card" style="background: white; border-radius: 16px; padding: 24px; border: 2px solid #10b981; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
                <!-- Live Indicator -->
                <div style="position: absolute; top: 0; right: 24px; background: #ef4444; color: white; padding: 6px 14px; border-radius: 0 0 10px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                    <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
                    LIVE NOW
                </div>

                <!-- Subject Icon -->
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; margin-top: 10px;">
                    <i class="fas fa-book" style="font-size: 24px; color: white;"></i>
                </div>

                <!-- Session Info -->
                <h4 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${session.subjectName}</h4>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">
                    <i class="fas fa-chalkboard" style="margin-right: 6px; color: #3b82f6;"></i>${session.className}
                </p>

                <!-- Teacher Info -->
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">
                    <i class="fas fa-user-tie" style="margin-right: 6px; color: #8b5cf6;"></i>${session.teacherName}
                </p>

                <!-- Time Info -->
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <div style="flex: 1; padding: 10px; background: #f8fafc; border-radius: 8px; text-align: center;">
                        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">Schedule</p>
                        <p style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">${session.startTime} - ${session.endTime}</p>
                    </div>
                    <div style="flex: 1; padding: 10px; background: #f8fafc; border-radius: 8px; text-align: center;">
                        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">Duration</p>
                        <p style="font-weight: 600; color: #10b981; font-size: 0.9rem;">${durationText}</p>
                    </div>
                </div>

                <!-- Meeting Info -->
                <div style="padding: 12px; background: #ecfdf5; border-radius: 8px; margin-bottom: 16px;">
                    <p style="font-size: 0.8rem; color: #059669; margin: 0; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-video"></i>
                        ${session.isZoomMeeting ? 'Zoom Meeting' : 'Video Meeting'} Active
                    </p>
                    ${session.meetingPassword ? `<p style="font-size: 0.75rem; color: #6b7280; margin: 4px 0 0 0;">Password: ${session.meetingPassword}</p>` : ''}
                </div>

                <!-- Join Button -->
                <button onclick="joinStudentSession('${session._id}')" style="width: 100%; padding: 14px; border-radius: 10px; border: none; background: #10b981; color: white; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='#059669'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.background='#10b981'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-sign-in-alt"></i>Join Session Now
                </button>

                <!-- Copy Link Button -->
                <button onclick="copyStudentMeetingLink('${session.meetingLink}', '${session.meetingPassword}')" style="width: 100%; margin-top: 8px; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 500; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-copy"></i>Copy Meeting Link
                </button>
            </div>
        `;
    }

    /**
     * Join a live session as a student
     */
    async joinStudentSession(sessionId) {
        if (window.studentDashboard) {
            window.studentDashboard.showLoading();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/student/live-sessions/${sessionId}/join`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Open the meeting in a new tab
                const meetingUrl = result.data.meetingLink;
                if (meetingUrl) {
                    window.open(meetingUrl, '_blank');
                    if (window.studentDashboard) {
                        window.studentDashboard.showMessage('Joining live session...', 'success');
                    }
                } else {
                    if (window.studentDashboard) {
                        window.studentDashboard.showMessage('Meeting link not found', 'error');
                    }
                }
            } else {
                if (window.studentDashboard) {
                    window.studentDashboard.showMessage(result.message || 'Failed to join session', 'error');
                }
            }
        } catch (error) {
            console.error('Error joining session:', error);
            if (window.studentDashboard) {
                window.studentDashboard.showMessage('Network error. Please try again.', 'error');
            }
        } finally {
            if (window.studentDashboard) {
                window.studentDashboard.hideLoading();
            }
        }
    }
}

// Create global instance
const studentLiveSessionManager = new StudentLiveSessionManager();

// Global helper functions
function loadStudentLiveSessions() {
    studentLiveSessionManager.loadStudentLiveSessions();
}

function joinStudentSession(sessionId) {
    studentLiveSessionManager.joinStudentSession(sessionId);
}

function copyStudentMeetingLink(link, password) {
    const textToCopy = password ? `Meeting Link: ${link}\nPassword: ${password}` : link;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        if (window.studentDashboard) {
            window.studentDashboard.showMessage('Meeting details copied to clipboard!', 'success');
        }
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (window.studentDashboard) {
            window.studentDashboard.showMessage('Meeting details copied to clipboard!', 'success');
        }
    });
}

// Add pulse animation style and page visibility trigger
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // Watch for page visibility changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const joinSessionPage = document.getElementById('page-join-session');
                if (joinSessionPage && joinSessionPage.classList.contains('active')) {
                    loadStudentLiveSessions();
                }
            }
        });
    });

    const joinPage = document.getElementById('page-join-session');
    if (joinPage) {
        observer.observe(joinPage, { attributes: true });
        // Load immediately if already visible
        if (joinPage.classList.contains('active') || getComputedStyle(joinPage).display !== 'none') {
            loadStudentLiveSessions();
        }
    }
});
