// ================================================
// SMART SCHOOL - LANDING PAGE JAVASCRIPT
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS Animation Library
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100,
        disable: function() {
            return window.innerWidth < 768;
        }
    });

    // Header Scroll Effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        });
    }

    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Counter Animation for Stats
    const statNumbers = document.querySelectorAll('.stat-number, .about-stat-number');
    
    function animateCounters() {
        statNumbers.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };
            
            updateCounter();
        });
    }

    // Trigger counter animation when in viewport
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    const aboutStats = document.querySelector('.about-stats-card');
    if (aboutStats) {
        statsObserver.observe(aboutStats);
    }

    // Testimonials Slider
    const track = document.querySelector('.testimonials-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dots = document.querySelectorAll('.testimonial-dots .dot');
    
    let currentSlide = 0;
    const totalSlides = document.querySelectorAll('.testimonial-card').length;
    const visibleSlides = window.innerWidth < 768 ? 1 : 3;
    const maxSlides = Math.max(0, totalSlides - visibleSlides);

    function updateSlider() {
        if (track) {
            const slideWidth = track.querySelector('.testimonial-card').offsetWidth;
            const gap = 30;
            track.style.transform = `translateX(-${currentSlide * (slideWidth + gap)}px)`;
        }
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlider();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentSlide < maxSlides) {
                currentSlide++;
                updateSlider();
            }
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            currentSlide = index;
            updateSlider();
        });
    });

    // Auto-slide testimonials
    setInterval(function() {
        if (currentSlide < maxSlides) {
            currentSlide++;
        } else {
            currentSlide = 0;
        }
        updateSlider();
    }, 5000);

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Simulate form submission
            setTimeout(function() {
                contactForm.style.display = 'none';
                if (contactSuccess) {
                    contactSuccess.classList.add('show');
                }
            }, 1500);
        });
    }

    // Header position for form pages
    const formPageHeader = document.querySelector('.form-page header');
    if (formPageHeader && !formPageHeader.classList.contains('header-scrolled')) {
        formPageHeader.classList.add('header-scrolled');
    }

    // Add animation classes to feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 50}ms`;
    });

    // Parallax effect for hero shapes
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.hero-shape');
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            shape.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Mobile menu link click handler
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Floating card animations
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.5}s`;
    });

    // Job position selection
    const jobCards = document.querySelectorAll('.job-card');
    const positionSelect = document.getElementById('position');
    
    jobCards.forEach(card => {
        card.addEventListener('click', function() {
            jobCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            const position = this.getAttribute('data-position');
            if (positionSelect) {
                positionSelect.value = position;
            }
        });
    });

    // File upload visual feedback
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.files && this.files.length > 0) {
                label.querySelector('span').textContent = this.files[0].name;
                label.style.borderColor = 'var(--accent)';
                label.style.background = 'rgba(0, 200, 83, 0.1)';
            } else {
                label.querySelector('span').textContent = 'Choose file or drag here';
                label.style.borderColor = 'var(--primary)';
                label.style.background = 'rgba(10, 102, 255, 0.05)';
            }
        });
    });
});

// Utility function to generate random ID
function generateId(prefix) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${random}`;
}
