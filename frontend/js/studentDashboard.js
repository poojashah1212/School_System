class StudentDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5001/api';
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '/html/login.html';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Session tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchPage(pageName) {
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show selected page
        document.getElementById(`${pageName}-page`).classList.remove('hidden');

        // Load page-specific data
        switch(pageName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'sessions':
                this.loadSessionsData();
                break;
            case 'results':
                this.loadResults();
                break;
        }
    }

    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        if (response.status === 401) {
            this.logout();
            return null;
        }

        return response;
    }

    async loadUserData() {
        try {
            const response = await this.apiCall('/users/profile');
            if (response && response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Update sidebar user info
        document.getElementById('user-name').textContent = this.currentUser.fullName;
        
        // Update welcome section
        document.getElementById('student-name').textContent = this.currentUser.fullName;
        
        // Update profile page if it exists
        const profileFullName = document.getElementById('profile-fullname');
        if (profileFullName) {
            profileFullName.textContent = this.currentUser.fullName;
        }
        
        // Update profile image in sidebar
        const sidebarAvatar = document.querySelector('.user-avatar');
        if (sidebarAvatar) {
            if (this.currentUser.profileImage) {
                sidebarAvatar.innerHTML = `<img src="${this.getProfileImageUrl(this.currentUser.profileImage)}" alt="Profile" class="profile-img">`;
            } else {
                sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';
            }
        }
        
    }
    
    getProfileImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Otherwise, construct the full URL
        return `${this.apiBaseUrl.replace('/api', '')}${imagePath}`;
    }

    async loadDashboardData() {
        this.showLoading();
        try {
            const resultsResponse = await this.apiCall('/users/quiz/results');
            let results = [];

            if (resultsResponse && resultsResponse.ok) {
                const resultsData = await resultsResponse.json();
                results = resultsData.results || [];
            }

            this.updateDashboardStats(results);
            this.updateRecentActivity(results);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateDashboardStats(results) {
        document.getElementById('completed-quizzes').textContent = results.length;
        document.getElementById('total-attempts').textContent = results.length;

        if (results.length > 0) {
            const scores = results.map(r => (r.score / r.totalMarks) * 100);
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            const best = Math.max(...scores);

            document.getElementById('average-score').textContent = `${average.toFixed(1)}%`;
            document.getElementById('best-score').textContent = `${best.toFixed(1)}%`;
        } else {
            document.getElementById('average-score').textContent = '0%';
            document.getElementById('best-score').textContent = '0%';
        }
    }

    updateRecentActivity(results) {
        const activityList = document.getElementById('activity-list');
        
        if (results.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">No recent activity</p>
                        <p class="activity-time">Start taking tests to see your progress</p>
                    </div>
                </div>
            `;
            return;
        }

        const recentResults = results.slice(0, 5);
        activityList.innerHTML = recentResults.map(result => {
            const percentage = ((result.score / result.totalMarks) * 100).toFixed(1);
            const date = new Date(result.createdAt).toLocaleDateString();
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">Completed ${result.quizId?.title || 'Test'}</p>
                        <p class="activity-time">Score: ${result.score}/${result.totalMarks} (${percentage}%) - ${date}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadResults() {
        this.showLoading();
        try {
            const response = await this.apiCall('/users/quiz/results');
            
            if (response && response.ok) {
                const data = await response.json();
                this.displayResults(data.results || []);
            } else {
                this.showMessage('Failed to load results', 'error');
            }
        } catch (error) {
            console.error('Error loading results:', error);
            this.showMessage('Error loading results', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(results) {
        const tbody = document.getElementById('results-tbody');
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-results">No quiz results available</td></tr>';
            document.getElementById('total-attempts').textContent = '0';
            document.getElementById('results-average').textContent = '0%';
            return;
        }

        // Update summary
        document.getElementById('total-attempts').textContent = results.length;
        
        const scores = results.map(r => (r.score / r.totalMarks) * 100);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        document.getElementById('results-average').textContent = `${average.toFixed(1)}%`;

        // Display results
        tbody.innerHTML = results.map(result => {
            const percentage = ((result.score / result.totalMarks) * 100).toFixed(1);
            const date = new Date(result.createdAt).toLocaleDateString();
            
            return `
                <tr>
                    <td>${result.quizId?.title || 'Unknown Quiz'}</td>
                    <td>${result.quizId?.subject || 'N/A'}</td>
                    <td>${result.score}</td>
                    <td>${result.totalMarks}</td>
                    <td><span class="percentage-badge ${percentage >= 70 ? 'good' : percentage >= 50 ? 'average' : 'poor'}">${percentage}%</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    }


    logout() {
        localStorage.removeItem('token');
        window.location.href = '/html/login.html';
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    showMessage(text, type = 'info') {
        const container = document.getElementById('message-container');
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.innerHTML = `${text}<button class="message-close">&times;</button>`;
        container.appendChild(msg);

        setTimeout(() => msg.remove(), 5000);
        msg.querySelector('.message-close').addEventListener('click', () => msg.remove());
    }

    // Session Management Functions
    async loadSessionsData() {
        this.showLoading();
        try {
            // Load available sessions
            await this.loadAvailableSessions();
            // Load confirmed sessions
            await this.loadConfirmedSessions();
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showMessage('Error loading sessions', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadAvailableSessions() {
        try {
            const response = await this.apiCall('/sessions/mysessions');
            
            if (response && response.ok) {
                const data = await response.json();
                this.displayAvailableSessions(data.sessions || []);
            } else {
                this.showMessage('Failed to load available sessions', 'error');
            }
        } catch (error) {
            console.error('Error loading available sessions:', error);
            this.showMessage('Error loading available sessions', 'error');
        }
    }

    async loadConfirmedSessions() {
        try {
            const response = await this.apiCall('/sessions/my-confirmed-sessions');
            
            if (response && response.ok) {
                const data = await response.json();
                this.displayConfirmedSessions(data.sessions || []);
            } else {
                this.showMessage('Failed to load confirmed sessions', 'error');
            }
        } catch (error) {
            console.error('Error loading confirmed sessions:', error);
            this.showMessage('Error loading confirmed sessions', 'error');
        }
    }

    displayAvailableSessions(sessions) {
        const container = document.getElementById('available-sessions');
        
        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Available Sessions</h3>
                    <p>Check back later for new session slots</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-card">
                <div class="session-header">
                    <h4>${session.title || 'Session'}</h4>
                    <span class="session-date">${session.date}</span>
                </div>
                <div class="session-slots">
                    <h5>Available Time Slots:</h5>
                    <div class="slots-list">
                        ${session.slots.map(slot => `
                            <div class="slot-item">
                                <span class="slot-time">${slot.startTime} - ${slot.endTime}</span>
                                <button class="btn-book" onclick="studentDashboard.bookSession('${session.sessionId}', '${slot.startTime}')">
                                    Book
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayConfirmedSessions(sessions) {
        const container = document.getElementById('confirmed-sessions');
        
        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <h3>No Confirmed Sessions</h3>
                    <p>Book a session to see it here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-card confirmed">
                <div class="session-header">
                    <h4>${session.title || 'Session'}</h4>
                    <span class="session-date">${session.date}</span>
                </div>
                <div class="session-details">
                    <p><strong>Time:</strong> ${session.startTime} - ${session.endTime}</p>
                    <p><strong>Teacher:</strong> ${session.teacherName || 'Teacher'}</p>
                </div>
                <div class="session-status">
                    <span class="status-badge confirmed">Confirmed</span>
                </div>
            </div>
        `).join('');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async bookSession(sessionId, startTime) {
        try {
            this.showLoading();
            
            const response = await this.apiCall('/sessions/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: sessionId,
                    startTime: startTime
                })
            });

            if (response && response.ok) {
                const result = await response.json();
                this.showMessage('Session booked successfully!', 'success');
                
                // Reload sessions data
                await this.loadSessionsData();
                
                // Show booking confirmation
                this.showBookingConfirmation(result.booking);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to book session', 'error');
            }
        } catch (error) {
            console.error('Error booking session:', error);
            this.showMessage('Error booking session', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showBookingConfirmation(booking) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Session Confirmed!</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="booking-confirmation">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4>Your session has been booked</h4>
                    <div class="booking-details">
                        <p><strong>Date:</strong> ${booking.date}</p>
                        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
                    </div>
                    <p class="booking-note">You will receive a reminder before the session starts.</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('show');
    }
}

// Initialize dashboard
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboard();
});
