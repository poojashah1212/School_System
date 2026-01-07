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

        const availabilityForm = document.getElementById('availabilityForm');
        if (availabilityForm) {
            availabilityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addAvailability();
            });
        }

        const marksForm = document.getElementById('marksForm');
        if (marksForm) {
            marksForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMarks();
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
            marks: 'Marks'
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
            } else {
                const error = await response.json();
                console.error('Load holidays error:', error);
            }
        } catch (error) {
            console.error('Error loading holiday data:', error);
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
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="addHolidayForm">
                    <div class="form-row">
                        <input type="date" name="startDate" required>
                        <input type="date" name="endDate" required>
                    </div>
                    <div class="form-row">
                        <select name="reason" required>
                            <option value="">Select Reason</option>
                            <option value="personal">Personal</option>
                            <option value="public">Public Holiday</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <textarea name="note" placeholder="Add a note (optional)" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Add Holiday</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('show');

        // Add event listener for form submission
        document.getElementById('addHolidayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHoliday();
        });
    }

    async addHoliday() {
        const formData = new FormData(document.getElementById('addHolidayForm'));
        const holidayData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            reason: formData.get('reason'),
            note: formData.get('note')
        };

        try {
            const response = await fetch('/api/teacher-availability/holidays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(holidayData)
            });

            if (response.ok) {
                this.showMessage('Holiday added successfully', 'success');
                document.querySelector('.modal').remove();
                this.loadHolidaysData();
                this.loadHolidaysPageData(); // Refresh holidays page if open
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to add holiday', 'error');
            }
        } catch (error) {
            console.error('Error adding holiday:', error);
            this.showMessage('Error adding holiday', 'error');
        }
    }

    async loadHolidaysPageData() {
        try {
            this.showLoading();
            
            // Get all holidays for the teacher
            const response = await fetch('/api/teacher-availability/holidays', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const holidays = result.holidays || [];
                this.updateHolidaysPage(holidays);
                this.updateHolidayStats(holidays);
            } else {
                const error = await response.json();
                console.error('Load holidays error:', error);
                this.showMessage(error.message || 'Failed to load holidays', 'error');
            }
        } catch (error) {
            console.error('Error loading holidays page data:', error);
            this.showMessage('Error loading holidays', 'error');
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
        const upcoming = holidays.filter(h => new Date(holiday.startDate) >= today);
        document.getElementById('upcomingHolidays').textContent = upcoming.length;
        
        // This month holidays
        const thisMonth = holidays.filter(h => {
            const holidayDate = new Date(holiday.startDate);
            return holidayDate.getMonth() === currentMonth && holidayDate.getFullYear() === currentYear;
        });
        document.getElementById('thisMonthHolidays').textContent = thisMonth.length;
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
        // Mock implementation - would need actual availability API
        document.getElementById('availabilitySlots').innerHTML = '<p class="empty">No slots added</p>';
    }

    async loadMarksData() {
        // Mock implementation - would need actual marks API
        const tbody = document.querySelector('#marks-page tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No records found</td></tr>';
    }

    async addAvailability() {
        // Mock implementation
        this.showMessage('Availability added successfully', 'success');
        document.getElementById('availabilityForm').reset();
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
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TeacherDashboard();
});
