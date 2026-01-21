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
            // Remove any existing listeners to prevent duplicates
            toggle.replaceWith(toggle.cloneNode(true));
            const newToggle = document.getElementById('studentDropdownMenuButton');

            newToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                menu.classList.toggle('show');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        } else {
            // Fallback: Elements not found
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

                // Load fresh profile data when dropdown opens
                if (!profileDropdownMenu.classList.contains('show')) {
                    await this.loadProfileData();
                }

                profileDropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                profileDropdownMenu.classList.remove('show');
            });
        } else {
            // Dropdown elements not found
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
        
        console.log('Student timezone set to:', this.studentTimezone);
        console.log('User object timezone:', this.currentUser.timezone);
        console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Auto-update timezone if user has default timezone and browser timezone is different
        this.autoUpdateTimezone();

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

    async renderMySessions(data) {
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
                                <span>Times shown in: ${TimezoneUtils.getDisplayTimezone(this.studentTimezone || 'Asia/Kolkata')}</span>
                                <button class="btn btn-sm btn-outline timezone-refresh-btn" onclick="window.studentDashboard.forceTimezoneUpdate()" title="Refresh timezone">
                                    <i class="fas fa-sync"></i>
                                </button>
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

        // Fetch booked slots to show them in green
        let bookedSlots = [];
        try {
            const token = localStorage.getItem('token');
            const confirmedResponse = await fetch(`${this.apiBaseUrl}/sessions/my-confirmed-sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (confirmedResponse.ok) {
                const confirmedData = await confirmedResponse.json();
                bookedSlots = confirmedData.sessions || [];
            }
        } catch (error) {
            console.error('Error fetching booked slots:', error);
        }

        console.log('Booked Slots:', bookedSlots); // Debug booked slots

        const sessionsHtml = await Promise.all(data.sessions.map(async (session) => {
            console.log('Current Session:', session); // Debug current session
            // Backend returns dates in Asia/Kolkata timezone, convert to student's timezone
            let displayDate = session.date || 'Date not specified';
            
            // Store original date for booking (without timezone conversion)
            const originalSessionDate = session.date ? session.date.split('/')[0] : session.date;
            
            // Ensure the date is in DD-MM-YYYY format (backend expects this exact format)
            const normalizedDate = originalSessionDate && moment ? moment(originalSessionDate, 'DD-MM-YYYY').format('DD-MM-YYYY') : originalSessionDate;
            
            try {
                const moment = window.moment;
                if (moment && session.date) {
                    // Parse the date from backend (assuming DD-MM-YYYY format in Asia/Kolkata)
                    const dateInKolkata = moment.tz(session.date.split('/')[0], 'DD-MM-YYYY', 'Asia/Kolkata');
                    // Convert to student's timezone and format
                    displayDate = dateInKolkata.clone().tz(this.studentTimezone).format('DD-MM-YYYY/dddd');
                }
            } catch (error) {
                console.error('Error converting session date:', error);
                displayDate = session.date || 'Date not specified';
            }
            
            // Create a map of booked slots for this session for quick lookup
            const sessionBookedSlots = bookedSlots.filter(slot => String(slot.sessionId) === String(session.sessionId || session._id));
            const bookedSlotTimes = new Set();
            const myBookedSlotsByTime = new Map();
            
            console.log('Session Booked Slots for session ID', session.sessionId || session._id, ':', sessionBookedSlots);
            
            sessionBookedSlots.forEach(bookedSlot => {
                const startTimeString = this.formatSlotTime(bookedSlot.startTime, session);
                if (startTimeString) {
                    bookedSlotTimes.add(startTimeString);
                    myBookedSlotsByTime.set(startTimeString, {
                        startTime: startTimeString,
                        endTime: this.formatSlotTime(bookedSlot.endTime, session)
                    });
                    console.log('Booked slot time:', startTimeString, '(raw startTime:', bookedSlot.startTime, ')');
                }
            });
            
            console.log('Final booked slot times set:', Array.from(bookedSlotTimes));

            // Preserve order: start from backend-provided available slots (already filtered for common sessions)
            // Then convert the *existing* slot to green if it's booked by the logged-in student.
            const slotsToRender = (session.availableSlots || []).map(slot => {
                const start = this.formatSlotTime(slot.startTime, session);
                const end = this.formatSlotTime(slot.endTime, session);
                return {
                    startTime: start,
                    endTime: end,
                    isBookedByMe: bookedSlotTimes.has(start)
                };
            }).filter(s => s.startTime && s.startTime !== 'Time not specified');

            // If the booked slot is no longer present in availableSlots (because it's booked), insert it back
            // in the correct chronological position (still no duplicates).
            const compareHHmm = (a, b) => {
                const [ah, am] = String(a).split(':').map(Number);
                const [bh, bm] = String(b).split(':').map(Number);
                return (ah * 60 + am) - (bh * 60 + bm);
            };

            myBookedSlotsByTime.forEach((slot, start) => {
                const exists = slotsToRender.some(s => s.startTime === start);
                if (exists) return;

                const toInsert = {
                    startTime: start,
                    endTime: slot.endTime,
                    isBookedByMe: true
                };

                let insertIndex = slotsToRender.length;
                for (let i = 0; i < slotsToRender.length; i++) {
                    if (compareHHmm(start, slotsToRender[i].startTime) < 0) {
                        insertIndex = i;
                        break;
                    }
                }

                slotsToRender.splice(insertIndex, 0, toInsert);
            });
            
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
                    <h4>Available Slots (${slotsToRender.length})</h4>
                    <div class="slots-grid">
                        ${slotsToRender.length > 0 ? slotsToRender.map(slot => {
                            const startTime = slot.startTime;
                            const endTime = slot.endTime;

                            // Only show green for the logged-in student's booked slot
                            const isBookedByMe = slot.isBookedByMe === true;

                            console.log('Checking slot:', startTime, '- isBookedByMe:', isBookedByMe);

                            if (isBookedByMe) {
                                return `
                                <button class="slot-btn booked" disabled data-session-id="${session.sessionId || session._id}" data-start-time="${startTime}" data-session-date="${normalizedDate}">
                                    <div class="slot-time">${startTime} - ${endTime}</div>
                                </button>
                            `;
                            } else {
                                return `
                                <button class="slot-btn" onclick="studentDashboard.bookSession('${session.sessionId || session._id}', '${startTime}', '${normalizedDate}')" data-session-id="${session.sessionId || session._id}" data-start-time="${startTime}" data-session-date="${normalizedDate}">
                                    <div class="slot-time">${startTime} - ${endTime}</div>
                                </button>
                            `;
                            }
                        }).join('') : '<p class="no-slots">No available slots</p>'}
                    </div>
                </div>
            </div>
        `;
        }));

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
                            <span>Times shown in: ${TimezoneUtils.getDisplayTimezone(this.studentTimezone || 'Asia/Kolkata')}</span>
                        </div>
                    </div>
                </div>
                <div class="sessions-grid">
                    ${sessionsHtml.join('')}
                </div>
                ${data.pagination ? `
                <div class="pagination-info">
                    <p>Page ${data.pagination.page} of ${data.pagination.pages} (Total: ${data.pagination.total} sessions)</p>
                </div>` : ''}
            </div>
        `;
    }

    async bookSession(sessionId, startTime, sessionDate) {
        const button = event.target.closest('.slot-btn');
        const originalContent = button.innerHTML;
        
        // Show confirmation dialog
        const confirmed = confirm(`Are you ready to book this session?\n\nDate: ${sessionDate}\nTime: ${startTime}\n\nClick OK to confirm booking.`);
        
        if (!confirmed) {
            return;
        }
        
        // Send the time in student's timezone (as displayed to student)
        const startTimeForBackend = startTime;
        // Use the date directly since it's now in correct DD-MM-YYYY format
        const bookingDateForBackend = sessionDate;
        
        console.log('Booking debug - sessionDate:', sessionDate);
        console.log('Booking debug - bookingDateForBackend:', bookingDateForBackend);
        console.log('Booking debug - startTimeForBackend:', startTimeForBackend);
        
        try {
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<div class="slot-time"><i class="fas fa-spinner fa-spin"></i> Booking...</div>';
            
            const token = localStorage.getItem('token');
            const requestBody = {
                sessionId: sessionId,
                startTime: startTimeForBackend,
                date: bookingDateForBackend
            };
            
            const response = await fetch(`${this.apiBaseUrl}/sessions/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book session');
            }

            const data = await response.json();
            
            // Convert the same existing slot button to green (no duplicates, no reorder)
            button.disabled = true;
            button.classList.add('booked');
            button.removeAttribute('onclick');

            // Display times directly from booking response (already in student's timezone)
            const bookedStart = data?.booking?.startTime;
            const bookedEnd = data?.booking?.endTime;
            if (bookedStart && bookedEnd) {
                const timeEl = button.querySelector('.slot-time');
                if (timeEl) {
                    timeEl.textContent = `${bookedStart} - ${bookedEnd}`;
                }
            } else {
                button.innerHTML = originalContent;
            }

            this.showNotification('Session slot booked successfully!', 'success');

        } catch (error) {
            console.error('Error booking session:', error);
            this.showNotification(error.message || 'Failed to book session slot', 'error');

            // Restore button state
            if (button) {
                button.disabled = false;
                button.innerHTML = originalContent;
            }
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
        // Implement search functionality
        // This would typically filter courses, assignments, etc.
    }

    handleQuickAction(button) {
        const actionText = button.querySelector('span').textContent;

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
                // Silently handle or implement specific action logic
        }
    }

    handleViewAll(button) {
        const buttonText = button.textContent;
        // Implement view all functionality or silently handle
    }

    navigateToPage(page) {

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
                // Unknown page
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
                <div class="profile-modal modal-profile">
                    <div class="modal-header">
                        <h3>Profile</h3>
                        <button class="modal-close" id="close-profile-modal">&times;</button>
                    </div>
                    
                    <div class="profile-view">
                        <div class="profile-header">
                            <img src="${this.currentUser.profileImage || 'https://picsum.photos/seed/student/80/80.jpg'}" 
                                 alt="Profile" class="profile-avatar" id="modal-profile-img">
                            <div class="profile-info">
                                <h4>${this.currentUser.fullName || 'Student Name'}</h4>
                                <p>${this.currentUser.email || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div class="profile-details">
                            <div class="detail-row">
                                <span class="label">User ID</span>
                                <span class="value">${this.currentUser.userId || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Mobile</span>
                                <span class="value">${this.currentUser.mobileNo || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Age</span>
                                <span class="value">${this.currentUser.age || 'N/A'}</span>
                            </div>
                            ${this.currentUser.class ? `
                            <div class="detail-row">
                                <span class="label">Class</span>
                                <span class="value">${this.currentUser.class}</span>
                            </div>
                            ` : ''}
                            <div class="detail-row">
                                <span class="label">Location</span>
                                <span class="value">${this.currentUser.city || 'N/A'}, ${this.currentUser.state || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Timezone</span>
                                <span class="value">${TimezoneUtils.getDisplayTimezone(this.studentTimezone || 'Asia/Kolkata')}</span>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button class="btn btn-primary" id="edit-profile-btn">
                                Edit Profile
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
            
            .profile-modal.modal-profile {
                max-width: 480px;
                padding: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                transform: scale(0.95);
                transition: transform 0.3s ease;
            }
            
            .profile-modal-overlay.show .profile-modal {
                transform: scale(1);
            }
            
            .modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 0;
            }
            
            .modal-header h3 {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
            }
            
            .modal-close {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                background: none;
                color: #64748b;
                cursor: pointer;
                border-radius: 6px;
                font-size: 18px;
                transition: all 0.2s ease;
            }
            
            .modal-close:hover {
                background: #f1f5f9;
                color: #374151;
            }
            
            .profile-view {
                padding: 24px;
            }
            
            .profile-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .profile-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid #f1f5f9;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .profile-info h4 {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 4px 0;
            }
            
            .profile-info p {
                font-size: 14px;
                color: #64748b;
                margin: 0;
            }
            
            .profile-details {
                margin-bottom: 24px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f8fafc;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-row .label {
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
            }
            
            .detail-row .value {
                font-size: 14px;
                color: #1e293b;
                font-weight: 500;
            }
            
            .profile-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
            }
            
            .btn {
                padding: 8px 20px;
                font-size: 14px;
                font-weight: 500;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563eb;
            }
            
            .btn-secondary {
                background: #f8fafc;
                color: #64748b;
                border: 1px solid #e2e8f0;
            }
            
            .btn-secondary:hover {
                background: #f1f5f9;
                color: #374151;
            }
            
            @media (max-width: 640px) {
                .profile-modal.modal-profile {
                    margin: 16px;
                    max-width: none;
                }
                
                .modal-header {
                    padding: 16px 20px;
                }
                
                .profile-view {
                    padding: 20px;
                }
                
                .profile-header {
                    flex-direction: column;
                    text-align: center;
                    gap: 12px;
                }
                
                .profile-actions {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .profile-actions .btn {
                    width: 100%;
                    padding: 10px;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupProfileModalListeners() {
        const modal = document.getElementById('profile-modal');
        const closeBtn = document.getElementById('close-profile-modal');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const updateTimezoneBtn = document.getElementById('update-timezone-btn');

        // Close modal handlers
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

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

        // Update timezone handler
        if (updateTimezoneBtn) {
            updateTimezoneBtn.addEventListener('click', async () => {
                updateTimezoneBtn.disabled = true;
                updateTimezoneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                
                try {
                    const updated = await this.autoUpdateTimezone(true); // Force update
                    if (updated) {
                        this.showNotification('Timezone updated successfully', 'success');
                        // Close and reopen modal to show updated timezone
                        closeModal();
                        setTimeout(() => this.showProfileModal(), 400);
                    } else {
                        this.showNotification('Timezone is already up to date', 'info');
                        updateTimezoneBtn.disabled = false;
                        updateTimezoneBtn.innerHTML = '<i class="fas fa-sync"></i> Update Timezone';
                    }
                } catch (error) {
                    console.error('Error updating timezone:', error);
                    this.showNotification('Failed to update timezone', 'error');
                    updateTimezoneBtn.disabled = false;
                    updateTimezoneBtn.innerHTML = '<i class="fas fa-sync"></i> Update Timezone';
                }
            });
        }

        // Show modal with animation
        setTimeout(() => modal.classList.add('show'), 100);
    }

    formatSlotTime(timeString, session = null) {
        if (!timeString) return 'Time not specified';
        
        try {
            const moment = window.moment;
            const rawTz = this.studentTimezone || 'Asia/Kolkata';
            const cleanedTz = String(rawTz).replace(/\s*\([^)]*\)\s*/g, '').trim();
            const tz = (moment && cleanedTz && moment.tz.zone(cleanedTz)) ? cleanedTz : 'Asia/Kolkata';
            
            // Get teacher timezone from session data or fallback
            const teacherTimezone = session?.teacher?.timezone || 
                                  this.currentUser?.teacherId?.timezone || 
                                  'Asia/Kolkata';
            
            console.log('formatSlotTime input:', timeString, 'student timezone:', tz, 'teacher timezone:', teacherTimezone);

            // If already in HH:mm format, these times are already converted to student timezone by the backend
            // No need to convert again - just return as is
            if (typeof timeString === 'string' && /^\d{2}:\d{2}$/.test(timeString)) {
                console.log('Time is already in student timezone (from backend), returning as is:', timeString);
                return timeString;
            }

            if (!moment) {
                return String(timeString);
            }

            // Convert UTC/ISO/Date to student's timezone and format HH:mm
            const m = moment.utc(timeString);
            if (!m.isValid()) {
                return String(timeString);
            }

            return m.tz(tz).format('HH:mm');
        } catch (error) {
            console.error('Error in formatSlotTime:', error);
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

    async autoUpdateTimezone(forceUpdate = false) {
        try {
            // Get browser timezone
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Check if user has default timezone and it's different from browser, or if force update is requested
            if (forceUpdate || (this.currentUser.timezone === 'Asia/Kolkata' && browserTimezone !== 'Asia/Kolkata')) {
                console.log('Auto-updating timezone from', this.currentUser.timezone, 'to', browserTimezone);
                
                // Update timezone on server
                const response = await fetch(`${this.apiBaseUrl}/auth/update-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ timezone: browserTimezone })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    // Update local user data
                    this.currentUser.timezone = browserTimezone;
                    this.studentTimezone = browserTimezone;
                    console.log('Timezone updated successfully to:', browserTimezone);
                    
                    // Refresh the page to show updated timezone
                    this.loadSessions();
                    
                    return true;
                } else {
                    console.error('Failed to update timezone');
                    return false;
                }
            } else {
                console.log('Timezone update not needed. Current:', this.currentUser.timezone, 'Browser:', browserTimezone);
                return false;
            }
        } catch (error) {
            console.error('Error auto-updating timezone:', error);
            return false;
        }
    }

    async forceTimezoneUpdate() {
        console.log('Force updating timezone...');
        const updated = await this.autoUpdateTimezone(true);
        if (updated) {
            this.showNotification('Timezone updated successfully', 'success');
        } else {
            // Even if not updated in database, refresh the display with browser timezone
            const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.studentTimezone = browserTimezone;
            this.loadSessions();
            this.showNotification('Display refreshed with browser timezone', 'info');
        }
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
