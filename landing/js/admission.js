// ================================================
// SMART SCHOOL - ADMISSION FORM JAVASCRIPT
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('admission-form');
    const successMessage = document.getElementById('admission-success');

    // Form validation rules
    const validators = {
        studentName: {
            required: true,
            minLength: 3,
            message: 'Please enter a valid student name (at least 3 characters)'
        },
        dob: {
            required: true,
            message: 'Please select a date of birth'
        },
        gender: {
            required: true,
            message: 'Please select gender'
        },
        grade: {
            required: true,
            message: 'Please select a grade'
        },
        parentName: {
            required: true,
            minLength: 3,
            message: 'Please enter parent/guardian name'
        },
        relation: {
            required: true,
            message: 'Please select relationship'
        },
        phone: {
            required: true,
            pattern: /^[\d\s\-+()]{10,}$/,
            message: 'Please enter a valid phone number'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        address: {
            required: true,
            message: 'Please enter street address'
        },
        city: {
            required: true,
            message: 'Please enter city'
        },
        state: {
            required: true,
            message: 'Please enter state'
        },
        zip: {
            required: true,
            pattern: /^[\d\-\s]{4,10}$/,
            message: 'Please enter a valid ZIP code'
        },
        country: {
            required: true,
            message: 'Please enter country'
        },
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
            // Scroll to first error
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
        
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Handle checkbox properly
        data.terms = form.querySelector('#terms').checked;
        
        try {
            // API URL - adjust based on environment
            const apiBaseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:5001/api'
                : 'https://smartschool-je18.onrender.com/api';
            
            const response = await fetch(`${apiBaseUrl}/applications/admissions/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Hide form
                form.classList.add('hidden');
                
                // Show application ID
                document.getElementById('application-id').textContent = result.applicationId;
                
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
            alert('Network error. Please check your connection and try again.');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Utility function to generate random ID
    function generateId(prefix) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const year = new Date().getFullYear();
        return `${prefix}-${year}-${random}`;
    }

    // Date input validation - prevent future dates
    const dobInput = document.getElementById('student-dob');
    if (dobInput) {
        const today = new Date().toISOString().split('T')[0];
        dobInput.setAttribute('max', today);
    }

    // Phone number formatting
    const phoneInput = document.getElementById('parent-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }
});
