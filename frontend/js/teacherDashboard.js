// Teacher Dashboard JavaScript
class TeacherDashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadTeacherData();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/html/index.html';
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.currentUser = payload;
            if (payload.role !== 'teacher') {
                this.showMessage('Access denied. Teacher account required.', 'error');
                setTimeout(() => {
                    window.location.href = '/html/index.html';
                }, 2000);
                return;
            }
            this.updateTeacherProfile();
        } catch (error) {
            this.logout();
        }
    }

    updateTeacherProfile() {
        if (!this.currentUser) return;

        console.log('Updating teacher profile with data:', this.currentUser);
        console.log('Profile image from token:', this.currentUser.profileImage);

        // Update profile info in header
        const teacherNameElement = document.querySelector('.teacher-name');
        if (teacherNameElement) {
            teacherNameElement.textContent = this.currentUser.fullName || this.currentUser.userId || 'Teacher';
            console.log('Teacher name updated to:', teacherNameElement.textContent);
        } else {
            console.log('Teacher name element not found');
        }

        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = this.currentUser.fullName || this.currentUser.userId || 'Teacher';
        }

        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email || 'teacher@example.com';
        }

        const profileMobile = document.getElementById('profileMobile');
        if (profileMobile) {
            profileMobile.textContent = this.currentUser.mobileNo || '-';
        }

        const profileCity = document.getElementById('profileCity');
        if (profileCity) {
            profileCity.textContent = this.currentUser.city || '-';
        }

        const profileState = document.getElementById('profileState');
        if (profileState) {
            profileState.textContent = this.currentUser.state || '-';
        }

        // Update profile image if available
        if (this.currentUser.profileImage) {
            let profileImageUrl = this.currentUser.profileImage;

            // If the profile image path is relative (starts with /uploads/), add server URL
            if (profileImageUrl.startsWith('/uploads/')) {
                profileImageUrl = `http://localhost:5001${profileImageUrl}`;
            }

            const profileImg = document.querySelector('.profile-img');
            if (profileImg) {
                profileImg.src = profileImageUrl;
                profileImg.onerror = function () {
                    // Fallback to placeholder if image fails to load
                    this.src = 'https://picsum.photos/seed/teacher/40/40.jpg';
                };
            }
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.src = profileImageUrl;
                profileAvatar.onerror = function () {
                    // Fallback to placeholder if image fails to load
                    this.src = 'https://picsum.photos/seed/teacher/100/100.jpg';
                };
            }
        }
    }

    // Modal helper functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Profile dropdown
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.querySelector('.dropdown-menu');

        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-dropdown')) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Profile modal
        const viewProfileBtn = document.getElementById('viewProfileBtn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfileModal();
            });
        }

        const closeProfileModal = document.getElementById('closeProfileModal');
        if (closeProfileModal) {
            closeProfileModal.addEventListener('click', () => {
                const modal = document.getElementById('teacherProfileModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfileForm();
            });
        }

        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.showProfileView();
            });
        }

        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', (e) => {
                this.previewProfileImage(e.target.files[0]);
            });
        }

        // Student management
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => {
                const modal = document.getElementById('addStudentModal');
                if (modal) modal.classList.add('show');
            });
        }

        const uploadCsvBtn = document.getElementById('uploadCsvBtn');
        if (uploadCsvBtn) {
            uploadCsvBtn.addEventListener('click', () => {
                const modal = document.getElementById('uploadCsvModal');
                if (modal) modal.classList.add('show');
            });
        }

        const closeStudentModal = document.getElementById('closeStudentModal');
        if (closeStudentModal) {
            closeStudentModal.addEventListener('click', () => {
                const modal = document.getElementById('addStudentModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const closeCsvModal = document.getElementById('closeCsvModal');
        if (closeCsvModal) {
            closeCsvModal.addEventListener('click', () => {
                const modal = document.getElementById('uploadCsvModal');
                if (modal) modal.classList.remove('show');
            });
        }

        // Quiz management
        const createQuizBtn = document.getElementById('createQuizBtn');
        if (createQuizBtn) {
            createQuizBtn.addEventListener('click', () => {
                const modal = document.getElementById('createQuizModal');
                if (modal) modal.classList.add('show');
            });
        }

        // Holiday management
        const addHolidayBtn = document.getElementById('addHolidayBtn');
        if (addHolidayBtn) {
            addHolidayBtn.addEventListener('click', () => {
                this.showAddHolidayModal();
            });
        }

        // Holiday filter
        const holidayFilter = document.getElementById('holidayFilter');
        if (holidayFilter) {
            holidayFilter.addEventListener('change', (e) => {
                this.filterHolidays(e.target.value);
            });
        }

        const closeQuizModal = document.getElementById('closeQuizModal');
        if (closeQuizModal) {
            closeQuizModal.addEventListener('click', () => {
                const modal = document.getElementById('createQuizModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                this.addQuestionField();
            });
        }

        // Forms
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }

        const uploadCsvForm = document.getElementById('uploadCsvForm');
        if (uploadCsvForm) {
            uploadCsvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadCsv();
            });
        }

        const createQuizForm = document.getElementById('createQuizForm');
        if (createQuizForm) {
            createQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createQuiz();
            });
        }

        // Weekly availability
        const editWeeklyAvailabilityBtn = document.getElementById('editWeeklyAvailabilityBtn');
        if (editWeeklyAvailabilityBtn) {
            editWeeklyAvailabilityBtn.addEventListener('click', () => {
                this.showWeeklyAvailabilityModal();
            });
        }

        const closeWeeklyAvailabilityModal = document.getElementById('closeWeeklyAvailabilityModal');
        if (closeWeeklyAvailabilityModal) {
            closeWeeklyAvailabilityModal.addEventListener('click', () => {
                this.hideModal('weeklyAvailabilityModal');
            });
        }

        const weeklyAvailabilityForm = document.getElementById('weeklyAvailabilityForm');
        if (weeklyAvailabilityForm) {
            weeklyAvailabilityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.setWeeklyAvailability();
            });
        }

        const clearWeeklyAvailability = document.getElementById('clearWeeklyAvailability');
        if (clearWeeklyAvailability) {
            clearWeeklyAvailability.addEventListener('click', () => {
                this.clearWeeklyAvailabilityForm();
            });
        }

        // Individual day clear buttons
        document.querySelectorAll('.btn-clear-day').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const day = button.dataset.day;
                this.clearDayAvailability(day);
            });
        });

        const marksForm = document.getElementById('marksForm');
        if (marksForm) {
            marksForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMarks();
            });
        }

        // Session management
        const createSessionBtn = document.getElementById('createSessionBtn');
        if (createSessionBtn) {
            createSessionBtn.addEventListener('click', () => {
                this.showCreateSessionModal();
            });
        }

        const closeSessionModal = document.getElementById('closeSessionModal');
        if (closeSessionModal) {
            closeSessionModal.addEventListener('click', () => {
                const modal = document.getElementById('createSessionModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', () => {
                const modal = document.getElementById('createSessionModal');
                if (modal) modal.classList.remove('show');
            });
        }

        const createSessionForm = document.getElementById('createSessionForm');
        if (createSessionForm) {
            createSessionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createSessionSlots();
            });
        }

        // Student type dropdown change handler
        const studentTypeSelect = document.getElementById('studentType');
        if (studentTypeSelect) {
            studentTypeSelect.addEventListener('change', (e) => {
                this.handleStudentTypeChange(e.target.value);
            });
        }

        // Session date change handler for real-time holiday validation
        const sessionDateInput = document.getElementById('sessionDate');
        if (sessionDateInput) {
            sessionDateInput.addEventListener('change', async (e) => {
                await this.validateSessionDate(e.target.value);
            });
        }

        const sessionFilter = document.getElementById('sessionFilter');
        if (sessionFilter) {
            sessionFilter.addEventListener('change', (e) => {
                this.filterSessions(e.target.value);
            });
        }

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Time picker emoji functionality
        this.setupTimePickerListeners();
    }

    setupTimePickerListeners() {
        // Add time picker functionality to all text inputs in availability modal
        document.querySelectorAll('#weeklyAvailabilityModal input[type="text"]').forEach(timeInput => {
            // Validate time input format
            timeInput.addEventListener('input', (e) => {
                const value = e.target.value;
                const timePattern = /^([0-2][0-9]):([0-5][0-9])$/;
                if (value && !timePattern.test(value)) {
                    e.target.setCustomValidity('Please enter time in HH:MM format (24-hour)');
                } else {
                    e.target.setCustomValidity('');
                }
            });

            // Add click event to show custom time picker when clicking on time icon
            const timeIcon = timeInput.nextElementSibling;
            if (timeIcon && timeIcon.classList.contains('time-icon')) {
                timeIcon.style.pointerEvents = 'auto';
                timeIcon.style.cursor = 'pointer';

                timeIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showCustomTimePicker(timeInput);
                });

                timeIcon.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showCustomTimePicker(timeInput);
                    }
                });
            }

            // Also add click event to input itself
            timeInput.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showCustomTimePicker(timeInput);
            });

            // Prevent default time picker from opening (not needed for text inputs)
            timeInput.addEventListener('focus', (e) => {
                e.preventDefault();
                this.showCustomTimePicker(timeInput);
            });
        });
    }

    showCustomTimePicker(timeInput) {
        // Remove any existing custom time picker
        const existingPicker = document.querySelector('.custom-time-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        // Get current time value and ensure it's in 24-hour format
        let currentValue = timeInput.value || '00:00';

        // Handle potential 12-hour to 24-hour conversion issues
        if (currentValue.includes('AM') || currentValue.includes('PM')) {
            // If it contains AM/PM, convert to 24-hour format
            const [timePart, period] = currentValue.split(' ');
            const [hours, minutes] = timePart.split(':');
            let hour24 = parseInt(hours);

            if (period === 'PM' && hour24 !== 12) {
                hour24 += 12;
            } else if (period === 'AM' && hour24 === 12) {
                hour24 = 0;
            }

            currentValue = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        const [currentHour, currentMinute] = currentValue.split(':');

        // Create custom time picker dropdown
        const picker = document.createElement('div');
        picker.className = 'custom-time-picker';

        picker.innerHTML = `
            <div class="time-picker-header">
                <span>Select Time (24-hour)</span>
                <button class="close-picker" type="button">&times;</button>
            </div>
            <div class="time-selects-container">
                <div class="time-select-group">
                    <label for="time_hour">Hour:</label>
                    <select id="time_hour" name="time_hour">
                        ${Array.from({ length: 24 }, (_, i) =>
            `<option value="${i.toString().padStart(2, '0')}" ${currentHour === i.toString().padStart(2, '0') ? 'selected' : ''}>${i.toString().padStart(2, '0')}</option>`
        ).join('')}
                    </select>
                </div>
                <div class="time-select-group">
                    <label for="time_minute">Minute:</label>
                    <select id="time_minute" name="time_minute">
                        ${Array.from({ length: 60 }, (_, i) =>
            `<option value="${i.toString().padStart(2, '0')}" ${currentMinute === i.toString().padStart(2, '0') ? 'selected' : ''}>${i.toString().padStart(2, '0')}</option>`
        ).join('')}
                    </select>
                </div>
            </div>
            <div class="time-picker-actions">
                <button type="button" class="btn-set-time">Set Time</button>
            </div>
        `;

        // Position picker at the bottom center of the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const pickerWidth = 280;
        const pickerHeight = 300;

        // Center horizontally and position at bottom with margin
        const left = (viewportWidth - pickerWidth) / 2;
        const top = viewportHeight - pickerHeight - 20; // 20px margin from bottom

        picker.style.position = 'fixed';
        picker.style.top = `${top}px`;
        picker.style.left = `${left}px`;
        picker.style.zIndex = '10000';

        // Add to document
        document.body.appendChild(picker);

        // Handle set time button
        picker.querySelector('.btn-set-time').addEventListener('click', () => {
            const hourSelect = picker.querySelector('#time_hour');
            const minuteSelect = picker.querySelector('#time_minute');
            const selectedTime = `${hourSelect.value}:${minuteSelect.value}`;

            // Set the time value directly in 24-hour format
            timeInput.value = selectedTime;

            // Force the input to recognize 24-hour format
            timeInput.setAttribute('value', selectedTime);

            picker.remove();

            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            timeInput.dispatchEvent(changeEvent);
        });

        // Handle close button
        picker.querySelector('.close-picker').addEventListener('click', () => {
            picker.remove();
        });

        // Close on outside click
        const handleClickOutside = (e) => {
            if (!picker.contains(e.target) && e.target !== timeInput) {
                picker.remove();
                document.removeEventListener('click', handleClickOutside);
            }
        };

        // Use setTimeout to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    navigateToPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page content
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Teacher Dashboard',
            students: 'Students Management',
            quiz: 'Quiz Management',
            availability: 'Availability',
            holidays: 'Holiday Management',
            marks: 'Marks',
            sessions: 'Session Management'
        };
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = titles[page] || 'Teacher Dashboard';
        }

        this.currentPage = page;
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'students':
                await this.loadStudentsData();
                break;
            case 'quiz':
                await this.loadQuizData();
                break;
            case 'availability':
                await this.loadAvailabilityData();
                break;
            case 'holidays':
                await this.loadHolidaysPageData();
                break;
            case 'marks':
                await this.loadMarksData();
                break;
            case 'sessions':
                await this.loadSessionsData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading();

            // Load students count from database
            const studentsResponse = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (studentsResponse.ok) {
                const students = await studentsResponse.json();
                const totalStudents = students.length || 0;

                // Update dashboard with real database count
                const totalStudentsElement = document.getElementById('totalStudents');
                if (totalStudentsElement) {
                    totalStudentsElement.textContent = totalStudents;
                    // Add animation to show real-time update
                    totalStudentsElement.style.animation = 'pulse 0.6s ease-out';
                    setTimeout(() => {
                        totalStudentsElement.style.animation = '';
                    }, 600);
                }

                this.updateRecentStudents(students.slice(0, 5));

                // Update student count in students page header
                const studentsHeader = document.querySelector('#students-page .page-header h2');
                if (studentsHeader) {
                    studentsHeader.textContent = `Students Management (${totalStudents})`;
                }

            }

            // Load quiz data from database
            const quizzesResponse = await fetch('/api/teachers/quiz', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (quizzesResponse.ok) {
                const result = await quizzesResponse.json();
                const quizzes = result.quizzes || [];
                const totalQuizzes = quizzes.length || 0;

                // Update dashboard with real quiz count
                document.getElementById('totalQuizzes').textContent = totalQuizzes;

                // Update recent quizzes
                this.updateRecentQuizzes(quizzes.slice(0, 3));

            }

            // Load total sessions data
            await this.loadTotalSessionsForDashboard();

            // Load holidays data
            await this.loadHolidaysData();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showMessage('Error loading dashboard data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateRecentStudents(students) {
        const container = document.getElementById('recentStudents');
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty">No students added yet</p>';
            return;
        }

        container.innerHTML = students.map(student => `
            <div class="student-item">
                <img src="${student.profileImage || 'https://via.placeholder.com/32'}" alt="${student.fullName}" class="student-avatar-small">
                <div class="student-info">
                    <h4>${student.fullName}</h4>
                    <p>${student.email}</p>
                </div>
                <span class="student-class">${student.class || 'N/A'}</span>
            </div>
        `).join('');
    }

    updateRecentQuizzes(quizzes) {
        const container = document.getElementById('recentQuizzes');
        if (!quizzes || quizzes.length === 0) {
            container.innerHTML = '<p class="empty">No quizzes created yet</p>';
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="quiz-item">
                <div class="quiz-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="quiz-info">
                    <h4>${quiz.title}</h4>
                    <p>${quiz.class} • ${quiz.subject}</p>
                </div>
                <div class="quiz-stats">
                    <span class="quiz-questions">${quiz.questions?.length || 0} questions</span>
                    <span class="quiz-marks">${quiz.totalMarks || quiz.questions?.length || 0} marks</span>
                </div>
            </div>
        `).join('');
    }

    async loadHolidaysData() {
        try {
            const response = await fetch('/api/teacher-availability/holidays', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const holidays = result.holidays || [];
                this.updateRecentHolidays(holidays);
            }
        } catch (error) {
            // Silently handle holiday loading errors
            console.log('Holiday data not available');
        }
    }

    updateRecentHolidays(holidays) {
        const container = document.getElementById('holidays');
        if (!holidays || holidays.length === 0) {
            container.innerHTML = '<p class="empty">No holidays added yet</p>';
            return;
        }

        container.innerHTML = holidays.map(holiday => `
            <div class="holiday-item">
                <div class="holiday-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="holiday-info">
                    <h4>${holiday.reason}</h4>
                    <p>${this.formatDate(holiday.startDate)}${holiday.startDate !== holiday.endDate ? ' - ' + this.formatDate(holiday.endDate) : ''}</p>
                    ${holiday.note ? `<p class="holiday-note">${holiday.note}</p>` : ''}
                </div>
                <div class="holiday-actions">
                    <button class="btn-delete" onclick="dashboard.deleteHoliday('${holiday._id}')" title="Delete Holiday">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showAddHolidayModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'addHolidayModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Holiday</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="addHolidayForm" novalidate>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="singleDayHoliday" onchange="dashboard.toggleSingleDayHoliday()">
                            Single Day Holiday
                        </label>
                    </div>
                    <div class="form-row" id="dateRangeRow">
                        <div class="form-group">
                            <label for="startDate">Start Date *</label>
                            <input type="date" name="startDate" id="startDate" required>
                            <small class="form-hint">Select holiday start date</small>
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date *</label>
                            <input type="date" name="endDate" id="endDate" required>
                            <small class="form-hint">Select holiday end date</small>
                        </div>
                    </div>
                    <div class="form-row" id="singleDateRow" style="display: none;">
                        <div class="form-group">
                            <label for="singleDate">Holiday Date *</label>
                            <input type="date" name="singleDate" id="singleDate">
                            <small class="form-hint">Select holiday date</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reason">Reason *</label>
                        <select name="reason" id="reason" required>
                            <option value="">Select Reason</option>
                            <option value="personal">Personal</option>
                            <option value="public">Public Holiday</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="note">Note (Optional)</label>
                        <textarea name="note" id="note" placeholder="Add a note (optional)" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Holiday</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('show');

        // Set minimum date to today for all date inputs
        this.setMinDateForDateInputs();

        // Add event listener for form submission with validation
        document.getElementById('addHolidayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateHolidayForm()) {
                this.addHoliday();
            }
        });

        // Add real-time validation
        this.setupHolidayValidation();
    }

    setMinDateForDateInputs() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        // Set min date for all date inputs
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.min = todayString;
        });
    }

    setupHolidayValidation() {
        // Date validation for HTML5 date inputs
        const dateInputs = document.querySelectorAll('input[name="startDate"], input[name="endDate"], input[name="singleDate"]');

        dateInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.validateDateFormat(e.target);
            });

            input.addEventListener('blur', (e) => {
                this.validateDateFormat(e.target);
            });
        });

        // Reason validation
        const reasonSelect = document.getElementById('reason');
        if (reasonSelect) {
            reasonSelect.addEventListener('change', (e) => {
                this.validateReason(e.target);
            });
        }
    }

    validateDateFormat(input) {
        const value = input.value.trim();
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');

        // Remove existing error
        if (errorElement) {
            errorElement.remove();
        }
        input.classList.remove('error');

        if (!value) {
            if (input.hasAttribute('required')) {
                this.showFieldError(input, 'Date is required');
                return false;
            }
            return true;
        }

        // HTML5 date inputs already validate format, but we need to check if it's a valid date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            this.showFieldError(input, 'Invalid date');
            return false;
        }

        // Validate date is not in the past (HTML5 date inputs use YYYY-MM-DD format)
        if (this.isPastDateISO(value)) {
            this.showFieldError(input, 'Holiday cannot be created for past dates');
            return false;
        }

        // Validate date range if both dates are present
        if (input.name === 'endDate' && document.getElementById('startDate').value) {
            const startDate = document.getElementById('startDate').value;
            if (startDate > value) {
                this.showFieldError(input, 'End date cannot be before start date');
                return false;
            }
        }

        return true;
    }

    validateReason(select) {
        const formGroup = select.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');

        // Remove existing error
        if (errorElement) {
            errorElement.remove();
        }
        select.classList.remove('error');

        if (!select.value) {
            this.showFieldError(select, 'Please select a reason');
            return false;
        }

        return true;
    }

    validateHolidayForm() {
        const form = document.getElementById('addHolidayForm');
        const isSingleDay = document.getElementById('singleDayHoliday').checked;
        let isValid = true;

        // Clear all previous errors
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));

        if (isSingleDay) {
            const singleDateInput = document.getElementById('singleDate');
            if (!this.validateDateFormat(singleDateInput)) {
                isValid = false;
            }
        } else {
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');

            if (!this.validateDateFormat(startDateInput)) {
                isValid = false;
            }

            if (!this.validateDateFormat(endDateInput)) {
                isValid = false;
            }

            // Validate date range
            if (startDateInput.value && endDateInput.value) {
                if (startDateInput.value > endDateInput.value) {
                    this.showFieldError(endDateInput, 'End date cannot be before start date');
                    isValid = false;
                }
            }

            // Additional check: start date should not be in past
            if (startDateInput.value && this.isPastDateISO(startDateInput.value)) {
                this.showFieldError(startDateInput, 'Holiday cannot be created for past dates');
                isValid = false;
            }
        }

        // Validate reason
        const reasonSelect = document.getElementById('reason');
        if (!this.validateReason(reasonSelect)) {
            isValid = false;
        }

        // Validate note (optional but if present, must be string)
        const noteTextarea = document.getElementById('note');
        if (noteTextarea.value && typeof noteTextarea.value !== 'string') {
            this.showFieldError(noteTextarea, 'Note must be text');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        const formGroup = field.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;
    }

    isValidDate(dateString) {
        const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (!dateRegex.test(dateString)) return false;

        const [day, month, year] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            year >= 1900 && year <= 2100
        );
    }

    compareDates(date1, date2) {
        const [d1, m1, y1] = date1.split('-').map(Number);
        const [d2, m2, y2] = date2.split('-').map(Number);

        const date1Obj = new Date(y1, m1 - 1, d1);
        const date2Obj = new Date(y2, m2 - 1, d2);

        return date1Obj - date2Obj;
    }

    isPastDate(dateString) {
        const [day, month, year] = dateString.split('-').map(Number);
        const holidayDate = new Date(year, month - 1, day);

        // Set current date to start of day for accurate comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Set holiday date to start of day for accurate comparison
        holidayDate.setHours(0, 0, 0, 0);

        return holidayDate < today;
    }

    isPastDateISO(dateString) {
        // dateString is in YYYY-MM-DD format from HTML5 date input
        const holidayDate = new Date(dateString);

        // Set current date to start of day for accurate comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Set holiday date to start of day for accurate comparison
        holidayDate.setHours(0, 0, 0, 0);

        return holidayDate < today;
    }

    convertISOToDDMMYYYY(isoDateString) {
        // Convert YYYY-MM-DD to DD-MM-YYYY
        if (!isoDateString) return '';

        const [year, month, day] = isoDateString.split('-');
        return `${day}-${month}-${year}`;
    }

    toggleSingleDayHoliday() {
        const isSingleDay = document.getElementById('singleDayHoliday').checked;
        const dateRangeRow = document.getElementById('dateRangeRow');
        const singleDateRow = document.getElementById('singleDateRow');

        if (isSingleDay) {
            dateRangeRow.style.display = 'none';
            singleDateRow.style.display = 'flex';
            // Remove required from date range inputs
            document.querySelector('input[name="startDate"]').removeAttribute('required');
            document.querySelector('input[name="endDate"]').removeAttribute('required');
            // Add required to single date input
            document.querySelector('input[name="singleDate"]').setAttribute('required', '');
        } else {
            dateRangeRow.style.display = 'flex';
            singleDateRow.style.display = 'none';
            // Add required back to date range inputs
            document.querySelector('input[name="startDate"]').setAttribute('required', '');
            document.querySelector('input[name="endDate"]').setAttribute('required', '');
            // Remove required from single date input
            document.querySelector('input[name="singleDate"]').removeAttribute('required');
        }
    }

    async addHoliday() {
        const formData = new FormData(document.getElementById('addHolidayForm'));
        const isSingleDay = document.getElementById('singleDayHoliday').checked;

        let startDate, endDate;

        if (isSingleDay) {
            // For single day holiday, use the same date for both start and end
            const singleDate = this.convertISOToDDMMYYYY(formData.get('singleDate'));
            startDate = singleDate;
            endDate = singleDate;
        } else {
            // For multi-day holiday, use start and end dates
            startDate = this.convertISOToDDMMYYYY(formData.get('startDate'));
            endDate = this.convertISOToDDMMYYYY(formData.get('endDate'));
        }

        const holidayData = {
            startDate,
            endDate,
            reason: formData.get('reason'),
            note: formData.get('note')
        };

        try {
            this.showLoading();

            const response = await fetch('/api/teacher-availability/holidays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(holidayData)
            });

            if (response.ok) {
                const result = await response.json();

                // Show success message
                this.showMessage('Holiday created successfully', 'success');

                // Close modal
                document.querySelector('.modal').remove();

                // Refresh holiday data to ensure it's added to the UI
                await this.loadHolidaysData();
                await this.loadHolidaysPageData();

                console.log('Holiday created and added to database:', result);

            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to create holiday', 'error');
                console.error('Failed to create holiday:', error);
            }
        } catch (error) {
            this.showMessage('Error creating holiday', 'error');
            console.error('Error creating holiday:', error);
        } finally {
            this.hideLoading();
        }
    }

    async loadHolidaysPageData() {
        try {
            this.showLoading();

            // Get all holidays for teacher
            const response = await fetch('/api/teacher-availability/holidays', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const holidays = result.holidays || [];
                // Store all holidays for filtering
                this.allHolidays = holidays;
                this.updateHolidaysPage(holidays);
                this.updateHolidayStats(holidays);
            }
        } catch (error) {
            // Silently handle holiday page loading errors
            console.log('Holiday page data not available');
        } finally {
            this.hideLoading();
        }
    }

    updateHolidaysPage(holidays) {
        const container = document.getElementById('holidaysList');
        if (!holidays || holidays.length === 0) {
            container.innerHTML = '<p class="empty">No holidays added yet</p>';
            return;
        }

        container.innerHTML = holidays.map(holiday => `
            <div class="holiday-item-full">
                <div class="holiday-header">
                    <div class="holiday-title">
                        <h4>${holiday.reason}</h4>
                        <span class="holiday-type ${holiday.reason}">${holiday.reason}</span>
                    </div>
                    <div class="holiday-actions">
                        <button class="btn-edit" onclick="dashboard.editHoliday('${holiday._id}')" title="Edit Holiday">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="dashboard.deleteHoliday('${holiday._id}')" title="Delete Holiday">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="holiday-details">
                    <div class="holiday-dates">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(holiday.startDate)}${holiday.startDate !== holiday.endDate ? ' - ' + this.formatDate(holiday.endDate) : ''}</span>
                    </div>
                    ${holiday.note ? `<div class="holiday-note-full"><i class="fas fa-sticky-note"></i> <span>${holiday.note}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateHolidayStats(holidays) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Total holidays
        document.getElementById('totalHolidays').textContent = holidays.length;

        // Upcoming holidays
        const upcoming = holidays.filter(h => new Date(h.startDate) >= today);
        document.getElementById('upcomingHolidays').textContent = upcoming.length;

        // This month holidays
        const thisMonth = holidays.filter(h => {
            const holidayDate = new Date(h.startDate);
            return holidayDate.getMonth() === currentMonth && holidayDate.getFullYear() === currentYear;
        });
        document.getElementById('thisMonthHolidays').textContent = thisMonth.length;
    }

    filterHolidays(filterType) {
        if (!this.allHolidays) {
            return;
        }

        let filteredHolidays = this.allHolidays;
        const today = new Date();

        switch (filterType) {
            case 'upcoming':
                filteredHolidays = this.allHolidays.filter(h => new Date(h.startDate) >= today);
                break;
            case 'past':
                filteredHolidays = this.allHolidays.filter(h => new Date(h.startDate) < today);
                break;
            case 'personal':
                filteredHolidays = this.allHolidays.filter(h => h.reason === 'personal');
                break;
            case 'public':
                filteredHolidays = this.allHolidays.filter(h => h.reason === 'public');
                break;
            case 'all':
            default:
                filteredHolidays = this.allHolidays;
                break;
        }

        this.updateHolidaysPage(filteredHolidays);
    }

    async loadStudentsData() {
        try {
            this.showLoading();

            const response = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const students = await response.json();
                this.updateStudentsGrid(students);
            } else {
                const error = await response.json();
                this.showMessage('Error loading students', 'error');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showMessage('Error loading students', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateStudentsGrid(students) {
        const container = document.getElementById('studentsGrid');
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty">No students found</p>';
            return;
        }

        container.innerHTML = students.map(student => `
            <div class="student-card">
                <img src="${student.profileImage || 'https://via.placeholder.com/60'}" alt="${student.fullName}" class="student-avatar">
                <div class="student-details">
                    <h4>${student.fullName}</h4>
                    <p><i class="fas fa-envelope"></i> ${student.email}</p>
                    <p><i class="fas fa-phone"></i> ${student.mobileNo}</p>
                    <p><i class="fas fa-graduation-cap"></i> ${student.class || 'N/A'}</p>
                </div>
                <div class="student-actions">
                    <button class="btn-edit" onclick="dashboard.editStudent('${student._id || student.userId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="dashboard.deleteStudent('${student._id || student.userId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStudentCount(count) {
        // Update dashboard total students
        const totalStudentsElement = document.getElementById('totalStudents');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = count;
            // Add animation to show real-time update
            totalStudentsElement.style.animation = 'pulse 0.6s ease-out';
            setTimeout(() => {
                totalStudentsElement.style.animation = '';
            }, 600);
        }

        // Update students page header
        const studentsHeader = document.querySelector('#students-page .page-header h2');
        if (studentsHeader) {
            studentsHeader.textContent = `Students Management (${count})`;
        }
    }


    async addStudent() {
        const formData = new FormData(document.getElementById('addStudentForm'));

        try {
            this.showLoading();

            const response = await fetch('/api/teachers/students', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Student added successfully:', result);

                // Update total students count immediately
                if (result.totalStudents !== undefined) {
                    this.updateStudentCount(result.totalStudents);
                }

                // Close modal and reset form
                const modal = document.getElementById('addStudentModal');
                if (modal) modal.classList.remove('show');
                document.getElementById('addStudentForm').reset();

                // Refresh both students list and dashboard
                await Promise.all([
                    this.loadStudentsData(),
                    this.loadDashboardData()
                ]);

                // Show success animation
                this.showAddSuccessAnimation();
            } else {
                const error = await response.json();
                console.error('Add student error:', error);
                this.showMessage(error.message || 'Failed to add student', 'error');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            this.showMessage('Error adding student to database', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showAddSuccessAnimation() {
        // Create a temporary success notification
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 2000;
            animation: successPulse 0.6s ease-out;
        `;
        successDiv.innerHTML = '<i class="fas fa-user-plus"></i> Student added successfully';
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 2000);
    }

    async uploadCsv() {
        const formData = new FormData(document.getElementById('uploadCsvForm'));

        try {
            const response = await fetch('/api/teachers/students/upload-csv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage(`CSV uploaded successfully. ${result.imported || 0} students imported.`, 'success');
                const modal = document.getElementById('uploadCsvModal');
                if (modal) modal.classList.remove('show');
                document.getElementById('uploadCsvForm').reset();
                this.loadStudentsData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to upload CSV', 'error');
            }
        } catch (error) {
            console.error('Error uploading CSV:', error);
            this.showMessage('Error uploading CSV', 'error');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

        try {
            this.showLoading();

            const response = await fetch(`/api/teachers/students/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Student deleted successfully:', result);

                // Update total students count immediately
                if (result.totalStudents !== undefined) {
                    this.updateStudentCount(result.totalStudents);
                }

                // Refresh both students list and dashboard
                await Promise.all([
                    this.loadStudentsData(),
                    this.loadDashboardData()
                ]);

                // Show success animation
                this.showDeleteSuccessAnimation();
            } else {
                const error = await response.json();
                console.error('Delete student error:', error);
                this.showMessage(error.message || 'Failed to delete student', 'error');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showMessage('Error deleting student from database', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async updateStudent() {
        const formData = new FormData(document.getElementById('editStudentForm'));
        const studentId = formData.get('userId');

        try {
            this.showLoading();

            const response = await fetch(`/api/teachers/students/update/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Student updated successfully:', result);

                // Update total students count immediately
                if (result.totalStudents !== undefined) {
                    this.updateStudentCount(result.totalStudents);
                }

                // Close modal
                const modal = document.getElementById('editStudentModal');
                if (modal) {
                    modal.classList.remove('show');
                    modal.remove(); // Remove modal from DOM
                }

                // Refresh both students list and dashboard
                await Promise.all([
                    this.loadStudentsData(),
                    this.loadDashboardData()
                ]);

                // Show success animation (this includes the success message)
                this.showUpdateSuccessAnimation();
            } else {
                const error = await response.json();
                console.error('Update student error:', error);
                this.showMessage(error.message || 'Failed to update student', 'error');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            this.showMessage('Error updating student in database', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showDeleteSuccessAnimation() {
        // Create a temporary success notification
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 2000;
            animation: successPulse 0.6s ease-out;
        `;
        successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Student removed successfully';
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 2000);
    }

    async editStudent(studentId) {
        try {
            const response = await fetch(`/api/teachers/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const student = await response.json();
                console.log('Student data loaded:', student);
                this.showEditStudentModal(student);
            } else {
                const error = await response.json();
                console.error('Load student error:', error);
                this.showMessage(error.message || 'Failed to load student data', 'error');
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            this.showMessage('Error loading student data', 'error');
        }
    }

    showEditStudentModal(student) {
        // Create edit modal if it doesn't exist
        let editModal = document.getElementById('editStudentModal');
        if (!editModal) {
            editModal = document.createElement('div');
            editModal.id = 'editStudentModal';
            editModal.className = 'modal';
            editModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Student</h3>
                        <button class="close-btn" id="closeEditModal">&times;</button>
                    </div>
                    <form id="editStudentForm">
                        <div class="form-row">
                            <input type="hidden" id="editStudentId" name="userId">
                            <input type="text" name="fullName" placeholder="Full Name" required>
                            <input type="email" name="email" placeholder="Email" required>
                        </div>
                        <div class="form-row">
                            <input type="number" name="age" placeholder="Age" min="1" max="120">
                            <input type="text" name="mobileNo" placeholder="Mobile Number" required>
                        </div>
                        <div class="form-row">
                            <input type="text" name="class" placeholder="Class">
                            <input type="text" name="city" placeholder="City">
                            <input type="text" name="state" placeholder="State">
                        </div>
                        <div class="form-row">
                            <input type="text" name="timezone" placeholder="Timezone (Optional)">
                        </div>
                        <div class="form-row">
                            <input type="file" name="image" accept="image/*" onchange="dashboard.previewImage(this)">
                        </div>
                        <div class="form-row" id="currentImagePreview" style="display: none;">
                            <label>Current Profile Image:</label>
                            <img id="currentProfileImage" src="" alt="Current Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                        </div>
                        <button type="submit" class="btn-primary">Update Student</button>
                    </form>
                </div>
            `;
            document.body.appendChild(editModal);

            // Add event listeners for edit modal
            document.getElementById('closeEditModal').addEventListener('click', () => {
                editModal.classList.remove('show');
            });

            document.getElementById('editStudentForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateStudent();
            });

            // Close modal on outside click
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    editModal.classList.remove('show');
                }
            });
        }

        // Populate form with student data
        document.getElementById('editStudentId').value = student._id || student.userId;
        document.getElementById('editStudentForm').elements['fullName'].value = student.fullName || '';
        document.getElementById('editStudentForm').elements['email'].value = student.email || '';
        document.getElementById('editStudentForm').elements['age'].value = student.age || '';
        document.getElementById('editStudentForm').elements['mobileNo'].value = student.mobileNo || '';
        document.getElementById('editStudentForm').elements['class'].value = student.class || '';
        document.getElementById('editStudentForm').elements['city'].value = student.city || '';
        document.getElementById('editStudentForm').elements['state'].value = student.state || '';
        document.getElementById('editStudentForm').elements['timezone'].value = student.timezone || '';

        // Show current profile image if exists
        if (student.profileImage) {
            const currentImagePreview = document.getElementById('currentImagePreview');
            const currentProfileImage = document.getElementById('currentProfileImage');
            currentProfileImage.src = student.profileImage;
            currentImagePreview.style.display = 'block';
        }

        editModal.classList.add('show');
    }

    previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const currentProfileImage = document.getElementById('currentProfileImage');
                currentProfileImage.src = e.target.result;
                document.getElementById('currentImagePreview').style.display = 'block';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    showUpdateSuccessAnimation() {
        // Create a temporary success notification
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 2000;
            animation: successPulse 0.6s ease-out;
        `;
        successDiv.innerHTML = '<i class="fas fa-user-edit"></i> Student updated successfully';
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 2000);
    }

    async createQuiz() {
        const form = document.getElementById('createQuizForm');
        const formData = new FormData(form);

        // Get basic quiz info
        const title = formData.get('title');
        const className = formData.get('class') || 'General';
        const subject = formData.get('subject') || 'General';
        const totalMarks = parseInt(formData.get('totalMarks')) || 1;

        // Collect questions from the form
        const questions = [];
        const questionElements = form.querySelectorAll('.question-item');

        for (let i = 0; i < questionElements.length; i++) {
            const questionEl = questionElements[i];
            const questionText = questionEl.querySelector('input[name^="question"]').value;
            const options = Array.from(questionEl.querySelectorAll('input[name^="options"]')).map(input => input.value);
            const correctOption = questionEl.querySelector('select').value;

            if (questionText && options.length === 4) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctOption: correctOption.toUpperCase()
                });
            }
        }

        const quizData = {
            title,
            class: className,
            subject,
            questions,
            totalMarks
        };

        try {
            this.showLoading();

            const response = await fetch('/api/teachers/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage('Quiz created successfully', 'success');
                document.getElementById('createQuizModal').classList.remove('show');
                form.reset();
                // Reset to single question
                this.resetQuestionsToDefault();
                this.loadQuizData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to create quiz', 'error');
            }
        } catch (error) {
            console.error('Error creating quiz:', error);
            this.showMessage('Error creating quiz', 'error');
        } finally {
            this.hideLoading();
        }
    }

    addQuestionField() {
        const container = document.getElementById('questionsContainer');
        const questionCount = container.querySelectorAll('.question-item').length + 1;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <input type="text" name="questions[]" placeholder="Question ${questionCount}" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option A" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option B" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option C" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option D" required>
            <select name="answers[]">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;

        container.appendChild(questionDiv);
    }

    resetQuestionsToDefault() {
        const container = document.getElementById('questionsContainer');
        // Keep only the first question
        const questions = container.querySelectorAll('.question-item');
        for (let i = 1; i < questions.length; i++) {
            questions[i].remove();
        }
        // Reset the first question
        const firstQuestion = container.querySelector('.question-item');
        if (firstQuestion) {
            firstQuestion.querySelectorAll('input').forEach(input => input.value = '');
            firstQuestion.querySelector('select').selectedIndex = 0;
        }
    }

    async loadQuizData() {
        try {
            const response = await fetch('/api/teachers/quiz', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const quizzes = result.quizzes || [];
                console.log('Quizzes loaded:', quizzes);

                // Update quiz count
                document.getElementById('totalQuizzes').textContent = quizzes.length;

                // Display quizzes
                const quizList = document.getElementById('quizList');
                if (quizzes.length === 0) {
                    quizList.innerHTML = '<p class="empty">No quizzes created yet</p>';
                } else {
                    quizList.innerHTML = quizzes.map(quiz => `
                        <div class="quiz-card-enhanced" data-quiz-id="${quiz._id}">
                            <div class="quiz-card-header">
                                <div class="quiz-title-section">
                                    <div class="quiz-icon-enhanced">
                                        <i class="fas fa-question-circle"></i>
                                    </div>
                                    <div class="quiz-title-info">
                                        <h3 class="quiz-title">${quiz.title}</h3>
                                        <p class="quiz-subtitle">${quiz.class} • ${quiz.subject}</p>
                                    </div>
                                </div>
                                <div class="quiz-actions-enhanced">
                                    <button class="btn-action btn-edit-enhanced" onclick="dashboard.editQuiz('${quiz._id}')" title="Edit Quiz">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action btn-delete-enhanced" onclick="dashboard.deleteQuiz('${quiz._id}')" title="Delete Quiz">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="quiz-card-body">
                                <div class="quiz-stats-grid">
                                    <div class="quiz-stat-item">
                                        <div class="stat-icon questions">
                                            <i class="fas fa-list-ol"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-value">${quiz.questions?.length || 0}</span>
                                            <span class="stat-label">Questions</span>
                                        </div>
                                    </div>
                                    <div class="quiz-stat-item">
                                        <div class="stat-icon marks">
                                            <i class="fas fa-star"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-value">${quiz.totalMarks || quiz.questions?.length || 0}</span>
                                            <span class="stat-label">Total Marks</span>
                                        </div>
                                    </div>
                                    <div class="quiz-stat-item">
                                        <div class="stat-icon date">
                                            <i class="fas fa-calendar"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-value">${new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span class="stat-label">Created</span>
                                        </div>
                                    </div>
                                </div>
                                ${quiz.description ? `
                                <div class="quiz-description">
                                    <p>${quiz.description}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="quiz-card-footer">
                                <div class="quiz-status">
                                    ${quiz.assignedClass ?
                            `<span class="status-badge status-assigned">Assigned to ${quiz.assignedClass}</span>` :
                            `<span class="status-badge status-active">Not Assigned</span>`
                        }
                                </div>
                                <div class="quiz-footer-actions">
                                    <button class="btn-view" onclick="dashboard.viewQuiz('${quiz._id}')">
                                        <i class="fas fa-eye"></i> View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }

            } else {
                const error = await response.json();
                console.error('Load quizzes error:', error);
                this.showMessage(error.message || 'Failed to load quizzes', 'error');
            }
        } catch (error) {
            console.error('Error loading quiz data:', error);
            this.showMessage('Error loading quiz data', 'error');
        }
    }

    async deleteQuiz(quizId) {
        if (!confirm('Are you sure you want to delete this quiz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/teachers/quiz/${quizId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showMessage('Quiz deleted successfully', 'success');
                this.loadQuizData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete quiz', 'error');
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
            this.showMessage('Error deleting quiz', 'error');
        }
    }

    editQuiz(quizId) {
        // Find the quiz data from the current displayed quizzes
        const quizCard = document.querySelector(`[data-quiz-id="${quizId}"]`);
        if (!quizCard) {
            this.showMessage('Quiz not found', 'error');
            return;
        }

        // Get quiz data (we'll need to fetch it from server for complete data)
        this.fetchQuizAndShowEditModal(quizId);
    }

    async fetchQuizAndShowEditModal(quizId) {
        try {
            this.showLoading();
            const response = await fetch(`/api/teachers/quiz/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const quiz = result.quiz;
                this.showEditQuizModal(quiz);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to fetch quiz', 'error');
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            this.showMessage('Error fetching quiz', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showEditQuizModal(quiz) {
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editQuizModal';

        // Generate questions HTML
        const questionsHTML = quiz.questions.map((q, index) => `
            <div class="question-item" data-question-index="${index}">
                <input type="text" name="questions[]" placeholder="Question ${index + 1}" value="${q.question}" required>
                <input type="text" name="options${index + 1}[]" placeholder="Option A" value="${q.options[0]}" required>
                <input type="text" name="options${index + 1}[]" placeholder="Option B" value="${q.options[1]}" required>
                <input type="text" name="options${index + 1}[]" placeholder="Option C" value="${q.options[2]}" required>
                <input type="text" name="options${index + 1}[]" placeholder="Option D" value="${q.options[3]}" required>
                <select name="answers[]">
                    <option value="A" ${q.correctOption === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${q.correctOption === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${q.correctOption === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${q.correctOption === 'D' ? 'selected' : ''}>D</option>
                </select>
                ${quiz.questions.length > 1 ? `<button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>` : ''}
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Quiz</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editQuizForm">
                    <input type="hidden" name="quizId" value="${quiz._id}">
                    <div class="form-group">
                        <label>Quiz Title</label>
                        <input type="text" name="title" placeholder="Enter quiz title" value="${quiz.title}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Class</label>
                            <input type="text" name="class" placeholder="e.g., 10th Grade" value="${quiz.class}" required>
                        </div>
                        <div class="form-group">
                            <label>Subject</label>
                            <input type="text" name="subject" placeholder="e.g., Mathematics" value="${quiz.subject}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Total Marks</label>
                        <input type="number" name="totalMarks" placeholder="Enter total marks" value="${quiz.totalMarks || quiz.questions?.length || 1}" min="1" required>
                    </div>
                    <div id="editQuestionsContainer">
                        <h4>Questions</h4>
                        ${questionsHTML}
                    </div>
                    <button type="button" class="btn-secondary" onclick="dashboard.addEditQuestionField()">Add Question</button>
                    <button type="submit" class="btn-primary">Update Quiz</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        // Add form submit event listener
        document.getElementById('editQuizForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateQuiz();
        });
    }

    addEditQuestionField() {
        const container = document.getElementById('editQuestionsContainer');
        const questionCount = container.querySelectorAll('.question-item').length + 1;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <input type="text" name="questions[]" placeholder="Question ${questionCount}" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option A" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option B" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option C" required>
            <input type="text" name="options${questionCount}[]" placeholder="Option D" required>
            <select name="answers[]">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;

        container.appendChild(questionDiv);
    }

    async updateQuiz() {
        const form = document.getElementById('editQuizForm');
        const formData = new FormData(form);
        const quizId = formData.get('quizId');

        // Get basic quiz info
        const title = formData.get('title');
        const className = formData.get('class') || 'General';
        const subject = formData.get('subject') || 'General';
        const totalMarks = parseInt(formData.get('totalMarks')) || 1;

        // Collect questions from form
        const questions = [];
        const questionElements = form.querySelectorAll('.question-item');

        for (let i = 0; i < questionElements.length; i++) {
            const questionEl = questionElements[i];
            const questionText = questionEl.querySelector('input[name^="questions"]').value;
            const options = Array.from(questionEl.querySelectorAll('input[name^="options"]')).map(input => input.value);
            const correctOption = questionEl.querySelector('select').value;

            if (questionText && options.length === 4) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctOption: correctOption.toUpperCase()
                });
            }
        }

        const quizData = {
            title,
            class: className,
            subject,
            questions,
            totalMarks
        };

        try {
            this.showLoading();

            const response = await fetch(`/api/teachers/quiz/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage('Quiz updated successfully', 'success');
                document.getElementById('editQuizModal').remove();
                this.loadQuizData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to update quiz', 'error');
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
            this.showMessage('Error updating quiz', 'error');
        } finally {
            this.hideLoading();
        }
    }

    viewQuiz(quizId) {
        // TODO: Implement view quiz functionality
        this.showMessage('View quiz details functionality coming soon', 'info');
    }

    async loadAvailabilityData() {
        try {
            this.showLoading();

            // Load weekly availability from database
            await this.loadWeeklyAvailability();

        } catch (error) {
            console.error('Error loading availability data:', error);
            this.showMessage('Error loading availability data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadWeeklyAvailability() {
        try {
            const response = await fetch('/api/teacher-availability/availability', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateWeeklyAvailabilityDisplay(result.weeklyAvailability);
            } else {
                const error = await response.json();
                console.error('Load weekly availability error:', error);
            }
        } catch (error) {
            console.error('Error loading weekly availability:', error);
        }
    }

    updateWeeklyAvailabilityDisplay(weeklyAvailability) {
        const container = document.getElementById('weeklyAvailabilityDisplay');
        if (!weeklyAvailability || weeklyAvailability.length === 0) {
            container.innerHTML = '<p class="empty">No weekly schedule set</p>';
            return;
        }

        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const sortedAvailability = weeklyAvailability.sort((a, b) =>
            dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );

        container.innerHTML = sortedAvailability.map(slot => `
            <div class="weekly-slot">
                <div class="day-name">${this.capitalizeFirst(slot.day)}</div>
                <div class="time-range">${this.formatTimeInTeacherTimezone(slot.startTime)} - ${this.formatTimeInTeacherTimezone(slot.endTime)}</div>
            </div>
        `).join('');
    }

    formatTime24Hour(timeString) {
        // Ensure the time is in 24-hour format (HH:MM)
        // If it's already in 24-hour format, return as-is
        if (!timeString) return '';

        // Check if the time is in 12-hour format and convert if needed
        const hasAMPM = timeString.includes('AM') || timeString.includes('PM');

        if (!hasAMPM) {
            // Already in 24-hour format, ensure it has leading zeros
            const [hours, minutes] = timeString.split(':');
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        // Convert from 12-hour to 24-hour format
        const [time, period] = timeString.trim().split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);

        if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }

        return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    showWeeklyAvailabilityModal() {
        // Load current availability first
        this.loadWeeklyAvailabilityForForm();

        this.showModal('weeklyAvailabilityModal');

        // Re-attach event listeners for clear buttons after modal is shown
        setTimeout(() => {
            this.setupTimePickerListeners();
            document.querySelectorAll('.btn-clear-day').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const day = button.dataset.day;
                    this.clearDayAvailability(day);
                });
            });
        }, 100);
    }

    async loadWeeklyAvailabilityForForm() {
        try {
            const response = await fetch('/api/teacher-availability/availability', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.populateWeeklyAvailabilityForm(result.weeklyAvailability);
            }
        } catch (error) {
            console.error('Error loading weekly availability for form:', error);
        }
    }

    populateWeeklyAvailabilityForm(weeklyAvailability) {
        if (!weeklyAvailability) return;

        weeklyAvailability.forEach(slot => {
            const day = slot.day;
            const startInput = document.querySelector(`input[name="${day}StartTime"]`);
            const endInput = document.querySelector(`input[name="${day}EndTime"]`);

            if (startInput) startInput.value = this.formatTime24Hour(slot.startTime);
            if (endInput) endInput.value = this.formatTime24Hour(slot.endTime);
        });
    }

    async setWeeklyAvailability() {
        const formData = new FormData(document.getElementById('weeklyAvailabilityForm'));
        const weeklyAvailability = [];
        const validationErrors = [];

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        // Clear previous validation errors
        this.clearValidationErrors();

        for (const day of days) {
            const startTime = formData.get(`${day}StartTime`);
            const endTime = formData.get(`${day}EndTime`);

            if (startTime && endTime) {
                // Validate time format
                if (!timeRegex.test(startTime)) {
                    validationErrors.push(`${this.capitalizeFirst(day)} start time format is invalid (HH:MM)`);
                    this.highlightFieldError(`${day}StartTime`);
                    continue;
                }

                if (!timeRegex.test(endTime)) {
                    validationErrors.push(`${this.capitalizeFirst(day)} end time format is invalid (HH:MM)`);
                    this.highlightFieldError(`${day}EndTime`);
                    continue;
                }

                // Validate that end time is after start time
                if (startTime >= endTime) {
                    validationErrors.push(`${this.capitalizeFirst(day)} end time must be after start time`);
                    this.highlightFieldError(`${day}EndTime`);
                    continue;
                }

                weeklyAvailability.push({
                    day,
                    startTime,
                    endTime
                });
            }
        }

        if (validationErrors.length > 0) {
            this.showValidationErrors(validationErrors);
            return;
        }

        if (weeklyAvailability.length === 0) {
            this.showMessage('Please set availability for at least one day', 'error');
            return;
        }

        try {
            this.showLoading();

            const response = await fetch('/api/teacher-availability/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ weeklyAvailability })
            });

            if (response.ok) {
                this.showMessage('Weekly availability updated successfully', 'success');
                this.hideModal('weeklyAvailabilityModal');
                await this.loadWeeklyAvailability();
            } else {
                const error = await response.json();
                if (error.errors && Array.isArray(error.errors)) {
                    this.showValidationErrors(error.errors);
                } else {
                    this.showMessage(error.message || 'Failed to update weekly availability', 'error');
                }
            }
        } catch (error) {
            console.error('Error setting weekly availability:', error);
            this.showMessage('Error updating weekly availability', 'error');
        } finally {
            this.hideLoading();
        }
    }

    clearValidationErrors() {
        // Remove all error highlights
        document.querySelectorAll('.time-range-wrapper').forEach(wrapper => {
            wrapper.classList.remove('error');
        });

        // Remove error messages
        document.querySelectorAll('.validation-error').forEach(error => {
            error.remove();
        });
    }

    highlightFieldError(fieldName) {
        const input = document.querySelector(`input[name="${fieldName}"]`);
        if (input) {
            const wrapper = input.closest('.time-range-wrapper');
            if (wrapper) {
                wrapper.classList.add('error');
            }
        }
    }

    showValidationErrors(errors) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors';
        errorContainer.innerHTML = `
            <div class="error-header">
                <i class="fas fa-exclamation-triangle"></i>
                Please fix the following errors:
            </div>
            <ul class="error-list">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;

        const form = document.getElementById('weeklyAvailabilityForm');
        form.insertBefore(errorContainer, form.firstChild);

        // Scroll to top of form to show errors
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
    }

    clearWeeklyAvailabilityForm() {
        const form = document.getElementById('weeklyAvailabilityForm');
        if (form) {
            // Clear all time input fields manually
            const timeInputs = form.querySelectorAll('input[type="text"]');
            timeInputs.forEach(input => {
                input.value = '';
            });

            // Clear any validation errors
            this.clearValidationErrors();

            // Show feedback to user
            this.showMessage('All availability cleared', 'info');
        }
    }

    clearDayAvailability(day) {
        // Clear the time inputs for the specific day
        const startInput = document.querySelector(`input[name="${day}StartTime"]`);
        const endInput = document.querySelector(`input[name="${day}EndTime"]`);

        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';

        // Show feedback
        this.showMessage(`${this.capitalizeFirst(day)} availability cleared`, 'info');
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    convertToDDMMYYYY(dateString) {
        if (!dateString) return '';

        // Convert from YYYY-MM-DD to DD-MM-YYYY
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }

    async loadMarksData() {
        // Mock implementation - would need actual marks API
        const tbody = document.querySelector('#marks-page tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No records found</td></tr>';
    }

    async addMarks() {
        // Mock implementation
        this.showMessage('Marks added successfully', 'success');
        document.getElementById('marksForm').reset();
    }

    // Profile Management Functions
    async showProfileModal() {
        try {
            this.showLoading();

            const response = await fetch('/api/teachers/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const teacher = await response.json();
                this.populateProfileView(teacher);

                const modal = document.getElementById('teacherProfileModal');
                if (modal) modal.classList.add('show');

                this.showProfileView();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to load profile', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showMessage('Error loading profile', 'error');
        } finally {
            this.hideLoading();
        }
    }

    populateProfileView(teacher) {
        // Update currentUser object with teacher data including timezone
        if (this.currentUser) {
            this.currentUser.timezone = teacher.timezone || 'Asia/Kolkata';
            console.log('Updated currentUser timezone:', this.currentUser.timezone);
        }
        
        // Update profile view
        document.getElementById('profileName').textContent = teacher.fullName || 'Teacher';
        document.getElementById('profileEmail').textContent = teacher.email || 'teacher@example.com';
        document.getElementById('profileMobile').textContent = teacher.mobileNo || '-';
        document.getElementById('profileAge').textContent = teacher.age || '-';
        document.getElementById('profileCity').textContent = teacher.city || '-';
        document.getElementById('profileState').textContent = teacher.state || '-';
        document.getElementById('profileTimezone').textContent = teacher.timezone || 'Asia/Kolkata';

        // Update profile avatar
        const profileAvatar = document.getElementById('profileAvatar');
        const profileAvatarEdit = document.getElementById('profileAvatarEdit');

        if (teacher.profileImage) {
            let profileImageUrl = teacher.profileImage;
            if (profileImageUrl.startsWith('/uploads/')) {
                profileImageUrl = `http://localhost:5001${profileImageUrl}`;
            }

            if (profileAvatar) {
                profileAvatar.src = profileImageUrl;
                profileAvatar.onerror = function () {
                    this.src = 'https://picsum.photos/seed/teacher/100/100.jpg';
                };
            }

            if (profileAvatarEdit) {
                profileAvatarEdit.src = profileImageUrl;
                profileAvatarEdit.onerror = function () {
                    this.src = 'https://picsum.photos/seed/teacher/100/100.jpg';
                };
            }
        }

        // Populate edit form
        document.getElementById('editFullName').value = teacher.fullName || '';
        document.getElementById('editEmail').value = teacher.email || '';
        document.getElementById('editMobileNo').value = teacher.mobileNo || '';
        document.getElementById('editAge').value = teacher.age || '';
        document.getElementById('editCity').value = teacher.city || '';
        document.getElementById('editState').value = teacher.state || '';
        document.getElementById('editTimezone').value = teacher.timezone || '';
    }

    showProfileView() {
        document.getElementById('profileView').style.display = 'block';
        document.getElementById('editProfileForm').style.display = 'none';
    }

    showEditProfileForm() {
        document.getElementById('profileView').style.display = 'none';
        document.getElementById('editProfileForm').style.display = 'block';
    }

    previewProfileImage(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profileAvatarEdit = document.getElementById('profileAvatarEdit');
                if (profileAvatarEdit) {
                    profileAvatarEdit.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    async updateProfile() {
        const form = document.getElementById('editProfileForm');
        const formData = new FormData(form);

        try {
            this.showLoading();

            const response = await fetch('/api/teachers/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage(result.message || 'Profile updated successfully', 'success');

                // Update current user data
                this.currentUser = result.teacher;
                this.updateTeacherProfile();

                // Refresh profile view
                this.populateProfileView(result.teacher);
                this.showProfileView();

                // Close modal
                const modal = document.getElementById('teacherProfileModal');
                if (modal) modal.classList.remove('show');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('Error updating profile', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('active');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('active');
    }

    showMessage(message, type = 'info') {
        let container = document.getElementById('messages');

        // Create messages container if it doesn't exist
        if (!container) {
            container = document.createElement('div');
            container.id = 'messages';
            container.className = 'messages';
            document.body.appendChild(container);
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        container.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    // Student Management Functions
    async loadStudentsData() {
        try {
            this.showLoading();

            console.log('Loading students data...');

            // Load teacher students
            const response = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('Students API Response Status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Students API Response:', data);
                console.log('Total students in DB:', Array.isArray(data) ? data.length : (data.students?.length || 0));

                // Handle different response formats
                const students = Array.isArray(data) ? data : (data.students || []);
                this.updateStudentsList(students);
            } else {
                const error = await response.json();
                console.error('Students API Error:', error);
                this.showMessage(error.message || 'Failed to load students', 'error');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showMessage('Error loading students', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateStudentsList(students) {
        const container = document.getElementById('studentsList');

        if (!students || students.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <div style="color: #9ca3af; font-size: 36px; margin-bottom: 16px;">👥</div>
                    <h3 style="color: #374151; margin: 0 0 8px 0; font-weight: 500; font-size: 18px;">No Students Found</h3>
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">Add students to manage your classroom</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="students-grid">
                ${students.map(student => `
                    <div class="student-card">
                        <div class="student-card-header">
                            <img src="${student.profileImage || `https://picsum.photos/seed/${student._id}/48/48.jpg`}" alt="${student.fullName}" class="student-avatar">
                            <h3 class="student-name">${student.fullName}</h3>
                        </div>
                        <div class="student-meta">
                            <div class="student-meta-item">
                                <i class="fas fa-envelope"></i>
                                <span>${student.email}</span>
                            </div>
                            <div class="student-meta-item">
                                <i class="fas fa-phone"></i>
                                <span>${student.mobileNo || 'N/A'}</span>
                            </div>
                            <div class="student-meta-item">
                                <i class="fas fa-graduation-cap"></i>
                                <span>${student.grade || student.class || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="student-actions">
                            <button class="btn-action edit" onclick="dashboard.editStudent('${student._id}')" title="Edit Student">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete" onclick="dashboard.deleteStudent('${student._id}')" title="Delete Student">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    editStudent(studentId) {
        console.log('Edit student:', studentId);
        this.showEditStudentModal(studentId);
    }

    async showEditStudentModal(studentId) {
        try {
            // Fetch student data
            const response = await fetch(`/api/teachers/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const student = await response.json();
                this.renderEditStudentModal(student);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to load student data', 'error');
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            this.showMessage('Error loading student data', 'error');
        }
    }

    renderEditStudentModal(student) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content modal-minimal">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> Edit Student</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editStudentForm">
                    <input type="hidden" name="userId" value="${student._id || student.userId}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editFullName">Full Name</label>
                            <input type="text" id="editFullName" name="fullName" value="${student.fullName || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editEmail">Email</label>
                            <input type="email" id="editEmail" name="email" value="${student.email || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editPhone">Phone</label>
                            <input type="tel" id="editPhone" name="mobileNo" value="${student.phone || student.mobileNo || ''}" placeholder="+1234567890">
                        </div>
                        
                        <div class="form-group">
                            <label for="editGrade">Class</label>
                            <input type="text" id="editGrade" name="class" value="${student.grade || student.class || ''}" placeholder="Enter class">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editAge">Age</label>
                            <input type="number" id="editAge" name="age" value="${student.age || ''}" min="1" max="120">
                        </div>
                        
                        <div class="form-group">
                            <label for="editCity">City</label>
                            <input type="text" id="editCity" name="city" value="${student.city || ''}" placeholder="Enter city">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editState">State</label>
                            <input type="text" id="editState" name="state" value="${student.state || ''}" placeholder="Enter state">
                        </div>
                        
                        <div class="form-group">
                            <label for="editTimezone">Timezone</label>
                            <input type="text" id="editTimezone" name="timezone" value="${student.timezone || ''}" placeholder="Enter timezone">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editProfileImage">Profile Image</label>
                        <input type="file" id="editProfileImage" name="image" accept="image/*">
                        <small style="color: #64748b; font-size: 12px;">Leave empty to keep current image</small>
                        ${student.profileImage ? `<div style="margin-top: 8px;"><img src="${student.profileImage}" alt="Current profile" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;"></div>` : ''}
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Update Student
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Add form submit event listener
        modal.querySelector('#editStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStudent();
        });
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }

        try {
            const response = await fetch(`/api/teachers/students/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showMessage('Student deleted successfully', 'success');
                await this.loadStudentsData(); // Reload students list
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete student', 'error');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showMessage('Error deleting student', 'error');
        }
    }

    // Session Management Functions
    async loadSessionsData(page = 1, limit = 5) {
        try {
            this.showLoading();

            // Load teacher sessions with pagination
            const response = await fetch(`/api/sessions/teacher?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Sessions API Response:', data);

                // Fetch available slots for each session
                const sessionsWithSlots = await Promise.all(
                    (data.sessions || []).map(async (session) => {
                        try {
                            const slotResponse = await fetch(`/api/sessions/${session._id}/details`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });

                            if (slotResponse.ok) {
                                const sessionDetails = await slotResponse.json();
                                return {
                                    ...session,
                                    availableSlots: sessionDetails.availableSlots || [],
                                    bookedSlots: sessionDetails.bookedSlots || []
                                };
                            }
                            return session;
                        } catch (error) {
                            return session;
                        }
                    })
                );

                console.log('Sessions with slots:', sessionsWithSlots);
                console.log('Pagination data:', data.pagination);

                this.updateSessionsList(sessionsWithSlots, data.pagination);
                this.updateSessionStats({ ...data, sessions: sessionsWithSlots });
            } else {
                const error = await response.json();
                console.error('Sessions API Error:', error);
                this.showMessage(error.message || 'Failed to load sessions', 'error');
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showMessage('Error loading sessions', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateSessionStats(data) {
        const totalSessions = data.pagination?.totalSessions || 0;
        let commonSessions = 0;
        let personalSessions = 0;
        let bookedSlots = 0;

        if (data.sessions) {
            data.sessions.forEach(session => {
                // Count session types
                if (session.type === 'common') {
                    commonSessions++;
                } else if (session.type === 'personal') {
                    personalSessions++;
                }

                // Count booked slots
                if (session.bookedSlots) {
                    bookedSlots += session.bookedSlots.length;
                }
            });
        }

        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('commonSessions').textContent = commonSessions;
        document.getElementById('personalSessions').textContent = personalSessions;
        document.getElementById('bookedSlots').textContent = bookedSlots;
    }

    async loadTotalSessionsForDashboard() {
        try {
            // Load teacher sessions to get total count
            const response = await fetch('/api/sessions/teacher?limit=1', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const totalSessions = data.pagination?.totalSessions || 0;

                // Update dashboard with total sessions count
                const totalSessionsElement = document.getElementById('totalSessionsDashboard');
                if (totalSessionsElement) {
                    totalSessionsElement.textContent = totalSessions;
                    // Add animation to show real-time update
                    totalSessionsElement.style.animation = 'pulse 0.6s ease-out';
                    setTimeout(() => {
                        totalSessionsElement.style.animation = '';
                    }, 600);
                }
            } else {
                // Set to 0 if there's an error
                const totalSessionsElement = document.getElementById('totalSessionsDashboard');
                if (totalSessionsElement) {
                    totalSessionsElement.textContent = '0';
                }
            }
        } catch (error) {
            console.error('Error loading total sessions for dashboard:', error);
            // Set to 0 if there's an error
            const totalSessionsElement = document.getElementById('totalSessionsDashboard');
            if (totalSessionsElement) {
                totalSessionsElement.textContent = '0';
            }
        }
    }

    async filterSessions(filter) {
        try {
            this.showLoading();

            // Load teacher sessions with filter
            const response = await fetch(`/api/sessions/teacher?type=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSessionsList(data.sessions || []);
                this.updateSessionStats(data);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to load sessions', 'error');
            }
        } catch (error) {
            console.error('Error filtering sessions:', error);
            this.showMessage('Error filtering sessions', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateSessionsList(sessions, pagination = null) {
        const container = document.getElementById('sessionsList');

        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: white; border: 1px solid #e3f2fd; border-radius: 8px;">
                    <div style="color: #1976d2; font-size: 48px; margin-bottom: 20px;">📅</div>
                    <h3 style="color: #1976d2; margin: 0 0 8px 0; font-weight: 500;">No Sessions Created Yet</h3>
                    <p style="color: #546e7a; margin: 0; font-size: 14px;">Create your first session to start managing your schedule</p>
                </div>
            `;

            // Show pagination even with no sessions if pagination data exists
            if (pagination && pagination.totalPages > 0) {
                container.innerHTML += this.generatePaginationHTML(pagination);
            }
            return;
        }

        const sessionsHtml = sessions.map(session => {
            const availableSlots = session.availableSlots || [];
            const bookedSlots = session.bookedSlots || [];
            const totalSlots = availableSlots.length;
            const availableCount = totalSlots - bookedSlots.length;
            const status = this.getSessionStatus(session);
            const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots.length / totalSlots) * 100) : 0;

            return `
                <div class="session-item" style="background: white; border: 1px solid #e3f2fd; border-radius: 8px; margin-bottom: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <!-- Session Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e3f2fd;">
                        <div>
                            <h3 style="margin: 0; color: #1976d2; font-size: 18px; font-weight: 500;">${session.title || 'Untitled Session'}</h3>
                            <p style="margin: 4px 0 0 0; color: #546e7a; font-size: 14px;">${this.formatSessionDate(session.date)}</p>
                            ${session.type === 'personal' && session.studentName ? `
                                <p style="margin: 4px 0 0 0; color: #1976d2; font-size: 13px; font-weight: 500;">
                                    <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Personal</span>
                                    👤 ${session.studentName}
                                </p>
                            ` : session.type === 'common' ? `
                                <p style="margin: 4px 0 0 0; color: #4caf50; font-size: 13px; font-weight: 500;">
                                    <span style="background: #e8f5e8; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Common</span>
                                    👥 All Students
                                </p>
                            ` : ''}
                        </div>
                        <div style="text-align: right;">
                            <span style="background: ${status === 'completed' ? '#2196f3' : '#1976d2'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase;">
                                ${status}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Session Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e3f2fd; margin-bottom: 16px; border-radius: 4px; overflow: hidden;">
                        <div style="background: white; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 600; color: #1976d2;">${totalSlots}</div>
                            <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
                        </div>
                        <div style="background: white; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 600; color: #1976d2;">${availableCount}</div>
                            <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Available</div>
                        </div>
                        <div style="background: white; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 600; color: #1976d2;">${bookedSlots.length}</div>
                            <div style="font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.5px;">Booked</div>
                        </div>
                    </div>
                    
                    <!-- Session Info -->
                    <div style="display: flex; gap: 24px; margin-bottom: 16px; font-size: 13px; color: #546e7a;">
                        <span style="display: flex; align-items: center; gap: 6px;">
                            <span style="color: #1976d2;">⏱</span> ${session.sessionDuration || 30} min
                        </span>
                        <span style="display: flex; align-items: center; gap: 6px;">
                            <span style="color: #1976d2;">☕</span> ${session.breakDuration || 5} min break
                        </span>
                    </div>
                    
                    <!-- Slots Preview -->
                    <div style="margin-bottom: 16px;">
                        ${this.generateUnifiedSlotsView(availableSlots, bookedSlots, session.date)}
                    </div>
                    
                    <!-- Actions -->
                    <div style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e3f2fd;">
                        <button onclick="dashboard.deleteSession('${session._id}')" style="background: white; color: #1976d2; border: 1px solid #1976d2; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');


        const paginationHtml = this.generatePaginationHTML(pagination);
        container.innerHTML = sessionsHtml + paginationHtml;
    }

    generatePaginationHTML(pagination) {
        if (!pagination || pagination.totalPages <= 1) {
            return '';
        }

        const { currentPage, totalPages, limit } = pagination;
        const startRecord = ((currentPage - 1) * limit) + 1;
        const endRecord = Math.min(currentPage * limit, pagination.totalSessions || 0);

        // Generate page numbers with ellipsis for large page counts
        let pageNumbers = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is less than or equal to max visible
            pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Show first page, current page, current page neighbors, and last page with ellipsis
            if (currentPage <= 3) {
                pageNumbers = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        return `
            <div class="session-pagination">
                <div class="pagination-info">
                    <span>Showing ${startRecord}-${endRecord} of ${pagination.totalSessions || 0} sessions</span>
                </div>
                
                <div class="pagination-controls">
                    <button 
                        onclick="dashboard.loadSessionsData(${currentPage - 1}, ${limit})"
                        class="pagination-btn"
                        ${currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    
                    ${pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
                return `<span class="pagination-ellipsis">...</span>`;
            }
            return `
                            <button 
                                onclick="dashboard.loadSessionsData(${pageNum}, ${limit})"
                                class="pagination-btn ${pageNum === currentPage ? 'active' : ''}">
                                ${pageNum}
                            </button>
                        `;
        }).join('')}
                    
                    <button 
                        onclick="dashboard.loadSessionsData(${currentPage + 1}, ${limit})"
                        class="pagination-btn"
                        ${currentPage === totalPages ? 'disabled' : ''}>
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getSessionStatus(session) {
        const sessionDate = new Date(session.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (sessionDate < today) {
            return 'completed';
        } else if (sessionDate.getTime() === today.getTime()) {
            return 'active';
        } else {
            return 'active';
        }
    }

generateUnifiedSlotsView(availableSlots, bookedSlots, sessionDate) {
        // Create a map of all possible slots with their booking status
        const allSlotsMap = new Map();
        
        // First, add all available slots to map
        availableSlots.forEach(slot => {
            const startTime = this.formatTimeInTeacherTimezone(slot.startTime);
            const endTime = this.formatTimeInTeacherTimezone(slot.endTime);
            const key = `${startTime}-${endTime}`;
            
            allSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                type: 'available',
                studentName: null
            });
        });
        
        // Then, mark slots as booked (this will overwrite available slots with same time)
        bookedSlots.forEach(slot => {
            const startTime = this.formatUtcTimeToTeacherTimezone(slot.startTime, sessionDate);
            const endTime = this.formatUtcTimeToTeacherTimezone(slot.endTime, sessionDate);
            const key = `${startTime}-${endTime}`;
            
            allSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                type: 'booked',
                studentName: slot.bookedBy ? slot.bookedBy.fullName : 'Booked'
            });
        });
        
        // Convert map to array and sort by start time
        const allSlots = Array.from(allSlotsMap.values()).sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        if (allSlots.length === 0) {
            return `
                <div style="text-align: center; padding: 24px; background: #f8f9fa; border-radius: 4px; color: #546e7a; font-size: 13px;">
                    No slots available
                </div>
            `;
        }
        
        return `
            <div>
                <div style="color: #1976d2; font-size: 13px; font-weight: 500; margin-bottom: 8px;">Time Slots (${allSlots.length})</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${allSlots.map(slot => {
                        if (slot.type === 'available') {
                            return `
                                <span style="background: #1976d2; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                                    ${slot.startTime} - ${slot.endTime}
                                </span>
                            `;
                        } else {
                            return `
                                <span style="background: #d32f2f; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                                    ${slot.studentName} [${slot.startTime} – ${slot.endTime}]
                                </span>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        `;
    }

    generateUnifiedSlotsModalView(availableSlots, bookedSlots, sessionDate) {
        // Create a map of all possible slots with their booking status
        const allSlotsMap = new Map();
        
        // First, add all available slots to map
        availableSlots.forEach(slot => {
            const key = `${this.formatTimeInTeacherTimezone(slot.startTime)}-${this.formatTimeInTeacherTimezone(slot.endTime)}`;
            allSlotsMap.set(key, {
                startTime: this.formatTimeInTeacherTimezone(slot.startTime),
                endTime: this.formatTimeInTeacherTimezone(slot.endTime),
                type: 'available',
                studentName: null,
                studentEmail: null
            });
        });
        
        // Then, mark slots as booked (this will overwrite available slots with same time)
        bookedSlots.forEach(slot => {
            const startTime = this.formatUtcTimeToTeacherTimezone(slot.startTime, sessionDate);
            const endTime = this.formatUtcTimeToTeacherTimezone(slot.endTime, sessionDate);
            const key = `${startTime}-${endTime}`;
            
            allSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                type: 'booked',
                studentName: slot.bookedBy ? slot.bookedBy.fullName : 'Booked',
                studentEmail: slot.bookedBy ? slot.bookedBy.email : ''
            });
        });
        
        // Convert map to array and sort by start time
        const allSlots = Array.from(allSlotsMap.values()).sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        if (allSlots.length === 0) {
            return '<div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; color: #6c757d;">No slots available</div>';
        }
        
        return allSlots.map((slot, index) => `
            <div class="slot-card ${slot.type}" style="background: ${slot.type === 'available' ? 'white' : '#fee2e2'}; border: 2px solid ${slot.type === 'available' ? '#28a745' : '#dc2626'}; border-radius: 8px; padding: 15px;">
                <div style="font-weight: bold; color: ${slot.type === 'available' ? '#28a745' : 'white'}; margin-bottom: 8px;">
                    Slot #${index + 1}
                </div>
                <div style="font-size: 16px; color: ${slot.type === 'available' ? '#495057' : 'white'}; margin-bottom: 10px;">
                    <i class="fas fa-clock"></i> ${slot.startTime} - ${slot.endTime}
                </div>
                ${slot.type === 'available' ? `
                    <div style="margin-top: 8px; background: #d4edda; color: #155724; padding: 5px; border-radius: 15px; font-size: 12px;">
                        Available
                    </div>
                ` : ''}
                ${slot.type === 'booked' ? `
                    <div style="background: white; padding: 10px; border-radius: 8px; border-left: 3px solid #ffc107;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 30px; height: 30px; background: #ffc107; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user" style="color: white;"></i>
                            </div>
                            <div>
                                <div style="font-weight: bold; color: #856404;">${slot.studentName}</div>
                                ${slot.studentEmail ? `<div style="font-size: 12px; color: #856404;">${slot.studentEmail}</div>` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    formatTimeInTeacherTimezone(timeString) {
        if (!timeString) return '';
        
        // Get teacher's timezone from current user or default to Asia/Kolkata
        const teacherTimezone = this.currentUser?.timezone || 'Asia/Kolkata';
        
        // If it's already in HH:MM format, return as-is (already converted by backend)
        if (typeof timeString === 'string' && /^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
        }
        
        // Handle time strings with seconds (HH:MM:SS), remove seconds
        if (typeof timeString === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
            return timeString.substring(0, 5);
        }
        
        // Handle Date objects or UTC time strings - convert to teacher timezone
        try {
            let momentDate;
            
            // Handle different input formats
            if (timeString instanceof Date) {
                // It's a Date object
                momentDate = moment(timeString);
            } else if (typeof timeString === 'string') {
                // It's a string - try parsing as UTC first
                if (timeString.includes('T') || timeString.includes('Z') || timeString.includes('+')) {
                    // ISO string or UTC format
                    momentDate = moment.utc(timeString);
                } else {
                    // Regular string, try parsing as local first
                    momentDate = moment(timeString);
                }
            } else {
                // Any other type
                momentDate = moment(timeString);
            }
            
            if (momentDate.isValid()) {
                // Convert to teacher timezone and format as HH:mm
                return momentDate.tz(teacherTimezone).format('HH:mm');
            }
        } catch (error) {
            console.warn('Error converting time to teacher timezone:', error, 'Input:', timeString);
        }
        
        // Fallback: try to parse as string and format to HH:MM
        try {
            const fallbackDate = moment.tz(timeString, teacherTimezone);
            if (fallbackDate.isValid()) {
                return fallbackDate.format('HH:mm');
            }
        } catch (error) {
            console.warn('Error with fallback time conversion:', error);
        }
        
        // Final fallback - return as string if possible
        return typeof timeString === 'string' ? timeString : '';
    }

    formatUtcTimeToTeacherTimezone(timeString, referenceDate) {
        if (!timeString) return '';

        const teacherTimezone = this.currentUser?.timezone || 'Asia/Kolkata';

        try {
            // If it's already in HH:mm or HH:mm:ss, treat it as a UTC time-of-day and convert using the session date
            if (typeof timeString === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
                const hhmm = timeString.substring(0, 5);

                const baseDate = moment(referenceDate, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);
                const ymd = baseDate.isValid() ? baseDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

                const utcMoment = moment.utc(`${ymd} ${hhmm}`, 'YYYY-MM-DD HH:mm');
                return utcMoment.tz(teacherTimezone).format('HH:mm');
            }

            // Date object or ISO string assumed to be UTC
            const utcMoment = moment.utc(timeString);
            if (utcMoment.isValid()) {
                return utcMoment.tz(teacherTimezone).format('HH:mm');
            }
        } catch (error) {
            console.warn('Error converting UTC time to teacher timezone:', error, 'Input:', timeString);
        }

        return '';
    }

    async viewSessionDetails(sessionId) {
        try {
            this.showLoading();

            const response = await fetch(`/api/sessions/${sessionId}/details`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const session = await response.json();
                console.log('Session data received:', session);
                this.showSessionDetailsModal(session);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to load session details', 'error');
            }
        } catch (error) {
            console.error('Error loading session details:', error);
            this.showMessage('Error loading session details', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showSessionDetailsModal(session) {
        const availableSlots = session.availableSlots || [];
        const bookedSlots = session.bookedSlots || [];
        const totalSlots = availableSlots.length + bookedSlots.length;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> Session Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-details-modal">
                        <!-- Session Header -->
                        <div class="session-header-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 24px;">${session.title || 'Untitled Session'}</h2>
                            <div style="display: flex; gap: 20px; margin-top: 10px;">
                                <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px;">
                                    <i class="fas fa-calendar"></i> ${this.formatSessionDate(session.date)}
                                </span>
                                <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px;">
                                    <i class="fas fa-clock"></i> ${session.sessionDuration || 30} min
                                </span>
                            </div>
                        </div>
                        
                        <!-- Session Statistics -->
                        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                            <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff;">
                                <div style="font-size: 24px; font-weight: bold; color: #007bff;">${totalSlots}</div>
                                <div style="color: #6c757d; font-size: 14px;">Total Slots</div>
                            </div>
                            <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
                                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${availableSlots.length}</div>
                                <div style="color: #6c757d; font-size: 14px;">Available</div>
                            </div>
                            <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #ffc107;">
                                <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${bookedSlots.length}</div>
                                <div style="color: #6c757d; font-size: 14px;">Booked</div>
                            </div>
                            <div class="stat-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #17a2b8;">
                                <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${totalSlots > 0 ? Math.round((bookedSlots.length / totalSlots) * 100) : 0}%</div>
                                <div style="color: #6c757d; font-size: 14px;">Occupancy</div>
                            </div>
                        </div>
                        
                        <!-- Session Information -->
                        <div class="session-info-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="margin-top: 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                                <i class="fas fa-info-circle"></i> Session Information
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                                <div>
                                    <strong style="color: #6c757d;">Session Type:</strong>
                                    <div style="margin-top: 5px;">${session.allowedStudentId ? '👤 Personal Session' : '👥 Common Session'}</div>
                                </div>
                                <div>
                                    <strong style="color: #6c757d;">Session Duration:</strong>
                                    <div style="margin-top: 5px;">⏱️ ${session.sessionDuration || 30} minutes</div>
                                </div>
                                <div>
                                    <strong style="color: #6c757d;">Break Duration:</strong>
                                    <div style="margin-top: 5px;">☕ ${session.breakDuration || 5} minutes</div>
                                </div>
                                <div>
                                    <strong style="color: #6c757d;">Created:</strong>
                                    <div style="margin-top: 5px;">📅 ${this.formatDate(session.createdAt)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- My Slots Section -->
                        <div class="available-slots-section">
                            <h4 style="color: #1976d2; margin-bottom: 15px;">
                                <i class="fas fa-clock"></i> Time Slots
                            </h4>
                            <div class="slots-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;">
                                ${this.generateUnifiedSlotsModalView(availableSlots, bookedSlots, session.date)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading();

            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage(result.message || 'Session deleted successfully', 'success');

                // Reload sessions list
                await this.loadSessionsData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete session', 'error');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            this.showMessage('Error deleting session', 'error');
        } finally {
            this.hideLoading();
        }
    }

    formatSessionDate(dateString) {
        if (!dateString) return 'No date set';

        let date;
        // Handle different date formats
        if (typeof dateString === 'string') {
            // If it's already formatted with day names, return as is
            if (dateString.includes('/')) return dateString;

            // Handle DD-MM-YYYY format from backend
            if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
                const [day, month, year] = dateString.split('-');
                date = new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD for proper parsing
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showCreateSessionModal() {
        // Load students for the dropdown
        this.loadStudentsForSession();

        const modal = document.getElementById('createSessionModal');
        if (modal) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('sessionDate').min = today;

            // Clear any existing date validation errors
            const dateInput = document.getElementById('sessionDate');
            const formGroup = dateInput.closest('.form-group');
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            dateInput.classList.remove('error');

            // Set default timezone based on user's browser timezone
            this.setDefaultTimezone();

            modal.classList.add('show');
        }
    }

    setDefaultTimezone() {
        const timezoneSelect = document.getElementById('studentTimezone');
        if (!timezoneSelect) return;

        // Get user's browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Try to find matching option in the dropdown
        const matchingOption = Array.from(timezoneSelect.options).find(option => option.value === browserTimezone);

        if (matchingOption) {
            timezoneSelect.value = browserTimezone;
        } else {
            // If exact match not found, try to find a timezone in the same region
            const region = browserTimezone.split('/')[0];
            const regionalOption = Array.from(timezoneSelect.options).find(option =>
                option.value.startsWith(region + '/')
            );

            if (regionalOption) {
                timezoneSelect.value = regionalOption.value;
            }
        }
    }

    handleStudentTypeChange(studentType) {
        const particularStudentGroup = document.getElementById('particularStudentGroup');

        if (studentType === 'particular') {
            particularStudentGroup.style.display = 'block';
        } else {
            particularStudentGroup.style.display = 'none';
            // Clear the particular student selection when switching back to "All Students"
            const particularStudentSelect = document.getElementById('particularStudentSelect');
            if (particularStudentSelect) {
                particularStudentSelect.value = '';
            }
        }
    }

    async loadStudentsForSession() {
        try {
            const response = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const students = await response.json();
                const particularStudentSelect = document.getElementById('particularStudentSelect');

                // Populate the particular student dropdown
                particularStudentSelect.innerHTML = '<option value="">Select a student</option>';
                students.forEach(student => {
                    particularStudentSelect.innerHTML += `<option value="${student._id}">${student.fullName}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async checkDateIsHoliday(dateString) {
        try {
            const response = await fetch('/api/teacher-availability/holidays', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const holidays = result.holidays || [];

                // Parse the input date (assuming it's in YYYY-MM-DD format from the date input)
                const checkDate = new Date(dateString);
                const checkDateStr = checkDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD

                // Check if the date falls within any holiday range
                for (const holiday of holidays) {
                    const startDate = new Date(holiday.startDate);
                    const endDate = new Date(holiday.endDate);
                    const startDateStr = startDate.toISOString().split('T')[0];
                    const endDateStr = endDate.toISOString().split('T')[0];

                    // Check if the selected date is within the holiday range
                    if (checkDateStr >= startDateStr && checkDateStr <= endDateStr) {
                        return {
                            isHoliday: true,
                            holiday: holiday
                        };
                    }
                }
            }

            return { isHoliday: false };
        } catch (error) {
            console.error('Error checking holiday:', error);
            return { isHoliday: false };
        }
    }

    async validateSessionDate(dateString) {
        if (!dateString) return;

        const holidayCheck = await this.checkDateIsHoliday(dateString);
        const dateInput = document.getElementById('sessionDate');
        const formGroup = dateInput.closest('.form-group');

        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Remove error styling
        dateInput.classList.remove('error');

        if (holidayCheck.isHoliday) {
            // Add error styling
            dateInput.classList.add('error');

            // Create and show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = '#ef4444';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '4px';
            errorDiv.textContent = `Holiday: ${holidayCheck.holiday.reason}${holidayCheck.holiday.startDate !== holidayCheck.holiday.endDate ? ' (' + this.formatDate(holidayCheck.holiday.startDate) + ' to ' + this.formatDate(holidayCheck.holiday.endDate) + ')' : ''}`;

            formGroup.appendChild(errorDiv);
        }
    }

    async createSessionSlots() {
        try {
            this.showLoading();

            const formData = new FormData(document.getElementById('createSessionForm'));
            const data = Object.fromEntries(formData.entries());

            // Check if the selected date is a holiday
            const holidayCheck = await this.checkDateIsHoliday(data.date);
            if (holidayCheck.isHoliday) {
                this.hideLoading();
                this.showMessage(`Session date cannot be a holiday. ${holidayCheck.holiday.reason} holiday from ${this.formatDate(holidayCheck.holiday.startDate)}${holidayCheck.holiday.startDate !== holidayCheck.holiday.endDate ? ' to ' + this.formatDate(holidayCheck.holiday.endDate) : ''}.`, 'error');
                return;
            }

            // Convert date format to DD-MM-YYYY
            const date = new Date(data.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            data.date = formattedDate;

            // Handle student selection based on studentType
            if (data.studentType === 'particular' && data.student_id) {
                // Keep student_id for particular student
                delete data.studentType; // Remove the temporary field
            } else {
                // Remove student_id for all students or if no particular student selected
                delete data.student_id;
                delete data.studentType; // Remove the temporary field
            }

            const response = await fetch('/api/sessions/slots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage('Session slots created successfully!', 'success');

                // Close modal
                const modal = document.getElementById('createSessionModal');
                if (modal) modal.classList.remove('show');

                // Reset form
                document.getElementById('createSessionForm').reset();

                // Reload sessions data
                await this.loadSessionsData();

                // Show created slots info
                if (result.availableSlots && result.availableSlots.length > 0) {
                    this.showSessionSlotsResult(result);
                }
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to create session slots', 'error');
            }
        } catch (error) {
            console.error('Error creating session slots:', error);
            this.showMessage('Error creating session slots', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showSessionSlotsResult(result) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Session Slots Created</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="session-result">
                    <p><strong>Session:</strong> ${result.title}</p>
                    <p><strong>Date:</strong> ${result.date}</p>
                    <p><strong>Total Slots Created:</strong> ${result.availableSlots.length}</p>
                    <div class="slots-preview">
                        <h4>Available Time Slots:</h4>
                        <div class="slots-list">
                            ${result.availableSlots.slice(0, 5).map(slot =>
            `<span class="slot-time">${this.formatTimeInTeacherTimezone(slot.startTime)} - ${this.formatTimeInTeacherTimezone(slot.endTime)}</span>`
        ).join('')}
                            ${result.availableSlots.length > 5 ? `<span class="slot-more">+${result.availableSlots.length - 5} more</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    async viewSessionDetails(sessionId) {
        try {
            this.showLoading();

            const response = await fetch(`/api/sessions/teacher?id=${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const session = await response.json();
                this.showSessionDetailsModal(session);
            } else {
                this.showMessage('Failed to load session details', 'error');
            }
        } catch (error) {
            console.error('Error loading session details:', error);
            this.showMessage('Error loading session details', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showSessionDetailsModal(session) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Session Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="session-details-full">
                    <div class="detail-row">
                        <label>Title:</label>
                        <span>${session.title || 'Untitled Session'}</span>
                    </div>
                    <div class="detail-row">
                        <label>Date:</label>
                        <span>${this.formatSessionDate(session.date)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Session Duration:</label>
                        <span>${session.sessionDuration || 30} minutes</span>
                    </div>
                    <div class="detail-row">
                        <label>Break Duration:</label>
                        <span>${session.breakDuration || 5} minutes</span>
                    </div>
                    <div class="detail-row">
                        <label>Total Slots:</label>
                        <span>${session.availableSlots?.length || 0}</span>
                    </div>
                    <div class="detail-row">
                        <label>Booked Slots:</label>
                        <span>${session.bookedSlots?.length || 0}</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    filterSessions(filter) {
        // This would filter the sessions based on the selected filter
        // For now, just reload the data
        this.loadSessionsData();
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    async loadTeacherData() {
        // Load teacher profile to get timezone information
        try {
            const response = await fetch('/api/teachers/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const teacher = await response.json();
                // Update currentUser object with timezone
                if (this.currentUser) {
                    this.currentUser.timezone = teacher.timezone || 'Asia/Kolkata';
                    console.log('Loaded teacher timezone:', this.currentUser.timezone);
                }
            }
        } catch (error) {
            console.warn('Could not load teacher profile for timezone:', error);
            // Continue with default timezone
        }

        // Load initial data for current page
        await this.loadPageData(this.currentPage);
    }

    showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        // Add to page
        document.body.appendChild(messageElement);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }

    showLoading() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    // Test function to verify timezone conversion
    testTimezoneConversion() {
        console.log('Testing timezone conversion...');
        
        // Set up test data
        this.currentUser = this.currentUser || {};
        this.currentUser.timezone = 'Asia/Kolkata';
        
        // Test case: 04:30 UTC should show 10:00 in Asia/Kolkata (UTC+5:30)
        const testUtcTime = '04:30';
        const testDate = '20-01-2026';
        
        const result = this.formatUtcTimeToTeacherTimezone(testUtcTime, testDate);
        
        console.log('Timezone conversion test:', {
            input: `${testUtcTime} UTC`,
            date: testDate,
            timezone: this.currentUser.timezone,
            expected: '10:00',
            actual: result,
            success: result === '10:00'
        });
        
        return result === '10:00';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load components first
    const componentLoader = new ComponentLoader();
    await componentLoader.loadAllComponents('teacher');

    // Then initialize dashboard
    window.dashboard = new TeacherDashboard();
});
