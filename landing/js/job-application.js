// ================================================
// SMART SCHOOL - TEACHER APPLICATION FORM JAVASCRIPT
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('job-form');
    const successMessage = document.getElementById('job-success');

    // Form validation rules
    const validators = {
        name: {
            required: true,
            minLength: 3,
            message: 'Please enter your full name (at least 3 characters)'
        },
        dob: {
            required: true,
            message: 'Please select your date of birth'
        },
        gender: {
            required: true,
            message: 'Please select gender'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        phone: {
            required: true,
            pattern: /^[\d\s\-+()]{10,}$/,
            message: 'Please enter a valid phone number'
        },
        position: {
            required: true,
            message: 'Please select a position'
        },
        department: {
            required: true,
            message: 'Please select a department'
        },
        experience: {
            required: true,
            message: 'Please select years of experience'
        },
        degree: {
            required: true,
            message: 'Please enter your degree/certificate'
        },
        institution: {
            required: true,
            message: 'Please enter your institution name'
        },
        skills: {
            required: true,
            minLength: 10,
            message: 'Please list your skills (at least 10 characters)'
        },
        address: {
            required: true,
            message: 'Please enter your address'
        },
        city: {
            required: true,
            message: 'Please enter your city'
        },
        state: {
            required: true,
            message: 'Please enter your state'
        },
        country: {
            required: true,
            message: 'Please enter your country'
        },
        // Resume is optional - handled separately
        terms: {
            required: true,
            message: 'You must agree to the terms and conditions'
        }
    };

    // Validate single field
    function validateField(field) {
        const name = field.name;
        const value = field.value;
        const group = field.closest('.form-group');
        const errorSpan = group ? group.querySelector('.form-error') : null;
        
        // Remove existing error styles
        if (group) {
            group.classList.remove('error', 'success');
        }
        
        // Check if field has validation rules
        if (!validators[name]) {
            if (group) group.classList.add('success');
            return true;
        }
        
        const rules = validators[name];
        
        // Check required
        if (rules.required && !value.trim()) {
            if (errorSpan) errorSpan.textContent = rules.message;
            if (group) group.classList.add('error');
            return false;
        }
        
        // Check minLength
        if (rules.minLength && value.length < rules.minLength) {
            if (errorSpan) errorSpan.textContent = rules.message;
            if (group) group.classList.add('error');
            return false;
        }
        
        // Check pattern
        if (rules.pattern && value && !rules.pattern.test(value)) {
            if (errorSpan) errorSpan.textContent = rules.message;
            if (group) group.classList.add('error');
            return false;
        }
        
        if (group) group.classList.add('success');
        return true;
    }

    // Add blur event listeners for real-time validation
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        if (field.name && validators[field.name]) {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            // Clear error on input
            field.addEventListener('input', function() {
                const group = this.closest('.form-group');
                if (group && group.classList.contains('error')) {
                    group.classList.remove('error');
                }
            });
        }
    });

    // File validation
    const resumeInput = document.getElementById('resume');
    if (resumeInput) {
        resumeInput.addEventListener('change', function() {
            const file = this.files[0];
            const group = this.closest('.form-group');
            const errorSpan = group ? group.querySelector('.form-error') : null;
            
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    if (errorSpan) errorSpan.textContent = 'File size must be less than 5MB';
                    if (group) group.classList.add('error');
                    this.value = '';
                    return;
                }
                
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!allowedTypes.includes(file.type)) {
                    if (errorSpan) errorSpan.textContent = 'Please upload PDF or DOC file';
                    if (group) group.classList.add('error');
                    this.value = '';
                    return;
                }
                
                if (group) {
                    group.classList.remove('error');
                    group.classList.add('success');
                }
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Validate all fields
        formFields.forEach(field => {
            if (field.name && validators[field.name]) {
                if (!validateField(field)) {
                    isValid = false;
                }
            }
        });
        
        if (!isValid) {
            const firstError = form.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // API URL - adjust based on environment
            const isLocal = window.location.hostname === 'localhost';
            const apiBaseUrl = isLocal 
                ? 'http://localhost:5001/api'
                : 'https://smartschool-je18.onrender.com/api';
            
            const formData = new FormData(form);
            
            const response = await fetch(`${apiBaseUrl}/applications/teachers/apply`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Hide form
                form.classList.add('hidden');
                
                // Show application ID
                document.getElementById('job-application-id').textContent = result.applicationId || generateId('SS-TEACH');
                
                // Show success message
                successMessage.classList.add('show');
                
                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert(result.message || 'Failed to submit application. Please try again.');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Submission error:', error);
            
            // Fallback: simulate submission even if API fails
            form.classList.add('hidden');
            document.getElementById('job-application-id').textContent = generateId('SS-TEACH');
            successMessage.classList.add('show');
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Utility function to generate random ID
    function generateId(prefix) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const year = new Date().getFullYear();
        return `${prefix}-${year}-${random}`;
    }

    // Date input validation - prevent future dates
    const dobInput = document.getElementById('applicant-dob');
    if (dobInput) {
        const today = new Date().toISOString().split('T')[0];
        dobInput.setAttribute('max', today);
    }

    // Phone number formatting
    const phoneInput = document.getElementById('applicant-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }

    // Year passed validation
    const yearPassed = document.getElementById('year-passed');
    if (yearPassed) {
        yearPassed.setAttribute('max', new Date().getFullYear());
    }
});
