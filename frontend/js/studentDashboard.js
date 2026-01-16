class StudentDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5001/api';
        this.currentUser = null;
        this.studentTimezone = null;
        this.init();
    }

    async init() {
        try {
            await this.loadComponents();
            await this.checkAuthentication();
            this.loadUserData();
            this.setupNavigation();

            // Fallback: Setup dropdown after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.setupDropdownFallback();
            }, 100);
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.redirectToLogin();
        }
    }

    setupDropdownFallback() {
        const toggle = document.getElementById('studentDropdownMenuButton');
        const menu = document.querySelector('.dropdown-menu');

        if (toggle && menu) {
            console.log('Setting up fallback dropdown handler');

            // Remove any existing listeners to prevent duplicates
            toggle.replaceWith(toggle.cloneNode(true));
            const newToggle = document.getElementById('studentDropdownMenuButton');

            newToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Fallback dropdown clicked');

                menu.classList.toggle('show');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        } else {
            console.log('Fallback: Elements not found', { toggle, menu });
        }
    }

    async loadComponents() {
        try {
            // Use the component loader to load sidebar and header
            if (window.componentLoader) {
                await window.componentLoader.loadAllComponents('student');
            } else {
                // Fallback to manual loading if componentLoader is not available
                const headerResponse = await fetch('../components/studentHeader.html');
                const headerHtml = await headerResponse.text();
                const mainElement = document.querySelector('.main');
                if (mainElement) {
                    mainElement.insertAdjacentHTML('afterbegin', headerHtml);
                }

                const sidebarResponse = await fetch('../components/studentSidebar.html');
                const sidebarHtml = await sidebarResponse.text();
                const dashboardElement = document.querySelector('.dashboard');
                if (dashboardElement) {
                    dashboardElement.insertAdjacentHTML('afterbegin', sidebarHtml);
                }
            }

            // Setup event listeners after components are loaded
            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading components:', error);
            throw error;
        }
    }

    async checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            this.currentUser = data.user;

            // Verify user is a student
            if (this.currentUser.role !== 'student') {
                this.redirectToTeacherDashboard();
                return;
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.redirectToLogin();
        }
    }

    setupEventListeners() {
        // Profile dropdown
        const profileDropdownToggle = document.getElementById('studentDropdownMenuButton');
        const profileDropdownMenu = document.querySelector('.dropdown-menu');
        const viewProfileBtn = document.getElementById('studentViewProfileBtn');
        const logoutBtn = document.getElementById('studentLogoutBtn');

        if (profileDropdownToggle && profileDropdownMenu) {
            profileDropdownToggle.addEventListener('click', async (e) => {
                e.stopPropagation();
                console.log('Dropdown toggle clicked'); // Debug log

                // Load fresh profile data when dropdown opens
                if (!profileDropdownMenu.classList.contains('show')) {
                    await this.loadProfileData();
                }

                profileDropdownMenu.classList.toggle('show');
                console.log('Dropdown menu classes:', profileDropdownMenu.classList); // Debug log
            });

            document.addEventListener('click', () => {
                profileDropdownMenu.classList.remove('show');
            });
        } else {
            console.log('Dropdown elements not found:', {
                toggle: profileDropdownToggle,
                menu: profileDropdownMenu
            }); // Debug log
        }

        // View Profile button
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfileModal();
            });
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Quick action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e.currentTarget);
            });
        });

        // View all buttons
        const viewAllButtons = document.querySelectorAll('.btn');
        viewAllButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleViewAll(e.currentTarget);
            });
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    loadUserData() {
        if (!this.currentUser) return;

        // Set student timezone with fallback to browser timezone
        this.studentTimezone = TimezoneUtils.getStudentTimezone(this.currentUser);
        console.log('Student timezone:', this.studentTimezone);
        console.log('User profile timezone:', this.currentUser.timezone);
        console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

        // Update student name in header
        const studentNameElement = document.getElementById('student-name');
        if (studentNameElement) {
            studentNameElement.textContent = this.currentUser.fullName || 'Student Name';
        }

        // Update profile image in header if available
        if (this.currentUser.profileImage) {
            const profileImage = document.getElementById('student-profile-img');
            if (profileImage) {
                profileImage.src = this.currentUser.profileImage;
            }
        }

        // Load dashboard data
        this.loadDashboardData();
    }

    async loadMySessions() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBaseUrl}/sessions/mysessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load sessions');
            }

            const data = await response.json();
            this.renderMySessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showNotification('Failed to load sessions', 'error');
        }
    }

    renderMySessions(data) {
        console.log('Sessions data from backend:', data);
        console.log('Current student timezone:', this.studentTimezone);
        
        const mainContent = document.getElementById('main-content');
        const dashboardPage = document.getElementById('dashboard-page');

        // Hide dashboard page and show main content
        if (dashboardPage) {
            dashboardPage.style.display = 'none';
        }

        if (!mainContent) {
            console.error('main-content element not found');
            return;
        }

        mainContent.style.display = 'block';

        if (!data.success || !data.sessions || data.sessions.length === 0) {
            mainContent.innerHTML = `
                <div class="sessions-container">
                    <div class="sessions-header">
                        <h2>My Sessions</h2>
                        <div class="header-info">
                            ${data.teacher ? `
                            <div class="teacher-info">
                                <i class="fas fa-user-tie"></i>
                                <span>${data.teacher.fullName}</span>
                            </div>` : ''}
                            <div class="timezone-info">
                                <i class="fas fa-globe"></i>
                                <span>Times shown in: ${TimezoneUtils.getDisplayTimezone(this.studentTimezone)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>No Sessions Available</h3>
                        <p>No sessions are currently available. Please check back later.</p>
                    </div>
                </div>
            `;
            return;
        }

        const sessionsHtml = data.sessions.map(session => {
            console.log('Session:', session.title, 'Date:', session.date, 'Slots:', session.availableSlots);
            
            // Backend returns dates in Asia/Kolkata timezone, convert to student's timezone
            let displayDate = session.date || 'Date not specified';
            
            try {
                const moment = window.moment;
                if (moment && session.date) {
                    // Parse the date from backend (assuming DD-MM-YYYY format in Asia/Kolkata)
                    const dateInKolkata = moment.tz(session.date.split('/')[0], 'DD-MM-YYYY', 'Asia/Kolkata');
                    // Convert to student's timezone and format
                    displayDate = dateInKolkata.clone().tz(this.studentTimezone).format('DD-MM-YYYY/dddd');
                    console.log('Converted date from Asia/Kolkata to', this.studentTimezone, ':', session.date, '->', displayDate);
                }
            } catch (error) {
                console.error('Error converting session date:', error);
                displayDate = session.date || 'Date not specified';
            }
            
            return `
            <div class="session-card ${session.type === 'personal' ? 'personal-session' : 'common-session'}">
                <div class="session-header">
                    <div class="session-title-section">
                        <h3>${session.title}</h3>
                        <span class="session-type-badge ${session.type}">
                            ${session.type === 'personal' ? '<i class="fas fa-user"></i> Personal Session' : '<i class="fas fa-users"></i> Common Session'}
                        </span>
                    </div>
                </div>
                <div class="session-details">
                    <div class="session-info">
                        <i class="fas fa-clock"></i>
                        <span>Duration: ${session.sessionDuration || '60'} minutes</span>
                    </div>
                    <div class="session-info">
                        <i class="fas fa-calendar"></i>
                        <span>${displayDate}</span>
                    </div>
                </div>
                <div class="available-slots">
                    <h4>Available Slots (${session.availableSlots ? session.availableSlots.length : 0})</h4>
                    <div class="slots-grid">
                        ${session.availableSlots && session.availableSlots.length > 0 ? session.availableSlots.map(slot => {
                            // Ensure slot times are properly formatted in student's timezone
                            console.log('Slot before formatting:', slot.startTime, '-', slot.endTime);
                            const startTime = this.formatSlotTime(slot.startTime);
                            const endTime = this.formatSlotTime(slot.endTime);
                            console.log('Slot after formatting:', startTime, '-', endTime);
                            return `
                            <button class="slot-btn" onclick="studentDashboard.bookSession('${session.sessionId || session._id}', '${slot.startTime}')">
                                <div class="slot-time">${startTime} - ${endTime}</div>
                            </button>
                        `;}).join('') : '<p class="no-slots">No available slots</p>'}
                    </div>
                </div>
            </div>
        `;
        }).join('');

        mainContent.innerHTML = `
            <div class="sessions-container">
                <div class="sessions-header">
                    <h2>My Sessions</h2>
                    <div class="header-info">
                        ${data.teacher ? `
                        <div class="teacher-info">
                            <i class="fas fa-user-tie"></i>
                            <span>${data.teacher.fullName}</span>
                        </div>` : ''}
                        <div class="timezone-info">
                            <i class="fas fa-globe"></i>
                            <span>Times shown in: ${TimezoneUtils.getDisplayTimezone(this.studentTimezone)}</span>
                        </div>
                    </div>
                </div>
                <div class="sessions-grid">
                    ${sessionsHtml}
                </div>
                ${data.pagination ? `
                <div class="pagination-info">
                    <p>Page ${data.pagination.page} of ${data.pagination.pages} (Total: ${data.pagination.total} sessions)</p>
                </div>` : ''}
            </div>
        `;
    }

    async bookSession(sessionId, startTime) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBaseUrl}/sessions/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    startTime: startTime
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book session');
            }

            const data = await response.json();
            this.showNotification('Session booked successfully!', 'success');

            // Reload sessions to update the view
            setTimeout(() => this.loadMySessions(), 1000);

        } catch (error) {
            console.error('Error booking session:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async loadDashboardData() {
        try {
            const token = localStorage.getItem('token');

            // Fetch student sessions
            const sessionsResponse = await fetch(`${this.apiBaseUrl}/sessions/mysessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (sessionsResponse.ok) {
                const sessions = await sessionsResponse.json();
                this.updateSessionsData(sessions);
            }

            // Fetch confirmed sessions
            const confirmedResponse = await fetch(`${this.apiBaseUrl}/sessions/my-confirmed-sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (confirmedResponse.ok) {
                const confirmedSessions = await confirmedResponse.json();
                this.updateConfirmedSessionsData(confirmedSessions);
            }

            // Update stats with real data
            this.updateStatsWithRealData();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Keep showing default data if API fails
        }
    }

    updateSessionsData(sessions) {
        try {
            // Update available sessions count
            const availableSessionsElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
            if (availableSessionsElement && sessions.success && sessions.sessions) {
                const totalSlots = sessions.sessions.reduce((sum, session) => {
                    return sum + (session.availableSlots ? session.availableSlots.length : 0);
                }, 0);
                availableSessionsElement.textContent = totalSlots;
            }

            // Update recent activity with sessions
            const activityList = document.querySelector('.activity-list');
            if (activityList && sessions.success && sessions.sessions && sessions.sessions.length > 0) {
                const recentSessions = sessions.sessions.slice(0, 3);
                const activityHtml = recentSessions.map(session => `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-calendar-plus"></i>
                        </div>
                        <div class="activity-details">
                            <h4>New Session: ${session.title}</h4>
                            <p class="activity-time">${session.date} - ${session.availableSlots ? session.availableSlots.length : 0} slots available</p>
                        </div>
                    </div>
                `).join('');
                activityList.innerHTML = activityHtml;
            }
        } catch (error) {
            console.error('Error updating sessions data:', error);
        }
    }

    updateConfirmedSessionsData(confirmedSessions) {
        try {
            // Update confirmed sessions count
            const confirmedSessionsElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
            if (confirmedSessionsElement && confirmedSessions.pagination) {
                confirmedSessionsElement.textContent = confirmedSessions.pagination.totalSessions || 0;
            }
        } catch (error) {
            console.error('Error updating confirmed sessions data:', error);
        }
    }

    updateStatsWithRealData() {
        // This method is called after loading dashboard data
        // Stats are already updated by the specific update methods above
        console.log('Dashboard stats updated with real data');
    }

    updateRecentActivity(activities) {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }

    updateUpcomingEvents(events) {
        const eventList = document.querySelector('.event-list');
        if (!eventList) return;

        eventList.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-date">
                    <span class="date-day">${event.date}</span>
                    <span class="date-month">${event.month}</span>
                </div>
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p class="event-time">${event.time}</p>
                </div>
            </div>
        `).join('');
    }

    handleSearch(query) {
        console.log('Searching for:', query);
        // Implement search functionality
        // This would typically filter courses, assignments, etc.
    }

    handleQuickAction(button) {
        const actionText = button.querySelector('span').textContent;
        console.log('Quick action:', actionText);

        // Handle different quick actions
        switch (actionText) {
            case 'New Assignment':
                this.navigateToPage('assignments');
                break;
            case 'View Courses':
                this.navigateToPage('courses');
                break;
            case 'View Grades':
                this.navigateToPage('grades');
                break;
            case 'Messages':
                this.navigateToPage('messages');
                break;
            default:
                console.log(`Quick action: ${actionText}`);
            // Silently handle or implement specific action logic
        }
    }

    handleViewAll(button) {
        const buttonText = button.textContent;
        console.log('View all:', buttonText);
        // Implement view all functionality or silently handle
    }

    navigateToPage(page) {
        console.log('Navigating to:', page);

        // Update active navigation
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(nav => nav.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Handle different pages
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'courses':
                this.loadMySessions();
                break;
            case 'assignments':
                this.showPageContent('Assignments', 'assignments');
                break;
            case 'grades':
                this.showPageContent('Grades', 'grades');
                break;
            case 'attendance':
                this.showPageContent('Attendance', 'attendance');
                break;
            case 'quiz':
                this.showPageContent('Quizzes', 'quiz');
                break;
            case 'resources':
                this.showPageContent('Resources', 'resources');
                break;
            case 'sessions':
                this.loadMySessions();
                break;
            case 'messages':
                this.showPageContent('Messages', 'messages');
                break;
            case 'announcements':
                this.showPageContent('Announcements', 'announcements');
                break;
            case 'profile':
                this.showProfileModal();
                break;
            case 'settings':
                this.showPageContent('Settings', 'settings');
                break;
            case 'help':
                this.showPageContent('Help & Support', 'help');
                break;
            default:
                console.log(`Unknown page: ${page}`);
        }
    }

    loadDashboard() {
        const mainContent = document.getElementById('main-content');
        const dashboardPage = document.getElementById('dashboard-page');

        // Hide main content and show dashboard page
        if (mainContent) {
            mainContent.style.display = 'none';
        }

        if (dashboardPage) {
            dashboardPage.style.display = 'block';
        }
    }

    showPageContent(title, pageType) {
        const mainContent = document.getElementById('main-content');
        const dashboardPage = document.getElementById('dashboard-page');

        // Hide dashboard page and show main content
        if (dashboardPage) {
            dashboardPage.style.display = 'none';
        }

        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.innerHTML = `
                <div class="page-content">
                    <div class="page-header">
                        <h2>${title}</h2>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-info-circle"></i>
                        <h3>${title} Page</h3>
                        <p>This section is under development.</p>
                    </div>
                </div>
            `;
        }
    }

    async loadProfileData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load profile data');
            }

            const data = await response.json();
            this.currentUser = data.user;

            // Update UI with fresh data
            this.updateProfileUI();
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showNotification('Failed to load profile data', 'error');
        }
    }

    updateProfileUI() {
        if (!this.currentUser) return;

        // Update profile information in header
        const headerStudentName = document.getElementById('header-student-name');
        const sidebarStudentName = document.getElementById('sidebar-student-name');
        const profileImg = document.getElementById('profile-img');
        const userAvatar = document.querySelector('.user-avatar');

        if (headerStudentName) {
            headerStudentName.textContent = this.currentUser.fullName || 'Student';
        }
        if (sidebarStudentName) {
            sidebarStudentName.textContent = this.currentUser.fullName || 'Student';
        }
        if (profileImg && this.currentUser.profileImage) {
            profileImg.src = this.currentUser.profileImage;
        }
        if (userAvatar && this.currentUser.profileImage) {
            userAvatar.src = this.currentUser.profileImage;
        }
    }

    showProfileModal() {
        if (!this.currentUser) {
            this.showNotification('Profile data not available', 'error');
            return;
        }

        // Create modal HTML
        const modalHtml = `
            <div class="profile-modal-overlay" id="profile-modal">
                <div class="profile-modal">
                    <div class="profile-modal-header">
                        <h2>Profile</h2>
                        <button class="modal-close" id="close-profile-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="profile-modal-content">
                        <div class="profile-basic-info">
                            <div class="profile-avatar">
                                <img src="${this.currentUser.profileImage || 'https://picsum.photos/seed/student/80/80.jpg'}" 
                                     alt="Profile" id="modal-profile-img">
                            </div>
                            <div class="profile-details">
                                <h3>${this.currentUser.fullName || 'Student Name'}</h3>
                                <p class="profile-email">${this.currentUser.email || 'N/A'}</p>
                                <span class="profile-role">${this.currentUser.role || 'Student'}</span>
                            </div>
                        </div>
                        
                        <div class="profile-info-grid">
                            <div class="info-item">
                                <label>User ID</label>
                                <p>${this.currentUser.userId || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Mobile</label>
                                <p>${this.currentUser.mobileNo || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Age</label>
                                <p>${this.currentUser.age || 'N/A'}</p>
                            </div>
                            ${this.currentUser.class ? `
                            <div class="info-item">
                                <label>Class</label>
                                <p>${this.currentUser.class}</p>
                            </div>
                            ` : ''}
                            <div class="info-item">
                                <label>Location</label>
                                <p>${this.currentUser.city || 'N/A'}, ${this.currentUser.state || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div class="profile-modal-actions">
                            <button class="btn btn-primary" id="edit-profile-btn">
                                Edit Profile
                            </button>
                            <button class="btn btn-secondary" id="close-modal-btn">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add modal styles
        this.addProfileModalStyles();

        // Setup modal event listeners
        this.setupProfileModalListeners();
    }

    addProfileModalStyles() {
        if (document.querySelector('#profile-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'profile-modal-styles';
        styles.textContent = `
            .profile-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .profile-modal-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .profile-modal {
                background: white;
                border-radius: 0.75rem;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.95);
                transition: transform 0.3s ease;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }
            
            .profile-modal-overlay.show .profile-modal {
                transform: scale(1);
            }
            
            .profile-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .profile-modal-header h2 {
                margin: 0;
                color: #2c3e50;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: #95a5a6;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .modal-close:hover {
                background: #f8f9fa;
                color: #2c3e50;
            }
            
            .profile-modal-content {
                padding: 1.5rem;
            }
            
            .profile-basic-info {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                margin-bottom: 2rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .profile-avatar img {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #ecf0f1;
            }
            
            .profile-details {
                flex: 1;
            }
            
            .profile-details h3 {
                margin: 0 0 0.5rem 0;
                color: #2c3e50;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .profile-email {
                margin: 0 0 0.5rem 0;
                color: #7f8c8d;
                font-size: 0.875rem;
            }
            
            .profile-role {
                background: #e3f2fd;
                color: #3498db;
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.75rem;
                font-weight: 500;
            }
            
            .profile-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .info-item {
                padding: 1rem;
                border-radius: 0.5rem;
                background: #f8f9fa;
            }
            
            .info-item label {
                display: block;
                font-size: 0.75rem;
                font-weight: 600;
                color: #7f8c8d;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }
            
            .info-item p {
                margin: 0;
                color: #2c3e50;
                font-weight: 500;
            }
            
            .profile-modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #f0f0f0;
            }
            
            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary {
                background: #3498db;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2980b9;
            }
            
            .btn-secondary {
                background: #95a5a6;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #7f8c8d;
            }
            
            @media (max-width: 768px) {
                .profile-modal {
                    width: 95%;
                    margin: 1rem;
                }
                
                .profile-basic-info {
                    flex-direction: column;
                    text-align: center;
                }
                
                .profile-info-grid {
                    grid-template-columns: 1fr;
                }
                
                .profile-modal-actions {
                    flex-direction: column;
                }
                
                .btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    setupProfileModalListeners() {
        const modal = document.getElementById('profile-modal');
        const closeBtn = document.getElementById('close-profile-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const editProfileBtn = document.getElementById('edit-profile-btn');

        // Close modal handlers
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Edit profile handler
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                console.log('Edit profile clicked');
                // Implement edit profile functionality
            });
        }

        // Show modal with animation
        setTimeout(() => modal.classList.add('show'), 100);
    }

    formatSlotTime(timeString) {
        if (!timeString) return 'Time not specified';
        
        try {
            console.log('formatSlotTime input:', timeString, 'student timezone:', this.studentTimezone);
            
            // Backend returns times in Asia/Kolkata timezone, we need to convert to student's timezone
            // Use moment-timezone for proper conversion
            const moment = window.moment;
            if (!moment) {
                console.error('Moment.js not loaded');
                return timeString;
            }
            
            // Parse the time in Asia/Kolkata timezone (backend storage timezone)
            const today = moment().format('YYYY-MM-DD');
            const dateTimeInKolkata = moment.tz(`${today} ${timeString}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
            
            // Convert to student's timezone
            const dateTimeInStudentTZ = dateTimeInKolkata.clone().tz(this.studentTimezone);
            
            // Format in HH:mm (24-hour format)
            const convertedTime = dateTimeInStudentTZ.format('HH:mm');
            
            console.log('Converted time from Asia/Kolkata to', this.studentTimezone, ':', timeString, '->', convertedTime);
            
            return convertedTime;
        } catch (error) {
            console.error('Error converting slot time:', error);
            return timeString;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                    max-width: 300px;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification-error {
                    border-left: 4px solid #e74c3c;
                    color: #e74c3c;
                }
                
                .notification-success {
                    border-left: 4px solid #2ecc71;
                    color: #2ecc71;
                }
                
                .notification-info {
                    border-left: 4px solid #3498db;
                    color: #3498db;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    cursor: pointer;
                    margin-left: auto;
                    color: inherit;
                    opacity: 0.7;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Setup close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    logout() {
        localStorage.removeItem('token');
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = '/html/index.html';
    }

    redirectToTeacherDashboard() {
        window.location.href = '/html/teacherDashboard.html';
    }
}

// Initialize component loader and dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize component loader first
    window.componentLoader = new ComponentLoader();

    // Initialize student dashboard
    window.studentDashboard = new StudentDashboard();

    // Global function for inline dropdown toggle
    window.toggleDropdown = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const menu = document.querySelector('.dropdown-menu');
        if (menu) {
            menu.classList.toggle('show');
            console.log('Inline toggle dropdown clicked');
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        const dropdown = document.querySelector('.dropdown-menu');
        const toggle = document.getElementById('studentDropdownMenuButton');

        if (dropdown && toggle && !toggle.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });
});
