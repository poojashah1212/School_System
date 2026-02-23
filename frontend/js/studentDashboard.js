class StudentDashboard {
    constructor() {
        this.apiBaseUrl = '/api';
        this.studentTimezone = 'Asia/Kolkata';
        this.currentUser = null;
        this.pendingBookingData = null;
        this.realTimeUpdateInterval = null; // For real-time slot updates

        // Initialize API service
        if (window.apiService) {
            window.apiService.setBaseUrl(this.apiBaseUrl);
        }
        this.init();
    }

    async init() {
        try {
            await this.loadComponents();
            await this.checkAuthentication();
            this.loadUserData();
            this.setupNavigation();
            this.startRealTimeUpdates(); // Start real-time polling
            this.setupVisibilityChangeHandler(); // Handle tab visibility

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
            const data = await window.apiService.get('/auth/profile');
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

    formatDuration(duration) {
        const minutes = parseInt(duration);
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
            }
        }
        return `${minutes} minutes`;
    }

    async loadMySessions() {
        try {
            const data = await window.apiService.get('/sessions/mysessions');
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

        const sessionCardsHtml = await Promise.all(data.sessions.map(async (session) => {
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
            console.log('Available slots from backend:', session.availableSlots);

            // Get all slots (both available and booked) and maintain original backend order
            const allSlots = [];

            // First, add all available slots in their original order
            (session.availableSlots || []).forEach(slot => {
                const start = this.formatSlotTime(slot.startTime, session);
                const end = this.formatSlotTime(slot.endTime, session);
                if (start && start !== 'Time not specified') {
                    allSlots.push({
                        startTime: start,
                        endTime: end,
                        isBookedByMe: bookedSlotTimes.has(start)
                    });
                }
            });

            // Then, add any booked slots that aren't already in the list (maintaining original order)
            myBookedSlotsByTime.forEach((slot, start) => {
                const exists = allSlots.some(s => s.startTime === start);
                if (!exists) {
                    allSlots.push({
                        startTime: start,
                        endTime: slot.endTime,
                        isBookedByMe: true
                    });
                }
            });

            console.log('Final slots to render (maintaining original order):', allSlots);

            return `
            <div class="session-card" data-session-id="${session.sessionId || session._id}" style="background: white; border: 1px solid #e3f2fd; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); height: fit-content;">
                <!-- Session Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e3f2fd;">
                    <div>
                        <h3 style="margin: 0; color: #1976d2; font-size: 18px; font-weight: 500;">${session.title}</h3>
                        <p style="margin: 4px 0 0 0; color: #546e7a; font-size: 14px;">${displayDate}</p>
                        <p style="margin: 4px 0 0 0; color: #4caf50; font-size: 13px; font-weight: 500;">
                            <span style="background: #e8f5e8; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${session.type === 'personal' ? '<i class="fas fa-user"></i> Personal Session' : '<i class="fas fa-users"></i> Common Session'}
                            </span>
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: #1976d2; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase;">
                            Available
                        </span>
                    </div>
                </div>
                
                <!-- Session Stats -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e3f2fd; margin-bottom: 16px; border-radius: 4px; overflow: hidden;">
                    <div style="background: white; padding: 12px; text-align: center;">
                        <div class="stat-total" style="font-size: 20px; font-weight: 600; color: #1976d2;">${allSlots.length}</div>
                        <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
                    </div>
                    <div style="background: white; padding: 12px; text-align: center;">
                        <div class="stat-available" style="font-size: 20px; font-weight: 600; color: #4caf50;">${allSlots.filter(s => !s.isBookedByMe).length}</div>
                        <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Available</div>
                    </div>
                    <div style="background: white; padding: 12px; text-align: center;">
                        <div class="stat-booked" style="font-size: 20px; font-weight: 600; color: #ff9800;">${allSlots.filter(s => s.isBookedByMe).length}</div>
                        <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Booked</div>
                    </div>
                </div>
                
                <!-- Session Info -->
                <div style="display: flex; gap: 24px; margin-bottom: 16px; font-size: 13px; color: #546e7a;">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #1976d2;">⏱</span> ${this.formatDuration(session.sessionDuration || '60')}
                    </span>
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #1976d2;">☕</span> ${session.breakDuration || 5} min break
                    </span>
                </div>
                
                <!-- Available Slots -->
                <div style="margin-bottom: 16px;">
                    <h4 class="available-slots-header" style="margin: 0 0 12px 0; color: #1976d2; font-size: 14px; font-weight: 500;">Available Slots (${allSlots.filter(s => !s.isBookedByMe).length})</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${allSlots.length > 0 ? allSlots.map(slot => {
                const startTime = slot.startTime;
                const endTime = slot.endTime;
                const isBookedByMe = slot.isBookedByMe === true;

                if (isBookedByMe) {
                    return `
                                <span class="slot-badge booked" data-session-id="${session.sessionId || session._id}" data-start-time="${startTime}" data-session-date="${normalizedDate}" 
                                      style="background: #e8f5e8; color: #2e7d32; border: 1px solid #4caf50; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; cursor: default;">
                                    <i class="fas fa-check"></i> ${startTime} - ${endTime}
                                </span>
                            `;
                } else {
                    return `
                                <span class="slot-badge" onclick="studentDashboard.bookSession('${session.sessionId || session._id}', '${startTime}', '${normalizedDate}')" 
                                      data-session-id="${session.sessionId || session._id}" data-start-time="${startTime}" data-session-date="${normalizedDate}"
                                      style="background: #e3f2fd; color: #1976d2; border: 1px solid #bbdefb; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                                      onmouseover="this.style.background='#bbdefb'; this.style.borderColor='#90caf9';" 
                                      onmouseout="this.style.background='#e3f2fd'; this.style.borderColor='#bbdefb';">
                                    <i class="fas fa-plus"></i> ${startTime} - ${endTime}
                                </span>
                            `;
                }
            }).join('') : '<p style="color: #9e9e9e; font-size: 13px; margin: 0;">No available slots</p>'}
                    </div>
                </div>
            </div>
        `;
        }));

        // Create grid container with responsive layout similar to teacher dashboard
        const sessionsGridHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;">
                ${sessionCardsHtml.join('')}
            </div>
        `;

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
                ${sessionsGridHtml}
                ${data.pagination ? `
                <div class="pagination-info">
                    <p>Page ${data.pagination.page} of ${data.pagination.pages} (Total: ${data.pagination.total} sessions)</p>
                </div>` : ''}
            </div>
        `;
    }

    async bookSession(sessionId, startTime, sessionDate) {
        const badge = event.target.closest('.slot-badge');
        const originalContent = badge.innerHTML;

        // Store booking data for modal confirmation
        this.pendingBookingData = {
            sessionId: sessionId,
            startTime: startTime,
            sessionDate: sessionDate,
            badge: badge,
            originalContent: originalContent
        };

        // Show custom confirmation modal
        this.showBookingModal(sessionDate, startTime);
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

            // Fetch available quizzes
            await this.loadDashboardQuizzes();

            // Update stats with real data
            this.updateStatsWithRealData();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Keep showing default data if API fails
        }
    }

    updateSessionsData(sessions) {
        try {
            // Update available sessions count using new ID
            const availableSessionsElement = document.getElementById('available-slots-count');
            if (availableSessionsElement && sessions.success && sessions.sessions) {
                const totalSlots = sessions.sessions.reduce((sum, session) => {
                    return sum + (session.availableSlots ? session.availableSlots.length : 0);
                }, 0);
                availableSessionsElement.textContent = totalSlots;
            }

            // Update recent sessions with enhanced UI
            this.updateRecentSessions(sessions);
        } catch (error) {
            console.error('Error updating sessions data:', error);
        }
    }

    updateRecentSessions(sessions) {
        const recentSessionsList = document.getElementById('recent-sessions-list');
        if (!recentSessionsList) return;

        if (!sessions.success || !sessions.sessions || sessions.sessions.length === 0) {
            recentSessionsList.innerHTML = `
                <div class="no-sessions">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No recent sessions available</p>
                </div>
            `;
            return;
        }

        // Get recent sessions (first 3)
        const recentSessions = sessions.sessions.slice(0, 3);

        const recentSessionsHtml = recentSessions.map(session => {
            const sessionTitle = session.title || 'Untitled Session';
            const sessionDate = session.date || 'Date not specified';
            const availableSlots = session.availableSlots ? session.availableSlots.length : 0;
            const sessionType = session.type || 'common';

            // Get subject icon based on title
            const subjectIcon = this.getSubjectIcon(sessionTitle);
            const subjectClass = this.getSubjectClass(sessionTitle);

            // Determine status
            let status = 'available';
            let statusText = 'Available';

            if (availableSlots === 0) {
                status = 'completed';
                statusText = 'Completed';
            } else if (this.hasBookedSlot(session)) {
                status = 'booked';
                statusText = 'Booked';
            }

            return `
                <div class="recent-session-item" onclick="studentDashboard.navigateToPage('sessions')">
                    <div class="recent-session-icon ${subjectClass}">
                        <i class="fas ${subjectIcon}"></i>
                    </div>
                    <div class="recent-session-details">
                        <div class="recent-session-title">${sessionTitle}</div>
                        <div class="recent-session-meta">
                            <div class="recent-session-date">
                                <i class="fas fa-calendar"></i>
                                <span>${sessionDate}</span>
                            </div>
                            <div class="recent-session-slots">
                                <i class="fas fa-clock"></i>
                                <span>${availableSlots} slots</span>
                            </div>
                            <div class="recent-session-status ${status}">
                                ${statusText}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        recentSessionsList.innerHTML = recentSessionsHtml;
    }

    getSubjectIcon(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('math')) return 'fa-calculator';
        if (titleLower.includes('science')) return 'fa-flask';
        if (titleLower.includes('english')) return 'fa-book';
        if (titleLower.includes('history')) return 'fa-landmark';
        if (titleLower.includes('physics')) return 'fa-atom';
        if (titleLower.includes('chemistry')) return 'fa-vial';
        if (titleLower.includes('biology')) return 'fa-dna';
        if (titleLower.includes('geography')) return 'fa-globe';
        if (titleLower.includes('computer')) return 'fa-laptop-code';
        return 'fa-graduation-cap';
    }

    getSubjectClass(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('math')) return 'math';
        if (titleLower.includes('science')) return 'science';
        if (titleLower.includes('english')) return 'english';
        if (titleLower.includes('history')) return 'history';
        return 'default';
    }

    hasBookedSlot(session) {
        // Check if student has any booked slots in this session
        // This would need to be implemented based on your booked sessions data
        return false; // Placeholder
    }

    renderTimeSlots(slots, targetElementId, selectedSlots = []) {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) {
            console.error(`Target element with ID ${targetElementId} not found.`);
            return;
        }

        targetElement.innerHTML = ''; // Clear previous slots

        if (!slots || slots.length === 0) {
            targetElement.innerHTML = '<p>No slots available.</p>';
            return;
        }

        // Maintain original order - render slots in the same sequence regardless of selection
        slots.forEach(slot => {
            const isSelected = selectedSlots.includes(slot.id); // Check if slot is selected
            const buttonClass = isSelected ? 'time-slot-button selected' : 'time-slot-button';
            const icon = isSelected ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>';

            const button = document.createElement('button');
            button.className = buttonClass;
            button.innerHTML = `${icon} ${slot.time}`;
            button.setAttribute('data-slot-id', slot.id); // Add data attribute for identification
            button.onclick = () => this.toggleSlotSelection(slot.id, targetElementId);
            targetElement.appendChild(button);
        });
    }

    toggleSlotSelection(slotId, targetElementId) {
        // Get current slots data to maintain order
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) return;

        // Extract slot data from existing buttons to maintain order
        const slotButtons = targetElement.querySelectorAll('.time-slot-button');
        const currentSlots = Array.from(slotButtons).map(button => ({
            id: button.getAttribute('data-slot-id'),
            time: button.textContent.trim().replace(/^[✓➕]\s*/, '') // Remove icon and get time
        }));

        // Get current selected slots from button classes
        const selectedSlots = Array.from(targetElement.querySelectorAll('.time-slot-button.selected'))
            .map(button => button.getAttribute('data-slot-id'));

        // Toggle selection
        const newSelectedSlots = selectedSlots.includes(slotId)
            ? selectedSlots.filter(id => id !== slotId) // Remove from selected
            : [...selectedSlots, slotId]; // Add to selected

        // Re-render slots maintaining original order
        this.renderTimeSlots(currentSlots, targetElementId, newSelectedSlots);
    }

    updateConfirmedSessionsData(confirmedSessions) {
        try {
            // Update confirmed sessions count using new ID
            const confirmedSessionsElement = document.getElementById('booked-sessions-count');
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

    // Real-time update methods
    startRealTimeUpdates() {
        // Update every 30 seconds for real-time slot availability
        this.realTimeUpdateInterval = setInterval(() => {
            this.updateAvailableSlotsRealTime();
        }, 30000); // 30 seconds

        console.log('Real-time updates started for available slots');
    }

    stopRealTimeUpdates() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
            this.realTimeUpdateInterval = null;
            console.log('Real-time updates stopped');
        }
    }

    async updateAvailableSlotsRealTime() {
        try {
            // Only update if user is on dashboard page
            const dashboardPage = document.getElementById('dashboard-page');
            if (!dashboardPage || !dashboardPage.classList.contains('active')) {
                return;
            }

            // Fetch latest sessions data
            const response = await fetch(`${this.apiBaseUrl}/sessions`);
            const sessions = await response.json();

            if (sessions.success && sessions.sessions) {
                // Update only the available slots count
                const totalSlots = sessions.sessions.reduce((sum, session) => {
                    return sum + (session.availableSlots ? session.availableSlots.length : 0);
                }, 0);

                const availableSlotsElement = document.getElementById('available-slots-count');
                if (availableSlotsElement) {
                    const currentCount = parseInt(availableSlotsElement.textContent);
                    if (currentCount !== totalSlots) {
                        availableSlotsElement.textContent = totalSlots;
                        // Add animation class when count changes
                        availableSlotsElement.classList.add('updating');
                        setTimeout(() => {
                            availableSlotsElement.classList.remove('updating');
                        }, 1000);
                        console.log(`Available slots updated: ${currentCount} → ${totalSlots}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating available slots in real-time:', error);
        }
    }

    setupVisibilityChangeHandler() {
        // Handle tab visibility to pause/resume real-time updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is hidden, pause updates to save resources
                this.stopRealTimeUpdates();
                console.log('Real-time updates paused (tab hidden)');
            } else {
                // Tab is visible again, resume updates
                const dashboardPage = document.getElementById('dashboard-page');
                if (dashboardPage && dashboardPage.classList.contains('active')) {
                    this.startRealTimeUpdates();
                    // Immediately update once when tab becomes visible
                    this.updateAvailableSlotsRealTime();
                    console.log('Real-time updates resumed (tab visible)');
                }
            }
        });
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

            // Show quizzes for assignments page
            if (pageType === 'assignments') {
                mainContent.innerHTML = `
                    <div class="page-content wide">

                        <div class="quizzes-section" id="assignments-quizzes-container">
                            <div class="loading-quizzes">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading quizzes...</p>
                            </div>
                        </div>
                    </div>
                `;
                // Load quizzes for assignments page
                this.loadQuizzesForAssignments();
            } else {
                // Default content for other pages
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
    }

    async loadProfileData() {
        try {
            const data = await window.apiService.get('/auth/profile');
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

            // Get teacher timezone from session data or fallback with proper null checks
            const teacherTimezone = session?.teacher?.timezone ||
                (this.currentUser && this.currentUser.teacherId && this.currentUser.teacherId.timezone) ||
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
        this.stopRealTimeUpdates(); // Stop real-time updates
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

    // Booking Modal Methods
    showBookingModal(sessionDate, startTime) {
        const modal = document.getElementById('bookingModal');
        const modalDateElement = document.getElementById('modalDate');
        const modalTimeElement = document.getElementById('modalTime');
        const confirmBtn = document.getElementById('confirmBookingBtn');

        // Set modal content
        modalDateElement.textContent = sessionDate;
        modalTimeElement.textContent = startTime;

        // Show modal
        modal.style.display = 'flex';

        // Add event listener to confirm button
        confirmBtn.onclick = () => this.confirmBooking();

        // Close modal on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideBookingModal();
            }
        };

        // Close modal on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideBookingModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    hideBookingModal() {
        const modal = document.getElementById('bookingModal');
        modal.style.display = 'none';
        this.pendingBookingData = null;
    }

    updateSessionStatsInstant(sessionId, action) {
        try {
            // Find the session card and update its stats
            const sessionCard = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (!sessionCard) return;

            // Get current stats from the session card using the new CSS classes
            const totalElement = sessionCard.querySelector('.stat-total');
            const availableElement = sessionCard.querySelector('.stat-available');
            const bookedElement = sessionCard.querySelector('.stat-booked');

            if (totalElement && availableElement && bookedElement) {
                const total = parseInt(totalElement.textContent) || 0;
                const available = parseInt(availableElement.textContent) || 0;
                const booked = parseInt(bookedElement.textContent) || 0;

                if (action === 'booked') {
                    // Update counts: total stays same, available decreases, booked increases
                    availableElement.textContent = Math.max(0, available - 1);
                    bookedElement.textContent = booked + 1;
                }
            }

            // Update the "Available Slots" count text
            const availableSlotsHeader = sessionCard.querySelector('.available-slots-header');
            if (availableSlotsHeader) {
                const currentAvailable = parseInt(availableElement?.textContent) || 0;
                availableSlotsHeader.textContent = `Available Slots (${currentAvailable})`;
            }

        } catch (error) {
            console.error('Error updating session stats:', error);
        }
    }

    async confirmBooking() {
        if (!this.pendingBookingData) {
            console.error('No pending booking data');
            return;
        }

        const { sessionId, startTime, sessionDate, badge, originalContent } = this.pendingBookingData;

        // Send the time in student's timezone (as displayed to student)
        const startTimeForBackend = startTime;
        // Use the date directly since it's now in correct DD-MM-YYYY format
        const bookingDateForBackend = sessionDate;

        console.log('Booking debug - sessionDate:', sessionDate);
        console.log('Booking debug - bookingDateForBackend:', bookingDateForBackend);
        console.log('Booking debug - startTimeForBackend:', startTimeForBackend);

        try {
            // Show loading state
            badge.style.pointerEvents = 'none';
            badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

            // Hide modal while processing
            this.hideBookingModal();

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

            // Instant visual feedback - convert the same existing slot badge to green (no duplicates, no reorder)
            badge.style.pointerEvents = 'none';
            badge.classList.add('booked');
            badge.removeAttribute('onclick');

            // Smooth transition to green state
            badge.style.transition = 'all 0.3s ease';
            badge.style.background = '#e8f5e8';
            badge.style.color = '#2e7d32';
            badge.style.borderColor = '#4caf50';

            // Update content with check icon
            const bookedStart = data?.booking?.startTime;
            const bookedEnd = data?.booking?.endTime;
            if (bookedStart && bookedEnd) {
                badge.innerHTML = `<i class="fas fa-check"></i> ${bookedStart} - ${bookedEnd}`;
            } else {
                // Fallback to original content with check icon
                const timeText = originalContent.replace(/<i class="fas fa-plus"><\/i>\s*/, '');
                badge.innerHTML = `<i class="fas fa-check"></i> ${timeText}`;
            }

            // Update session stats instantly
            this.updateSessionStatsInstant(sessionId, 'booked');

            this.showNotification('Session slot booked successfully!', 'success');

        } catch (error) {
            console.error('Error booking session:', error);
            this.showNotification(error.message || 'Failed to book session slot', 'error');

            // Restore badge state
            if (badge) {
                badge.style.pointerEvents = 'auto';
                badge.innerHTML = originalContent;
            }
        }
    }

    async loadQuizzesForAssignments() {
        try {
            console.log('=== DEBUG: Loading quizzes for assignments page...');
            const data = await window.apiService.get('/quizzes/student/quizzes');
            console.log('=== DEBUG: Quizzes API response:', data);
            this.renderQuizzesForAssignments(data);
        } catch (error) {
            console.error('=== DEBUG: Error loading quizzes for assignments:', error);
            const container = document.getElementById('assignments-quizzes-container');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to Load Quizzes</h3>
                        <p>Unable to load quizzes. Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    renderQuizzesForAssignments(data) {
        const container = document.getElementById('assignments-quizzes-container');
        if (!container) return;

        if (!data.quizzes || data.quizzes.length === 0) {
            container.innerHTML = `
                <div class="quiz-empty">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No quizzes available</p>
                </div>
            `;
            return;
        }

        const quizzesHtml = data.quizzes.map(quiz => {
            // Determine quiz status
            const now = new Date();
            const startTime = quiz.startDate ? new Date(quiz.startDate) : null;
            const endTime = quiz.endDate ? new Date(quiz.endDate) : null;
            let status = 'upcoming';
            let isDisabled = false;
            let statusText = 'Upcoming';
            const isCompleted = Boolean(quiz.alreadySubmitted);

            if (startTime && endTime) {
                if (now >= startTime && now <= endTime) {
                    status = 'active';
                    statusText = 'Active';
                } else if (now > endTime) {
                    status = 'expired';
                    statusText = 'Expired';
                    isDisabled = true;
                } else if (now < startTime) {
                    isDisabled = true;
                }
            }

            if (isCompleted) {
                status = 'completed';
                statusText = 'Completed';
                isDisabled = true;
            }

            // Format date/time in student timezone
            const studentTimezone = this.studentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const formatDateTime = (date) => {
                if (!date) return 'Not set';
                try {
                    // Convert UTC date to student timezone using TimezoneUtils
                    const utcDate = new Date(date);
                    const localDate = TimezoneUtils.convertTimezone(utcDate, 'UTC', studentTimezone);

                    return localDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return 'Invalid Date';
                }
            };

            return `
            <div class="quiz-row">
                <div class="quiz-info">
                    <h4 class="quiz-name">${quiz.title}</h4>
                    <span class="quiz-tag">${quiz.subject} • Class ${quiz.class}</span>
                </div>
                <div class="quiz-details">
                    <div class="quiz-field">
                        <span class="field-label">Start</span>
                        <span class="field-value">${formatDateTime(quiz.startDate)}</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">End</span>
                        <span class="field-value">${formatDateTime(quiz.endDate)}</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">Duration</span>
                        <span class="field-value">${quiz.duration} min</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">Questions</span>
                        <span class="field-value">${quiz.totalQuestions || quiz.questions?.length || 0}</span>
                    </div>
                </div>
                <div class="quiz-status">
                    <span class="status-pill ${status}">${statusText}</span>
                    ${isCompleted
                    ? `<div class="completed-indicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Completed</span>
                    </div>`
                    : `<div class="available-indicator">
                        <i class="fas fa-play-circle"></i>
                        <span>Available</span>
                    </div>`
                }
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="quiz-list-header">
                <h2>Quizzes</h2>
                <span class="quiz-count">${data.quizzes.length} available</span>
            </div>
            <div class="quiz-list">
                ${quizzesHtml}
            </div>
        `;
    }

    async loadQuizzes() {
        try {
            console.log('=== DEBUG: Loading quizzes...');
            const data = await window.apiService.get('/quizzes/student/quizzes');
            console.log('=== DEBUG: Quizzes API response:', data);
            this.renderQuizzes(data);
        } catch (error) {
            console.error('=== DEBUG: Error loading quizzes:', error);
            this.showNotification('Failed to load quizzes', 'error');
        }
    }

    async loadDashboardQuizzes() {
        try {
            console.log('=== DEBUG: Loading dashboard quizzes...');
            const data = await window.apiService.get('/quizzes/student/quizzes');
            console.log('=== DEBUG: Dashboard quizzes API response:', data);
            console.log('=== DEBUG: Quiz data structure:', data.quizzes ? data.quizzes.map(q => ({
                id: q._id,
                title: q.title,
                alreadySubmitted: q.alreadySubmitted,
                alreadySubmittedType: typeof q.alreadySubmitted
            })) : 'No quizzes array');
            this.renderDashboardQuizzes(data);
        } catch (error) {
            console.error('=== DEBUG: Error loading dashboard quizzes:', error);
            this.renderDashboardQuizzesError();
        }
    }

    renderDashboardQuizzes(data) {
        console.log('=== DEBUG: renderDashboardQuizzes called with data:', data);
        const quizListContainer = document.getElementById('dashboard-quiz-list');
        if (!quizListContainer) return;

        // Handle different response formats
        const quizzes = data.quizzes || data;
        console.log('=== DEBUG: Extracted quizzes:', quizzes);

        if (!quizzes || quizzes.length === 0) {
            console.log('=== DEBUG: No quizzes found');
            quizListContainer.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No quizzes available</p>
                </div>
            `;
            return;
        }

        console.log('=== DEBUG: Processing quizzes:', quizzes);
        
        // Filter out expired quizzes
        const now = new Date();
        const activeQuizzes = quizzes.filter(quiz => {
            const endTime = quiz.endDate ? new Date(quiz.endDate) : null;
            // Include quiz if it doesn't have an end date or if it hasn't expired yet
            return !endTime || now <= endTime;
        });
        
        console.log('=== DEBUG: Filtered active quizzes:', activeQuizzes);
        
        if (activeQuizzes.length === 0) {
            console.log('=== DEBUG: No active quizzes found');
            quizListContainer.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No active quizzes available</p>
                </div>
            `;
            return;
        }
        
        const quizzesHtml = activeQuizzes.map((quiz, index) => {
            console.log('=== DEBUG: Processing quiz:', quiz);
            console.log('=== DEBUG: Quiz alreadySubmitted:', quiz.alreadySubmitted);
            console.log('=== DEBUG: Quiz ID:', quiz._id);

            const isCompleted = Boolean(quiz.alreadySubmitted);
            console.log('=== DEBUG: Final isCompleted status:', isCompleted);

            const statusClass = isCompleted ? 'completed' : 'pending';
            const statusIcon = isCompleted ? 'fa-check-circle' : 'fa-clock';
            const statusText = isCompleted ? 'Completed' : 'Available';

            const quizHtml = `
                <div class="quiz-item ${isCompleted ? 'quiz-completed' : ''}">
                    <div class="quiz-info">
                        <h4>${quiz.title}</h4>
                        <div class="quiz-meta">
                            <span class="quiz-subject">${quiz.subject}</span>
                            <span class="quiz-status ${statusClass}">
                                <i class="fas ${statusIcon} quiz-status-icon"></i>
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    <div class="quiz-status-indicator">
                        ${isCompleted ? 
                            `<div class="completed-indicator">
                                <i class="fas fa-check-circle"></i>
                                <span>Completed</span>
                            </div>` :
                            `<div class="available-indicator">
                                <i class="fas fa-play-circle"></i>
                                <span>Available</span>
                            </div>`
                        }
                    </div>
                </div>
            `;


            return quizHtml;
        }).join('');



        quizListContainer.innerHTML = `
            <div class="quiz-list">
                ${quizzesHtml}
            </div>
        `;
    }

    renderDashboardQuizzesError() {
        const quizListContainer = document.getElementById('dashboard-quiz-list');
        if (!quizListContainer) return;

        quizListContainer.innerHTML = `
            <div class="no-quizzes">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load quizzes</p>
            </div>
        `;
    }

    handleQuizClick(quizId, alreadySubmitted) {
        if (alreadySubmitted) {
            // View results logic
            console.log('=== DEBUG: Viewing results for quiz:', quizId);
            this.loadQuizResults(quizId);
        } else {
            // Start quiz logic
            console.log('=== DEBUG: Starting quiz:', quizId);
            this.startQuiz(quizId);
        }
    }

    async loadQuizResults(quizId) {
        try {
            console.log('=== DEBUG: Loading quiz results for quiz ID:', quizId);

            // Try the specific endpoint first
            let data;
            try {
                data = await window.apiService.get(`/quizzes/student/${quizId}/results`);
                console.log('=== DEBUG: Specific quiz results response:', data);

                if (data.success && data.result) {
                    const result = data.result;

                    // Use marks data from database
                    const obtainedMarks = result.score || 0;
                    const totalMarks = result.totalMarks || 0;

                    // Calculate percentage if not stored
                    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

                    // Calculate wrong answers from total marks and score
                    const wrongAnswers = totalMarks - obtainedMarks;

                    const resultData = {
                        obtainedMarks: obtainedMarks,
                        totalMarks: totalMarks,
                        correctAnswers: obtainedMarks, // In quiz context, score = correct answers
                        wrongAnswers: wrongAnswers,
                        scorePercentage: percentage,
                        status: percentage >= 50 ? 'Pass' : 'Fail',
                        attemptedDate: result.attemptedAt || result.createdAt || new Date()
                    };

                    const quizData = {
                        title: result.quiz?.title || 'Quiz',
                        subject: result.quiz?.subject || 'Subject'
                    };

                    console.log('=== DEBUG: Result data from Marks table:', resultData);
                    console.log('=== DEBUG: Quiz data:', quizData);

                    this.showQuizResultPage(resultData, quizData);
                    return;
                }
            } catch (specificError) {
                console.log('=== DEBUG: Specific endpoint failed, falling back to general results:', specificError);
            }

            // Fallback to general results endpoint
            data = await window.apiService.get(`/quizzes/student/results`);
            console.log('=== DEBUG: General quiz results response:', data);
            console.log('=== DEBUG: Response structure:', {
                hasResults: !!data.results,
                resultsLength: data.results ? data.results.length : 0,
                resultsArray: data.results ? data.results.map(r => ({
                    quizId: r.quizId,
                    quizIdType: typeof r.quizId,
                    quiz: r.quiz,
                    score: r.score,
                    percentage: r.percentage
                })) : 'No results'
            });

            if (data.results && Array.isArray(data.results)) {
                // Find the specific quiz result - try both string and ObjectId comparison
                const quizResult = data.results.find(result => {
                    const resultQuizId = result.quizId?.toString() || result.quiz?._id?.toString();
                    const targetQuizId = quizId.toString();
                    const match = resultQuizId === targetQuizId;
                    console.log(`=== DEBUG: Comparing resultQuizId: ${resultQuizId} with targetQuizId: ${targetQuizId} - Match: ${match}`);
                    return match;
                });

                console.log('=== DEBUG: Found quiz result:', quizResult);

                if (quizResult) {
                    // Use marks data from database
                    const obtainedMarks = quizResult.score || 0;
                    const totalMarks = quizResult.totalMarks || 0;

                    // Calculate percentage if not stored
                    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

                    // Calculate wrong answers from total marks and score
                    const wrongAnswers = totalMarks - obtainedMarks;

                    // Create result data object in expected format
                    const resultData = {
                        obtainedMarks: obtainedMarks,
                        totalMarks: totalMarks,
                        correctAnswers: obtainedMarks, // In quiz context, score = correct answers
                        wrongAnswers: wrongAnswers,
                        scorePercentage: percentage,
                        status: percentage >= 50 ? 'Pass' : 'Fail',
                        attemptedDate: quizResult.attemptedAt || quizResult.createdAt || new Date()
                    };

                    // Get quiz details for title and subject
                    const quizData = {
                        title: quizResult.quiz?.title || quizResult.title || 'Quiz',
                        subject: quizResult.quiz?.subject || quizResult.subject || 'Subject'
                    };

                    console.log('=== DEBUG: Result data from Marks table:', resultData);
                    console.log('=== DEBUG: Quiz data:', quizData);

                    this.showQuizResultPage(resultData, quizData);
                } else {
                    console.log('=== DEBUG: Quiz result not found for ID:', quizId);
                    this.showNotification('Quiz results not found for this quiz', 'error');
                }
            } else {
                console.log('=== DEBUG: No results array in response');
                this.showNotification('No quiz results available', 'error');
            }
        } catch (error) {
            console.error('=== DEBUG: Error loading quiz results:', error);
            console.error('=== DEBUG: Error details:', error.response?.data || error.message);
            this.showNotification('Failed to load quiz results: ' + (error.message || 'Network error'), 'error');
        }
    }

    renderQuizzes(data) {
        console.log('=== DEBUG: Rendering quizzes with data:', data);
        const quizzesContainer = document.getElementById('quizzes-container');
        console.log('=== DEBUG: Quizzes container found:', quizzesContainer ? 'Yes' : 'No');

        if (!quizzesContainer) return;

        if (!data.quizzes || data.quizzes.length === 0) {
            console.log('=== DEBUG: No quizzes to display, showing empty state');
            quizzesContainer.innerHTML = `
                <div class="quiz-empty">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No quizzes available</p>
                </div>
            `;
            return;
        }

        console.log('=== DEBUG: Rendering', data.quizzes.length, 'quizzes');
        const quizzesHtml = data.quizzes.map(quiz => {
            const now = new Date();
            const startTime = quiz.startDate ? new Date(quiz.startDate) : null;
            const endTime = quiz.endDate ? new Date(quiz.endDate) : null;
            let status = 'upcoming';
            let isDisabled = false;
            let statusText = 'Upcoming';
            const isCompleted = Boolean(quiz.alreadySubmitted);

            if (startTime && endTime) {
                if (now >= startTime && now <= endTime) {
                    status = 'active';
                    statusText = 'Active';
                } else if (now > endTime) {
                    status = 'expired';
                    statusText = 'Expired';
                    isDisabled = true;
                } else if (now < startTime) {
                    isDisabled = true;
                }
            }

            if (isCompleted) {
                status = 'completed';
                statusText = 'Completed';
                isDisabled = true;
            }

            // Format date/time in student timezone
            const studentTimezone = this.studentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const formatDateTime = (date) => {
                if (!date) return 'Not set';
                try {
                    // Convert UTC date to student timezone using TimezoneUtils
                    const utcDate = new Date(date);
                    const localDate = TimezoneUtils.convertTimezone(utcDate, 'UTC', studentTimezone);

                    return localDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return 'Invalid Date';
                }
            };

            return `
            <div class="quiz-row">
                <div class="quiz-info">
                    <h4 class="quiz-name">${quiz.title}</h4>
                    <span class="quiz-tag">${quiz.subject} • Class ${quiz.class}</span>
                </div>
                <div class="quiz-details">
                    <div class="quiz-field">
                        <span class="field-label">Start</span>
                        <span class="field-value">${formatDateTime(quiz.startDate)}</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">End</span>
                        <span class="field-value">${formatDateTime(quiz.endDate)}</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">Duration</span>
                        <span class="field-value">${quiz.duration} min</span>
                    </div>
                    <div class="quiz-field">
                        <span class="field-label">Questions</span>
                        <span class="field-value">${quiz.totalQuestions || quiz.questions?.length || 0}</span>
                    </div>
                </div>
                <div class="quiz-status">
                    <span class="status-pill ${status}">${statusText}</span>
                    ${isCompleted
                    ? `<div class="completed-indicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Completed</span>
                    </div>`
                    : `<div class="available-indicator">
                        <i class="fas fa-play-circle"></i>
                        <span>Available</span>
                    </div>`
                }
                </div>
            </div>
            `;
        }).join('');

        quizzesContainer.innerHTML = `
            <div class="quiz-list-header">
                <h2>Quizzes</h2>
                <span class="quiz-count">${data.quizzes.length} available</span>
            </div>
            <div class="quiz-list">
                ${quizzesHtml}
            </div>
        `;
        console.log('=== DEBUG: Quizzes rendered successfully');
    }

    async startQuiz(quizId) {
        try {
            console.log('=== DEBUG: Starting quiz:', quizId);

            // Ensure currentUser is properly set
            if (!this.currentUser) {
                console.log('=== DEBUG: currentUser is undefined, reloading user data...');
                await this.checkAuthentication();
            }

            console.log('=== DEBUG: Current user after check:', this.currentUser);

            // Check if student has teacherId assigned
            if (!this.currentUser.teacherId) {
                this.showNotification('You must be assigned to a teacher before attempting quizzes. Please contact your administrator.', 'error');
                return;
            }

            // Check if student has already attempted this quiz
            console.log('=== DEBUG: Checking attempt status...');
            const attemptData = await window.apiService.get(`/quizzes/student/${quizId}/attempt-status`);
            console.log('=== DEBUG: Attempt status:', attemptData);

            if (attemptData.alreadySubmitted) {
                this.showNotification('You have already submitted this quiz. You can only attempt it once.', 'error');
                return;
            }

            // Load quiz data
            console.log('=== DEBUG: Loading quiz data...');
            const data = await window.apiService.get(`/quizzes/student/${quizId}`);
            console.log('=== DEBUG: Quiz data loaded:', data);

            if (data.quiz) {
                console.log('=== DEBUG: Quiz found, setting up modal...');
                console.log('=== DEBUG: Quiz questions:', data.quiz.questions);
                console.log('=== DEBUG: Number of questions:', data.quiz.questions?.length || 0);

                if (!data.quiz.questions || data.quiz.questions.length === 0) {
                    this.showNotification('This quiz has no questions available.', 'error');
                    return;
                }

                this.currentQuiz = data.quiz;
                this.currentQuizId = quizId; // Store the quiz ID separately
                this.currentQuestionIndex = 0;
                this.userAnswers = {};
                this.quizStartTime = new Date();
                this.quizTimeExpired = false;
                this.isAutoSubmit = false;

                // Show quiz modal
                this.showQuizModal();
                this.renderQuizQuestion();
                this.startQuizTimer();
            } else {
                console.log('=== DEBUG: No quiz data found');
                this.showNotification('Quiz not found', 'error');
            }
        } catch (error) {
            console.error('=== DEBUG: Error attempting quiz:', error);
            console.error('=== DEBUG: Error details:', error.response?.data || error.message);
            this.showNotification('Failed to load quiz', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Show above quiz modal (z-index 10000) and other overlays for proper visibility
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        const bgColor = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#2563eb';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10500;
            background: ${bgColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Quiz Modal Methods
    showQuizModal() {
        const modal = document.getElementById('quizAttemptModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Update quiz title and subject information
            const quizTitleElement = document.getElementById('quiz-title');
            if (quizTitleElement && this.currentQuiz) {
                const subjectIcon = this.getSubjectIcon(this.currentQuiz.subject);
                quizTitleElement.innerHTML = `
                    <div class="quiz-info-header">
                        <h2>${this.currentQuiz.title}</h2>
                        <div class="quiz-subject">
                            <i class="fas ${subjectIcon}"></i>
                            ${this.currentQuiz.subject} • Class ${this.currentQuiz.class || 'N/A'}
                        </div>
                    </div>
                `;
            }

            // Add keyboard navigation
            this.setupKeyboardNavigation();
        }
    }

    closeQuizModal() {
        const modal = document.getElementById('quizAttemptModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('quiz-closing', 'quiz-time-expired');
            document.body.style.overflow = 'auto';
            this.stopQuizTimer();

            // Close any open timer warning dialog
            this.closeTimerWarningDialog();

            // Remove keyboard navigation
            this.removeKeyboardNavigation();
        }
    }

    renderQuizQuestion() {
        if (!this.currentQuiz || !this.currentQuiz.questions) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const container = document.getElementById('quiz-questions-container');

        if (!container) return;

        const questionHtml = `
            <div class="quiz-question">
                <div class="quiz-question-text">
                    ${this.currentQuestionIndex + 1}. ${question.question}
                </div>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" onclick="studentDashboard.selectOption(${index})">
                            <input type="radio" name="question${this.currentQuestionIndex + 1}" value="${index}" id="option-${this.currentQuestionIndex + 1}-${index}">
                            <label for="option-${this.currentQuestionIndex + 1}-${index}" class="option-label">
                                ${String.fromCharCode(65 + index)}. ${option}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = questionHtml;
        this.updateQuizProgress();
        this.updateNavigationButtons();

        // Restore previous answer if exists
        if (this.userAnswers[this.currentQuestionIndex] !== undefined) {
            const previousAnswer = this.userAnswers[this.currentQuestionIndex];
            this.selectOption(previousAnswer);
        }
    }

    selectOption(optionIndex) {
        // Prevent answer changes when time has expired
        if (this.quizTimeExpired) return;

        // Clear previous selection within current question
        const container = document.getElementById('quiz-questions-container');
        if (container) {
            container.querySelectorAll('.quiz-option').forEach(item => {
                item.classList.remove('selected');
            });
        }

        // Select new option
        const selectedOption = document.querySelector(`#option-${this.currentQuestionIndex + 1}-${optionIndex}`).parentElement;
        selectedOption.classList.add('selected');
        document.querySelector(`#option-${this.currentQuestionIndex + 1}-${optionIndex}`).checked = true;

        // Store answer
        this.userAnswers[this.currentQuestionIndex] = optionIndex;

        // Hide error message if shown
        const errorElement = document.getElementById(`error-${this.currentQuestionIndex + 1}`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    updateQuizProgress() {
        const progressElement = document.getElementById('quiz-progress');
        if (progressElement && this.currentQuiz) {
            const totalQuestions = this.currentQuiz.questions.length;
            const answeredQuestions = Object.keys(this.userAnswers).length;
            const current = this.currentQuestionIndex + 1;

            progressElement.textContent = `Question ${current} of ${totalQuestions} (${answeredQuestions} answered)`;

            // Add visual indicator for unanswered questions
            if (answeredQuestions < totalQuestions) {
                progressElement.style.color = '#3b82f6';
            } else {
                progressElement.style.color = '#1e40af';
            }
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const submitBtn = document.getElementById('submitQuizBtn');

        if (!this.currentQuiz) return;

        // Previous button
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }

        // Next/Submit button
        const isLastQuestion = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
        if (nextBtn && submitBtn) {
            nextBtn.style.display = isLastQuestion ? 'none' : 'block';
            submitBtn.style.display = isLastQuestion ? 'block' : 'none';
        }
    }

    previousQuestion() {
        if (this.quizTimeExpired) return;
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuizQuestion();
        }
    }

    nextQuestion() {
        if (this.quizTimeExpired) return;
        // Validate current question is answered
        if (this.userAnswers[this.currentQuestionIndex] === undefined) {
            this.showNotification('Please select an answer before proceeding', 'warning');
            // Highlight the question error
            const errorElement = document.getElementById(`error-${this.currentQuestionIndex + 1}`);
            if (errorElement) {
                errorElement.style.display = 'block';
                setTimeout(() => {
                    errorElement.style.display = 'none';
                }, 3000);
            }
            return;
        }

        if (this.currentQuiz && this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuizQuestion();
        }
    }

    startQuizTimer() {
        // Set initial time based on quiz duration (default to 10 minutes if not specified)
        const quizDurationMinutes = this.currentQuiz.duration || 10;
        let timeRemaining = quizDurationMinutes * 60; // Convert to seconds
        let warningShown = false; // Track if warning has been shown

        this.quizTimer = setInterval(() => {
            timeRemaining--;

            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;

            const timerElement = document.getElementById('quiz-timer');
            if (timerElement) {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                // Add warning color when less than 2 minutes
                if (timeRemaining < 120) {
                    timerElement.style.color = '#dc2626';
                } else if (timeRemaining < 300) {
                    timerElement.style.color = '#f59e0b';
                } else {
                    timerElement.style.color = '#3b82f6';
                }
            }

            // Show warning alert when 1 minute or less remains (show only once)
            if (timeRemaining <= 60 && !warningShown) {
                warningShown = true;
                this.showTimerWarning();
            }

            // Auto-submit when time is up
            if (timeRemaining <= 0) {
                this.stopQuizTimer();
                this.quizTimeExpired = true;
                // Disable quiz UI - add class to overlay
                const modal = document.getElementById('quizAttemptModal');
                if (modal) modal.classList.add('quiz-time-expired');
                this.autoSubmitQuiz();
            }
        }, 1000);
    }

    stopQuizTimer() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
    }

    showTimerWarning() {
        // Close any existing warning dialog
        this.closeTimerWarningDialog();

        const dialog = document.createElement('div');
        dialog.id = 'quiz-timer-warning-dialog';
        dialog.className = 'quiz-timer-warning-dialog-overlay';
        dialog.innerHTML = `
            <div class="quiz-timer-warning-dialog">
                <div class="quiz-timer-warning-dialog-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="quiz-timer-warning-dialog-message">Only 1 minute left. If you do not submit in time, the quiz will be auto-submitted.</p>
                <button type="button" class="btn btn-primary quiz-timer-warning-ok">OK</button>
            </div>
        `;

        document.body.appendChild(dialog);

        const closeDialog = () => {
            if (dialog.parentNode) {
                dialog.classList.add('quiz-timer-warning-dialog-fadeout');
                setTimeout(() => dialog.remove(), 200);
            }
            if (this.timerWarningAutoCloseId) {
                clearTimeout(this.timerWarningAutoCloseId);
                this.timerWarningAutoCloseId = null;
            }
        };

        dialog.querySelector('.quiz-timer-warning-ok').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeDialog();
        });

        // Auto-close after 3.5 seconds
        this.timerWarningAutoCloseId = setTimeout(closeDialog, 3500);
    }

    closeTimerWarningDialog() {
        const dialog = document.getElementById('quiz-timer-warning-dialog');
        if (dialog) dialog.remove();
        if (this.timerWarningAutoCloseId) {
            clearTimeout(this.timerWarningAutoCloseId);
            this.timerWarningAutoCloseId = null;
        }
    }

    saveCurrentAnswer() {
        // Capture current question's selected answer from DOM (for edge cases)
        const container = document.getElementById('quiz-questions-container');
        if (!container || this.currentQuestionIndex === undefined) return;
        const checkedRadio = container.querySelector(`input[name="question${this.currentQuestionIndex + 1}"]:checked`);
        if (checkedRadio) {
            this.userAnswers[this.currentQuestionIndex] = parseInt(checkedRadio.value, 10);
        }
    }

    async autoSubmitQuiz() {
        try {
            // Prevent duplicate submissions
            if (this.isSubmitting) return;

            // Save current answer before submitting
            this.saveCurrentAnswer();

            // Mark as auto-submit (no result modal, stay on quiz list)
            this.isAutoSubmit = true;

            // Submit directly without confirmation or "all answered" validation
            await this.performQuizSubmission();
        } catch (error) {
            console.error('Error in auto-submit:', error);
            this.showNotification('Error auto-submitting quiz. Please try again.', 'error');
            this.isAutoSubmit = false;
            this.resetSubmissionState();
        }
    }

    async submitQuiz() {
        try {
            console.log('=== DEBUG: submitQuiz called');

            // Prevent multiple submissions
            if (this.isSubmitting) {
                console.log('=== DEBUG: Quiz already submitting, preventing duplicate submission');
                return;
            }

            // Validate quiz data exists
            if (!this.currentQuiz || !this.currentQuizId) {
                this.showNotification('Quiz data is missing. Please restart the quiz.', 'error');
                return;
            }

            // Validation: Prevent submit if unanswered questions remain
            const totalQuestions = this.currentQuiz.questions.length;
            const answeredQuestions = Object.keys(this.userAnswers).length;

            if (answeredQuestions < totalQuestions) {
                // Show inline message
                const unansweredMessage = document.getElementById('unanswered-message');
                if (!unansweredMessage) {
                    const messageDiv = document.createElement('div');
                    messageDiv.id = 'unanswered-message';
                    messageDiv.className = 'unanswered-message';
                    messageDiv.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        Please answer all questions before submitting.
                    `;

                    const container = document.getElementById('quiz-questions-container');
                    container.insertBefore(messageDiv, container.firstChild);
                }
                this.showNotification('Please answer all questions before submitting', 'error');
                return;
            }

            // Remove unanswered message if it exists
            const existingMessage = document.getElementById('unanswered-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            // Show custom confirmation alert
            this.showConfirmAlert(
                'Are you sure you want to submit the quiz?',
                () => {
                    this.performQuizSubmission();
                },
                {
                    confirmText: 'Yes',
                    cancelText: 'No'
                }
            );

        } catch (error) {
            console.error('=== DEBUG: Error in submitQuiz:', error);
            this.showNotification('An error occurred while preparing submission', 'error');
        }
    }

    performQuizSubmission() {
        try {
            // Check if student has teacherId assigned
            if (!this.currentUser?.teacherId) {
                console.log('=== ERROR: No teacherId found in currentUser');

                // TEMPORARY BYPASS FOR TESTING - REMOVE IN PRODUCTION
                console.log('=== WARNING: Using temporary teacherId bypass for testing');
                this.currentUser.teacherId = "507f1f77bcf86cd799439011"; // Dummy teacher ID

                // Uncomment the line below for production (no bypass)
                // this.showNotification('You must be assigned to a teacher before submitting quizzes. Please contact your administrator.', 'error');
                // return;
            }

            // Set submission flag to prevent multiple submissions
            this.isSubmitting = true;

            // Disable submit button and show loader
            const submitBtn = document.querySelector('.btn-success');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }

            // Calculate time taken
            const timeTaken = Math.floor((new Date() - this.quizStartTime) / 1000);
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;

            // Submit quiz with proper data structure
            const submitData = {
                quizId: this.currentQuizId,
                studentId: this.currentUser._id || this.currentUser.id,
                studentName: this.currentUser.fullName || this.currentUser.name,
                teacherId: this.currentUser.teacherId,
                answers: this.userAnswers,
                timeTaken: `${minutes}m ${seconds}s`,
                timeTakenSeconds: timeTaken,
                submittedAt: new Date().toISOString()
            };

            console.log('=== DEBUG: Submitting quiz with ID:', this.currentQuizId);
            console.log('=== DEBUG: Submit data:', JSON.stringify(submitData, null, 2));

            this.submitQuizAPI(submitData);

        } catch (error) {
            console.error('=== DEBUG: Error in performQuizSubmission:', error);
            this.showNotification('An error occurred while submitting', 'error');
            this.resetSubmissionState();
        }
    }

    async submitQuizAPI(submitData) {
        try {
            // Use the stored quiz ID
            const data = await window.apiService.post(`/quizzes/student/${this.currentQuizId}/submit`, submitData);
            console.log('=== DEBUG: Submit response:', data);

            if (data.success) {
                const wasAutoSubmit = this.isAutoSubmit;
                this.isAutoSubmit = false;

                if (wasAutoSubmit) {
                    // Close quiz modal - keep student on Quiz List, do NOT open result modal
                    this.closeQuizModal();

                    // Toast message
                    this.showNotification('Time is up! Your quiz was auto-submitted.', 'info');
                } else {
                    // Manual submit - close quiz and show notification
                    this.closeQuizModal();
                    this.showNotification('Quiz submitted successfully!', 'success');
                }

                // Update quiz cards (Completed badge, View Result button)
                this.loadQuizzesForAssignments();
                this.loadDashboardQuizzes();

            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('=== DEBUG: API submission error:', error);
            this.isAutoSubmit = false;
            this.handleSubmissionError(error);
        }
    }

    handleSubmissionError(error) {
        // Show retry option
        this.showNotification(`Submission failed: ${error.message}. Please try again.`, 'error');

        // Re-enable submit button
        const submitBtn = document.querySelector('.btn-success');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Quiz';
        }

        // Reset submission flag
        this.resetSubmissionState();

        let errorMessage = '';
        if (error.status === 403) {
            errorMessage = 'You are not allowed to submit this quiz';
        } else if (error.status === 409) {
            errorMessage = 'You have already submitted this quiz';
        } else if (error.message && error.message.includes('teacherId')) {
            errorMessage = 'Teacher assignment required. Please contact your administrator to be assigned to a teacher.';
        } else {
            errorMessage = error.message || 'Submission failed';
        }

        this.showNotification(errorMessage, 'error');
    }

    resetSubmissionState() {
        this.isSubmitting = false;
    }

    showConfirmAlert(message, onConfirm, options = {}) {
        const { confirmText = 'Yes', cancelText = 'Cancel', destructive = false } = options || {};
        // Remove any existing confirm alert
        const existingAlert = document.getElementById('custom-confirm-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create custom confirm alert
        const alertOverlay = document.createElement('div');
        alertOverlay.id = 'custom-confirm-alert';
        alertOverlay.className = 'confirm-alert-overlay';
        alertOverlay.innerHTML = `
            <div class="confirm-alert-box">
                <div class="confirm-alert-content">
                    <div class="confirm-alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="confirm-alert-message">${message}</div>
                    <div class="confirm-alert-actions">
                        <button class="btn btn-secondary confirm-cancel" onclick="studentDashboard.closeConfirmAlert()">
                            ${cancelText}
                        </button>
                        <button class="btn ${destructive ? 'btn-danger confirm-destructive' : 'btn-primary'} confirm-yes" onclick="studentDashboard.closeConfirmAlert(); studentDashboard.confirmQuizSubmission()">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(alertOverlay);

        // Store the callback
        this.confirmCallback = onConfirm;

        // Add animation
        setTimeout(() => {
            alertOverlay.classList.add('show');
        }, 10);
    }

    closeConfirmAlert() {
        const alertOverlay = document.getElementById('custom-confirm-alert');
        if (alertOverlay) {
            alertOverlay.classList.remove('show');
            setTimeout(() => {
                alertOverlay.remove();
            }, 300);
        }
    }

    confirmQuizSubmission() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
    }

    showQuizResultsModal(resultData) {
        const { data } = resultData;
        if (!data) {
            this.showNotification('Results not available', 'error');
            return;
        }

        const {
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            scorePercentage,
            status
        } = data;

        // Create simple modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'quiz-results-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="quiz-results-modal">
                <div class="results-header">
                    <h3>Quiz Results</h3>
                    <button class="modal-close quiz-result-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="results-content">
                    <div class="score-display">
                        <div class="score-circle">
                            <span class="score-text">${scorePercentage}%</span>
                        </div>
                        <div class="score-label">Your Score</div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${totalQuestions}</span>
                            <span class="stat-label">Total Questions</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value correct">${correctAnswers}</span>
                            <span class="stat-label">Correct</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value wrong">${wrongAnswers}</span>
                            <span class="stat-label">Wrong</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${correctAnswers}/${totalQuestions}</span>
                            <span class="stat-label">Marks</span>
                        </div>
                    </div>
                    
                    <div class="status-badge ${status.toLowerCase()}">
                        ${status === 'Pass' ? '✓ Passed' : '✗ Failed'}
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-primary quiz-result-ok-btn">
                        OK - Back to Dashboard
                    </button>
                </div>
            </div>
        `;

        // Block background interaction
        document.body.style.overflow = 'hidden';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.pointerEvents = 'auto';
        document.body.appendChild(modalOverlay);

        // Trigger smooth transition
        setTimeout(() => {
            modalOverlay.style.opacity = '1';
        }, 10);

        const removeResultModal = () => {
            modalOverlay.style.opacity = '0';
            setTimeout(() => {
                modalOverlay.remove();
                document.body.style.overflow = '';
            }, 300);
        };

        const okBtn = modalOverlay.querySelector('.quiz-result-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.closeQuizModal();
                removeResultModal();
            });
        }

        const closeBtn = modalOverlay.querySelector('.quiz-result-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', removeResultModal);
        }

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                removeResultModal();
            }
        });
    }

    formatDuration(minutes) {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    // Quiz Result Page Functions
    showQuizResultPage(resultData, quizData) {
        try {
            console.log('=== DEBUG: Showing quiz result modal with data:', resultData, quizData);

            // Create modal overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'quiz-result-modal-overlay';
            const attemptedDate = resultData.attemptedDate ? new Date(resultData.attemptedDate).toLocaleDateString() : '—';
            const status = resultData.status === 'Pass' ? 'Passed' : 'Failed';
            modalOverlay.innerHTML = `
                <div class="quiz-result-modal">
                    <div class="quiz-result-header">
                        <h2>${quizData.title || 'Quiz'}</h2>
                        <button type="button" class="quiz-result-close" onclick="this.closest('.quiz-result-modal-overlay').remove(); document.body.style.overflow='';" aria-label="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="quiz-result-body">
                        <table class="quiz-result-table">
                            <tr>
                                <td class="quiz-result-label">Score</td>
                                <td class="quiz-result-value">${resultData.obtainedMarks ?? 0} / ${resultData.totalMarks ?? 0}</td>
                            </tr>
                            <tr>
                                <td class="quiz-result-label">Percentage</td>
                                <td class="quiz-result-value">${resultData.scorePercentage ?? 0}%</td>
                            </tr>
                            <tr>
                                <td class="quiz-result-label">Correct Answers</td>
                                <td class="quiz-result-value">${resultData.correctAnswers ?? 0}</td>
                            </tr>
                            <tr>
                                <td class="quiz-result-label">Wrong Answers</td>
                                <td class="quiz-result-value">${resultData.wrongAnswers ?? 0}</td>
                            </tr>
                            <tr>
                                <td class="quiz-result-label">Attempted Date</td>
                                <td class="quiz-result-value">${attemptedDate}</td>
                            </tr>
                            <tr>
                                <td class="quiz-result-label">Status</td>
                                <td class="quiz-result-value"><span class="quiz-result-badge ${(resultData.status || 'Pass').toLowerCase()}">${status}</span></td>
                            </tr>
                        </table>
                    </div>
                    <div class="quiz-result-footer">
                        <button type="button" class="btn btn-primary" onclick="this.closest('.quiz-result-modal-overlay').remove(); document.body.style.overflow='';">
                            Close
                        </button>
                    </div>
                </div>
            `;

            // Add modal to body
            document.body.appendChild(modalOverlay);

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';

            // Add fade-in animation
            setTimeout(() => {
                modalOverlay.classList.add('show');
            }, 10);

            // Close on outside click
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.remove();
                    document.body.style.overflow = '';
                }
            });

            // Restore scrolling when modal is removed
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === modalOverlay) {
                                document.body.style.overflow = '';
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            observer.observe(document.body, { childList: true });

        } catch (error) {
            console.error('Error showing quiz result modal:', error);
            this.showNotification('Failed to load quiz results', 'error');
        }
    }

    updateResultPageData(resultData, quizData) {
        try {
            // Update quiz info
            const quizTitleElement = document.getElementById('result-quiz-title');
            const quizSubjectElement = document.getElementById('result-quiz-subject');

            if (quizTitleElement && quizData) {
                quizTitleElement.textContent = quizData.title || 'Quiz';
            }

            if (quizSubjectElement && quizData) {
                quizSubjectElement.textContent = quizData.subject || 'Subject';
            }

            // Update score
            const scorePercentageElement = document.getElementById('score-percentage');
            if (scorePercentageElement && resultData) {
                scorePercentageElement.textContent = `${resultData.scorePercentage || 0}%`;
            }

            // Update stats
            const totalQuestionsElement = document.getElementById('total-questions');
            const correctAnswersElement = document.getElementById('correct-answers');
            const wrongAnswersElement = document.getElementById('wrong-answers');
            const attemptedQuestionsElement = document.getElementById('attempted-questions');

            if (resultData) {
                if (totalQuestionsElement) {
                    totalQuestionsElement.textContent = resultData.totalQuestions || 0;
                }
                if (correctAnswersElement) {
                    correctAnswersElement.textContent = resultData.correctAnswers || 0;
                }
                if (wrongAnswersElement) {
                    wrongAnswersElement.textContent = resultData.wrongAnswers || 0;
                }
                if (attemptedQuestionsElement) {
                    attemptedQuestionsElement.textContent = resultData.totalQuestions || 0;
                }
            }

            // Update performance message
            this.updatePerformanceMessage(resultData ? resultData.scorePercentage : 0);

        } catch (error) {
            console.error('Error updating result page data:', error);
        }
    }

    updatePerformanceMessage(scorePercentage) {
        try {
            const performanceMessageElement = document.getElementById('performance-message');
            if (!performanceMessageElement) return;

            let message = '';
            let className = '';
            let icon = 'fa-trophy';

            if (scorePercentage >= 80) {
                message = 'Excellent Work!';
                className = 'excellent';
                icon = 'fa-trophy';
            } else if (scorePercentage >= 50) {
                message = 'Good Job!';
                className = 'good';
                icon = 'fa-thumbs-up';
            } else {
                message = 'Needs Improvement';
                className = 'needs-improvement';
                icon = 'fa-chart-line';
            }

            performanceMessageElement.className = `performance-message ${className}`;
            performanceMessageElement.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            `;

        } catch (error) {
            console.error('Error updating performance message:', error);
        }
    }

    hideAllPages() {
        try {
            // Hide main content
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'none';
            }

            // Hide dashboard page
            const dashboardPage = document.getElementById('dashboard-page');
            if (dashboardPage) {
                dashboardPage.style.display = 'none';
            }

            // Hide quiz modal
            this.closeQuizModal();

        } catch (error) {
            console.error('Error hiding pages:', error);
        }
    }

    backToDashboard() {
        try {
            console.log('=== DEBUG: Navigating back to dashboard');

            // Hide result page
            const resultPage = document.getElementById('quiz-result-page');
            if (resultPage) {
                resultPage.style.display = 'none';
                resultPage.classList.remove('show');
            }

            // Show dashboard
            this.loadDashboard();

        } catch (error) {
            console.error('Error navigating back to dashboard:', error);
            this.showNotification('Failed to navigate back', 'error');
        }
    }

    viewAnswers() {
        try {
            console.log('=== DEBUG: Viewing quiz answers');

            // This would show a detailed answer review
            // For now, show a notification
            this.showNotification('Answer review feature coming soon!', 'info');

        } catch (error) {
            console.error('Error viewing answers:', error);
            this.showNotification('Failed to view answers', 'error');
        }
    }

    setupKeyboardNavigation() {
        this.keyboardHandler = (e) => {
            if (!this.currentQuiz || this.quizTimeExpired) return;

            // Number keys (1-4) for selecting options
            if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                const question = this.currentQuiz.questions[this.currentQuestionIndex];
                if (question && optionIndex < question.options.length) {
                    this.selectOption(optionIndex);
                }
            }

            // Arrow keys for navigation
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.currentQuestionIndex > 0) {
                        this.previousQuestion();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    const isLastQuestion = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
                    if (isLastQuestion) {
                        this.submitQuiz();
                    } else {
                        this.nextQuestion();
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const isLast = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
                    if (isLast) {
                        this.submitQuiz();
                    } else {
                        this.nextQuestion();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.handleExitQuizClick();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    removeKeyboardNavigation() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }

    handleExitQuizClick() {
        if (!this.currentQuiz) {
            this.closeQuizModal();
            return;
        }

        this.showConfirmAlert(
            'Are you sure you want to exit? Your progress will be lost.',
            () => {
                this.closeQuizModal();
            },
            {
                confirmText: 'Exit Quiz',
                destructive: true,
                cancelText: 'Stay'
            }
        );
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
