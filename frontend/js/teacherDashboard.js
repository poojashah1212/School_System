// Teacher Dashboard JavaScript
class TeacherDashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.currentCancelSlotData = null; // Store current slot data for cancellation
        this.highlightedSessionId = null; // Store session ID to highlight

        // Initialize API service
        if (window.apiService) {
            window.apiService.setBaseUrl('/api');
        }

        this.init();
    }

    // Helper function to get server URL
    getServerUrl() {
        return 'https://smartschool-je18.onrender.com';
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupFormResetHandlers();
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
                }, 5000);
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
            profileEmail.textContent = this.currentUser.email || '';
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
                profileImageUrl = `${this.getServerUrl()}${profileImageUrl}`;
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

    // Helper function to format session duration
    formatSessionDuration(duration) {
        if (!duration) return '30 Minutes';

        const numDuration = parseInt(duration);

        if (numDuration >= 60) {
            const hours = numDuration / 60;
            return hours === 1 ? '1 Hour' : `${hours} Hours`;
        } else {
            return `${numDuration} Minutes`;
        }
    }

    // Navigate to sessions page with optional session ID
    navigateToSession(sessionId = null) {
        console.log('navigateToSession called with sessionId:', sessionId);

        // Switch to sessions page
        this.navigateToPage('sessions');

        // If session ID is provided, highlight or scroll to that session
        if (sessionId) {
            // Store the session ID to highlight it after page loads
            this.highlightedSessionId = sessionId;

            // Load sessions data which will handle the highlighting
            setTimeout(() => {
                this.loadSessionsData();
            }, 100);
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

    // Delete Question Modal Functions
    showDeleteQuestionModal(questionElement) {
        // Check if the question has any content
        const questionInput = questionElement.querySelector('input[name^="questions"]');

        if (questionInput && questionInput.value.trim() !== '') {
            // If question has content, show confirmation
            this.showConfirmDialog(
                'Are you sure you want to delete this question? Any unsaved changes will be lost.',
                'Delete Question',
                () => {
                    questionElement.remove();
                    this.updateQuestionNumbers();
                }
            );
        } else {
            // If question is empty, just remove it
            questionElement.remove();
            this.updateQuestionNumbers();
        }
    }

    hideDeleteQuestionModal() {
        this.hideModal('deleteQuestionModal');
        this.questionToDelete = null;
    }

    validateQuestionField(input) {
        const questionItem = input.closest('.question-item');
        if (!questionItem) return;

        const errorElement = questionItem.querySelector('.question-error') ||
            (() => {
                const error = document.createElement('div');
                error.className = 'question-error text-danger mt-1';
                input.parentNode.insertAdjacentElement('afterend', error);
                return error;
            })();

        if (input.value.trim() === '') {
            errorElement.textContent = 'Question cannot be empty';
            input.classList.add('is-invalid');
            return false;
        } else {
            errorElement.textContent = '';
            input.classList.remove('is-invalid');
            return true;
        }
    }

    confirmDeleteQuestion() {
        if (this.questionToDelete) {
            this.questionToDelete.remove();
            this.questionToDelete = null;
            this.updateQuestionNumbers();
        }
        this.hideDeleteQuestionModal();
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
            addStudentBtn.addEventListener('click', (e) => {
                console.log('Add Student button clicked'); // Debug log
                e.preventDefault();
                const modal = document.getElementById('addStudentModal');
                if (modal) {
                    console.log('Modal found, showing modal'); // Debug log
                    // Reset form to clean state before opening
                    this.resetAddStudentForm();
                    modal.classList.add('show');
                } else {
                    console.error('Add Student modal not found'); // Debug log
                }
            });
        } else {
            console.error('Add Student button not found'); // Debug log
        }

        const uploadCsvBtn = document.getElementById('uploadCsvBtn');
        if (uploadCsvBtn) {
            uploadCsvBtn.addEventListener('click', () => {
                const modal = document.getElementById('uploadCsvModal');
                if (modal) modal.classList.add('show');
            });
        }

        // Download sample CSV functionality
        const downloadSampleCsvBtn = document.getElementById('downloadSampleCsvBtn');
        if (downloadSampleCsvBtn) {
            downloadSampleCsvBtn.addEventListener('click', () => {
                this.downloadSampleCsv();
            });
        }

        // Download student sample CSV functionality
        const downloadStudentSampleCsvBtn = document.getElementById('downloadStudentSampleCsvBtn');
        if (downloadStudentSampleCsvBtn) {
            downloadStudentSampleCsvBtn.addEventListener('click', () => {
                this.downloadStudentSampleCsv();
            });
        }

        // Download quiz sample CSV functionality
        const downloadQuizSampleCsvBtn = document.getElementById('downloadQuizSampleCsvBtn');
        if (downloadQuizSampleCsvBtn) {
            downloadQuizSampleCsvBtn.addEventListener('click', () => {
                this.downloadQuizSampleCsv();
            });
        }

        const closeStudentModal = document.getElementById('closeStudentModal');
        if (closeStudentModal) {
            closeStudentModal.addEventListener('click', () => {
                const modal = document.getElementById('addStudentModal');
                if (modal) {
                    modal.classList.remove('show');
                    // Reset form to clean state when modal is closed
                    this.resetAddStudentForm();
                }
            });
        }

        const cancelStudentBtn = document.getElementById('cancelStudentBtn');
        if (cancelStudentBtn) {
            cancelStudentBtn.addEventListener('click', () => {
                const modal = document.getElementById('addStudentModal');
                if (modal) {
                    modal.classList.remove('show');
                    // Reset form to clean state when modal is closed
                    this.resetAddStudentForm();
                }
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
                this.navigateToCreateQuizPage();
            });
        }

        // CSV Upload functionality
        const uploadQuestionsBtn = document.getElementById('uploadQuestionsBtn');
        if (uploadQuestionsBtn) {
            uploadQuestionsBtn.addEventListener('click', () => {
                this.toggleCsvDropdown();
            });
        }

        const csvFileInput = document.getElementById('csvFileInput');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (e) => {
                this.handleCsvFileUpload(e);
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.csv-upload-container')) {
                this.closeCsvDropdown();
            }
        });

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

        // Quiz management navigation
        const backToQuizListBtn = document.getElementById('backToQuizListBtn');
        if (backToQuizListBtn) {
            backToQuizListBtn.addEventListener('click', () => {
                this.resetCreateQuizForm();
                this.resetQuestionsToDefault();
                this.navigateToQuizPage();
            });
        }

        const backToQuizListFromEditBtn = document.getElementById('backToQuizListFromEditBtn');
        if (backToQuizListFromEditBtn) {
            backToQuizListFromEditBtn.addEventListener('click', () => {
                this.resetEditQuizForm();
                this.navigateToQuizPage();
            });
        }

        const backToQuizListBtnFromDetails = document.getElementById('backToQuizListBtnFromDetails');
        if (backToQuizListBtnFromDetails) {
            backToQuizListBtnFromDetails.addEventListener('click', () => {
                this.backToQuizListFromDetails();
            });
        }

        const quizDetailsStudentSearch = document.getElementById('quizDetailsStudentSearch');
        if (quizDetailsStudentSearch) {
            quizDetailsStudentSearch.addEventListener('input', () => this.applyQuizDetailsFilter());
        }
        const quizDetailsFilter = document.querySelector('.quiz-details-filter');
        if (quizDetailsFilter) {
            quizDetailsFilter.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (btn) {
                    document.querySelectorAll('.quiz-details-filter .filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.applyQuizDetailsFilter();
                }
            });
        }

        const backToQuizDetailsBtn = document.getElementById('backToQuizDetailsBtn');
        if (backToQuizDetailsBtn) {
            backToQuizDetailsBtn.addEventListener('click', () => this.backToQuizDetailsFromResult());
        }

        document.getElementById('quizDetailsView')?.addEventListener('click', (e) => {
            const viewDetailsBtn = e.target.closest('.btn-view-quiz-details');
            if (viewDetailsBtn) {
                e.preventDefault();
                const studentId = viewDetailsBtn.dataset.studentId;
                if (!studentId || !this.currentQuizDetailsData?.attempted) return;
                const row = this.currentQuizDetailsData.attempted.find(a => {
                    const id = (a.studentId && a.studentId._id ? a.studentId._id : a.studentId || '').toString();
                    return id === studentId;
                });
                if (row) {
                    const totalMarks = row.totalMarks != null ? row.totalMarks : 0;
                    const score = row.score != null ? row.score : 0;
                    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
                    this.openStudentQuizResult({
                        fullName: row.fullName || '—',
                        score,
                        totalMarks,
                        percentage,
                        attemptedAt: row.attemptedAt
                    });
                }
            }
        });

        const editQuizForm = document.getElementById('editQuizForm');
        if (editQuizForm) {
            editQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateQuiz();
            });

            // Add event listeners to clear errors when fields are corrected
            const editFormFields = editQuizForm.querySelectorAll('input, select, textarea');
            editFormFields.forEach(field => {
                // Clear error on input/change
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                });

                field.addEventListener('change', () => {
                    this.clearFieldError(field);
                });
            });
        }

        const addEditQuestionBtn = document.getElementById('addEditQuestionBtn');
        if (addEditQuestionBtn) {
            addEditQuestionBtn.addEventListener('click', () => {
                this.addEditQuestionField();
            });
        }

        // Single event handler for publish button (works for both create and edit forms)
        const publishQuizBtn = document.getElementById('publishQuizBtn');
        if (publishQuizBtn) {
            // Remove any existing click event listeners to prevent duplicates
            const newPublishBtn = publishQuizBtn.cloneNode(true);
            publishQuizBtn.parentNode.replaceChild(newPublishBtn, publishQuizBtn);

            // Add single click handler
            newPublishBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Check if we're in edit mode by looking for the edit form
                const isEditMode = !!document.getElementById('editQuizForm');

                // For edit form, use validateEditQuizForm, otherwise use validateQuizForm
                const isValid = isEditMode ?
                    this.validateEditQuizForm() :
                    this.validateQuizForm();

                if (!isValid) {
                    // Scroll to first error
                    const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                // Call publishQuiz directly - it will handle its own confirmation
                this.publishQuiz();
            });
        }

        // Save to Draft button event handler
        const saveToDraftBtn = document.getElementById('saveToDraftBtn');
        if (saveToDraftBtn) {
            saveToDraftBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Call saveToDraft function
                this.saveToDraft();
            });
        }

        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                this.addQuestionField();
            });
        }

        // Delete Question Modal
        const cancelDeleteQuestion = document.getElementById('cancelDeleteQuestion');
        if (cancelDeleteQuestion) {
            cancelDeleteQuestion.addEventListener('click', () => {
                this.hideDeleteQuestionModal();
            });
        }

        const confirmDeleteQuestion = document.getElementById('confirmDeleteQuestion');
        if (confirmDeleteQuestion) {
            confirmDeleteQuestion.addEventListener('click', () => {
                this.confirmDeleteQuestion();
            });
        }

        // Forms
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            // Also add click event listener to the submit button as backup
            const submitBtn = addStudentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    console.log('Submit button clicked'); // Debug log
                    e.preventDefault();
                    this.addStudent();
                });
            }

            addStudentForm.addEventListener('submit', (e) => {
                console.log('Form submit event triggered'); // Debug log
                e.preventDefault();
                console.log('Calling addStudent function'); // Debug log
                this.addStudent();
            });

            // Add input event listeners to clear errors on typing
            addStudentForm.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });

            // Setup image upload functionality
            this.setupImageUpload();
        }

        const uploadCsvForm = document.getElementById('uploadCsvForm');
        if (uploadCsvForm) {
            uploadCsvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadCsv();
            });
        }

        const uploadQuizCsvForm = document.getElementById('uploadQuizCsvForm');
        if (uploadQuizCsvForm) {
            uploadQuizCsvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadQuizCsv();
            });
        }

        const createQuizForm = document.getElementById('createQuizForm');
        if (createQuizForm) {
            createQuizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createQuiz();
            });
        }

        const saveQuizBtn = document.getElementById('saveQuizBtn');
        if (saveQuizBtn) {
            saveQuizBtn.addEventListener('click', () => {
                this.saveQuizAsDraft();
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
                if (modal) {
                    modal.classList.remove('show');
                    this.resetCreateSessionForm();
                }
            });
        }

        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', (e) => {
                console.log('Cancel button clicked');
                e.preventDefault();
                const modal = document.getElementById('createSessionModal');
                if (modal) {
                    modal.classList.remove('show');
                    this.resetCreateSessionForm();
                }
            });
        } else {
            console.log('Cancel button not found');
        }

        // Assign Slot Modal event listeners
        const closeAssignSlotModal = document.getElementById('closeAssignSlotModal');
        if (closeAssignSlotModal) {
            closeAssignSlotModal.addEventListener('click', () => {
                this.hideAssignSlotModal();
            });
        }

        const cancelAssignBtn = document.getElementById('cancelAssignBtn');
        if (cancelAssignBtn) {
            cancelAssignBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAssignSlotModal();
            });
        }

        // Cancel Slot Modal event listeners
        const closeCancelSlotModal = document.getElementById('closeCancelSlotModal');
        if (closeCancelSlotModal) {
            closeCancelSlotModal.addEventListener('click', () => {
                this.hideModal('cancelSlotModal');
                this.currentCancelSlotData = null;
            });
        }

        const cancelSlotBtnCancel = document.getElementById('cancelSlotBtnCancel');
        if (cancelSlotBtnCancel) {
            cancelSlotBtnCancel.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('cancelSlotModal');
                this.currentCancelSlotData = null;
            });
        }

        const cancelSlotBtnConfirm = document.getElementById('cancelSlotBtnConfirm');
        if (cancelSlotBtnConfirm) {
            cancelSlotBtnConfirm.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelSlot();
            });
        }

        const assignSlotForm = document.getElementById('assignSlotForm');
        if (assignSlotForm) {
            assignSlotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAssignSlotSubmit();
            });
        }

        // Student type dropdown change handler
        const studentTypeSelect = document.getElementById('studentType');
        if (studentTypeSelect) {
            studentTypeSelect.addEventListener('change', (e) => {
                this.handleStudentTypeChange(e.target.value);
            });
            // Initialize - hide dropdown by default
            this.handleStudentTypeChange('all');
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
                    // Clear validation errors and reset form if it's the add student modal
                    if (modal.id === 'addStudentModal') {
                        this.resetAddStudentForm();
                    }
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
        // Reset Create Quiz form when navigating away from create-quiz page
        if (this.currentPage === 'create-quiz' && page !== 'create-quiz') {
            this.resetCreateQuizForm();
            this.resetQuestionsToDefault();
        }

        // Reset Edit Quiz form when navigating away from edit-quiz page
        if (this.currentPage === 'edit-quiz' && page !== 'edit-quiz') {
            this.resetEditQuizForm();
        }

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
            students: 'Enrolled Students',
            quiz: 'Quiz Center',
            availability: 'Schedule',
            holidays: 'Academic Holidays',
            sessions: 'Learning Sessions'
        };
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = titles[page] || 'Teacher Dashboard';
        }

        this.currentPage = page;
        this.loadPageData(page);
    }

    setupFormResetHandlers() {
        // Reset form when user navigates away or closes the page
        const handleBeforeUnload = () => {
            this.resetCreateQuizForm();
        };

        // Add beforeunload event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Add visibility change listener to handle tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentPage === 'create-quiz') {
                this.resetCreateQuizForm();
            }
        });

        // Store the handler reference for potential cleanup
        this._formResetHandlers = {
            beforeUnload: handleBeforeUnload
        };
    }

    resetCreateQuizForm() {
        const form = document.getElementById('createQuizForm');
        if (!form) return;

        // Clear all validation errors first
        this.clearCreateQuizFormValidation();

        // Reset all form fields to initial state
        form.reset();

        // Clear any remaining field values manually (ensures complete reset)
        const titleInput = form.querySelector('input[name="title"]');
        const descriptionInput = form.querySelector('textarea[name="description"]');
        const classSelect = form.querySelector('select[name="class"]');
        const subjectSelect = form.querySelector('select[name="subject"]');
        const durationInput = form.querySelector('input[name="duration"]');
        const startTimeInput = form.querySelector('input[name="startTime"]');
        const endTimeInput = form.querySelector('input[name="endTime"]');

        // Ensure all fields are completely cleared
        if (titleInput) titleInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (classSelect) classSelect.selectedIndex = 0;
        if (subjectSelect) subjectSelect.selectedIndex = 0;
        if (durationInput) durationInput.value = '';
        if (startTimeInput) startTimeInput.value = '';
        if (endTimeInput) endTimeInput.value = '';

        // Remove any remaining error styling, classes, and attributes
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });

        // Remove error styling from question containers
        form.querySelectorAll('.question-item').forEach(question => {
            question.style.borderColor = '';
            question.classList.remove('error');
        });
    }

    resetEditQuizForm() {
        const form = document.getElementById('editQuizForm');
        if (!form) return;

        // Clear all validation errors first
        this.clearEditQuizFormValidation();

        // Reset all form fields to initial state
        form.reset();

        // Clear any remaining field values manually (ensures complete reset)
        const titleInput = form.querySelector('#editQuizTitle');
        const classSelect = form.querySelector('#editQuizClass');
        const subjectInput = form.querySelector('#editQuizSubject');
        const durationInput = form.querySelector('#editQuizDuration');
        const startTimeInput = form.querySelector('#editQuizStartTime');
        const endTimeInput = form.querySelector('#editQuizEndTime');

        // Ensure all fields are completely cleared
        if (titleInput) titleInput.value = '';
        if (classSelect) classSelect.selectedIndex = 0;
        if (subjectInput) subjectInput.value = '';
        if (durationInput) durationInput.value = '';
        if (startTimeInput) startTimeInput.value = '';
        if (endTimeInput) endTimeInput.value = '';

        // Clear hidden quiz ID
        const quizIdInput = form.querySelector('#editQuizId');
        if (quizIdInput) quizIdInput.value = '';

        // Remove any remaining error styling, classes, and attributes
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });

        // Remove error styling from question containers
        form.querySelectorAll('.question-item').forEach(question => {
            question.style.borderColor = '';
            question.classList.remove('error');
        });

        // Reset edit questions container to empty
        const editQuestionsContainer = form.querySelector('#editQuestionsContainer');
        if (editQuestionsContainer) {
            editQuestionsContainer.innerHTML = '';
        }
    }

    clearEditQuizFormValidation() {
        const form = document.getElementById('editQuizForm');
        if (!form) return;

        // Clear all validation error messages by type
        form.querySelectorAll('.validation-error').forEach(error => {
            error.remove();
        });

        form.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });

        form.querySelectorAll('.question-error').forEach(error => {
            error.remove();
        });

        form.querySelectorAll('.option-error').forEach(error => {
            error.remove();
        });

        form.querySelectorAll('.general-error').forEach(error => {
            error.remove();
        });

        // Remove error styling and classes from all form fields
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });

        // Remove error styling from question containers
        form.querySelectorAll('.question-item').forEach(question => {
            question.style.borderColor = '';
            question.classList.remove('error');
        });
    }

    navigateToCreateQuizPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show create quiz page
        const createQuizPage = document.getElementById('create-quiz-page');
        if (createQuizPage) {
            createQuizPage.classList.add('active');
        }

        // Always reset form to initial state when opening Create Quiz form
        this.resetCreateQuizForm();

        // Reset questions to default single question
        this.resetQuestionsToDefault();

        // Set minimum date for date inputs
        this.setMinDateForQuizInputs();

        // Update page title
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Quiz Center';
        }

        this.currentPage = 'create-quiz';
    }

    navigateToEditQuizPage(quizId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show edit quiz page
        const editQuizPage = document.getElementById('edit-quiz-page');
        if (editQuizPage) {
            editQuizPage.classList.add('active');
        }

        // Update page title
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Quiz Center';
        }

        // Remove active state from navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set minimum date for date inputs
        this.setMinDateForQuizInputs();

        this.currentPage = 'edit-quiz';
    }

    resetQuestionsToDefault() {
        const questionsContainer = document.getElementById('questionsContainer');
        if (!questionsContainer) return;

        // Clear all questions
        questionsContainer.innerHTML = '';

        // Add one default empty question
        this.addQuestionField();
    }

    addQuestionField() {
        const questionsContainer = document.getElementById('questionsContainer');
        if (!questionsContainer) return;

        const questionCount = questionsContainer.children.length + 1;
        const questionHtml = `
            <div class="question-item">
                <div class="question-header">
                    <span class="question-number">Question ${questionCount}</span>
                    <button type="button" class="btn-remove-question" onclick="dashboard.deleteQuestion(this.closest('.question-item'))">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="question-field">
                    <input type="text" name="questions[]" placeholder="Enter question text" required>
                </div>
                <div class="options-grid">
                    <div class="option-item">
                        <label>A</label>
                        <input type="text" name="options${questionCount}[]" placeholder="Option A" required>
                    </div>
                    <div class="option-item">
                        <label>B</label>
                        <input type="text" name="options${questionCount}[]" placeholder="Option B" required>
                    </div>
                    <div class="option-item">
                        <label>C</label>
                        <input type="text" name="options${questionCount}[]" placeholder="Option C" required>
                    </div>
                    <div class="option-item">
                        <label>D</label>
                        <input type="text" name="options${questionCount}[]" placeholder="Option D" required>
                    </div>
                </div>
                <div class="answer-field">
                    <label>Correct Answer</label>
                    <select name="answers[]" required>
                        <option value="">Select correct answer</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
            </div>
        `;

        questionsContainer.insertAdjacentHTML('beforeend', questionHtml);
    }

    deleteQuestion(questionElement) {
        if (!questionElement) return;

        const container = document.getElementById('questionsContainer');
        if (container.children.length <= 1) {
            this.showMessage('Quiz must have at least one question', 'error');
            return;
        }

        questionElement.remove();
        this.updateQuestionNumbers();
    }

    updateQuestionNumbers() {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        const questions = container.querySelectorAll('.question-item');
        questions.forEach((question, index) => {
            // Update question number text
            const numberSpan = question.querySelector('.question-number');
            if (numberSpan) {
                numberSpan.textContent = `Question ${index + 1}`;
            }

            // Update options names to ensure they are grouped correctly
            const optionInputs = question.querySelectorAll('input[name^="options"]');
            optionInputs.forEach(input => {
                input.name = `options${index + 1}[]`;
            });
        });
    }

    getQuestionsFromForm() {
        const form = document.getElementById('createQuizForm');
        if (!form) return [];

        // Collect questions from the form
        const questions = [];
        const questionElements = form.querySelectorAll('.question-item');

        for (let i = 0; i < questionElements.length; i++) {
            const questionEl = questionElements[i];
            const questionText = questionEl.querySelector('input[name^="questions"]').value;
            const options = Array.from(questionEl.querySelectorAll('input[name^="options"]')).map(input => input.value);
            const correctOption = questionEl.querySelector('select').value;

            if (questionText && options.length === 4 && correctOption) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctOption: correctOption.toUpperCase()
                });
            }
        }

        return questions;
    }

    async saveQuizAsDraft() {
        // First validate the form
        if (!this.validateQuizForm()) {
            // Show a toast message
            this.showMessage('Please fill in all required fields before saving as draft', 'error');

            // Scroll to the first error
            const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
        }

        const form = document.getElementById('createQuizForm');
        const formData = new FormData(form);

        // Get basic quiz info
        const quizData = {
            title: formData.get('title'),
            class: formData.get('class'),
            subject: formData.get('subject'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            duration: formData.get('duration'),
            questions: this.getQuestionsFromForm(),
            status: 'draft'
        };

        try {
            this.showLoading();

            const response = await fetch('/api/quizzes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage('Quiz saved as draft successfully', 'success');
                this.navigateToQuizPage();
            } else {
                this.showMessage(result.message || 'Failed to save draft', 'error');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            this.showMessage('Failed to save draft. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }


    getSubjectClass(subject) {
        if (!subject) return 'default';
        const subjectLower = subject.toLowerCase();
        if (subjectLower.includes('math')) return 'math';
        if (subjectLower.includes('science')) return 'science';
        if (subjectLower.includes('english')) return 'english';
        if (subjectLower.includes('history')) return 'history';
        if (subjectLower.includes('physics')) return 'science';
        if (subjectLower.includes('chemistry')) return 'science';
        if (subjectLower.includes('biology')) return 'science';
        if (subjectLower.includes('geography')) return 'history';
        if (subjectLower.includes('computer')) return 'math';
        return 'default';
    }

    navigateToQuizPage() {
        this.navigateToPage('quiz');
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
            const studentsResponse = await window.apiService.get('/teachers/students');
            console.log('Dashboard students API Response:', studentsResponse);

            // Handle different response formats (same as loadStudentsData)
            const students = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse.students || []);
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

            // Load sessions data for recent sessions display
            const sessionsResponse = await window.apiService.get('/sessions/teacher');
            const sessions = sessionsResponse.sessions || [];
            this.updateRecentSessions(sessions.slice(0, 5)); // Show recent 5 sessions

            // Update student count in students page header
            const studentsHeader = document.querySelector('#students-page .page-header h2');
            if (studentsHeader) {
                studentsHeader.textContent = `Students Management (${totalStudents})`;
            }

            // Load quiz data from database
            const result = await window.apiService.get('/teachers/quiz');
            const quizzes = result.quizzes || [];
            const totalQuizzes = quizzes.length || 0;

            // Update dashboard with real quiz count
            document.getElementById('totalQuizzes').textContent = totalQuizzes;

            // Update recent quizzes
            this.updateRecentQuizzes(quizzes.slice(0, 4));

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

        container.innerHTML = students.map(student => {
            // Handle profile image URL
            let profileImageUrl = student.profileImage;
            if (profileImageUrl) {
                // Convert Windows backslashes to forward slashes and ensure proper format
                profileImageUrl = profileImageUrl.replace(/\\/g, '/');
                if (!profileImageUrl.startsWith('/uploads/') && !profileImageUrl.startsWith('http')) {
                    profileImageUrl = '/uploads/' + profileImageUrl.replace(/^uploads\//, '');
                }
                if (profileImageUrl.startsWith('/uploads/')) {
                    profileImageUrl = `${this.getServerUrl()}${profileImageUrl}`;
                }
            }

            return `
            <div class="student-item">
                <img src="${profileImageUrl || 'https://picsum.photos/seed/' + student._id + '/32/32.jpg'}" alt="${student.fullName}" class="student-avatar-small">
                <div class="student-info">
                    <h4>${student.fullName}</h4>
                    <p>${student.email}</p>
                </div>
                <span class="student-class">${student.class || 'N/A'}</span>
            </div>
            `;
        }).join('');
    }

    updateRecentSessions(sessions) {
        const container = document.getElementById('recentSessions'); // Use the dedicated sessions container
        if (!sessions || sessions.length === 0) {
            container.innerHTML = '<p class="empty">No sessions created yet</p>';
            return;
        }

        container.innerHTML = sessions.map(session => {
            const bookedSlots = session.bookedSlots?.length || 0;
            const sessionId = session._id || session.id; // Handle both _id and id

            return `
            <div class="session-item clickable" style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid #1976d2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s ease;" onclick="console.log('Session clicked:', '${sessionId}'); window.dashboard.navigateToSession('${sessionId}')">
                <div class="session-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1976d2;">${session.title || 'Untitled Session'}</h4>
                    <span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                        ${this.formatSessionDuration(session.sessionDuration)}
                    </span>
                </div>
                <div class="session-info" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #666;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-calendar" style="color: #999;"></i>
                        ${this.formatSessionDate(session.date)}
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-users" style="color: #999;"></i>
                        ${bookedSlots} booked
                    </span>
                </div>
                <div class="session-type" style="margin-top: 6px; font-size: 11px; color: #888;">
                    ${session.allowedStudentId ? '👤 Personal Session' : '👥 All Students Session'}
                </div>
            </div>
            `;
        }).join('');
    }

    updateRecentQuizzes(quizzes) {
        const container = document.getElementById('recentQuizzes');
        if (!quizzes || quizzes.length === 0) {
            container.innerHTML = '<p class="empty">No quizzes created yet</p>';
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="quiz-item clickable" data-quiz-id="${quiz._id}" onclick="dashboard.navigateToPage('quiz')" style="cursor: pointer; transition: all 0.2s ease;">
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
                <div class="quiz-status-badge">
                    ${this.getQuizStatusBadge(quiz)}
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
            <div class="holiday-item clickable" onclick="dashboard.navigateToPage('holidays')" style="cursor: pointer; transition: all 0.2s ease;">
                <div class="holiday-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="holiday-info">
                    <h4>${holiday.reason}</h4>
                    <p>${this.formatDate(holiday.startDate)}${holiday.startDate !== holiday.endDate ? ' - ' + this.formatDate(holiday.endDate) : ''}</p>
                    ${holiday.note ? `<p class="holiday-note">${holiday.note}</p>` : ''}
                </div>
                <div class="holiday-actions">
                    <button class="btn-delete" onclick="event.stopPropagation(); dashboard.deleteHoliday('${holiday._id}')" title="Delete Holiday">
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
                            <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date *</label>
                            <input type="date" name="endDate" id="endDate" required>
                            <small class="form-hint">Select holiday end date</small>
                            <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                        </div>
                    </div>
                    <div class="form-row" id="singleDateRow" style="display: none;">
                        <div class="form-group">
                            <label for="singleDate">Holiday Date *</label>
                            <input type="date" name="singleDate" id="singleDate">
                            <small class="form-hint">Select holiday date</small>
                            <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reason">Holiday Type *</label>
                        <select name="reason" id="reason" required>
                            <option value="">Select Holiday Type</option>
                            <option value="personal">Personal</option>
                            <option value="public">Public</option>
                        </select>
                        <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                    </div>
                    <div class="form-group">
                        <label for="note">Reason (Optional)</label>
                        <textarea name="note" id="note" placeholder="Reason (optional)" rows="3"></textarea>
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

        // Add input event listeners to clear errors on typing
        const holidayForm = document.getElementById('addHolidayForm');
        if (holidayForm) {
            holidayForm.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
                input.addEventListener('change', () => {
                    this.clearFieldError(input);
                });
            });
        }
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

    setMinDateForQuizInputs() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // Set minimum datetime to current time
        const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        // Set min datetime for both create and edit quiz forms
        const quizStartTime = document.getElementById('quizStartTime');
        const quizEndTime = document.getElementById('quizEndTime');
        const editQuizStartTime = document.getElementById('editQuizStartTime');
        const editQuizEndTime = document.getElementById('editQuizEndTime');

        // Set min date for create quiz form
        if (quizStartTime) {
            quizStartTime.min = minDateTime;
            quizStartTime.addEventListener('change', () => {
                this.updateEndTimeMinimum();
            });
        }

        if (quizEndTime) {
            quizEndTime.min = minDateTime;
        }

        // Set min date for edit quiz form
        if (editQuizStartTime) {
            editQuizStartTime.min = minDateTime;
            editQuizStartTime.addEventListener('change', () => {
                this.updateEndTimeMinimum(true);
            });
        }

        if (editQuizEndTime) {
            editQuizEndTime.min = minDateTime;
        }
    }

    updateEndTimeMinimum(isEditForm = false) {
        const prefix = isEditForm ? 'edit' : '';
        const quizStartTime = document.getElementById(`${prefix}QuizStartTime`);
        const quizEndTime = document.getElementById(`${prefix}QuizEndTime`);

        if (quizStartTime && quizEndTime) {
            if (quizStartTime.value) {
                // Set end time minimum to be at least 30 minutes after start time
                const startDate = new Date(quizStartTime.value);
                const minEndDate = new Date(startDate);
                minEndDate.setMinutes(minEndDate.getMinutes() + 30);

                // Format the minimum end time
                const year = minEndDate.getFullYear();
                const month = String(minEndDate.getMonth() + 1).padStart(2, '0');
                const day = String(minEndDate.getDate()).padStart(2, '0');
                const hours = String(minEndDate.getHours()).padStart(2, '0');
                const minutes = String(minEndDate.getMinutes()).padStart(2, '0');

                const minEndTime = `${year}-${month}-${day}T${hours}:${minutes}`;

                // Update the min attribute to prevent selecting invalid times
                quizEndTime.min = minEndTime;

                // If end time is set and is before the new minimum, clear it
                if (quizEndTime.value && new Date(quizEndTime.value) < minEndDate) {
                    quizEndTime.value = '';
                }
            } else {
                // If start time is cleared, also clear min attribute on end time
                quizEndTime.min = '';
            }
        }
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

        // Clear previous error for this field
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        input.classList.remove('error');

        // Return true if empty (required validation is handled separately)
        if (!value) {
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

        // Hide existing error instead of removing
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        select.classList.remove('error');

        if (!select.value) {
            this.showFieldError(select, 'Please select holiday type');
            return false;
        }

        return true;
    }

    validateHolidayForm() {
        const form = document.getElementById('addHolidayForm');
        const isSingleDay = document.getElementById('singleDayHoliday').checked;
        let isValid = true;

        // Clear all previous errors - hide instead of remove
        form.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));

        if (isSingleDay) {
            const singleDateInput = document.getElementById('singleDate');
            if (!singleDateInput.value) {
                this.showFieldError(singleDateInput, 'Holiday date is required');
                isValid = false;
            } else if (!this.validateDateFormat(singleDateInput)) {
                isValid = false;
            }
        } else {
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');

            // Check if start date is empty
            if (!startDateInput.value) {
                this.showFieldError(startDateInput, 'Start date is required');
                isValid = false;
            } else if (!this.validateDateFormat(startDateInput)) {
                isValid = false;
            }

            // Check if end date is empty
            if (!endDateInput.value) {
                this.showFieldError(endDateInput, 'End date is required');
                isValid = false;
            } else if (!this.validateDateFormat(endDateInput)) {
                isValid = false;
            }

            // Validate date range only if both dates are present
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

    validateCreateSessionForm() {
        console.log('validateCreateSessionForm called');
        const form = document.getElementById('createSessionForm');
        let isValid = true;
        let validationErrors = [];

        // Set submitted flag to true
        this.isSessionFormSubmitted = true;

        // Clear all previous errors
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));

        // Validate session title
        const titleInput = document.getElementById('sessionTitle');
        console.log('Title input value:', titleInput.value);
        if (!titleInput.value.trim()) {
            this.showFieldError(titleInput, 'Session title is required');
            validationErrors.push('Session title is required');
            isValid = false;
        }

        // Validate session date
        const dateInput = document.getElementById('sessionDate');
        console.log('Date input value:', dateInput.value);
        if (!dateInput.value) {
            this.showFieldError(dateInput, 'Date is required');
            validationErrors.push('Date is required');
            isValid = false;
        }

        // Validate session duration
        const durationInput = document.getElementById('sessionDuration');
        console.log('Duration input value:', durationInput.value);
        if (!durationInput.value) {
            this.showFieldError(durationInput, 'Session duration is required');
            validationErrors.push('Session duration is required');
            isValid = false;
        }

        // Validate break duration
        const breakInput = document.getElementById('breakDuration');
        console.log('Break input value:', breakInput.value);
        if (!breakInput.value) {
            this.showFieldError(breakInput, 'Break duration is required');
            validationErrors.push('Break duration is required');
            isValid = false;
        }

        // Show toast message for validation errors
        if (!isValid) {
            this.showMessage('Please fill all required fields', 'error');
        }

        console.log('Validation result:', isValid);
        return isValid;
    }

    showFieldError(field, message) {
        // Add error class and show message
        field.classList.add('error');
        field.style.borderColor = '#dc2626';

        // Remove any existing error message for this field
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            font-weight: 500;
        `;
        errorElement.textContent = message;

        // Insert error message immediately after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
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
                console.log('Students loaded from DB:', students);
                console.log('Profile images:', students.map(s => ({
                    name: s.fullName,
                    profileImage: s.profileImage,
                    _id: s._id
                })));

                // Also update recent students with the same data
                this.updateRecentStudents(students);
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

        container.innerHTML = students.map(student => {
            // Handle profile image URL
            let profileImageUrl = student.profileImage;
            if (profileImageUrl) {
                // Convert Windows backslashes to forward slashes and ensure proper format
                profileImageUrl = profileImageUrl.replace(/\\/g, '/');
                if (!profileImageUrl.startsWith('/uploads/') && !profileImageUrl.startsWith('http')) {
                    profileImageUrl = '/uploads/' + profileImageUrl.replace(/^uploads\//, '');
                }
                if (profileImageUrl.startsWith('/uploads/')) {
                    profileImageUrl = `${this.getServerUrl()}${profileImageUrl}`;
                }
            }

            return `
            <div class="student-card">
                <img src="${profileImageUrl || 'https://picsum.photos/seed/' + student._id + '/60/60.jpg'}" alt="${student.fullName}" class="student-avatar">
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
            `;
        }).join('');
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


    validateAddStudentForm() {
        const form = document.getElementById('addStudentForm');
        const inputs = form.querySelectorAll('input[data-required="true"]');
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.validation-error').forEach(error => error.remove());
        form.querySelectorAll('input.error').forEach(input => input.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(errorMsg => {
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
        });

        inputs.forEach(input => {
            const value = input.value.trim();

            if (!value) {
                this.showFieldError(input, `${this.getFieldName(input.name)} is required`);
                isValid = false;
            } else {
                // Specific field validations
                switch (input.name) {
                    case 'email':
                        if (!this.isValidEmail(value)) {
                            this.showFieldError(input, 'Please enter a valid email address');
                            isValid = false;
                        }
                        break;
                    case 'mobileNo':
                        if (!this.isValidMobile(value)) {
                            this.showFieldError(input, 'Please enter a valid 10-digit mobile number');
                            isValid = false;
                        }
                        break;
                    case 'age':
                        const age = parseInt(value);
                        if (isNaN(age) || age < 1 || age > 120) {
                            this.showFieldError(input, 'Age must be between 1 and 120');
                            isValid = false;
                        }
                        break;
                    case 'password':
                        if (value.length < 6) {
                            this.showFieldError(input, 'Password must be at least 6 characters long');
                            isValid = false;
                        }
                        break;
                }
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        input.classList.add('error');

        // Use existing error-message span instead of creating new validation-error
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            // Fallback: create validation-error if error-message doesn't exist
            const existingError = input.parentNode.querySelector('.validation-error');
            if (existingError) {
                existingError.remove();
            }
            const errorElement = document.createElement('span');
            errorElement.className = 'validation-error';
            errorElement.textContent = message;
            input.parentNode.appendChild(errorElement);
        }
    }

    showBackendFieldError(fieldName, message) {
        // Map backend field names to frontend form field IDs
        const fieldMapping = {
            'title': 'sessionTitle',
            'date': 'sessionDate',
            'sessionDuration': 'sessionDuration',
            'breakDuration': 'breakDuration',
            'student_id': 'student_id'
        };

        const fieldId = fieldMapping[fieldName] || fieldName;
        const field = document.getElementById(fieldId);

        if (field) {
            this.showFieldError(field, message);
            // Scroll to the field with error
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on the field
            field.focus();
        } else {
            // If field not found, show as toast message
            this.showMessage(message, 'error');
        }
    }

    clearFieldError(input) {
        input.classList.remove('error');

        // Hide error-message span (for add student form)
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        // Clear validation-error (fallback)
        const validationError = input.parentNode.querySelector('.validation-error');
        if (validationError) {
            validationError.remove();
        }

        // Also check form-group for any remaining error messages
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            const groupErrorMessage = formGroup.querySelector('.error-message');
            if (groupErrorMessage) {
                groupErrorMessage.style.display = 'none';
                groupErrorMessage.textContent = '';
            }
        }
    }

    resetAddStudentForm() {
        const form = document.getElementById('addStudentForm');
        if (form) {
            // Reset form fields
            form.reset();

            // Clear validation errors
            form.querySelectorAll('.validation-error').forEach(error => error.remove());
            form.querySelectorAll('input.error').forEach(input => input.classList.remove('error'));

            // Clear all error message spans
            form.querySelectorAll('.error-message').forEach(errorMsg => {
                errorMsg.style.display = 'none';
                errorMsg.textContent = '';
            });

            // Reset image preview
            this.removeImage();
        }
    }

    clearAddStudentFormErrors() {
        const form = document.getElementById('addStudentForm');
        if (form) {
            form.querySelectorAll('.validation-error').forEach(error => error.remove());
            form.querySelectorAll('input.error').forEach(input => input.classList.remove('error'));
        }
    }

    setupImageUpload() {
        const fileInput = document.getElementById('addProfileImageInput');
        const profilePreview = document.getElementById('addProfilePreview');

        if (!fileInput || !profilePreview) return;

        // File selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    handleImageFile(file) {
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('Image size should be less than 2MB', 'error');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please upload a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const uploadPlaceholder = document.querySelector('.upload-placeholder-clean');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (uploadPlaceholder && imagePreview && previewImg) {
            previewImg.src = imageSrc;
            uploadPlaceholder.style.display = 'none';
            imagePreview.style.display = 'block';
        }
    }

    removeImage() {
        // Handle Add Student form image reset
        const addFileInput = document.getElementById('addProfileImageInput');
        const addProfilePreview = document.getElementById('addProfilePreview');

        if (addFileInput && addProfilePreview) {
            addFileInput.value = '';
            addProfilePreview.src = '';
        }

        // Handle other forms with different structure (profileImageInput, imagePreview)
        const fileInput = document.getElementById('profileImageInput');
        const uploadPlaceholder = document.querySelector('.upload-placeholder-clean');
        const imagePreview = document.getElementById('imagePreview');

        if (fileInput && uploadPlaceholder && imagePreview) {
            fileInput.value = '';
            uploadPlaceholder.style.display = 'flex';
            imagePreview.style.display = 'none';
        }
    }

    getFieldName(fieldName) {
        const fieldNames = {
            userId: 'User ID',
            fullName: 'Full Name',
            email: 'Email',
            password: 'Password',
            age: 'Age',
            mobileNo: 'Mobile Number',
            city: 'City',
            state: 'State'
        };
        return fieldNames[fieldName] || fieldName;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidMobile(mobile) {
        const mobileRegex = /^[0-9]{10}$/;
        return mobileRegex.test(mobile);
    }

    async addStudent() {
        console.log('addStudent function called'); // Debug log

        // Validate form first
        if (!this.validateAddStudentForm()) {
            console.log('Validation failed'); // Debug log
            return;
        }

        console.log('Validation passed, submitting form'); // Debug log
        const formData = new FormData(document.getElementById('addStudentForm'));

        try {
            console.log('Sending request to server'); // Debug log
            const response = await fetch('/api/teachers/students', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            console.log('Response received:', response); // Debug log
            const result = await response.json();
            console.log('Response data:', result); // Debug log

            if (response.ok) {
                // Update total students count immediately
                if (result.totalStudents !== undefined) {
                    this.updateStudentCount(result.totalStudents);
                }

                // Immediately add the new student to the display
                if (result.student) {
                    this.addStudentToDisplay(result.student);
                }

                // Close modal and reset form
                const modal = document.getElementById('addStudentModal');
                if (modal) modal.classList.remove('show');
                document.getElementById('addStudentForm').reset();

                // Show success message immediately
                this.showMessage('Student added successfully!', 'success');

                // Show success animation
                this.showAddSuccessAnimation();

                // Refresh dashboard data in background (don't wait for it)
                setTimeout(() => {
                    this.loadDashboardData();
                }, 100);
            } else {
                this.showMessage(result.message || 'Failed to add student', 'error');
            }
        } catch (error) {
            this.showMessage('Error adding student to database', 'error');
        }
    }

    addStudentToDisplay(student) {
        // Handle profile image URL
        let profileImageUrl = student.profileImage;
        if (profileImageUrl) {
            // Convert Windows backslashes to forward slashes and ensure proper format
            profileImageUrl = profileImageUrl.replace(/\\/g, '/');
            if (!profileImageUrl.startsWith('/uploads/') && !profileImageUrl.startsWith('http')) {
                profileImageUrl = '/uploads/' + profileImageUrl.replace(/^uploads\//, '');
            }
            if (profileImageUrl.startsWith('/uploads/')) {
                profileImageUrl = `${this.getServerUrl()}${profileImageUrl}`;
            }
        }

        // Create student card HTML
        const studentCard = `
            <div class="student-card">
                <img src="${profileImageUrl || 'https://picsum.photos/seed/' + student._id + '/60/60.jpg'}" alt="${student.fullName}" class="student-avatar">
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
        `;

        // Add to students list
        const studentsList = document.getElementById('studentsList');
        if (studentsList) {
            // If list is empty or has loading message, clear it
            if (studentsList.innerHTML.includes('Loading students') || studentsList.innerHTML.includes('No students found')) {
                studentsList.innerHTML = '';
            }

            // Add the new student at the beginning with animation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = studentCard;
            const newCard = tempDiv.firstElementChild;
            newCard.style.animation = 'slideIn 0.3s ease-out';
            studentsList.insertBefore(newCard, studentsList.firstChild);
        }

        // Also add to recent students list
        const recentStudents = document.getElementById('recentStudents');
        if (recentStudents) {
            const recentStudentItem = `
                <div class="student-item" style="animation: slideIn 0.3s ease-out;">
                    <img src="${profileImageUrl || 'https://picsum.photos/seed/' + student._id + '/32/32.jpg'}" alt="${student.fullName}" class="student-avatar-small">
                    <div class="student-info">
                        <h4>${student.fullName}</h4>
                        <p>${student.email}</p>
                    </div>
                    <span class="student-class">${student.class || 'N/A'}</span>
                </div>
            `;

            // If list is empty, remove the "No students added yet" message
            if (recentStudents.innerHTML.includes('No students added yet')) {
                recentStudents.innerHTML = '';
            }

            // Add at the beginning and limit to 5 recent students
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = recentStudentItem;
            const newItem = tempDiv.firstElementChild;
            recentStudents.insertBefore(newItem, recentStudents.firstChild);

            // Remove the last item if more than 5
            const items = recentStudents.querySelectorAll('.student-item');
            if (items.length > 5) {
                items[items.length - 1].remove();
            }
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
        const form = document.getElementById('uploadCsvForm');
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];

        // Clear previous errors
        this.clearCsvFieldError(fileInput);

        // Validate file selection
        if (!file) {
            this.showCsvFieldError(fileInput, 'Please select a CSV file before uploading.');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showCsvFieldError(fileInput, 'Please select a CSV file');
            return;
        }

        const formData = new FormData(form);

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

    async uploadQuizCsv() {
        const form = document.getElementById('uploadQuizCsvForm');
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];

        // Get quiz details from form
        const title = form.querySelector('#quizTitle')?.value;
        const className = form.querySelector('#quizClass')?.value;
        const subject = form.querySelector('#quizSubject')?.value;
        const totalMarks = form.querySelector('#totalMarks')?.value;
        const startTime = this.toIsoStringFromDateTimeLocal(form.querySelector('#quizStartTime')?.value);
        const endTime = this.toIsoStringFromDateTimeLocal(form.querySelector('#quizEndTime')?.value);
        const duration = form.querySelector('#quizDuration')?.value;

        // Clear previous errors
        this.clearCsvFieldError(fileInput);

        // Validate file selection
        if (!file) {
            this.showCsvFieldError(fileInput, 'Please select a CSV file before uploading.');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showCsvFieldError(fileInput, 'Please select a CSV file');
            return;
        }

        // Validate required quiz fields
        if (!title || !className || !subject || !startTime || !endTime || !duration) {
            this.showMessage('Please fill in all quiz details (title, class, subject, start time, end time, duration)', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('class', className);
        formData.append('subject', subject);
        if (totalMarks) formData.append('totalMarks', totalMarks);
        formData.append('startTime', startTime);
        formData.append('endTime', endTime);
        formData.append('duration', duration);

        try {
            const response = await fetch('/api/quizzes/upload-csv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage(`Quiz created successfully from CSV! ${result.quiz.totalQuestions} questions imported.`, 'success');
                const modal = document.getElementById('uploadQuizCsvModal');
                if (modal) modal.classList.remove('show');
                form.reset();
                this.loadQuizzesData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                if (error.errors && error.errors.length > 0) {
                    const errorMessages = error.errors.map(err => `Row ${err.row}: ${err.errors.join(', ')}`).join('\n');
                    this.showMessage(`CSV validation failed:\n${errorMessages}`, 'error');
                } else {
                    this.showMessage(error.message || 'Failed to upload quiz CSV', 'error');
                }
            }
        } catch (error) {
            console.error('Error uploading quiz CSV:', error);
            this.showMessage('Error uploading quiz CSV', 'error');
        }
    }

    showCsvFieldError(input, message) {
        input.classList.add('error');

        // Remove existing error message
        const existingError = input.parentNode.querySelector('.csv-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'csv-error';
        errorElement.textContent = message;
        errorElement.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
        input.parentNode.appendChild(errorElement);
    }

    clearCsvFieldError(input) {
        input.classList.remove('error');

        // Remove error message
        const errorElement = input.parentNode.querySelector('.csv-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    async deleteStudent(studentId) {
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to delete this student? This action cannot be undone.',
            'Delete Student'
        );

        if (!confirmed) return;

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

    setupEditStudentValidation() {
        const form = document.getElementById('editStudentForm');
        if (!form) return;

        // Add input event listeners to clear errors
        const inputs = form.querySelectorAll('input[data-required="true"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.clearFieldError(input));
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.previousElementSibling?.textContent || input.name;

        if (!value) {
            this.showFieldError(input, `${fieldName} is required`);
            return false;
        }

        // Email validation
        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(input, 'Invalid email format');
                return false;
            }
        }

        // Mobile validation
        if (input.name === 'mobileNo') {
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(value)) {
                this.showFieldError(input, 'Mobile must be 10 digits');
                return false;
            }
        }

        // Age validation
        if (input.name === 'age') {
            const age = parseInt(value);
            if (isNaN(age) || age < 1 || age > 120) {
                this.showFieldError(input, 'Age must be between 1 and 120');
                return false;
            }
        }

        this.clearFieldError(input);
        return true;
    }

    showFieldError(input, message) {
        input.style.borderColor = '#dc3545';
        input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';

        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';

        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    validateEditStudentForm() {
        const form = document.getElementById('editStudentForm');
        if (!form) return false;

        const inputs = form.querySelectorAll('input[data-required="true"]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
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
                <div class="modal-content modal-wide">
                    <div class="modal-header-clean">
                        <h3>Edit Student</h3>
                        <button class="modal-close-clean" id="closeEditModal">&times;</button>
                    </div>
                    <form id="editStudentForm" enctype="multipart/form-data" novalidate>
                        <div class="form-wide-grid">
                            <!-- Basic Info Section -->
                            <div class="form-section">
                                <h4 class="section-title-clean">Basic Info</h4>
                                <div class="form-row-wide">
                                    <div class="form-field-clean required">
                                        <label for="editUserId">User ID</label>
                                        <input type="text" name="userId" id="editUserId" placeholder="Enter user ID" data-required="true" readonly>
                                    </div>
                                    <div class="form-field-clean required">
                                        <label for="editFullName">Full Name</label>
                                        <input type="text" name="fullName" id="editFullName" placeholder="Enter full name" data-required="true">
                                    </div>
                                    <div class="form-field-clean required">
                                        <label for="editEmail">Email</label>
                                        <input type="email" name="email" id="editEmail" placeholder="Enter email address" data-required="true">
                                    </div>
                                </div>
                                <div class="form-row-wide">
                                    <div class="form-field-clean">
                                        <label for="editPassword">Password</label>
                                        <input type="password" name="password" id="editPassword" placeholder="Leave blank to keep current">
                                    </div>
                                    <div class="form-field-clean required">
                                        <label for="editAge">Age</label>
                                        <input type="number" name="age" id="editAge" placeholder="Age" min="1" max="120" data-required="true">
                                    </div>
                                    <div class="form-field-clean">
                                        <!-- Empty field for balance -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contact Info Section -->
                            <div class="form-section">
                                <h4 class="section-title-clean">Contact Info</h4>
                                <div class="form-row-wide">
                                    <div class="form-field-clean required">
                                        <label for="editMobileNo">Mobile</label>
                                        <input type="tel" name="mobileNo" id="editMobileNo" placeholder="10-digit number" maxlength="10" data-required="true">
                                    </div>
                                    <div class="form-field-clean required">
                                        <label for="editCity">City</label>
                                        <input type="text" name="city" id="editCity" placeholder="City" data-required="true">
                                    </div>
                                    <div class="form-field-clean required">
                                        <label for="editState">State</label>
                                        <input type="text" name="state" id="editState" placeholder="State" data-required="true">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Academic Info Section -->
                            <div class="form-section">
                                <h4 class="section-title-clean">Academic Info</h4>
                                <div class="form-row-wide">
                                    <div class="form-field-clean">
                                        <label for="editClass">Class</label>
                                        <input type="text" name="class" id="editClass" placeholder="e.g., 10th Grade">
                                    </div>
                                    <div class="form-field-clean">
                                        <label for="editTimezone">Timezone</label>
                                        <input type="text" name="timezone" id="editTimezone" placeholder="e.g., Asia/Kolkata">
                                    </div>
                                    <div class="form-field-clean">
                                        <!-- Empty field for balance -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Profile Image Section -->
                            <div class="form-section">
                                <h4 class="section-title-clean">Profile Image</h4>
                                <div class="form-row-wide">
                                    <div class="form-field-clean">
                                        <label for="editProfileImage">Profile Image</label>
                                        <input type="file" name="image" id="editProfileImage" accept="image/*">
                                    </div>
                                    <div class="form-field-clean">
                                        <!-- Empty field for balance -->
                                    </div>
                                    <div class="form-field-clean">
                                        <!-- Empty field for balance -->
                                    </div>
                                </div>
                                <div class="form-row-wide" id="currentImagePreview" style="display: none;">
                                    <div class="form-field-clean">
                                        <label>Current Profile Image:</label>
                                        <img id="currentProfileImage" src="" alt="Current Profile" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover; margin-top: 8px;">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="form-actions-clean">
                            <button type="button" class="btn btn-outline" id="cancelEditBtn">Cancel</button>
                            <button type="submit" class="btn btn-primary-clean">Update Student</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(editModal);

            // Add event listeners for edit modal
            document.getElementById('closeEditModal').addEventListener('click', () => {
                editModal.classList.remove('show');
                editModal.remove();
            });

            document.getElementById('cancelEditBtn').addEventListener('click', () => {
                editModal.classList.remove('show');
                editModal.remove();
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
        document.getElementById('editUserId').value = student._id || student.userId;
        document.getElementById('editFullName').value = student.fullName || '';
        document.getElementById('editEmail').value = student.email || '';
        document.getElementById('editAge').value = student.age || '';
        document.getElementById('editMobileNo').value = student.mobileNo || '';
        document.getElementById('editClass').value = student.class || '';
        document.getElementById('editCity').value = student.city || '';
        document.getElementById('editState').value = student.state || '';
        // Set timezone dropdown value
        const editTimezoneSelect = document.getElementById('editTimezone');
        if (editTimezoneSelect && student.timezone) {
            editTimezoneSelect.value = student.timezone;
        }

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

    setupQuizFormErrorClearing() {
        const form = document.getElementById('createQuizForm');
        if (!form) return;

        // Clear errors for basic fields on input
        const basicFields = form.querySelectorAll('#quizTitle, #quizClass, #quizSubject, #totalMarks, #quizStartTime, #quizEndTime, #quizDuration');
        basicFields.forEach(field => {
            field.addEventListener('input', () => {
                this.clearFieldError(field);
            });

            field.addEventListener('change', () => {
                this.clearFieldError(field);
            });
        });

        // Clear errors for question fields on input
        const observer = new MutationObserver(() => {
            const questionInputs = form.querySelectorAll('.question-item input, .question-item select');
            questionInputs.forEach(input => {
                if (!input.hasAttribute('data-error-listener')) {
                    input.setAttribute('data-error-listener', 'true');
                    input.addEventListener('input', () => {
                        this.clearFieldError(input);
                    });

                    input.addEventListener('change', () => {
                        this.clearFieldError(input);
                    });
                }
            });
        });

        // Start observing the questions container for dynamic question additions
        const questionsContainer = form.querySelector('#questionsContainer');
        if (questionsContainer) {
            observer.observe(questionsContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    clearFieldError(field) {
        // Remove error styling from field
        field.style.borderColor = '';

        // Remove field-specific error message
        const fieldError = field.parentNode.querySelector('.field-error, .option-error');
        if (fieldError) {
            fieldError.remove();
        }

        // Remove question-level error if all fields in that question are valid
        const questionItem = field.closest('.question-item');
        if (questionItem) {
            const questionError = questionItem.querySelector('.question-error');
            if (questionError) {
                // Check if all fields in this question are now valid
                const questionText = questionItem.querySelector('input[name^="questions"]').value.trim();
                const options = questionItem.querySelectorAll('input[name^="options"]');
                const correctAnswer = questionItem.querySelector('select').value;

                let allValid = questionText && correctAnswer;
                options.forEach(option => {
                    if (!option.value.trim()) {
                        allValid = false;
                    }
                });

                if (allValid) {
                    questionError.remove();
                }
            }
        }
    }

    // Show field error for quiz form - handles CSS selectors
    showFieldError(selector, message) {
        // Handle both string selectors and DOM elements
        const field = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!field) return;

        // Add red border
        field.style.borderColor = '#dc3545';
        field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';

        // Remove existing error message
        const parent = field.parentElement;
        const existingError = parent.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '4px';
        errorElement.style.fontWeight = '500';
        errorElement.style.display = 'block';

        // Insert after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    validateQuizForm() {
        const form = document.getElementById('createQuizForm');

        // Clear all previous error messages
        this.clearAllErrorMessages();

        let isValid = true;
        const errors = [];

        // Validate Quiz Title
        const title = form.querySelector('#quizTitle').value.trim();
        if (!title) {
            this.showFieldError('#quizTitle', 'Title is required');
            isValid = false;
        }

        // Validate Class
        const className = form.querySelector('#quizClass').value;
        if (!className) {
            this.showFieldError('#quizClass', 'Class is required');
            isValid = false;
        }

        // Validate Subject
        const subject = form.querySelector('#quizSubject').value.trim();
        if (!subject) {
            this.showFieldError('#quizSubject', 'Subject is required');
            isValid = false;
        }

        // Validate Start Time
        const startTime = form.querySelector('#quizStartTime').value;
        if (!startTime) {
            this.showFieldError('#quizStartTime', 'Start time is required');
            isValid = false;
        }

        // Validate End Time
        const endTime = form.querySelector('#quizEndTime').value;
        if (!endTime) {
            this.showFieldError('#quizEndTime', 'End time is required');
            isValid = false;
        }

        // Validate Duration
        const duration = form.querySelector('#quizDuration').value;
        if (!duration) {
            this.showFieldError('#quizDuration', 'Duration is required');
            isValid = false;
        }

        // Validate Questions
        const questionElements = form.querySelectorAll('.question-item');
        if (questionElements.length === 0) {
            this.showGeneralError('Please add at least one question');
            isValid = false;
        } else {
            questionElements.forEach((questionEl, index) => {
                const questionNumber = index + 1;

                // Validate question text
                const questionText = questionEl.querySelector('input[name^="questions"]').value.trim();
                if (!questionText) {
                    this.showQuestionError(questionEl, `Question ${questionNumber} text is required`);
                    isValid = false;
                }

                // Validate options
                const options = questionEl.querySelectorAll('input[name^="options"]');
                let allOptionsFilled = true;
                options.forEach((option, optionIndex) => {
                    if (!option.value.trim()) {
                        this.showOptionError(option, `Option ${String.fromCharCode(65 + optionIndex)} is required`);
                        allOptionsFilled = false;
                    }
                });

                if (!allOptionsFilled) {
                    isValid = false;
                }

                // Validate correct answer selection
                const correctAnswer = questionEl.querySelector('select').value;
                if (!correctAnswer) {
                    this.showQuestionError(questionEl, `Please select correct answer for Question ${questionNumber}`);
                    isValid = false;
                }
            });
        }

        return isValid;
    }

    showQuestionError(questionElement, message) {
        // Remove existing error if any
        const existingError = questionElement.querySelector('.question-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'question-error';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            padding: 0.5rem;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 0.375rem;
        `;
        errorElement.textContent = message;

        // Add error after the question content
        questionElement.appendChild(errorElement);

        // Add error styling to question container
        questionElement.style.borderColor = '#dc2626';
        questionElement.style.borderWidth = '2px';
        questionElement.style.borderStyle = 'solid';
    }

    showOptionError(optionField, message) {
        // Remove existing error if any
        const existingError = optionField.parentNode.querySelector('.option-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'option-error';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.75rem;
            margin-top: 0.25rem;
        `;
        errorElement.textContent = message;

        // Add error after the option field
        optionField.parentNode.appendChild(errorElement);

        // Add error styling to field
        optionField.style.borderColor = '#dc2626';
    }

    showGeneralError(message) {
        // Remove existing general error if any
        const existingError = document.querySelector('#editQuizForm .general-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'general-error';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 0.375rem;
        `;
        errorElement.textContent = message;

        // Add error at the top of the edit quiz form
        const form = document.getElementById('editQuizForm');
        if (form) {
            form.insertBefore(errorElement, form.firstChild);
        }
    }

    clearQuestionError(questionElement) {
        // Remove error styling from question container
        questionElement.style.borderColor = '';
        questionElement.style.borderWidth = '';
        questionElement.style.borderStyle = '';

        // Remove error message for this question
        const errorElement = questionElement.querySelector('.question-error');
        if (errorElement) {
            errorElement.remove();
        }

        // Clear general errors if this was the last question with an error
        const remainingErrors = document.querySelectorAll('.field-error, .question-error, .general-error');
        if (remainingErrors.length === 0) {
            const generalError = document.querySelector('#editQuizForm .general-error');
            if (generalError) {
                generalError.remove();
            }
        }
    }

    clearFieldError(field) {
        // Remove error styling from field
        field.style.borderColor = '';
        field.classList.remove('error');

        // Remove error message for this field
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }

        // Clear general errors if this was the last field with an error
        const remainingErrors = document.querySelectorAll('.field-error, .question-error, .general-error');
        if (remainingErrors.length === 0) {
            const generalError = document.querySelector('#editQuizForm .general-error');
            if (generalError) {
                generalError.remove();
            }
        }
    }

    clearAllErrorMessages() {
        // Remove all error messages from both forms
        document.querySelectorAll('.field-error, .question-error, .option-error, .general-error').forEach(error => {
            error.remove();
        });

        // Remove error styling from all fields in both forms
        document.querySelectorAll('#editQuizForm input, #editQuizForm select, #createQuizForm input, #createQuizForm select').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
        });

        // Remove error styling from question containers
        document.querySelectorAll('.question-item').forEach(question => {
            question.style.borderColor = '';
            question.style.borderWidth = '';
            question.style.borderStyle = '';
        });
    }

    clearCreateQuizFormValidation() {
        const form = document.getElementById('createQuizForm');
        if (!form) return;

        // Clear all validation error messages by type
        document.querySelectorAll('#createQuizForm .validation-error').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('#createQuizForm .field-error').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('#createQuizForm .question-error').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('#createQuizForm .option-error').forEach(error => {
            error.remove();
        });

        document.querySelectorAll('#createQuizForm .general-error').forEach(error => {
            error.remove();
        });

        // Remove error styling and classes from all form fields
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });

        // Remove error styling from question containers
        form.querySelectorAll('.question-item').forEach(question => {
            question.style.borderColor = '';
            question.classList.remove('error');
        });

        // Reset form to clean state
        form.reset();;
    }

    async createQuiz() {
        // First validate the form
        if (!this.validateQuizForm()) {
            // Scroll to the first error
            const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
        }

        const form = document.getElementById('createQuizForm');
        const formData = new FormData(form);

        // Get basic quiz info
        const title = formData.get('title');
        const className = formData.get('class') || 'General';
        const subject = formData.get('subject') || 'General';

        // Get schedule information
        const startTime = this.toIsoStringFromDateTimeLocal(formData.get('startTime'));
        const endTime = this.toIsoStringFromDateTimeLocal(formData.get('endTime'));
        const duration = parseInt(formData.get('duration')) || 60;

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
            startTime,
            endTime,
            duration
        };

        // Show confirmation dialog with quiz details
        this.showQuizConfirmationDialog(quizData);
    }

    showQuizConfirmationDialog(quizData) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'quiz-confirmation-modal';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 900px;
            width: 95%;
            max-height: 95vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;

        // Format dates for display
        const formatDateTime = (dateTime) => {
            if (!dateTime) return 'Not set';
            const date = new Date(dateTime);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        // Calculate total marks if not provided
        const calculatedTotalMarks = quizData.totalMarks || quizData.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; margin-bottom: 1rem;">
                    <i class="fas fa-question-circle" style="color: #2563eb; font-size: 20px;"></i>
                </div>
                <h3 style="margin: 0 0 0.5rem 0; color: #111827; font-size: 1.5rem; font-weight: 600;">
                    Quiz Confirmation
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.95rem;">Please review your quiz details before creating</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Title</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.title}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Class</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.class}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Subject</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.subject}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Total Marks</div>
                        <div style="color: #111827; font-weight: 500;">${calculatedTotalMarks}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Duration</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.duration} minutes</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Questions</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.questions.length} questions</div>
                    </div>
                </div>
                

                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Start Time</div>
                        <div style="color: #111827; font-weight: 500;">${formatDateTime(quizData.startTime)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">End Time</div>
                        <div style="color: #111827; font-weight: 500;">${formatDateTime(quizData.endTime)}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-list" style="color: #2563eb; margin-right: 0.5rem;"></i>
                        <h4 style="margin: 0; color: #111827; font-size: 1rem; font-weight: 600;">Questions Preview</h4>
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        ${quizData.questions.length} question${quizData.questions.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
                    ${quizData.questions.map((q, index) => `
                        <div style="padding: 1rem; ${index < quizData.questions.length - 1 ? 'border-bottom: 1px solid #f3f4f6' : ''};">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 0.75rem;">
                                <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #eff6ff; color: #2563eb; border-radius: 50%; font-size: 0.75rem; font-weight: 600; margin-right: 0.75rem; flex-shrink: 0;">${index + 1}</span>
                                <div style="color: #374151; font-weight: 500; line-height: 1.4; flex: 1;">${q.question}</div>
                            </div>
                            <div style="margin-left: 2.25rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                                ${q.options.map((option, optIndex) => `
                                    <div style="display: flex; align-items: center; padding: 0.25rem 0.5rem; border-radius: 4px; ${String.fromCharCode(65 + optIndex) === q.correctOption ? 'background: #dcfce7; color: #166534; font-weight: 600;' : 'background: #f9fafb; color: #6b7280;'}">
                                        <span style="font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">${String.fromCharCode(65 + optIndex)}:</span>
                                        <span style="font-size: 0.875rem;">${option}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button id="cancelQuizBtn" style="
                    padding: 0.625rem 1.25rem;
                    background: white;
                    color: #6b7280;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                ">
                    Cancel
                </button>
                <button id="confirmQuizBtn" style="
                    padding: 0.625rem 1.25rem;
                    background: #2563eb;
                    color: white;
                    border: 1px solid #2563eb;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                ">
                    <i class="fas fa-check" style="font-size: 0.75rem;"></i>
                    Create Quiz
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners
        document.getElementById('cancelQuizBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        document.getElementById('confirmQuizBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            this.submitQuizData(quizData);
        });

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });

        // Add hover effects
        const buttons = modalContent.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (btn.id === 'confirmQuizBtn') {
                    btn.style.background = '#1d4ed8';
                    btn.style.transform = 'translateY(-1px)';
                    btn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                } else {
                    btn.style.background = '#f9fafb';
                    btn.style.color = '#374151';
                    btn.style.borderColor = '#9ca3af';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (btn.id === 'confirmQuizBtn') {
                    btn.style.background = '#2563eb';
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = 'none';
                } else {
                    btn.style.background = 'white';
                    btn.style.color = '#6b7280';
                    btn.style.borderColor = '#d1d5db';
                }
            });
        });
    }

    showQuizPreviewDialog(quizData, quizId) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'quiz-preview-modal';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 900px;
            width: 95%;
            max-height: 95vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;

        // Format dates for display
        const formatDateTime = (dateTime) => {
            if (!dateTime) return 'Not set';
            const date = new Date(dateTime);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        // Calculate total marks if not provided
        const calculatedTotalMarks = quizData.totalMarks || quizData.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #dcfce7; border-radius: 12px; margin-bottom: 1rem;">
                    <i class="fas fa-eye" style="color: #16a34a; font-size: 20px;"></i>
                </div>
                <h3 style="margin: 0 0 0.5rem 0; color: #111827; font-size: 1.5rem; font-weight: 600;">
                    Quiz Preview
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.95rem;">Review your quiz before publishing</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Title</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.title}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Class</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.class}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Subject</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.subject}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Total Marks</div>
                        <div style="color: #111827; font-weight: 500;">${calculatedTotalMarks}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Duration</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.duration} minutes</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Questions</div>
                        <div style="color: #111827; font-weight: 500;">${quizData.questions.length} questions</div>
                    </div>
                </div>
                

                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Start Time</div>
                        <div style="color: #111827; font-weight: 500;">${formatDateTime(quizData.startTime)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">End Time</div>
                        <div style="color: #111827; font-weight: 500;">${formatDateTime(quizData.endTime)}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-list" style="color: #2563eb; margin-right: 0.5rem;"></i>
                        <h4 style="margin: 0; color: #111827; font-size: 1rem; font-weight: 600;">Questions Preview</h4>
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        ${quizData.questions.length} question${quizData.questions.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
                    ${quizData.questions.map((q, index) => `
                        <div style="padding: 1rem; ${index < quizData.questions.length - 1 ? 'border-bottom: 1px solid #f3f4f6' : ''};">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 0.75rem;">
                                <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #eff6ff; color: #2563eb; border-radius: 50%; font-size: 0.75rem; font-weight: 600; margin-right: 0.75rem; flex-shrink: 0;">${index + 1}</span>
                                <div style="color: #374151; font-weight: 500; line-height: 1.4; flex: 1;">${q.question}</div>
                            </div>
                            <div style="margin-left: 2.25rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                                ${q.options.map((option, optIndex) => `
                                    <div style="display: flex; align-items: center; padding: 0.25rem 0.5rem; border-radius: 4px; ${String.fromCharCode(65 + optIndex) === q.correctOption ? 'background: #dcfce7; color: #166534; font-weight: 600;' : 'background: #f9fafb; color: #6b7280;'}">
                                        <span style="font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">${String.fromCharCode(65 + optIndex)}:</span>
                                        <span style="font-size: 0.875rem;">${option}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button id="backToEditBtn" style="
                    padding: 0.625rem 1.25rem;
                    background: white;
                    color: #6b7280;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                ">
                    <i class="fas fa-arrow-left" style="margin-right: 0.5rem;"></i>
                    Back to Edit
                </button>
                <button id="confirmPublishBtn" style="
                    padding: 0.625rem 1.25rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                ">
                    <i class="fas fa-rocket" style="font-size: 0.75rem;"></i>
                    Confirm Publish
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners
        document.getElementById('backToEditBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        document.getElementById('confirmPublishBtn').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            this.confirmPublishQuiz(quizData, quizId);
        });

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });

        // Add hover effects
        const buttons = modalContent.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (btn.id === 'confirmPublishBtn') {
                    btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    btn.style.transform = 'translateY(-1px)';
                    btn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                } else {
                    btn.style.background = '#f9fafb';
                    btn.style.color = '#374151';
                    btn.style.borderColor = '#9ca3af';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (btn.id === 'confirmPublishBtn') {
                    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = 'none';
                } else {
                    btn.style.background = 'white';
                    btn.style.color = '#6b7280';
                    btn.style.borderColor = '#d1d5db';
                }
            });
        });
    }

    async submitQuizData(quizData) {
        try {
            this.showLoading();

            const response = await fetch('/api/quizzes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            if (response.ok) {
                const result = await response.json();
                const newQuiz = result.quiz;

                this.showMessage('Quiz created successfully', 'success');

                // Update quiz status immediately for new quiz
                if (newQuiz && newQuiz._id && newQuiz.status) {
                    // Since it's a new quiz, we'll let the loadQuizData handle the UI updates
                    // But we can add the new quiz to the current data immediately if needed
                    console.log('New quiz created with status:', newQuiz.status);
                }

                // Reset the form
                const form = document.getElementById('createQuizForm');
                form.reset();
                // Reset to single question
                this.resetQuestionsToDefault();
                // Navigate back to quiz list
                this.navigateToQuizPage();
                // Refresh quiz list
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
            <div class="question-header">
                <span class="question-number">Question ${questionCount}</span>
                <button type="button" class="btn-remove-question" onclick="dashboard.showDeleteQuestionModal(this.closest('.question-item'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="question-field">
                <input type="text" name="questions[]" placeholder="Enter question text" required>
            </div>
            <div class="options-grid">
                <div class="option-item">
                    <label>A</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option A" required>
                </div>
                <div class="option-item">
                    <label>B</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option B" required>
                </div>
                <div class="option-item">
                    <label>C</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option C" required>
                </div>
                <div class="option-item">
                    <label>D</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option D" required>
                </div>
            </div>
            <div class="answer-field">
                <label>Correct Answer</label>
                <select name="answers[]">
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
            </div>
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
            const response = await fetch('/api/quizzes', {
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
                                        <i class="fas fa-question"></i>
                                    </div>
                                    <div class="quiz-title-info">
                                        <h3 class="quiz-title">${quiz.title}</h3>
                                        <p class="quiz-subtitle">${quiz.class} • ${quiz.subject}</p>
                                    </div>
                                </div>
                                <div class="quiz-header-right">
                                    <div class="quiz-status-badge">
                                        ${this.getQuizStatusBadge(quiz)}
                                    </div>
                                    <div class="quiz-actions-enhanced">
                                        ${quiz.status !== 'draft' ? `
                                        <button class="btn-action btn-view-enhanced" onclick="dashboard.viewQuiz('${quiz._id}')" title="View Quiz Details">
                                            <i class="fas fa-eye"></i>
                                        </button>` : ''}
                                        ${this.isQuizEditable(quiz) ? `
                                        <button class="btn-action btn-edit-enhanced" onclick="dashboard.editQuiz('${quiz._id}')" title="Edit Quiz">
                                            <i class="fas fa-edit"></i>
                                        </button>` : `
                                        <button class="btn-action btn-edit-enhanced" disabled title="Cannot edit - quiz is active or expired" style="opacity: 0.5; cursor: not-allowed;">
                                            <i class="fas fa-edit"></i>
                                        </button>`}
                                        <button class="btn-action btn-delete-enhanced" onclick="dashboard.deleteQuiz('${quiz._id}')" title="Delete Quiz">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="quiz-card-body">
                                <div class="quiz-stats-row">
                                    <div class="quiz-stat-item">
                                        <div class="stat-label">Questions</div>
                                        <div class="stat-value">${quiz.questions?.length || 0}</div>
                                    </div>
                                    <div class="quiz-stat-item">
                                        <div class="stat-label">Duration</div>
                                        <div class="stat-value">${quiz.duration || 0} min</div>
                                    </div>
                                    <div class="quiz-stat-item">
                                        <div class="stat-label">Created</div>
                                        <div class="stat-value">${quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
                                    </div>
                                </div>
                                
                                <div class="quiz-schedule-row">
                                    <div class="schedule-item">
                                        <div class="schedule-label">Start</div>
                                        <div class="schedule-value">
                                            ${quiz.startTime ? this.formatDateTime(quiz.startTime) : 'Not set'}
                                        </div>
                                    </div>
                                    <div class="schedule-item">
                                        <div class="schedule-label">End</div>
                                        <div class="schedule-value">
                                            ${quiz.endTime ? this.formatDateTime(quiz.endTime) : 'Not set'}
                                        </div>
                                    </div>
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
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to delete this quiz?',
            'Delete Quiz'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/quizzes/${quizId}`, {
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

    async editQuiz(quizId) {
        try {
            this.showLoading();

            // Navigate to edit quiz page
            this.navigateToEditQuizPage(quizId);

            // Fetch quiz data and populate form
            await this.fetchQuizAndPopulateEditForm(quizId);

        } catch (error) {
            console.error('Error editing quiz:', error);
            this.showMessage('Failed to load quiz for editing', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async fetchQuizAndPopulateEditForm(quizId) {
        try {
            this.showLoading();
            const response = await fetch(`/api/quizzes/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const quiz = result.quiz;
                this.populateEditForm(quiz);
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to fetch quiz', 'error');
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            this.showMessage('Failed to fetch quiz', 'error');
        } finally {
            this.hideLoading();
        }
    }

    populateEditForm(quiz) {
        // Set quiz ID
        document.getElementById('editQuizId').value = quiz._id;

        // Set minimum dates for the edit form
        this.setMinDateForQuizInputs();

        // Populate basic info
        document.getElementById('editQuizTitle').value = quiz.title || '';
        document.getElementById('editQuizSubject').value = quiz.subject || '';

        // Set class dropdown
        const classSelect = document.getElementById('editQuizClass');
        if (classSelect && quiz.class) {
            classSelect.value = quiz.class;
        }

        // Populate schedule
        const editStartInput = document.getElementById('editQuizStartTime');
        const editEndInput = document.getElementById('editQuizEndTime');
        if (editStartInput) {
            editStartInput.value = quiz.startTime ? this.toDateTimeLocalInputValue(quiz.startTime) : '';
        }
        if (editEndInput) {
            editEndInput.value = quiz.endTime ? this.toDateTimeLocalInputValue(quiz.endTime) : '';
        }
        this.clearTimeDisplay('editQuizStartTimeDisplay');
        this.clearTimeDisplay('editQuizEndTimeDisplay');
        document.getElementById('editQuizDuration').value = quiz.duration || 60;

        // Add event listeners for time display updates
        this.setupEditTimeDisplayListeners();

        // Populate questions
        this.populateEditQuestions(quiz.questions || []);

        // Show/hide Publish Quiz and Save to Draft buttons based on status
        const publishBtn = document.getElementById('publishQuizBtn');
        const saveToDraftBtn = document.getElementById('saveToDraftBtn');

        if (publishBtn) {
            if (quiz.status === 'draft') {
                publishBtn.style.display = 'flex';
            } else {
                publishBtn.style.display = 'none';
            }
        }

        if (saveToDraftBtn) {
            if (quiz.status === 'published') {
                saveToDraftBtn.style.display = 'flex';
            } else {
                saveToDraftBtn.style.display = 'none';
            }
        }
    }

    populateEditQuestions(questions) {
        const container = document.getElementById('editQuestionsContainer');
        container.innerHTML = '';

        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <button type="button" class="btn-remove-question" onclick="dashboard.showDeleteQuestionModal(this.closest('.question-item'))">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="question-field">
                    <input type="text" name="questions[]" placeholder="Enter question text" value="${q.question || ''}" required>
                </div>
                <div class="options-grid">
                    <div class="option-item">
                        <label>A</label>
                        <input type="text" name="options${index + 1}[]" placeholder="Option A" value="${q.options?.[0] || ''}" required>
                    </div>
                    <div class="option-item">
                        <label>B</label>
                        <input type="text" name="options${index + 1}[]" placeholder="Option B" value="${q.options?.[1] || ''}" required>
                    </div>
                    <div class="option-item">
                        <label>C</label>
                        <input type="text" name="options${index + 1}[]" placeholder="Option C" value="${q.options?.[2] || ''}" required>
                    </div>
                    <div class="option-item">
                        <label>D</label>
                        <input type="text" name="options${index + 1}[]" placeholder="Option D" value="${q.options?.[3] || ''}" required>
                    </div>
                </div>
                <div class="answer-field">
                    <label>Correct Answer</label>
                    <select name="answers[]">
                        <option value="">Select correct answer</option>
                        <option value="A" ${q.correctOption === 'A' ? 'selected' : ''}>A</option>
                        <option value="B" ${q.correctOption === 'B' ? 'selected' : ''}>B</option>
                        <option value="C" ${q.correctOption === 'C' ? 'selected' : ''}>C</option>
                        <option value="D" ${q.correctOption === 'D' ? 'selected' : ''}>D</option>
                    </select>
                </div>
            `;
            container.appendChild(questionDiv);

            // Add event listeners to clear errors when fields are corrected
            const questionInputs = questionDiv.querySelectorAll('input, select');
            questionInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.clearQuestionError(questionDiv);
                });

                input.addEventListener('change', () => {
                    this.clearQuestionError(questionDiv);
                });
            });
        });
    }

    addEditQuestionField() {
        const container = document.getElementById('editQuestionsContainer');
        const questionCount = container.querySelectorAll('.question-item').length + 1;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Question ${questionCount}</span>
                <button type="button" class="btn-remove-question" data-question-number="${questionCount}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="question-field">
                <input type="text" name="questions[]" placeholder="Enter question text" required>
            </div>
            <div class="options-grid">
                <div class="option-item">
                    <label>A</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option A" required>
                </div>
                <div class="option-item">
                    <label>B</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option B" required>
                </div>
                <div class="option-item">
                    <label>C</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option C" required>
                </div>
                <div class="option-item">
                    <label>D</label>
                    <input type="text" name="options${questionCount}[]" placeholder="Option D" required>
                </div>
            </div>
            <div class="answer-field">
                <label>Correct Answer</label>
                <select name="answers[]">
                    <option value="">Select correct answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
            </div>
        `;

        container.appendChild(questionDiv);

        // Add event listeners to clear errors when fields are corrected
        const questionInputs = questionDiv.querySelectorAll('input, select');
        questionInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearQuestionError(questionDiv);
            });

            input.addEventListener('change', () => {
                this.clearQuestionError(questionDiv);
            });
        });
    }

    async updateQuiz() {
        // First validate the form
        if (!this.validateEditQuizForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
        }

        const form = document.getElementById('editQuizForm');
        const formData = new FormData(form);
        const quizId = formData.get('quizId');

        // Get basic quiz info
        const title = formData.get('title');
        const className = formData.get('class');
        const subject = formData.get('subject');

        // Get schedule information
        const startTime = this.toIsoStringFromDateTimeLocal(formData.get('startTime'));
        const endTime = this.toIsoStringFromDateTimeLocal(formData.get('endTime'));
        const duration = parseInt(formData.get('duration')) || 60;

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
            startTime,
            endTime,
            duration
        };

        try {
            this.showLoading();

            const response = await fetch(`/api/quizzes/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            if (response.ok) {
                const result = await response.json();
                const updatedQuiz = result.quiz;

                this.showMessage('Quiz updated successfully', 'success');

                // Update quiz status immediately if status changed
                if (updatedQuiz && updatedQuiz.status) {
                    this.updateQuizStatusImmediately(quizId, updatedQuiz.status);
                }

                this.navigateToQuizPage();
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

    async publishQuiz() {
        // First validate the form
        if (!this.validateEditQuizForm()) {
            // Scroll to the first error
            const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
        }

        try {
            const form = document.getElementById('editQuizForm');
            const formData = new FormData(form);
            const quizId = formData.get('quizId');

            console.log('Preparing to publish quiz with ID:', quizId);

            // Get basic quiz info
            const title = formData.get('title');
            const className = formData.get('class');
            const subject = formData.get('subject');

            // Get schedule information
            const startTime = this.toIsoStringFromDateTimeLocal(formData.get('startTime'));
            const endTime = this.toIsoStringFromDateTimeLocal(formData.get('endTime'));
            const duration = parseInt(formData.get('duration')) || 60;

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
                startTime,
                endTime,
                duration,
                status: 'published' // Set status to published
            };

            console.log('=== FRONTEND DEBUG: Quiz data prepared for preview ===');
            console.log('Quiz ID:', quizId);
            console.log('Quiz data being sent:', JSON.stringify(quizData, null, 2));

            // Show quiz preview before publishing
            this.showQuizPreviewDialog(quizData, quizId);

        } catch (error) {
            console.error('Error preparing quiz preview:', error);
            this.showMessage('Error preparing quiz preview', 'error');
        }
    }

    async confirmPublishQuiz(quizData, quizId) {
        try {
            this.showLoading();

            console.log('=== FRONTEND DEBUG: Confirming quiz publish ===');
            console.log('Quiz ID:', quizId);
            console.log('Quiz data being sent:', JSON.stringify(quizData, null, 2));

            const response = await fetch(`/api/quizzes/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            console.log('=== FRONTEND DEBUG: Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('=== FRONTEND DEBUG: API Response result:', JSON.stringify(result, null, 2));

                this.showMessage('Quiz published successfully', 'success');

                // Update quiz status immediately in all places
                console.log('Calling updateQuizStatusImmediately with quizId:', quizId, 'status: published');
                this.updateQuizStatusImmediately(quizId, 'published');

                // Update button visibility in edit form
                const publishBtn = document.getElementById('publishQuizBtn');
                const saveToDraftBtn = document.getElementById('saveToDraftBtn');

                if (publishBtn) {
                    publishBtn.style.display = 'none';
                }
                if (saveToDraftBtn) {
                    saveToDraftBtn.style.display = 'flex';
                }

                // Navigate back to quiz list
                this.navigateToQuizPage();
                // Refresh quiz list (this will now show updated status)
                this.loadQuizData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                console.error('=== FRONTEND DEBUG: API Error:', error);
                this.showMessage(error.message || 'Failed to publish quiz', 'error');
            }
        } catch (error) {
            console.error('Error publishing quiz:', error);
            this.showMessage('Error publishing quiz', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveToDraft() {
        // Show confirmation dialog
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to save this quiz as a draft? Students will not be able to take this quiz until it is published.',
            'Save to Draft'
        );

        if (!confirmed) return;

        // First validate the form
        if (!this.validateEditQuizForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.field-error, .question-error, .option-error, .general-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Stop execution if validation fails
        }

        try {
            this.showLoading();

            const form = document.getElementById('editQuizForm');
            const formData = new FormData(form);
            const quizId = formData.get('quizId');

            console.log('Saving quiz to draft with ID:', quizId);

            // Get basic quiz info
            const title = formData.get('title');
            const className = formData.get('class');
            const subject = formData.get('subject');

            // Get schedule information
            const startTime = this.toIsoStringFromDateTimeLocal(formData.get('startTime'));
            const endTime = this.toIsoStringFromDateTimeLocal(formData.get('endTime'));
            const duration = parseInt(formData.get('duration')) || 60;

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
                startTime,
                endTime,
                duration,
                status: 'draft' // Set status to draft
            };

            console.log('=== FRONTEND DEBUG: Sending quiz data to API for draft ===');
            console.log('Quiz ID:', quizId);
            console.log('Quiz data being sent:', JSON.stringify(quizData, null, 2));

            const response = await fetch(`/api/quizzes/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizData)
            });

            console.log('=== FRONTEND DEBUG: Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('=== FRONTEND DEBUG: API Response result:', JSON.stringify(result, null, 2));

                this.showMessage('Quiz saved to draft successfully', 'success');

                // Update quiz status immediately in all places
                console.log('Calling updateQuizStatusImmediately with quizId:', quizId, 'status: draft');
                this.updateQuizStatusImmediately(quizId, 'draft');

                // Update button visibility in edit form
                const publishBtn = document.getElementById('publishQuizBtn');
                const saveToDraftBtn = document.getElementById('saveToDraftBtn');

                if (publishBtn) {
                    publishBtn.style.display = 'flex';
                }
                if (saveToDraftBtn) {
                    saveToDraftBtn.style.display = 'none';
                }

                // Navigate back to quiz list
                this.navigateToQuizPage();
                // Refresh quiz list (this will now show updated status)
                this.loadQuizData();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                console.error('=== FRONTEND DEBUG: API Error:', error);
                this.showMessage(error.message || 'Failed to save quiz to draft', 'error');
            }
        } catch (error) {
            console.error('Error saving quiz to draft:', error);
            this.showMessage('Error saving quiz to draft', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateQuizStatusImmediately(quizId, newStatus) {
        console.log(`Updating quiz ${quizId} status to ${newStatus} immediately`);

        // Helper function to update status badge, eye icon visibility, and edit button state
        const updateStatusBadge = (element, quizId, newStatus) => {
            if (element) {
                const statusBadge = element.querySelector('.quiz-status-badge');
                if (statusBadge) {
                    console.log('Found status badge, updating from:', statusBadge.innerHTML);
                    const newBadgeHTML = this.getQuizStatusBadge({ status: newStatus });
                    console.log('To:', newBadgeHTML);
                    statusBadge.innerHTML = newBadgeHTML;

                    // Update eye icon visibility based on status
                    const viewButton = element.querySelector('.btn-view-enhanced');
                    if (viewButton) {
                        if (newStatus === 'draft') {
                            viewButton.style.display = 'none';
                        } else {
                            viewButton.style.display = 'flex';
                        }
                    }

                    // Update edit button state based on quiz data
                    const editButton = element.querySelector('.btn-edit-enhanced');
                    if (editButton) {
                        // Get the quiz data to check if it's editable
                        const quizData = { status: newStatus };
                        // Try to get more quiz data from the element or current state
                        const quizId = element.getAttribute('data-quiz-id');
                        if (quizId) {
                            // For dynamic updates, we need to check the current time vs quiz times
                            // This is a simplified check - in a real implementation, you might want to fetch full quiz data
                            const isEditable = this.isQuizEditable(quizData);
                            if (isEditable) {
                                editButton.disabled = false;
                                editButton.style.opacity = '1';
                                editButton.style.cursor = 'pointer';
                                editButton.title = 'Edit Quiz';
                                editButton.setAttribute('onclick', `dashboard.editQuiz('${quizId}')`);
                            } else {
                                editButton.disabled = true;
                                editButton.style.opacity = '0.5';
                                editButton.style.cursor = 'not-allowed';
                                editButton.title = 'Cannot edit - quiz is active or expired';
                                editButton.removeAttribute('onclick');
                            }
                        }
                    }

                    return true;
                } else {
                    console.log('Element found but no status badge inside');
                }
            } else {
                console.log('Element not found');
            }
            return false;
        };

        let updatedCount = 0;

        // Update status badge in quiz list cards
        const quizCard = document.querySelector(`[data-quiz-id="${quizId}"]`);
        console.log('Looking for quiz card with ID:', quizId);
        if (updateStatusBadge(quizCard, quizId, newStatus)) {
            updatedCount++;
        }

        // Update status in dashboard recent quizzes
        const recentQuizzesContainer = document.getElementById('recentQuizzes');
        if (recentQuizzesContainer) {
            const recentQuizItem = recentQuizzesContainer.querySelector(`[data-quiz-id="${quizId}"]`);
            console.log('Looking for recent quiz item with ID:', quizId);
            if (updateStatusBadge(recentQuizItem, quizId, newStatus)) {
                updatedCount++;
            }
        }

        // Update status in any modal or overlay that might be showing the quiz
        const modalOverlays = document.querySelectorAll('.modal-overlay');
        modalOverlays.forEach((overlay, index) => {
            const statusBadge = overlay.querySelector('.quiz-status-badge');
            if (statusBadge) {
                // Check if this modal is for the specific quiz
                const modalTitle = overlay.querySelector('h3, h4');
                if (modalTitle && modalTitle.textContent.includes('Quiz')) {
                    console.log(`Found modal ${index} with quiz title, updating status`);
                    const newBadgeHTML = this.getQuizStatusBadge({ status: newStatus });
                    statusBadge.innerHTML = newBadgeHTML;

                    // Update eye icon visibility in modal
                    const viewButton = overlay.querySelector('.btn-view-enhanced');
                    if (viewButton) {
                        if (newStatus === 'draft') {
                            viewButton.style.display = 'none';
                        } else {
                            viewButton.style.display = 'flex';
                        }
                    }

                    // Update edit button state in modal
                    const editButton = overlay.querySelector('.btn-edit-enhanced');
                    if (editButton) {
                        const quizData = { status: newStatus };
                        const isEditable = this.isQuizEditable(quizData);
                        if (isEditable) {
                            editButton.disabled = false;
                            editButton.style.opacity = '1';
                            editButton.style.cursor = 'pointer';
                            editButton.title = 'Edit Quiz';
                            editButton.setAttribute('onclick', `dashboard.editQuiz('${quizId}')`);
                        } else {
                            editButton.disabled = true;
                            editButton.style.opacity = '0.5';
                            editButton.style.cursor = 'not-allowed';
                            editButton.title = 'Cannot edit - quiz is active or expired';
                            editButton.removeAttribute('onclick');
                        }
                    }

                    updatedCount++;
                }
            }
        });

        // Update status in edit form if it's currently open
        const editQuizId = document.getElementById('editQuizId');
        if (editQuizId && editQuizId.value === quizId) {
            console.log('Edit form is open for this quiz, hiding publish button');
            const publishBtn = document.getElementById('publishQuizBtn');
            if (publishBtn) {
                if (newStatus === 'published') {
                    publishBtn.style.display = 'none';
                } else {
                    publishBtn.style.display = 'flex';
                }
                updatedCount++;
            }
        }

        // Update any status badges in the current page (fallback)
        const allStatusBadges = document.querySelectorAll('.quiz-status-badge');
        console.log(`Found ${allStatusBadges.length} total status badges on page`);
        allStatusBadges.forEach((badge, index) => {
            // Check if this badge is related to the updated quiz
            const parentCard = badge.closest('[data-quiz-id]');
            if (parentCard && parentCard.getAttribute('data-quiz-id') === quizId) {
                console.log(`Found matching badge ${index}, updating`);
                const newBadgeHTML = this.getQuizStatusBadge({ status: newStatus });
                badge.innerHTML = newBadgeHTML;

                // Update eye icon visibility
                const viewButton = parentCard.querySelector('.btn-view-enhanced');
                if (viewButton) {
                    if (newStatus === 'draft') {
                        viewButton.style.display = 'none';
                    } else {
                        viewButton.style.display = 'flex';
                    }
                }

                // Update edit button state
                const editButton = parentCard.querySelector('.btn-edit-enhanced');
                if (editButton) {
                    const quizData = { status: newStatus };
                    const isEditable = this.isQuizEditable(quizData);
                    if (isEditable) {
                        editButton.disabled = false;
                        editButton.style.opacity = '1';
                        editButton.style.cursor = 'pointer';
                        editButton.title = 'Edit Quiz';
                        editButton.setAttribute('onclick', `dashboard.editQuiz('${quizId}')`);
                    } else {
                        editButton.disabled = true;
                        editButton.style.opacity = '0.5';
                        editButton.style.cursor = 'not-allowed';
                        editButton.title = 'Cannot edit - quiz is active or expired';
                        editButton.removeAttribute('onclick');
                    }
                }

                updatedCount++;
            }
        });

        console.log(`Status update completed. Updated ${updatedCount} elements for quiz ${quizId}`);
    }

    validateEditQuizForm() {
        const form = document.getElementById('editQuizForm');

        // Clear all previous error messages
        this.clearAllErrorMessages();

        let isValid = true;
        let firstInvalidField = null;

        // Validate title
        const title = form.querySelector('#editQuizTitle').value.trim();
        if (!title) {
            this.showFieldError(form.querySelector('#editQuizTitle'), 'Title is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizTitle');
        }

        // Validate subject
        const subject = form.querySelector('#editQuizSubject').value.trim();
        if (!subject) {
            this.showFieldError(form.querySelector('#editQuizSubject'), 'Subject is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizSubject');
        }

        // Validate class
        const className = form.querySelector('#editQuizClass').value;
        if (!className) {
            this.showFieldError(form.querySelector('#editQuizClass'), 'Class is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizClass');
        }

        // Validate duration
        const duration = form.querySelector('#editQuizDuration').value;
        if (!duration) {
            this.showFieldError(form.querySelector('#editQuizDuration'), 'Duration is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizDuration');
        }

        // Validate start date & time
        const startTime = form.querySelector('#editQuizStartTime').value;
        if (!startTime) {
            this.showFieldError(form.querySelector('#editQuizStartTime'), 'Start date & time is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizStartTime');
        }

        // Validate end date & time
        const endTime = form.querySelector('#editQuizEndTime').value;
        if (!endTime) {
            this.showFieldError(form.querySelector('#editQuizEndTime'), 'End date & time is required');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = form.querySelector('#editQuizEndTime');
        }

        // Validate start and end time logic
        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            this.showGeneralError('End time must be after start time');
            isValid = false;
        }

        // Validate questions
        const questionElements = form.querySelectorAll('.question-item');
        if (questionElements.length === 0) {
            this.showGeneralError('At least one question is required');
            isValid = false;
        }

        // Validate each question
        questionElements.forEach((questionEl, index) => {
            const questionText = questionEl.querySelector('input[name^="question"]').value.trim();
            const options = Array.from(questionEl.querySelectorAll('input[name^="options"]')).map(input => input.value.trim());
            const correctOption = questionEl.querySelector('select').value;

            if (!questionText) {
                this.showQuestionError(questionEl, `Question ${index + 1} text is required`);
                isValid = false;
            }

            // Check if all options are provided
            if (options.some(option => !option)) {
                this.showQuestionError(questionEl, `All options for Question ${index + 1} are required`);
                isValid = false;
            }

            // Check if correct answer is selected
            if (!correctOption) {
                this.showQuestionError(questionEl, `Correct answer for Question ${index + 1} is required`);
                isValid = false;
            }
        });

        // Auto-focus first invalid field
        if (firstInvalidField) {
            firstInvalidField.focus();
        }

        return isValid;
    }

    async viewQuiz(quizId) {
        try {
            this.showLoading();
            await this.loadQuizDetailsView(quizId);
        } catch (error) {
            console.error('Error loading quiz details:', error);
            const message = error && error.message ? error.message : 'Failed to load quiz details';
            this.showMessage(message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadQuizDetailsView(quizId) {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showMessage('Please log in again', 'error');
            return;
        }
        const response = await fetch(`/api/quizzes/attempt-tracking/${quizId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            let message = 'Failed to load quiz details';
            try {
                const err = await response.json();
                message = err.message || message;
            } catch (_) {
                message = `Request failed (${response.status}). Please try again.`;
            }
            console.error('Quiz details error:', response.status, message);
            throw new Error(message);
        }
        let data;
        try {
            data = await response.json();
        } catch (_) {
            throw new Error('Invalid response from server');
        }
        if (!data || !data.quiz) {
            throw new Error('Invalid response from server');
        }
        this.currentQuizDetailsData = data;

        document.getElementById('quizListView').style.display = 'none';
        document.getElementById('quizDetailsView').style.display = 'block';

        document.getElementById('quizDetailsTitle').textContent = data.quiz.title;
        document.getElementById('quizDetailsSubtitle').textContent = `${data.quiz.class} • ${data.quiz.subject}`;

        document.getElementById('quizDetailsTotalStudents').textContent = data.totalStudents;
        document.getElementById('quizDetailsAttempted').textContent = data.attemptedCount;
        document.getElementById('quizDetailsNotAttempted').textContent = data.notAttemptedCount;

        document.getElementById('attemptedSectionCount').textContent = data.attemptedCount;
        document.getElementById('notAttemptedSectionCount').textContent = data.notAttemptedCount;

        this.renderQuizDetailsAttempted(data.attempted || []);
        this.renderQuizDetailsNotAttempted(data.notAttempted || []);

        const attemptedSection = document.getElementById('quizDetailsAttemptedSection');
        const notAttemptedSection = document.getElementById('quizDetailsNotAttemptedSection');
        const allDoneEl = document.getElementById('quizDetailsAllDone');

        if (data.notAttemptedCount === 0 && data.totalStudents > 0) {
            attemptedSection.style.display = 'block';
            notAttemptedSection.style.display = 'none';
            allDoneEl.style.display = 'flex';
        } else {
            attemptedSection.style.display = 'block';
            notAttemptedSection.style.display = 'block';
            allDoneEl.style.display = 'none';
        }

        document.getElementById('quizDetailsAttemptedEmpty').style.display = (data.attempted || []).length === 0 ? 'block' : 'none';
        document.getElementById('quizDetailsNotAttemptedEmpty').style.display = (data.notAttempted || []).length === 0 ? 'block' : 'none';

        document.getElementById('quizDetailsStudentSearch').value = '';
        document.querySelectorAll('.quiz-details-filter .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
        this.applyQuizDetailsFilter();
    }

    applyQuizDetailsFilter() {
        const searchInput = document.getElementById('quizDetailsStudentSearch');
        const query = (searchInput?.value || '').trim().toLowerCase();
        const activeFilter = document.querySelector('.quiz-details-filter .filter-btn.active')?.dataset.filter || 'all';

        const attemptedSection = document.getElementById('quizDetailsAttemptedSection');
        const notAttemptedSection = document.getElementById('quizDetailsNotAttemptedSection');

        if (attemptedSection) {
            attemptedSection.style.display = (activeFilter === 'all' || activeFilter === 'attempted') ? 'block' : 'none';
        }
        if (notAttemptedSection) {
            notAttemptedSection.style.display = (activeFilter === 'all' || activeFilter === 'not-attempted') ? 'block' : 'none';
        }

        document.querySelectorAll('.quiz-details-sections .student-row').forEach(row => {
            const name = row.dataset.name || '';
            const status = row.dataset.status || '';
            const matchesSearch = !query || name.includes(query);
            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'attempted' && status === 'attempted') ||
                (activeFilter === 'not-attempted' && status === 'not-attempted');
            row.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    }

    renderQuizDetailsAttempted(attempted) {
        const tbody = document.getElementById('quizDetailsAttemptedBody');
        const formatAttemptTime = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
        tbody.innerHTML = attempted.map(row => {
            const totalMarks = row.totalMarks != null ? row.totalMarks : 0;
            const studentIdStr = (row.studentId && row.studentId._id ? row.studentId._id : row.studentId || '').toString();
            return `
            <tr class="student-row" data-status="attempted" data-name="${(row.fullName || '').toLowerCase()}">
                <td data-label="Student Name">${this.escapeHtml(row.fullName || '—')}</td>
                <td data-label="Score">${row.score != null ? `${row.score} / ${totalMarks || '?'}` : '—'}</td>
                <td data-label="Attempt Time">${formatAttemptTime(row.attemptedAt)}</td>
                <td data-label="Status"><span class="status-badge status-attempted">Attempted</span></td>
                <td data-label="Action" class="td-actions">
                    <button type="button" class="btn-view-quiz-details" data-student-id="${this.escapeHtml(studentIdStr)}" title="View result">
                        View Details
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    renderQuizDetailsNotAttempted(notAttempted) {
        const tbody = document.getElementById('quizDetailsNotAttemptedBody');
        tbody.innerHTML = notAttempted.map(row => `
            <tr class="student-row" data-status="not-attempted" data-name="${(row.fullName || '').toLowerCase()}">
                <td data-label="Student Name">${this.escapeHtml(row.fullName || '—')}</td>
                <td data-label="Status"><span class="status-badge status-not-attempted">Not Attempted</span></td>
            </tr>
        `).join('');
    }

    openStudentQuizResult(data) {
        const resultView = document.getElementById('quizStudentResultView');
        const detailsView = document.getElementById('quizDetailsView');
        if (!resultView || !detailsView) return;
        const quiz = this.currentQuizDetailsData?.quiz || {};
        document.getElementById('quizStudentResultQuizTitle').textContent = quiz.title || 'Quiz';
        document.getElementById('quizStudentResultSubtitle').textContent = [quiz.class, quiz.subject].filter(Boolean).join(' • ') || '—';
        document.getElementById('quizStudentResultStudentName').textContent = data.fullName || 'Student';
        document.getElementById('quizStudentResultScore').textContent = `${data.score ?? '—'} / ${data.totalMarks ?? '—'}`;
        document.getElementById('quizStudentResultPercentage').textContent = (data.percentage != null ? `${data.percentage}%` : '—');
        const attemptTime = data.attemptedAt ? new Date(data.attemptedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
        document.getElementById('quizStudentResultAttemptTime').textContent = attemptTime;
        detailsView.style.display = 'none';
        resultView.style.display = 'block';
    }

    backToQuizDetailsFromResult() {
        const resultView = document.getElementById('quizStudentResultView');
        const detailsView = document.getElementById('quizDetailsView');
        if (resultView) resultView.style.display = 'none';
        if (detailsView) detailsView.style.display = 'block';
    }

    backToQuizListFromDetails() {
        document.getElementById('quizDetailsView').style.display = 'none';
        const resultView = document.getElementById('quizStudentResultView');
        if (resultView) resultView.style.display = 'none';
        document.getElementById('quizListView').style.display = 'block';
        this.currentQuizDetailsData = null;
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

        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Create a map of available data for easy lookup
        const availabilityMap = {};
        if (weeklyAvailability && weeklyAvailability.length > 0) {
            weeklyAvailability.forEach(slot => {
                availabilityMap[slot.day] = slot;
            });
        }

        // Generate display for all days, using empty data if not available
        const displayData = dayOrder.map(day => {
            const slot = availabilityMap[day];
            if (slot) {
                return {
                    day,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    hasData: true
                };
            } else {
                return {
                    day,
                    startTime: '',
                    endTime: '',
                    hasData: false
                };
            }
        });

        container.innerHTML = displayData.map(slot => `
            <div class="weekly-slot" data-day="${slot.day}">
                <div class="day-name">${this.capitalizeFirst(slot.day)}</div>
                <div class="time-range-display">${slot.hasData ? `${this.formatTimeInTeacherTimezone(slot.startTime)} - ${this.formatTimeInTeacherTimezone(slot.endTime)}` : 'Not set'}</div>
                <div class="time-range-edit" style="display: none;">
                    <input type="text" class="time-input-start" value="${slot.hasData ? this.formatTime24Hour(slot.startTime) : ''}" placeholder="HH:MM">
                    <span class="time-separator">-</span>
                    <input type="text" class="time-input-end" value="${slot.hasData ? this.formatTime24Hour(slot.endTime) : ''}" placeholder="HH:MM">
                </div>
                <div class="slot-actions">
                    <button class="edit-slot-btn" onclick="dashboard.editWeeklySlot('${slot.day}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="save-slot-btn" onclick="dashboard.saveWeeklySlot('${slot.day}')" style="display: none;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="clear-slot-btn" onclick="dashboard.clearWeeklySlot('${slot.day}')">
                        <i class="fas fa-eraser"></i>
                    </button>
                    <button class="cancel-slot-btn" onclick="dashboard.cancelEditSlot('${slot.day}')" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('') + `
            <div class="weekly-actions">
                <button class="btn-primary" onclick="dashboard.saveAllWeeklyChanges()">
                    <i class="fas fa-save"></i> Save All Changes
                </button>
            </div>
        `;
    }

    editWeeklySlot(day) {
        const slot = document.querySelector(`.weekly-slot[data-day="${day}"]`);
        if (!slot) return;

        const displayDiv = slot.querySelector('.time-range-display');
        const editDiv = slot.querySelector('.time-range-edit');
        const editBtn = slot.querySelector('.edit-slot-btn');
        const saveBtn = slot.querySelector('.save-slot-btn');
        const clearBtn = slot.querySelector('.clear-slot-btn');
        const cancelBtn = slot.querySelector('.cancel-slot-btn');

        // Store original value for potential cancel
        slot.dataset.originalDisplay = displayDiv.textContent;

        // Show edit mode
        displayDiv.style.display = 'none';
        editDiv.style.display = 'flex';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'flex';
        clearBtn.style.display = 'none';
        cancelBtn.style.display = 'flex';

        // Focus on start time input
        const startInput = editDiv.querySelector('.time-input-start');
        if (startInput) {
            startInput.focus();
            if (startInput.value) {
                startInput.select();
            }
        }
    }

    async saveWeeklySlot(day) {
        const slot = document.querySelector(`.weekly-slot[data-day="${day}"]`);
        if (!slot) return;

        const editDiv = slot.querySelector('.time-range-edit');
        const startInput = editDiv.querySelector('.time-input-start');
        const endInput = editDiv.querySelector('.time-input-end');

        const startTime = startInput.value.trim();
        const endTime = endInput.value.trim();

        // Validate time format
        const timePattern = /^([0-2][0-9]):([0-5][0-9])$/;
        if (startTime && !timePattern.test(startTime)) {
            this.showMessage('Please enter start time in HH:MM format (24-hour)', 'error');
            startInput.focus();
            return;
        }
        if (endTime && !timePattern.test(endTime)) {
            this.showMessage('Please enter end time in HH:MM format (24-hour)', 'error');
            endInput.focus();
            return;
        }

        // Validate time logic
        if (startTime && endTime && startTime >= endTime) {
            this.showMessage('End time must be greater than start time', 'error');
            endInput.focus();
            return;
        }

        try {
            this.showLoading();

            // Get current availability data
            const slots = document.querySelectorAll('.weekly-slot[data-day]');
            const weeklyAvailability = [];

            slots.forEach(slot => {
                const slotDay = slot.dataset.day;
                const slotDisplayDiv = slot.querySelector('.time-range-display');
                const slotTimeText = slotDisplayDiv.textContent;

                // For the current slot being saved, use the new values
                if (slotDay === day && startTime && endTime) {
                    weeklyAvailability.push({
                        day: slotDay,
                        startTime,
                        endTime
                    });
                } else if (slotTimeText !== 'Not set' && slotTimeText && slotTimeText.trim() !== '') {
                    // For other slots, use existing values
                    const [existingStartTime, existingEndTime] = slotTimeText.split(' - ').map(time => {
                        return this.formatTime24Hour(time.trim());
                    });

                    if (existingStartTime && existingEndTime && existingStartTime !== '' && existingEndTime !== '') {
                        weeklyAvailability.push({
                            day: slotDay,
                            startTime: existingStartTime,
                            endTime: existingEndTime
                        });
                    }
                }
            });

            // Save to database
            const response = await fetch('/api/teacher-availability/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ weeklyAvailability })
            });

            if (response.ok) {
                const result = await response.json();

                // Update the display with the saved time
                const displayDiv = slot.querySelector('.time-range-display');
                if (startTime && endTime) {
                    displayDiv.textContent = `${this.formatTimeInTeacherTimezone(startTime)} - ${this.formatTimeInTeacherTimezone(endTime)}`;
                } else {
                    displayDiv.textContent = 'Not set';
                }

                // Exit edit mode
                this.cancelEditSlot(day);

                // Update the entire display with server response to ensure consistency
                if (result.availability && result.availability.weeklyAvailability) {
                    this.updateWeeklyAvailabilityDisplay(result.availability.weeklyAvailability);
                }

                this.showMessage(`${this.capitalizeFirst(day)} schedule saved successfully`, 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to save schedule', 'error');
            }
        } catch (error) {
            console.error('Error saving weekly slot:', error);
            this.showMessage('Error saving schedule', 'error');
        } finally {
            this.hideLoading();
        }
    }

    cancelEditSlot(day) {
        const slot = document.querySelector(`.weekly-slot[data-day="${day}"]`);
        if (!slot) return;

        const displayDiv = slot.querySelector('.time-range-display');
        const editDiv = slot.querySelector('.time-range-edit');
        const editBtn = slot.querySelector('.edit-slot-btn');
        const saveBtn = slot.querySelector('.save-slot-btn');
        const clearBtn = slot.querySelector('.clear-slot-btn');
        const cancelBtn = slot.querySelector('.cancel-slot-btn');
        const startInput = editDiv.querySelector('.time-input-start');
        const endInput = editDiv.querySelector('.time-input-end');

        // Restore original display value
        if (slot.dataset.originalDisplay) {
            displayDiv.textContent = slot.dataset.originalDisplay;

            // Restore input values based on original display
            if (slot.dataset.originalDisplay === 'Not set') {
                startInput.value = '';
                endInput.value = '';
            } else {
                const times = slot.dataset.originalDisplay.split(' - ');
                if (times.length === 2) {
                    startInput.value = this.formatTime24Hour(times[0].trim());
                    endInput.value = this.formatTime24Hour(times[1].trim());
                }
            }
        }

        // Hide edit mode
        displayDiv.style.display = 'block';
        editDiv.style.display = 'none';
        editBtn.style.display = 'flex';
        saveBtn.style.display = 'none';
        clearBtn.style.display = 'flex';
        cancelBtn.style.display = 'none';

        // Clear stored original value
        delete slot.dataset.originalDisplay;
    }

    async clearWeeklySlot(day) {
        const slot = document.querySelector(`.weekly-slot[data-day="${day}"]`);
        if (!slot) return;

        try {
            this.showLoading();

            // Get current availability data and remove the specified day
            const slots = document.querySelectorAll('.weekly-slot[data-day]');
            const weeklyAvailability = [];

            slots.forEach(slot => {
                const slotDay = slot.dataset.day;
                const slotDisplayDiv = slot.querySelector('.time-range-display');
                const slotTimeText = slotDisplayDiv.textContent;

                // Skip the day being cleared
                if (slotDay === day) {
                    return;
                }

                // Include other slots that have time data
                if (slotTimeText !== 'Not set' && slotTimeText && slotTimeText.trim() !== '') {
                    const [existingStartTime, existingEndTime] = slotTimeText.split(' - ').map(time => {
                        return this.formatTime24Hour(time.trim());
                    });

                    if (existingStartTime && existingEndTime && existingStartTime !== '' && existingEndTime !== '') {
                        weeklyAvailability.push({
                            day: slotDay,
                            startTime: existingStartTime,
                            endTime: existingEndTime
                        });
                    }
                }
            });

            // Save to database
            const response = await fetch('/api/teacher-availability/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ weeklyAvailability })
            });

            if (response.ok) {
                const result = await response.json();

                // Update the display to show "Not set"
                const displayDiv = slot.querySelector('.time-range-display');
                const editDiv = slot.querySelector('.time-range-edit');
                const startInput = editDiv.querySelector('.time-input-start');
                const endInput = editDiv.querySelector('.time-input-end');

                displayDiv.textContent = 'Not set';
                startInput.value = '';
                endInput.value = '';

                // Update the entire display with server response to ensure consistency
                if (result.availability && result.availability.weeklyAvailability) {
                    this.updateWeeklyAvailabilityDisplay(result.availability.weeklyAvailability);
                }

                this.showMessage(`${this.capitalizeFirst(day)} schedule cleared successfully`, 'info');
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to clear schedule', 'error');
            }
        } catch (error) {
            console.error('Error clearing weekly slot:', error);
            this.showMessage('Error clearing schedule', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveAllWeeklyChanges() {
        const slots = document.querySelectorAll('.weekly-slot[data-day]');
        const weeklyAvailability = [];

        slots.forEach(slot => {
            const day = slot.dataset.day;
            const displayDiv = slot.querySelector('.time-range-display');
            const timeText = displayDiv.textContent;

            // Only save days that have actual time data (not "Not set")
            if (timeText !== 'Not set' && timeText && timeText.trim() !== '') {
                // Parse the time range from display
                const [startTime, endTime] = timeText.split(' - ').map(time => {
                    // Convert from display format back to 24-hour format
                    return this.formatTime24Hour(time.trim());
                });

                // Only add to array if both times are valid
                if (startTime && endTime && startTime !== '' && endTime !== '') {
                    weeklyAvailability.push({
                        day,
                        startTime,
                        endTime
                    });
                }
            }
        });

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
                const result = await response.json();
                this.showMessage('Weekly schedule saved successfully', 'success');

                // Update the display with the saved data from the server response
                if (result.availability && result.availability.weeklyAvailability) {
                    this.updateWeeklyAvailabilityDisplay(result.availability.weeklyAvailability);
                } else {
                    // Fallback: reload from server
                    await this.loadWeeklyAvailability();
                }
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to save weekly schedule', 'error');
            }
        } catch (error) {
            console.error('Error saving weekly availability:', error);
            this.showMessage('Error saving weekly schedule', 'error');
        } finally {
            this.hideLoading();
        }
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
        document.getElementById('profileEmail').textContent = teacher.email || '';
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
                profileImageUrl = `${this.getServerUrl()}${profileImageUrl}`;
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


    // Student Management Functions
    async loadStudentsData() {
        try {
            this.showLoading();

            const response = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
                        <img src="${student.profileImage || `https://picsum.photos/seed/${student._id}/48/48.jpg`}" alt="${student.fullName}" class="student-avatar">
                        <div class="student-details">
                            <h3 class="student-name">${student.fullName}</h3>
                            <div class="student-meta">
                                <div class="student-meta-item">
                                    <i class="fas fa-id-card"></i>
                                    <span>${student.userId || 'N/A'}</span>
                                </div>
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
            <div class="modal-content modal-wide">
                <div class="modal-header-clean">
                    <h3>Edit Student</h3>
                    <button class="modal-close-clean" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editStudentForm" enctype="multipart/form-data" novalidate>
                    <div class="form-wide-grid">
                        <!-- Basic Info Section -->
                        <div class="form-section">
                            <h4 class="section-title-clean">Basic Info</h4>
                            <div class="form-row-wide">
                                <div class="form-field-clean" style="display: none;">
                                    <label for="editUserId">User ID</label>
                                    <input type="text" name="userId" id="editUserId" value="${student._id || student.userId}" data-required="true" readonly>
                                </div>
                                <div class="form-field-clean">
                                    <label for="editStudentId">Student ID</label>
                                    <input type="text" id="editStudentId" value="${student.userId || 'N/A'}" readonly style="background: #f8fafc; color: #64748b;">
                                    <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">Student ID (read-only)</small>
                                </div>
                                <div class="form-field-clean required">
                                    <label for="editFullName">Full Name</label>
                                    <input type="text" name="fullName" id="editFullName" value="${student.fullName || ''}" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                                <div class="form-field-clean required">
                                    <label for="editEmail">Email</label>
                                    <input type="email" name="email" id="editEmail" value="${student.email || ''}" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                            </div>
                            <div class="form-row-wide">
                                <div class="form-field-clean required">
                                    <label for="editAge">Age</label>
                                    <input type="number" name="age" id="editAge" value="${student.age || ''}" min="1" max="120" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                                <div class="form-field-clean">
                                    <!-- Empty field for balance -->
                                </div>
                                <div class="form-field-clean">
                                    <!-- Empty field for balance -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contact Info Section -->
                        <div class="form-section">
                            <h4 class="section-title-clean">Contact Info</h4>
                            <div class="form-row-wide">
                                <div class="form-field-clean required">
                                    <label for="editMobileNo">Mobile</label>
                                    <input type="tel" name="mobileNo" id="editMobileNo" value="${student.mobileNo || student.phone || ''}" placeholder="10-digit number" maxlength="10" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                                <div class="form-field-clean required">
                                    <label for="editCity">City</label>
                                    <input type="text" name="city" id="editCity" value="${student.city || ''}" placeholder="City" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                                <div class="form-field-clean required">
                                    <label for="editState">State</label>
                                    <input type="text" name="state" id="editState" value="${student.state || ''}" placeholder="State" data-required="true">
                                    <span class="error-message" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Academic Info Section -->
                        <div class="form-section">
                            <h4 class="section-title-clean">Academic Info</h4>
                            <div class="form-row-wide">
                                <div class="form-field-clean">
                                    <label for="editClass">Class</label>
                                    <input type="text" name="class" id="editClass" value="${student.class || student.grade || ''}" placeholder="e.g., 10th Grade">
                                </div>
                                <div class="form-field-clean">
                                    <label for="editTimezone">Timezone</label>
                                    <select name="timezone" id="editTimezone">
                                        <option value="">Select Timezone</option>
                                        <option value="Asia/Kolkata" ${student.timezone === 'Asia/Kolkata' ? 'selected' : ''}>India - Asia/Kolkata</option>
                                        <option value="America/New_York" ${student.timezone === 'America/New_York' ? 'selected' : ''}>USA East - America/New_York</option>
                                        <option value="America/Los_Angeles" ${student.timezone === 'America/Los_Angeles' ? 'selected' : ''}>USA West - America/Los_Angeles</option>
                                        <option value="America/Chicago" ${student.timezone === 'America/Chicago' ? 'selected' : ''}>USA Central - America/Chicago</option>
                                        <option value="America/Denver" ${student.timezone === 'America/Denver' ? 'selected' : ''}>USA Mountain - America/Denver</option>
                                        <option value="Europe/London" ${student.timezone === 'Europe/London' ? 'selected' : ''}>UK - Europe/London</option>
                                        <option value="Europe/Paris" ${student.timezone === 'Europe/Paris' ? 'selected' : ''}>France - Europe/Paris</option>
                                        <option value="Europe/Berlin" ${student.timezone === 'Europe/Berlin' ? 'selected' : ''}>Germany - Europe/Berlin</option>
                                        <option value="Europe/Moscow" ${student.timezone === 'Europe/Moscow' ? 'selected' : ''}>Russia - Europe/Moscow</option>
                                        <option value="Asia/Tokyo" ${student.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Japan - Asia/Tokyo</option>
                                        <option value="Asia/Shanghai" ${student.timezone === 'Asia/Shanghai' ? 'selected' : ''}>China - Asia/Shanghai</option>
                                        <option value="Asia/Hong_Kong" ${student.timezone === 'Asia/Hong_Kong' ? 'selected' : ''}>Hong Kong - Asia/Hong_Kong</option>
                                        <option value="Asia/Singapore" ${student.timezone === 'Asia/Singapore' ? 'selected' : ''}>Singapore - Asia/Singapore</option>
                                        <option value="Asia/Dubai" ${student.timezone === 'Asia/Dubai' ? 'selected' : ''}>UAE - Asia/Dubai</option>
                                        <option value="Australia/Sydney" ${student.timezone === 'Australia/Sydney' ? 'selected' : ''}>Australia East - Australia/Sydney</option>
                                        <option value="Australia/Melbourne" ${student.timezone === 'Australia/Melbourne' ? 'selected' : ''}>Australia - Australia/Melbourne</option>
                                        <option value="Australia/Perth" ${student.timezone === 'Australia/Perth' ? 'selected' : ''}>Australia West - Australia/Perth</option>
                                        <option value="Pacific/Auckland" ${student.timezone === 'Pacific/Auckland' ? 'selected' : ''}>New Zealand - Pacific/Auckland</option>
                                        <option value="America/Toronto" ${student.timezone === 'America/Toronto' ? 'selected' : ''}>Canada - America/Toronto</option>
                                        <option value="America/Vancouver" ${student.timezone === 'America/Vancouver' ? 'selected' : ''}>Canada West - America/Vancouver</option>
                                        <option value="America/Mexico_City" ${student.timezone === 'America/Mexico_City' ? 'selected' : ''}>Mexico - America/Mexico_City</option>
                                        <option value="America/Sao_Paulo" ${student.timezone === 'America/Sao_Paulo' ? 'selected' : ''}>Brazil - America/Sao_Paulo</option>
                                        <option value="Europe/Rome" ${student.timezone === 'Europe/Rome' ? 'selected' : ''}>Italy - Europe/Rome</option>
                                        <option value="Europe/Madrid" ${student.timezone === 'Europe/Madrid' ? 'selected' : ''}>Spain - Europe/Madrid</option>
                                        <option value="Asia/Seoul" ${student.timezone === 'Asia/Seoul' ? 'selected' : ''}>South Korea - Asia/Seoul</option>
                                        <option value="Asia/Bangkok" ${student.timezone === 'Asia/Bangkok' ? 'selected' : ''}>Thailand - Asia/Bangkok</option>
                                        <option value="Asia/Jakarta" ${student.timezone === 'Asia/Jakarta' ? 'selected' : ''}>Indonesia - Asia/Jakarta</option>
                                        <option value="Africa/Cairo" ${student.timezone === 'Africa/Cairo' ? 'selected' : ''}>Egypt - Africa/Cairo</option>
                                        <option value="Africa/Johannesburg" ${student.timezone === 'Africa/Johannesburg' ? 'selected' : ''}>South Africa - Africa/Johannesburg</option>
                                    </select>
                                </div>
                                <div class="form-field-clean">
                                    <!-- Empty field for balance -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profile Image Section -->
                        <div class="form-section">
                            <h4 class="section-title-clean">Profile Image</h4>
                            <div class="form-row-wide">
                                <div class="form-field-clean">
                                    <label>Profile Image</label>
                                    <div class="profile-upload-compact">
                                        <img src="${student.profileImage || ''}" alt="Profile" class="profile-image-circle" id="editProfilePreview">
                                        <div class="upload-icon-overlay" onclick="document.getElementById('editProfileImageInput').click()">
                                            <i class="fas fa-upload"></i>
                                        </div>
                                        <input type="file" name="image" id="editProfileImageInput" accept="image/*">
                                    </div>
                                </div>
                                <div class="form-field-clean">
                                    <!-- Empty field for balance -->
                                </div>
                                <div class="form-field-clean">
                                    <!-- Empty field for balance -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="form-actions-clean">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary-clean">Update Student</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Set timezone dropdown value explicitly after modal is added to DOM
        const editTimezoneSelect = document.getElementById('editTimezone');
        if (editTimezoneSelect && student.timezone) {
            editTimezoneSelect.value = student.timezone;
        }

        // Add image preview functionality for edit modal
        const editProfileInput = document.getElementById('editProfileImageInput');
        const editProfilePreview = document.getElementById('editProfilePreview');

        if (editProfileInput && editProfilePreview) {
            editProfileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        editProfilePreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Add form submit event listener
        modal.querySelector('#editStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateEditStudentForm()) {
                this.updateStudent();
            }
        });

        // Add validation event listeners
        this.setupEditStudentValidation();
    }

    async deleteStudent(studentId) {
        this.showDeleteStudentModal(studentId);
    }

    showDeleteStudentModal(studentId) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-width: 320px;
                width: 90%;
                text-align: center;
            ">
                <div style="
                    color: #dc3545;
                    font-size: 18px;
                    margin-bottom: 16px;
                    font-weight: 500;
                ">Delete Student?</div>
                <div style="
                    color: #6c757d;
                    font-size: 14px;
                    margin-bottom: 24px;
                    line-height: 1.4;
                ">Are you sure you want to delete this student? This action cannot be undone.</div>
                <div style="
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                ">
                    <button onclick="this.closest('.modal').remove()" style="
                        padding: 8px 16px;
                        border: 1px solid #dee2e6;
                        background: white;
                        color: #6c757d;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button onclick="dashboard.confirmDeleteStudent('${studentId}', this.closest('.modal'))" style="
                        padding: 8px 16px;
                        border: none;
                        background: #dc3545;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async confirmDeleteStudent(studentId, modal) {
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
                this.showMessage(result.message || 'Student deleted successfully', 'success');
                await this.loadStudentsData(); // Reload students list
                modal.remove();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete student', 'error');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showMessage('Error deleting student', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Session Management Functions
    async loadSessionsData(page = 1, limit = 5) {
        try {
            this.showLoading();

            // Add cache-busting timestamp
            const timestamp = new Date().getTime();
            console.log('Loading sessions data at:', new Date());

            // Load teacher sessions with pagination
            const response = await fetch(`/api/sessions/teacher?page=${page}&limit=${limit}&_t=${timestamp}`, {
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
                            const slotResponse = await fetch(`/api/sessions/${session._id}/details?_t=${timestamp}`, {
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

                // Debug: Log each session's date and status
                sessionsWithSlots.forEach((session, index) => {
                    console.log(`Session ${index + 1}:`, {
                        title: session.title,
                        date: session.date,
                        status: this.getSessionStatus(session)
                    });
                });

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
                <div style="text-align: center; padding: 60px 20px; background: white; border: 1px solid #e3f2fd; border-radius: 8px; grid-column: 1 / -1;">
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

        // Create grid container with responsive 2-column layout
        const sessionsHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;">
                ${sessions.map(session => {
            const availableSlots = session.availableSlots || [];
            const bookedSlots = session.bookedSlots || [];
            const totalSlots = availableSlots.length + bookedSlots.length;
            const availableCount = totalSlots - bookedSlots.length;
            const status = this.getSessionStatus(session);
            const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots.length / totalSlots) * 100) : 0;

            return `
                        <div class="session-item" data-session-id="${session._id}" style="background: white; border: 1px solid #e3f2fd; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); height: fit-content;">
                            <!-- Session Header -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e3f2fd;">
                                <div>
                                    <h3 style="margin: 0; color: #1976d2; font-size: 18px; font-weight: 500;">${session.title || 'Untitled Session'}</h3>
                                    <p style="margin: 4px 0 0 0; color: #546e7a; font-size: 14px;">${this.formatSessionDate(session.date)}</p>
                                    ${session.type === 'personal' && session.studentName ? `
                                        <p style="margin: 4px 0 0 0; color: #1976d2; font-size: 13px; font-weight: 500;">
                                            👤 ${session.studentName}
                                        </p>
                                    ` : session.type === 'common' ? `
                                        <p style="margin: 4px 0 0 0; color: #4caf50; font-size: 13px; font-weight: 500;">
                                            <span style="background: #e8f5e8; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">All Students</span>
                                           
                                        </p>
                                    ` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <span class="session-status ${status}">
                                        ${status.toUpperCase()}
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
                                    <span style="color: #1976d2;">⏱</span> ${this.formatSessionDuration(session.sessionDuration)}
                                </span>
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #1976d2;">☕</span> ${session.breakDuration || 5} min break
                                </span>
                            </div>
                            
                            <!-- Slots Preview -->
                            <div style="margin-bottom: 16px;">
                                ${this.generateUnifiedSlotsView(availableSlots, bookedSlots, session.date, session._id, session.type, session.allowedStudentId)}
                            </div>
                            
                            <!-- Actions -->
                            <div style="display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e3f2fd;">
                                <button onclick="dashboard.deleteSession('${session._id}')" style="background: white; color: #1976d2; border: 1px solid #1976d2; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

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

        console.log('Session date:', session.date, 'Session date object:', sessionDate, 'Today:', today, 'Comparison:', sessionDate < today);

        if (sessionDate < today) {
            return 'expired';
        } else {
            return 'active';
        }
    }

    generateUnifiedSlotsView(availableSlots, bookedSlots, sessionDate, sessionId, sessionType, allowedStudentId = null) {
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
            const startTime = this.formatTimeInTeacherTimezone(slot.startTime);
            const endTime = this.formatTimeInTeacherTimezone(slot.endTime);
            const key = `${startTime}-${endTime}`;

            // Determine slot type and permissions
            const isTeacherAssigned = slot.assignedBy && slot.assignedBy === this.currentUser?.id;
            const isStudentBooked = !slot.assignedBy; // No assignedBy means student booked it themselves
            const canCancel = isTeacherAssigned && !isStudentBooked;

            allSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                type: 'booked',
                studentName: sessionType === 'personal' ? null : (slot.bookedBy ? slot.bookedBy.fullName : 'Booked'),
                actualStudentName: sessionType === 'personal' ? (allowedStudentId ? allowedStudentId.fullName : null) : (slot.bookedBy ? slot.bookedBy.fullName : null),
                slotId: slot._id, // Add slot ID for cancellation
                assignedBy: slot.assignedBy,
                canCancel: canCancel,
                isStudentBooked: isStudentBooked,
                isTeacherAssigned: isTeacherAssigned
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
                <div style="color: #1976d2; font-size: 13px; font-weight: 500; margin-bottom: 8px;">My Slots (${allSlots.length})</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${allSlots.map(slot => {
            if (slot.type === 'available') {
                return `
                                <button onclick="dashboard.handleSlotClick('${slot.startTime}', '${slot.endTime}', 'available', null, '${sessionId}')" 
                                        style="background: #1976d2; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: none; cursor: pointer; transition: all 0.2s ease;"
                                        onmouseover="this.style.background='#1565c0'; this.style.transform='scale(1.05)';"
                                        onmouseout="this.style.background='#1976d2'; this.style.transform='scale(1)';">
                                    ${slot.startTime} - ${slot.endTime}
                                </button>
                            `;
            } else {
                // Handle booked slots with different restrictions
                const slotClass = slot.isStudentBooked ? 'student-booked' : 'teacher-assigned';
                const cursorStyle = slot.canCancel ? 'cursor: pointer;' : 'cursor: not-allowed;';
                const hoverEffects = slot.canCancel ?
                    'onmouseover="this.style.background=\'#c62828\'; this.style.transform=\'scale(1.05)\';"' +
                    'onmouseout="this.style.background=\'#d32f2f\'; this.style.transform=\'scale(1)\';"' : '';
                const tooltip = slot.isTeacherAssigned ? 'title="Assigned by you - Click to cancel"' :
                    slot.isStudentBooked ? 'title="Student booked - Cannot cancel"' :
                        'title="Booked - Cannot cancel"';
                const clickHandler = slot.canCancel ?
                    `onclick="dashboard.handleSlotClick('${slot.startTime}', '${slot.endTime}', 'booked', '${slot.actualStudentName || slot.studentName}', '${sessionId}', '${slot.slotId}')"` :
                    `onclick="event.preventDefault(); return false;"`;

                return `
                                <button ${clickHandler} 
                                        ${tooltip}
                                        style="background: #d32f2f; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: none; ${cursorStyle} transition: all 0.2s ease; opacity: ${slot.isStudentBooked ? '0.7' : '1'};"
                                        ${hoverEffects}>
                                    ${slot.studentName ? `${slot.studentName} [${slot.startTime} – ${slot.endTime}]` : `${slot.startTime} – ${slot.endTime}`}
                                </button>
                            `;
            }
        }).join('')}
                </div>
            </div>
        `;
    }

    handleSlotClick(startTime, endTime, type, studentName = null, sessionId = null, slotId = null) {
        console.log('Slot clicked:', { startTime, endTime, type, studentName, sessionId, slotId });

        if (type === 'available') {
            // Handle available slot click - open assign modal
            this.showAssignSlotModal(startTime, endTime, sessionId);
        } else if (type === 'booked') {
            // Find the slot data to check permissions
            const slotData = this.findSlotData(sessionId, startTime, endTime);
            if (!slotData) {
                console.error('Slot data not found');
                return;
            }

            // Check if teacher can cancel this slot
            if (!slotData.canCancel) {
                if (slotData.isStudentBooked) {
                    this.showMessage('This slot was booked by the student and cannot be cancelled.', 'error');
                } else {
                    this.showMessage('You cannot cancel this slot.', 'error');
                }
                return;
            }

            // Handle booked slot click - show cancellation confirmation
            this.showCancelSlotConfirmation(startTime, endTime, studentName, sessionId, slotId);
        }
    }

    findSlotData(sessionId, startTime, endTime) {
        // This would need to be implemented to find slot data
        // For now, return a placeholder - in a real implementation, 
        // you'd store the slot data or retrieve it from the DOM
        return { canCancel: true, isStudentBooked: false };
    }

    showCancelSlotConfirmation(startTime, endTime, studentName, sessionId, slotId) {
        // Store slot data for later use
        this.currentCancelSlotData = {
            startTime,
            endTime,
            studentName,
            sessionId,
            slotId
        };

        // Populate modal with slot details
        const detailsContainer = document.getElementById('cancelSlotDetails');
        detailsContainer.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">
                    <i class="fas fa-user"></i>
                    Student
                </div>
                <div class="detail-value">${studentName || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">
                    <i class="fas fa-clock"></i>
                    Time
                </div>
                <div class="detail-value">${startTime} - ${endTime}</div>
            </div>
        `;

        // Show the modal
        this.showModal('cancelSlotModal');
    }

    async cancelSlot() {
        if (!this.currentCancelSlotData) {
            console.error('No slot data available for cancellation');
            return;
        }

        const { slotId, sessionId, startTime, endTime, studentName } = this.currentCancelSlotData;

        try {
            this.showLoading();

            const response = await fetch(`/api/sessions/slots/${slotId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage(`Slot cancelled successfully: ${startTime} - ${endTime}`, 'success');
                // Hide the modal
                this.hideModal('cancelSlotModal');
                // Clear stored data
                this.currentCancelSlotData = null;
                // Refresh the sessions data to show updated slot status
                await this.loadSessionsData();
            } else {
                this.showMessage(result.message || 'Failed to cancel slot', 'error');
            }
        } catch (error) {
            console.error('Error cancelling slot:', error);
            this.showMessage('Error cancelling slot. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    generateUnifiedSlotsModalView(availableSlots, bookedSlots, sessionDate, sessionType, allowedStudentId = null) {
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
            const startTime = this.formatTimeInTeacherTimezone(slot.startTime);
            const endTime = this.formatTimeInTeacherTimezone(slot.endTime);
            const key = `${startTime}-${endTime}`;

            allSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                type: 'booked',
                studentName: sessionType === 'personal' ? null : (slot.bookedBy ? slot.bookedBy.fullName : 'Booked'),
                actualStudentName: sessionType === 'personal' ? (allowedStudentId ? allowedStudentId.fullName : null) : (slot.bookedBy ? slot.bookedBy.fullName : null),
                studentEmail: sessionType === 'personal' ? (allowedStudentId ? allowedStudentId.email : '') : (slot.bookedBy ? slot.bookedBy.email : '')
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
                    ${slot.studentName ? `
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

        // Create a map of all unique slots to avoid double-counting
        const allSlotsMap = new Map();

        // Add all available slots
        availableSlots.forEach(slot => {
            const key = `${slot.startTime}-${slot.endTime}`;
            allSlotsMap.set(key, { type: 'available', slot });
        });

        // Add or update booked slots (this will overwrite available slots with same time)
        bookedSlots.forEach(slot => {
            const key = `${slot.startTime}-${slot.endTime}`;
            allSlotsMap.set(key, { type: 'booked', slot });
        });

        const totalSlots = allSlotsMap.size;

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
                                    <i class="fas fa-clock"></i> ${this.formatSessionDuration(session.sessionDuration)}
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
                                    <div style="margin-top: 5px;">${session.allowedStudentId ? '👤 Personal Session' : '👥 All Students Session'}</div>
                                </div>
                                <div>
                                    <strong style="color: #6c757d;">Session Duration:</strong>
                                    <div style="margin-top: 5px;">⏱️ ${this.formatSessionDuration(session.sessionDuration)}</div>
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
                                ${this.generateUnifiedSlotsModalView(availableSlots, bookedSlots, session.date, session.type, session.allowedStudentId)}
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
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to delete this session? This action cannot be undone.',
            'Delete Session'
        );

        if (!confirmed) return;

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
        // Reset form to initial state first
        this.resetCreateSessionForm();

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

            // Setup form validation when modal is shown
            this.setupCreateSessionFormValidation();

            modal.classList.add('show');
        }
    }

    setupCreateSessionFormValidation() {
        const createSessionForm = document.getElementById('createSessionForm');
        if (createSessionForm) {
            // Remove existing listeners to avoid duplicates
            const newForm = createSessionForm.cloneNode(true);
            createSessionForm.parentNode.replaceChild(newForm, createSessionForm);

            // Add submit event listener
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateCreateSessionForm()) {
                    this.createSessionSlots();
                }
            });

            // Re-add cancel button listener after form cloning
            const cancelBtn = newForm.querySelector('#cancelSessionBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    console.log('Cancel button clicked');
                    e.preventDefault();
                    const modal = document.getElementById('createSessionModal');
                    if (modal) {
                        modal.classList.remove('show');
                        this.resetCreateSessionForm();
                    }
                });
            }

            // Add real-time validation to clear errors on input
            const sessionInputs = newForm.querySelectorAll('input, select');
            sessionInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
                input.addEventListener('change', () => {
                    this.clearFieldError(input);
                });
            });
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

        // Clear all inline styles first
        particularStudentGroup.style.cssText = '';

        if (studentType === 'particular') {
            // Show the dropdown
            particularStudentGroup.style.visibility = 'visible';
            particularStudentGroup.style.opacity = '1';
            particularStudentGroup.style.maxHeight = '120px';
            particularStudentGroup.style.display = 'block';
        } else {
            // Hide the dropdown
            particularStudentGroup.style.visibility = 'hidden';
            particularStudentGroup.style.opacity = '0';
            particularStudentGroup.style.maxHeight = '0';
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
                const data = await response.json();
                const students = data.students || [];
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

            const result = await response.json();

            if (response.ok && response.status === 201) {
                // Success case
                this.showMessage(result.message || 'Session slots created successfully!', 'success');

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
                // Error case - display backend error message
                const errorMessage = result.message || 'Failed to create session slots';
                const errorField = result.field;

                // Show error inline if field is specified, otherwise show as toast
                if (errorField) {
                    this.showBackendFieldError(errorField, errorMessage);
                }
                this.showMessage(errorMessage, 'error');

                // Keep the modal open and form intact so user can fix the errors
                console.error('Session creation error:', errorMessage);
            }
        } catch (error) {
            console.error('Error creating session slots:', error);
            this.showMessage('Network error. Please try again.', 'error');
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
                        <span>${this.formatSessionDuration(session.sessionDuration)}</span>
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
            const teacher = await window.apiService.get('/teachers/profile');
            // Update currentUser object with timezone
            if (this.currentUser) {
                this.currentUser.timezone = teacher.timezone || 'Asia/Kolkata';
                console.log('Loaded teacher timezone:', this.currentUser.timezone);
            }
        } catch (error) {
            console.warn('Could not load teacher profile for timezone:', error);
            // Continue with default timezone
        }

        // Load initial data for current page
        await this.loadPageData(this.currentPage);
    }

    resetCreateSessionForm() {
        const form = document.getElementById('createSessionForm');
        if (!form) return;

        // Reset submitted flag
        this.isSessionFormSubmitted = false;

        // Reset form and session type
        form.reset();
        document.getElementById('studentType').value = ' ';

        // Reset dropdowns to default empty state
        document.getElementById('sessionDuration').value = '';
        document.getElementById('breakDuration').value = '';

        // Hide student dropdown
        const dropdown = document.getElementById('particularStudentGroup');
        if (dropdown) {
            dropdown.style.cssText = 'visibility: hidden; opacity: 0; max-height: 0; display: none;';
        }

        // Clear all error classes and messages
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
        });
    }

    downloadStudentSampleCsv() {
        const csvContent = `userId,fullName,email,password,age,mobileNo,city,state,class,timezone
s101,John Smith,john.smith@email.com,password123,18,9876543210,Mumbai,Maharashtra,10th Grade,Asia/Kolkata
s102,Emily Johnson,emily.j@email.com,password123,17,9876543211,Delhi,Delhi,9th Grade,Asia/Kolkata
s103,Michael Brown,michael.b@email.com,password123,19,9876543212,Bangalore,Karnataka,11th Grade,Asia/Kolkata
s104,Sarah Davis,sarah.d@email.com,password123,18,9876543213,Chennai,Tamil Nadu,10th Grade,Asia/Kolkata
s105,James Wilson,james.w@email.com,password123,17,9876543214,Kolkata,West Bengal,9th Grade,Asia/Kolkata`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showMessage('Sample CSV downloaded successfully!', 'success');
    }

    showMessage(message, type = 'info') {
        console.log('=== showMessage DEBUG ===');
        console.log('Message:', message);
        console.log('Type:', type);

        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message, .toast-message');
        existingMessages.forEach(msg => msg.remove());

        // Remove any existing containers to avoid conflicts
        const existingContainers = document.querySelectorAll('#messages, #toast-container');
        existingContainers.forEach(container => container.remove());

        // Create a completely independent container with unique ID
        const containerId = 'toast-container-' + Date.now();
        const container = document.createElement('div');
        container.id = containerId;

        // Apply container styles directly to avoid CSS conflicts
        container.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;
            max-width: 400px !important;
            pointer-events: auto !important;
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            transform: none !important;
            transition: none !important;
        `;

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';

        // Determine colors based on type
        let borderColor = '#10b981';
        let bgColor = '#f0fdf4';
        let icon = 'fa-check-circle';
        let iconColor = '#10b981';

        switch (type) {
            case 'success':
                borderColor = '#10b981';
                bgColor = '#f0fdf4';
                icon = 'fa-check-circle';
                iconColor = '#10b981';
                break;
            case 'error':
                borderColor = '#ef4444';
                bgColor = '#fef2f2';
                icon = 'fa-exclamation-circle';
                iconColor = '#ef4444';
                break;
            case 'warning':
                borderColor = '#f59e0b';
                bgColor = '#fffbeb';
                icon = 'fa-exclamation-triangle';
                iconColor = '#f59e0b';
                break;
            default:
                borderColor = '#3b82f6';
                bgColor = '#eff6ff';
                icon = 'fa-info-circle';
                iconColor = '#3b82f6';
        }

        // Apply message styles directly to avoid CSS conflicts
        messageElement.style.cssText = `
            background: white !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin-bottom: 12px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            border-left: 4px solid ${borderColor} !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            position: relative !important;
            min-height: 60px !important;
            z-index: 2147483647 !important;
            transform: translateX(0) !important;
            transition: all 0.3s ease !important;
            font-family: Inter, Arial, sans-serif !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
            color: #374151 !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
        `;

        messageElement.innerHTML = `
            <i class="fas ${icon}" style="color: ${iconColor} !important; font-size: 20px !important; flex-shrink: 0 !important; display: block !important;"></i>
            <span style="flex: 1 !important; font-weight: 500 !important; display: block !important;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none !important; border: none !important; color: #9ca3af !important; cursor: pointer !important; padding: 4px !important; border-radius: 4px !important; transition: all 0.2s ease !important; font-size: 14px !important; flex-shrink: 0 !important; display: block !important;">
                <i class="fas fa-times"></i>
            </button>
        `;

        console.log('Created message element:', messageElement);
        console.log('Message styles:', messageElement.style.cssText);
        console.log('Container styles:', container.style.cssText);

        // Add message to container
        container.appendChild(messageElement);

        // Add container to body
        document.body.appendChild(container);

        console.log('Container added to body');
        console.log('Container visible:', container.offsetWidth > 0 && container.offsetHeight > 0);
        console.log('Message visible:', messageElement.offsetWidth > 0 && messageElement.offsetHeight > 0);
        console.log('Container computed display:', window.getComputedStyle(container).display);
        console.log('Message computed display:', window.getComputedStyle(messageElement).display);

        // Force reflow
        container.offsetHeight;
        messageElement.offsetHeight;

        // Auto remove after 5 seconds
        setTimeout(() => {
            console.log('Removing message after timeout');
            if (container.parentNode) {
                container.style.opacity = '0';
                container.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                }, 300);
            }
        }, 5000);
    }


    showConfirmDialog(message, title = 'Confirm Action', onConfirm = null, onCancel = null) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay confirm-dialog-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'confirm-dialog';
        modalContent.innerHTML = `
            <div class="confirm-dialog-header">
                <div class="confirm-dialog-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>${title}</h3>
            </div>
            <div class="confirm-dialog-body">
                <p>${message}</p>
            </div>
            <div class="confirm-dialog-footer">
                <button class="btn btn-secondary confirm-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn btn-danger confirm-confirm">
                    <i class="fas fa-check"></i> Confirm
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Trigger animation
        setTimeout(() => {
            modalOverlay.classList.add('show');
            modalContent.classList.add('show');
        }, 10);

        // Handle button clicks
        const cancelBtn = modalContent.querySelector('.confirm-cancel');
        const confirmBtn = modalContent.querySelector('.confirm-confirm');

        const closeModal = () => {
            modalOverlay.classList.remove('show');
            modalContent.classList.remove('show');
            setTimeout(() => {
                if (modalOverlay.parentNode) {
                    modalOverlay.parentNode.removeChild(modalOverlay);
                }
            }, 300);
        };

        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        confirmBtn.addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        });

        // Return promise for async usage
        return new Promise((resolve) => {
            cancelBtn.onclick = () => {
                closeModal();
                resolve(false);
                if (onCancel) onCancel();
            };
            confirmBtn.onclick = () => {
                closeModal();
                resolve(true);
                if (onConfirm) onConfirm();
            };
        });
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

    // Assign Slot Modal Functions
    async showAssignSlotModal(startTime, endTime, sessionId) {
        try {
            if (!sessionId) {
                this.showMessage('Session ID is required. Please try again.', 'error');
                return;
            }

            // Fetch session details to check if it's a personal session
            const sessionResponse = await fetch(`/api/sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            let sessionDetails = null;
            if (sessionResponse.ok) {
                sessionDetails = await sessionResponse.json();
            }

            // Set slot information
            const slotTimeDisplay = document.getElementById('slotTimeDisplay');
            const slotDateDisplay = document.getElementById('slotDateDisplay');
            const sessionTypeDisplay = document.getElementById('sessionTypeDisplay');

            if (slotTimeDisplay) slotTimeDisplay.textContent = `${startTime} - ${endTime}`;

            // Set date information if session details are available
            if (slotDateDisplay) {
                if (sessionDetails && sessionDetails.date) {
                    const formattedDate = this.formatSessionDate(sessionDetails.date);
                    slotDateDisplay.textContent = formattedDate;
                } else {
                    slotDateDisplay.textContent = 'Date not available';
                }
            }

            // Set session type information
            if (sessionTypeDisplay) {
                if (sessionDetails && sessionDetails.allowedStudentId) {
                    sessionTypeDisplay.textContent = 'Personal Session';
                } else {
                    sessionTypeDisplay.textContent = 'Common Session';
                }
            }

            document.getElementById('assignSessionId').value = sessionId;
            document.getElementById('assignStartTime').value = startTime;

            // Get the student selection field and header
            const studentAssignmentField = document.querySelector('.assign-slot-field');
            const modalTitle = document.querySelector('.assign-slot-header h3');

            if (sessionDetails && sessionDetails.allowedStudentId) {
                // This is a personal session - hide student dropdown and update title
                if (studentAssignmentField) {
                    studentAssignmentField.style.display = 'none';
                }
                if (modalTitle) {
                    modalTitle.textContent = 'Personal Session Slot';
                }

                // Remove required attribute from student select since it's hidden
                const studentSelect = document.getElementById('studentSelect');
                if (studentSelect) {
                    studentSelect.removeAttribute('required');
                }
            } else {
                // This is a common session - show student dropdown and use default title
                if (studentAssignmentField) {
                    studentAssignmentField.style.display = 'block';
                }
                if (modalTitle) {
                    modalTitle.textContent = 'Assign Slot';
                }

                // Add required attribute back to student select
                const studentSelect = document.getElementById('studentSelect');
                if (studentSelect) {
                    studentSelect.setAttribute('required', '');
                }

                // Load students for this teacher
                await this.loadStudentsForAssignModal();
            }

            // Show modal
            const modal = document.getElementById('assignSlotModal');
            if (modal) {
                modal.classList.add('show');
            }
        } catch (error) {
            console.error('Error showing assign slot modal:', error);
            this.showMessage('Error opening assign slot modal', 'error');
        }
    }

    hideAssignSlotModal() {
        const modal = document.getElementById('assignSlotModal');
        if (modal) {
            modal.classList.remove('show');
            this.resetAssignSlotForm();
        }
    }

    resetAssignSlotForm() {
        const form = document.getElementById('assignSlotForm');
        if (form) {
            form.reset();
            // Clear error messages
            form.querySelectorAll('.error-message').forEach(error => {
                error.style.display = 'none';
                error.textContent = '';
            });
            form.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });
        }
    }

    async loadStudentsForAssignModal() {
        try {
            const response = await fetch('/api/teachers/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const students = result.students || [];
                const selectElement = document.getElementById('studentSelect');

                if (selectElement) {
                    selectElement.innerHTML = '<option value="">Select a student</option>';

                    students.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student._id;
                        option.textContent = student.fullName;
                        selectElement.appendChild(option);
                    });
                }
            } else {
                throw new Error('Failed to load students');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showMessage('Error loading students', 'error');

            // Show error in select element
            const selectElement = document.getElementById('studentSelect');
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Error loading students</option>';
            }
        }
    }

    async handleAssignSlotSubmit() {
        try {
            const form = document.getElementById('assignSlotForm');

            // Clear previous errors if any (using default browser validation or simple check)

            // Get form data
            const formData = new FormData(form);
            const sessionId = formData.get('sessionId');
            const startTime = formData.get('startTime');
            const studentId = formData.get('studentId');

            // Validate
            let isValid = true;

            if (!sessionId) {
                this.showMessage('Session ID is missing', 'error');
                isValid = false;
            }

            if (!startTime) {
                this.showMessage('Start time is missing', 'error');
                isValid = false;
            }

            // Check if student selection is required (only if the student assignment field is visible)
            const studentAssignmentField = document.querySelector('.assign-slot-field');
            const isStudentSelectionRequired = studentAssignmentField && studentAssignmentField.style.display !== 'none';

            if (isStudentSelectionRequired && !studentId) {
                this.showMessage('Please select a student', 'error');
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Show loading
            this.showLoading();

            // For personal sessions, we don't need to send studentId
            // The backend will handle it based on the session's allowedStudentId
            const payload = {
                sessionId,
                startTime
            };

            // Only include studentId for common sessions
            if (isStudentSelectionRequired && studentId) {
                payload.studentId = studentId;
            }

            // Call API
            const response = await fetch('/api/sessions/assign-slot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage(result.message || 'Slot assigned successfully!', 'success');
                this.hideAssignSlotModal();

                // Reload sessions data to show the updated slot
                await this.loadSessionsData();
            } else {
                this.showMessage(result.message || 'Failed to assign slot', 'error');
            }
        } catch (error) {
            console.error('Error assigning slot:', error);
            this.showMessage('Error assigning slot', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // CSV Upload functionality
    toggleCsvDropdown() {
        const dropdown = document.getElementById('csvDropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    closeCsvDropdown() {
        const dropdown = document.getElementById('csvDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    downloadSampleCsv() {
        // Create sample CSV content
        const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Answer
What is the capital of France?,London,Paris,Berlin,Madrid,B
What is 2 + 2?,3,4,5,6,B
Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,B
Who painted the Mona Lisa?,Van Gogh,Picasso,Da Vinci,Rembrandt,C
What is the largest ocean?,Atlantic,Indian,Arctic,Pacific,D`;

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_questions.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.closeCsvDropdown();
        this.showMessage('Sample CSV downloaded successfully', 'success');
    }

    downloadQuizSampleCsv() {
        // Create sample CSV content for quiz questions
        const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Answer
What is the capital of France?,London,Paris,Berlin,Madrid,B
What is 2 + 2?,3,4,5,6,B
Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,B
Who painted the Mona Lisa?,Van Gogh,Picasso,Da Vinci,Rembrandt,C
What is the largest ocean?,Atlantic,Indian,Arctic,Pacific,D`;

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_quiz_questions.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.closeCsvDropdown();
        this.showMessage('Quiz Sample CSV downloaded successfully', 'success');
    }

    async handleCsvFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            this.showMessage('Please select a valid CSV file', 'error');
            return;
        }

        try {
            const text = await file.text();
            const questions = this.parseCsvQuestions(text);

            if (questions.length === 0) {
                this.showMessage('No valid questions found in CSV file', 'error');
                return;
            }

            // Navigate to create quiz page and populate questions
            this.navigateToCreateQuizPage();

            // Wait a bit for the page to load
            setTimeout(() => {
                this.populateQuestionsFromCsv(questions);
            }, 100);

            this.closeCsvDropdown();
            this.showMessage(`Successfully loaded ${questions.length} questions from CSV`, 'success');

        } catch (error) {
            console.error('Error reading CSV file:', error);
            this.showMessage('Error reading CSV file. Please check the format.', 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    parseCsvQuestions(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const questions = [];

        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (simple parsing - assumes no commas in quoted text)
            const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));

            if (parts.length >= 6) {
                const question = {
                    question: parts[0],
                    options: [parts[1], parts[2], parts[3], parts[4]],
                    correctOption: parts[5].toUpperCase()
                };

                // Validate question data
                if (question.question &&
                    question.options.every(opt => opt) &&
                    ['A', 'B', 'C', 'D'].includes(question.correctOption)) {
                    questions.push(question);
                }
            }
        }

        return questions;
    }

    populateQuestionsFromCsv(questions) {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        // Clear existing questions
        container.innerHTML = '';

        questions.forEach((questionData, index) => {
            const questionNumber = index + 1;
            const questionHtml = `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-number">Question ${questionNumber}</span>
                        <button type="button" class="btn-remove-question" onclick="dashboard.showDeleteQuestionModal(this.closest('.question-item'))">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="question-field">
                        <input type="text" name="questions[]" placeholder="Enter question text" required value="${this.escapeHtml(questionData.question)}">
                    </div>
                    <div class="options-grid">
                        <div class="option-item">
                            <label>A</label>
                            <input type="text" name="options${questionNumber}[]" placeholder="Option A" required value="${this.escapeHtml(questionData.options[0])}">
                        </div>
                        <div class="option-item">
                            <label>B</label>
                            <input type="text" name="options${questionNumber}[]" placeholder="Option B" required value="${this.escapeHtml(questionData.options[1])}">
                        </div>
                        <div class="option-item">
                            <label>C</label>
                            <input type="text" name="options${questionNumber}[]" placeholder="Option C" required value="${this.escapeHtml(questionData.options[2])}">
                        </div>
                        <div class="option-item">
                            <label>D</label>
                            <input type="text" name="options${questionNumber}[]" placeholder="Option D" required value="${this.escapeHtml(questionData.options[3])}">
                        </div>
                    </div>
                    <div class="answer-field">
                        <label>Correct Answer</label>
                        <select name="answers[]">
                            <option value="">Select correct answer</option>
                            <option value="A" ${questionData.correctOption === 'A' ? 'selected' : ''}>A</option>
                            <option value="B" ${questionData.correctOption === 'B' ? 'selected' : ''}>B</option>
                            <option value="C" ${questionData.correctOption === 'C' ? 'selected' : ''}>C</option>
                            <option value="D" ${questionData.correctOption === 'D' ? 'selected' : ''}>D</option>
                        </select>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', questionHtml);
        });

        // Re-setup error clearing for new fields
        this.setupQuizFormErrorClearing();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Not set';

        const date = new Date(dateTimeString);
        if (Number.isNaN(date.getTime())) return 'Not set';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    toIsoStringFromDateTimeLocal(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString();
    }

    toDateTimeLocalInputValue(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    clearTimeDisplay(displayId) {
        const display = document.getElementById(displayId);
        if (!display) return;
        display.textContent = '';
    }

    updateEditTimeDisplay(inputId, displayId) {
        // Requirement: don't show extra helper text under inputs.
        this.clearTimeDisplay(displayId);
    }

    setupEditTimeDisplayListeners() {
        const startTimeInput = document.getElementById('editQuizStartTime');
        const endTimeInput = document.getElementById('editQuizEndTime');

        if (startTimeInput) {
            startTimeInput.addEventListener('change', () => {
                this.updateEditTimeDisplay('editQuizStartTime', 'editQuizStartTimeDisplay');
            });
        }

        if (endTimeInput) {
            endTimeInput.addEventListener('change', () => {
                this.updateEditTimeDisplay('editQuizEndTime', 'editQuizEndTimeDisplay');
            });
        }
    }

    isQuizEditable(quiz) {
        // Quiz is editable if it's not active (not started) and not expired
        const now = new Date();
        const startTime = quiz.startTime ? new Date(quiz.startTime) : null;
        const endTime = quiz.endTime ? new Date(quiz.endTime) : null;

        // If no time is set, it's editable
        if (!startTime || !endTime) {
            return true;
        }

        // If current time is between start and end time, quiz is active and not editable
        if (now >= startTime && now <= endTime) {
            return false;
        }

        // If current time is after end time, quiz is expired and not editable
        if (now > endTime) {
            return false;
        }

        // Otherwise, quiz is editable (scheduled but not started)
        return true;
    }

    getQuizStatusBadge(quiz) {
        // Check if quiz is in draft status
        if (quiz.status === 'draft') {
            return '<span class="status-badge status-draft">Draft</span>';
        }

        // Check if quiz is published
        if (quiz.status === 'published') {
            const endTime = quiz.endTime ? new Date(quiz.endTime) : null;
            const now = new Date();
            if (endTime && now > endTime) {
                return '<span class="status-badge status-expired">Expired</span>';
            }
            return '<span class="status-badge status-published">Published</span>';
        }

        const now = new Date();
        const startTime = quiz.startTime ? new Date(quiz.startTime) : null;
        const endTime = quiz.endTime ? new Date(quiz.endTime) : null;

        if (!startTime || !endTime) {
            return '<span class="status-badge status-inactive">Schedule Not Set</span>';
        }

        if (now >= startTime && now <= endTime) {
            return '<span class="status-badge status-active">Active</span>';
        } else {
            return '<span class="status-badge status-completed">Completed</span>';
        }
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
