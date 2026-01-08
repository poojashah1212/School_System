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
                profileImg.onerror = function() {
                    // Fallback to placeholder if image fails to load
                    this.src = 'https://picsum.photos/seed/teacher/40/40.jpg';
                };
            }
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.src = profileImageUrl;
                profileAvatar.onerror = function() {
                    // Fallback to placeholder if image fails to load
                    this.src = 'https://picsum.photos/seed/teacher/100/100.jpg';
                };
            }
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
        const setWeeklyAvailabilityBtn = document.getElementById('setWeeklyAvailabilityBtn');
        if (setWeeklyAvailabilityBtn) {
            setWeeklyAvailabilityBtn.addEventListener('click', () => {
                this.showWeeklyAvailabilityModal();
            });
        }

        const closeWeeklyAvailabilityModal = document.getElementById('closeWeeklyAvailabilityModal');
        if (closeWeeklyAvailabilityModal) {
            closeWeeklyAvailabilityModal.addEventListener('click', () => {
                const modal = document.getElementById('weeklyAvailabilityModal');
                if (modal) modal.classList.remove('show');
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
                    modal.classList.remove('show');
                }
            });
        });

        // Time picker emoji functionality
        this.setupTimePickerListeners();
    }

    setupTimePickerListeners() {
        // Add time picker buttons to all time input wrappers
        document.querySelectorAll('.time-input-wrapper').forEach(wrapper => {
            const timeInput = wrapper.querySelector('input[type="time"]');
            
            // Remove existing button if any
            const existingBtn = wrapper.querySelector('.time-picker-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            if (timeInput) {
                // Create time picker button
                const timePickerBtn = document.createElement('button');
                timePickerBtn.className = 'time-picker-btn';
                timePickerBtn.innerHTML = '🕐';
                timePickerBtn.type = 'button';
                timePickerBtn.setAttribute('aria-label', 'Select time');
                
                // Add click event to trigger time picker
                timePickerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    timeInput.focus();
                    timeInput.click();
                    timeInput.showPicker?.();
                });
                
                // Add keyboard support
                timePickerBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        timeInput.focus();
                        timeInput.click();
                        timeInput.showPicker?.();
                    }
                });
                
                // Append button to wrapper
                wrapper.appendChild(timePickerBtn);
                
                // Also make the wrapper clickable (except the input itself)
                wrapper.addEventListener('click', (e) => {
                    if (e.target !== timeInput && e.target !== timePickerBtn) {
                        e.preventDefault();
                        timeInput.focus();
                        timeInput.click();
                        timeInput.showPicker?.();
                    }
                });
            }
        });
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
        switch(page) {
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
            
            // Update available slots (mock for now)
            document.getElementById('availableSlots').textContent = '0';

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

        switch(filterType) {
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
                document.getElementById('editStudentModal').classList.remove('show');
                
                // Refresh both students list and dashboard
                await Promise.all([
                    this.loadStudentsData(),
                    this.loadDashboardData()
                ]);
                
                // Show success animation
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
            reader.onload = function(e) {
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
                <div class="time-range">${slot.startTime} - ${slot.endTime}</div>
            </div>
        `).join('');
    }

    showWeeklyAvailabilityModal() {
        // Load current availability first
        this.loadWeeklyAvailabilityForForm();
        
        const modal = document.getElementById('weeklyAvailabilityModal');
        if (modal) modal.classList.add('show');
        
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
            
            if (startInput) startInput.value = slot.startTime;
            if (endInput) endInput.value = slot.endTime;
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
                document.getElementById('weeklyAvailabilityModal').classList.remove('show');
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
        document.querySelectorAll('.time-input-wrapper').forEach(wrapper => {
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
            const wrapper = input.closest('.time-input-wrapper');
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
            form.reset();
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
                profileAvatar.onerror = function() {
                    this.src = 'https://picsum.photos/seed/teacher/100/100.jpg';
                };
            }
            
            if (profileAvatarEdit) {
                profileAvatarEdit.src = profileImageUrl;
                profileAvatarEdit.onerror = function() {
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

    // Session Management Functions
    async loadSessionsData() {
        try {
            this.showLoading();
            
            // Load teacher sessions
            const response = await fetch('/api/sessions/teacher', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSessionsList(data.sessions || []);
                this.updateSessionStats(data);
            } else {
                this.showMessage('Failed to load sessions', 'error');
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
        let totalSlots = 0;
        let bookedSlots = 0;

        if (data.sessions) {
            data.sessions.forEach(session => {
                if (session.availableSlots) {
                    totalSlots += session.availableSlots.length;
                }
                if (session.bookedSlots) {
                    bookedSlots += session.bookedSlots.length;
                }
            });
        }

        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('availableSlots').textContent = totalSlots - bookedSlots;
        document.getElementById('bookedSlots').textContent = bookedSlots;
    }

    updateSessionsList(sessions) {
        const container = document.getElementById('sessionsList');
        
        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<p class="empty">No sessions created yet</p>';
            return;
        }

        container.innerHTML = sessions.map(session => {
            const availableSlots = session.availableSlots || [];
            const bookedSlots = session.bookedSlots || [];
            const totalSlots = availableSlots.length + bookedSlots.length;
            const status = this.getSessionStatus(session);
            
            return `
                <div class="session-item">
                    <div class="session-header">
                        <div>
                            <h4 class="session-title">${session.title || 'Untitled Session'}</h4>
                            <p class="session-date">${this.formatSessionDate(session.date)}</p>
                        </div>
                        <span class="session-status ${status}">${status}</span>
                    </div>
                    
                    <div class="session-details">
                        <div class="session-detail">
                            <span class="session-detail-label">Duration</span>
                            <span class="session-detail-value">${session.sessionDuration || 30} min</span>
                        </div>
                        <div class="session-detail">
                            <span class="session-detail-label">Break</span>
                            <span class="session-detail-value">${session.breakDuration || 5} min</span>
                        </div>
                        <div class="session-detail">
                            <span class="session-detail-label">Total Slots</span>
                            <span class="session-detail-value">${totalSlots}</span>
                        </div>
                        <div class="session-detail">
                            <span class="session-detail-label">Available</span>
                            <span class="session-detail-value">${availableSlots.length}</span>
                        </div>
                        <div class="session-detail">
                            <span class="session-detail-label">Booked</span>
                            <span class="session-detail-value">${bookedSlots.length}</span>
                        </div>
                    </div>
                    
                    ${availableSlots.length > 0 ? `
                        <div class="session-slots">
                            <span class="session-detail-label" style="width: 100%; margin-bottom: 8px;">Available Time Slots:</span>
                            ${availableSlots.slice(0, 5).map(slot => `
                                <span class="slot-badge">
                                    ${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}
                                </span>
                            `).join('')}
                            ${availableSlots.length > 5 ? `
                                <span class="slot-badge">+${availableSlots.length - 5} more</span>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${bookedSlots.length > 0 ? `
                        <div class="session-slots">
                            <span class="session-detail-label" style="width: 100%; margin-bottom: 8px;">Booked Slots:</span>
                            ${bookedSlots.slice(0, 3).map(slot => `
                                <span class="slot-badge booked">
                                    ${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}
                                </span>
                            `).join('')}
                            ${bookedSlots.length > 3 ? `
                                <span class="slot-badge booked">+${bookedSlots.length - 3} more</span>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="session-actions">
                        <button class="primary" onclick="dashboard.viewSessionDetails('${session._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="danger" onclick="dashboard.deleteSession('${session._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    async viewSessionDetails(sessionId) {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/session-slots/${sessionId}`, {
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
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Session Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-details-modal">
                        <h4>${session.title || 'Untitled Session'}</h4>
                        <p><strong>Date:</strong> ${this.formatSessionDate(session.date)}</p>
                        <p><strong>Duration:</strong> ${session.sessionDuration || 30} minutes</p>
                        <p><strong>Break Duration:</strong> ${session.breakDuration || 5} minutes</p>
                        
                        <h5>Available Slots (${session.availableSlots?.length || 0})</h5>
                        <div class="slots-list">
                            ${session.availableSlots?.length > 0 ? 
                                session.availableSlots.map(slot => `
                                    <div class="slot-item">
                                        <span>${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}</span>
                                        <span class="slot-status available">Available</span>
                                    </div>
                                `).join('') : 
                                '<p class="empty">No available slots</p>'
                            }
                        </div>
                        
                        <h5>Booked Slots (${session.bookedSlots?.length || 0})</h5>
                        <div class="slots-list">
                            ${session.bookedSlots?.length > 0 ? 
                                session.bookedSlots.map(slot => `
                                    <div class="slot-item">
                                        <span>${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}</span>
                                        <span class="slot-status booked">Booked</span>
                                    </div>
                                `).join('') : 
                                '<p class="empty">No booked slots</p>'
                            }
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

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`/api/session-slots/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showMessage('Session deleted successfully', 'success');
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
        const date = new Date(dateString);
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
            
            modal.classList.add('show');
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
                const select = document.getElementById('studentSelect');
                
                select.innerHTML = '<option value="">All Students</option>';
                students.forEach(student => {
                    select.innerHTML += `<option value="${student._id}">${student.fullName}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async createSessionSlots() {
        try {
            this.showLoading();
            
            const formData = new FormData(document.getElementById('createSessionForm'));
            const data = Object.fromEntries(formData.entries());
            
            // Convert date format to DD-MM-YYYY
            const date = new Date(data.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            data.date = formattedDate;
            
            // Remove empty student_id
            if (!data.student_id) {
                delete data.student_id;
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
                                `<span class="slot-time">${slot.startTime} - ${slot.endTime}</span>`
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
        // Load initial data for current page
        await this.loadPageData(this.currentPage);
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
