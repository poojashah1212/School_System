class AuthSystem {
    constructor() {
        // Automatically detect environment and set API URL
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiBaseUrl = isLocal 
            ? 'http://localhost:5001/api/auth'    // local backend
            : 'https://smartschool-je18.onrender.com/api/auth';  // live backend

        // Initialize API service for consistency
        if (window.apiService) {
            const apiBase = isLocal 
                ? 'http://localhost:5001/api'    // local backend
                : 'https://smartschool-je18.onrender.com/api';  // live backend
            window.apiService.setBaseUrl(apiBase);
        }

        this.init();
    }

    init() {
        this.setupForms();
        this.setupValidation();
        this.setupPasswordToggle();
        this.setupRoleHandler();
        this.setupFileUpload();
        this.setupTimezoneCountryCode();
    }

    setupForms() {
        document.getElementById('login-form')?.addEventListener('submit', e => this.handleLogin(e));
        document.getElementById('signup-form')?.addEventListener('submit', e => this.handleSignup(e));
    }

    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                const icon = btn.querySelector('.eye-icon');
                input.type = input.type === 'password' ? 'text' : 'password';

                // Toggle Font Awesome icons
                if (input.type === 'password') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        });
    }

    setupValidation() {
        // Email validation
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input, 'email'));
            input.addEventListener('input', () => this.clearError(input));
        });

        // Mobile validation
        document.querySelectorAll('input[name="mobileNo"]').forEach(input => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '').slice(0, 10);
                this.validateField(input, 'mobile');
            });
        });

        // Password validation
        document.querySelectorAll('input[name="password"]').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input, 'password'));
            input.addEventListener('input', () => this.clearError(input));
        });

        // Text inputs and other required fields
        document.querySelectorAll('input[type="text"], input[type="number"], select').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input, 'required'));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupRoleHandler() {
        const roleSelect = document.getElementById('signup-role');
        const classGroup = document.getElementById('class-group');
        if (roleSelect && classGroup) {
            roleSelect.addEventListener('change', () => {
                const isStudent = roleSelect.value === 'student';
                classGroup.style.display = isStudent ? 'block' : 'none';
                document.getElementById('signup-class').required = isStudent;
            });
        }
    }

    setupFileUpload() {
        const fileInput = document.getElementById('signup-profileImage');
        const fileLabel = document.querySelector('.file-label');
        if (fileInput && fileLabel) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const validation = this.validateFile(file);
                    if (validation.valid) {
                        fileLabel.querySelector('.upload-text').textContent = file.name;
                        fileLabel.style.borderColor = '#28a745';
                        this.clearError(fileInput);
                    } else {
                        this.showError(fileInput, validation.error);
                        fileLabel.style.borderColor = '#dc3545';
                    }
                }
            });
        }
    }

    validateField(input, type) {
        const value = input.value.trim();
        let isValid = true;
        let errorMsg = '';

        switch (type) {
            case 'email':
                if (!value) errorMsg = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Invalid email format';
                break;
            case 'mobile':
                if (!value) errorMsg = 'Mobile number is required';
                else if (!/^[0-9]{10}$/.test(value)) errorMsg = 'Must be 10 digits';
                break;
            case 'password':
                if (!value) errorMsg = 'Password is required';
                else if (value.length < 6) errorMsg = 'Min 6 characters';
                else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) errorMsg = 'Need uppercase, lowercase, and number';
                break;
            case 'required':
                if (!value) {
                    const label = input.previousElementSibling;
                    const fieldName = label ? label.textContent.replace(':', '').trim() : input.name;
                    errorMsg = `${fieldName} is required`;
                }
                break;
        }

        if (errorMsg) {
            this.showError(input, errorMsg);
            isValid = false;
        } else {
            this.showSuccess(input);
        }

        return isValid;
    }

    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type' };
        }
        if (file.size > maxSize) {
            return { valid: false, error: 'File too large (max 5MB)' };
        }
        return { valid: true };
    }

    showError(input, msg) {
        input.style.borderColor = '#dc3545';
        input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.color = '#dc3545';
            errorEl.style.display = 'block';
        }
    }

    showSuccess(input) {
        input.style.borderColor = '#28a745';
        input.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    clearError(input) {
        input.style.borderColor = '#e9ecef';
        input.style.boxShadow = 'none';
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));

        if (!this.validateLoginForm(data)) return;

        this.showLoading();
        try {
            const res = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                this.showMessage('Welcome back!', 'success');
                localStorage.setItem('token', result.token);

                // Check user role and redirect accordingly
                try {
                    const payload = JSON.parse(atob(result.token.split('.')[1]));
                    if (payload.role === 'teacher') {
                        setTimeout(() => window.location.href = '/html/teacherDashboard.html', 1500);
                    } else {
                        setTimeout(() => window.location.href = '/html/studentDashboard.html', 1500);
                    }
                } catch (jwtError) {
                    // Fallback to student dashboard
                    setTimeout(() => window.location.href = '/html/studentDashboard.html', 1500);
                }
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        if (!this.validateSignupForm(formData)) return;

        this.showLoading();
        try {
            // Use dynamic API URL with fetch
            const res = await fetch(`${this.apiBaseUrl}/signup`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (res.ok) {
                this.showMessage(result.message || 'Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/html/login.html';
                }, 1500);
            } else {
                this.showMessage(result.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            if (error.errors) {
                error.errors.forEach(err => {
                    const input = document.querySelector(`[name="${err.field}"]`);
                    if (input) this.showError(input, err.message);
                });
            }
            this.showMessage(error.message || 'Signup failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    validateLoginForm(data) {
        return this.validateField(document.getElementById('login-email'), 'email') &&
            this.validateField(document.getElementById('login-password'), 'required');
    }

    validateSignupForm(formData) {
        let isValid = true;
        const validations = [
            ['signup-userId', 'required'],
            ['signup-fullName', 'required'],
            ['signup-email', 'email'],
            ['signup-password', 'password'],
            ['signup-age', 'required'],
            ['signup-mobileNo', 'mobile'],
            ['signup-city', 'required'],
            ['signup-state', 'required']
        ];

        validations.forEach(([id, type]) => {
            const input = document.getElementById(id);
            if (input && !this.validateField(input, type)) isValid = false;
        });

        return isValid;
    }

    clearAllErrors() {
        document.querySelectorAll('input, select').forEach(input => this.clearError(input));
        const uploadText = document.querySelector('.file-label .upload-text');
        if (uploadText) uploadText.textContent = 'Choose Profile Image';
        const fileInput = document.getElementById('signup-profileImage');
        if (fileInput) fileInput.value = '';
    }

    showLoading() {
        document.getElementById('loading').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showMessage(text, type = 'info') {
        const container = document.getElementById('message-container');
        const msg = document.createElement('div');
        msg.className = `message ${type}`;

        // Simple minimal design for success messages
        if (type === 'success' && text === 'Welcome back!') {
            msg.innerHTML = `
                <div class="success-content">
                    <div class="success-title">Welcome back!</div>
                </div>
                <button class="message-close">&times;</button>
            `;
        } else {
            msg.innerHTML = `${text}<button class="message-close">&times;</button>`;
        }

        container.appendChild(msg);

        setTimeout(() => msg.remove(), 5000);
        msg.querySelector('.message-close').addEventListener('click', () => msg.remove());
    }

    clearMessages() {
        document.getElementById('message-container').innerHTML = '';
    }

    setupTimezoneCountryCode() {
        const timezoneSelect = document.getElementById('signup-timezone');
        const countryCodeElement = document.getElementById('country-code');

        if (!timezoneSelect || !countryCodeElement) return;

        // Mapping of timezones to country codes
        const timezoneCountryCodeMap = {
            'Asia/Kolkata': '+91',
            'Asia/Tokyo': '+81',
            'Asia/Shanghai': '+86',
            'Asia/Hong_Kong': '+852',
            'Asia/Singapore': '+65',
            'Asia/Dubai': '+971',
            'Asia/Seoul': '+82',
            'Asia/Bangkok': '+66',
            'Asia/Jakarta': '+62',
            'America/New_York': '+1',
            'America/Los_Angeles': '+1',
            'America/Chicago': '+1',
            'America/Denver': '+1',
            'America/Toronto': '+1',
            'America/Vancouver': '+1',
            'America/Mexico_City': '+52',
            'America/Sao_Paulo': '+55',
            'Europe/London': '+44',
            'Europe/Paris': '+33',
            'Europe/Berlin': '+49',
            'Europe/Moscow': '+7',
            'Europe/Rome': '+39',
            'Europe/Madrid': '+34',
            'Africa/Cairo': '+20',
            'Africa/Johannesburg': '+27',
            'Australia/Sydney': '+61',
            'Australia/Melbourne': '+61',
            'Australia/Perth': '+61',
            'Pacific/Auckland': '+64'
        };

        // Function to update country code based on selected timezone
        const updateCountryCode = () => {
            const selectedTimezone = timezoneSelect.value;
            const countryCode = timezoneCountryCodeMap[selectedTimezone] || '+91';
            countryCodeElement.textContent = countryCode;
        };

        // Add event listener to timezone select
        timezoneSelect.addEventListener('change', updateCountryCode);

        // Set initial country code based on current selection
        updateCountryCode();
    }
}

document.addEventListener('DOMContentLoaded', () => new AuthSystem());
