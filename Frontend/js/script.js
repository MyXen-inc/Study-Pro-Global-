// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Form submission handler
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            service: formData.get('service'),
            message: formData.get('message')
        };

        // Validate form
        if (!validateForm(data)) {
            showMessage('Please fill in all required fields correctly.', 'error');
            return;
        }

        // Simulate form submission (in a real application, this would send to a server)
        try {
            // Show loading state
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success message
            showMessage('Thank you for your inquiry! We will contact you soon.', 'success');
            contactForm.reset();

            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            // Log form data (in production, this would be sent to a server)
            console.log('Form submitted:', data);
        } catch (error) {
            showMessage('An error occurred. Please try again later.', 'error');
            console.error('Form submission error:', error);
        }
    });
}

// Form validation
function validateForm(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!data.name || data.name.trim().length < 2) {
        return false;
    }

    if (!emailRegex.test(data.email)) {
        return false;
    }

    if (!phoneRegex.test(data.phone)) {
        return false;
    }

    if (!data.country || !data.service || !data.message) {
        return false;
    }

    if (data.message.trim().length < 10) {
        return false;
    }

    return true;
}

// Show form message
function showMessage(message, type) {
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Observe stats
document.querySelectorAll('.stat').forEach(stat => {
    stat.style.opacity = '0';
    stat.style.transform = 'translateY(30px)';
    stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(stat);
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(start));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num + '+';
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('h3');
            const text = statNumber.textContent;
            const match = text.match(/(\d+)/);
            
            if (match) {
                const number = parseInt(match[1]);
                if (text.includes('%')) {
                    statNumber.textContent = '0%';
                    animatePercentage(statNumber, number);
                } else {
                    animateCounter(statNumber, number);
                }
            }
            
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

function animatePercentage(element, target) {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '%';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '%';
        }
    }, 16);
}

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// Add active state to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
});

// Service card hover effects are handled by CSS :hover pseudo-class

// Prevent form resubmission on page reload
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// ========== Registration Form Handler ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            country: formData.get('country'),
            academicLevel: formData.get('academicLevel')
        };

        // Validate
        if (!data.fullName || data.fullName.trim().length < 2) {
            Auth.showNotification('Please enter your full name', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            Auth.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!data.password || data.password.length < 8) {
            Auth.showNotification('Password must be at least 8 characters', 'error');
            return;
        }

        // Submit
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        try {
            const result = await Auth.register(data);
            if (result.success) {
                registerForm.reset();
                // Redirect to dashboard or home
                setTimeout(() => {
                    window.location.hash = '#home';
                    window.scrollTo(0, 0);
                }, 1000);
            }
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// ========== Login Form Handler ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        // Validate
        if (!email || !password) {
            Auth.showNotification('Please enter email and password', 'error');
            return;
        }

        // Submit
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        try {
            const result = await Auth.login(email, password);
            if (result.success) {
                loginForm.reset();
                // Check if there's a redirect URL
                const redirectUrl = sessionStorage.getItem('authRedirect');
                if (redirectUrl) {
                    sessionStorage.removeItem('authRedirect');
                    window.location.hash = redirectUrl;
                } else {
                    window.location.hash = '#home';
                }
                window.scrollTo(0, 0);
            }
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// ========== University Search Handler ==========
const universitySearchBtn = document.querySelector('.university-search .btn-primary');
if (universitySearchBtn) {
    universitySearchBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const searchSection = document.querySelector('.university-search');
        const countrySelect = searchSection.querySelector('.search-select:first-of-type');
        const levelSelect = searchSection.querySelector('.search-select:last-of-type');
        const searchInput = searchSection.querySelector('.search-input');

        const params = {};
        if (countrySelect.value) params.country = countrySelect.value;
        if (levelSelect.value) params.level = levelSelect.value;
        if (searchInput.value) params.search = searchInput.value;

        universitySearchBtn.textContent = 'Searching...';
        universitySearchBtn.disabled = true;

        try {
            const response = await API.universities.search(params);
            if (response.success) {
                displayUniversityResults(response.data);
            }
        } catch (error) {
            Auth.showNotification(error.message || 'Search failed', 'error');
        } finally {
            universitySearchBtn.textContent = 'Search Universities';
            universitySearchBtn.disabled = false;
        }
    });
}

// Display university search results
function displayUniversityResults(data) {
    // Remove existing results
    const existingResults = document.querySelector('.university-results');
    if (existingResults) existingResults.remove();

    // Create results container
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'university-results';
    resultsDiv.style.cssText = 'margin-top: 30px; padding: 20px;';

    if (!data.universities || data.universities.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: #666;">No universities found matching your criteria.</p>';
    } else {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
        
        data.universities.forEach(uni => {
            html += `
                <div class="university-card" style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h3 style="color: #2563eb; margin-bottom: 10px;">${uni.name}</h3>
                    <p style="color: #666; margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> ${uni.country}</p>
                    ${uni.ranking ? `<p style="color: #666; margin-bottom: 5px;"><i class="fas fa-trophy"></i> Ranking: #${uni.ranking}</p>` : ''}
                    ${uni.tuitionRange ? `<p style="color: #666; margin-bottom: 5px;"><i class="fas fa-dollar-sign"></i> ${uni.tuitionRange}</p>` : ''}
                    ${uni.hasScholarships ? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i class="fas fa-check"></i> Scholarships Available</span>' : ''}
                    <div style="margin-top: 15px;">
                        <a href="#" onclick="viewUniversity('${uni.id}')" class="btn-secondary" style="text-decoration: none; padding: 8px 16px; border-radius: 6px;">View Details</a>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (data.notice) {
            html += `<p style="text-align: center; color: #f59e0b; margin-top: 20px;"><i class="fas fa-info-circle"></i> ${data.notice}</p>`;
        }
        
        if (data.pagination) {
            html += `<p style="text-align: center; color: #666; margin-top: 20px;">Showing ${data.universities.length} of ${data.pagination.total} universities</p>`;
        }
        
        resultsDiv.innerHTML = html;
    }

    // Insert after search section
    const searchSection = document.querySelector('.university-search');
    searchSection.appendChild(resultsDiv);
}

// View university details
async function viewUniversity(id) {
    try {
        const response = await API.universities.getById(id);
        if (response.success) {
            showUniversityModal(response.data);
        }
    } catch (error) {
        Auth.showNotification(error.message || 'Failed to load university details', 'error');
    }
}

// Show university details modal
function showUniversityModal(university) {
    // Remove existing modal
    const existingModal = document.querySelector('.university-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'university-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    let programsHtml = '';
    if (university.programs && university.programs.length > 0) {
        programsHtml = '<h4 style="margin-top: 20px;">Programs Offered:</h4><ul>';
        university.programs.forEach(prog => {
            programsHtml += `<li><strong>${prog.name}</strong> - ${prog.level} (${prog.duration})</li>`;
        });
        programsHtml += '</ul>';
    }

    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">${university.name}</h2>
                <button onclick="this.closest('.university-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Country:</strong> ${university.country}</p>
            ${university.ranking ? `<p><i class="fas fa-trophy"></i> <strong>Ranking:</strong> #${university.ranking}</p>` : ''}
            ${university.tuitionRange ? `<p><i class="fas fa-dollar-sign"></i> <strong>Tuition:</strong> ${university.tuitionRange}</p>` : ''}
            ${university.description ? `<p style="margin-top: 15px;">${university.description}</p>` : ''}
            ${university.website ? `<p><a href="${university.website}" target="_blank"><i class="fas fa-external-link-alt"></i> Visit Website</a></p>` : ''}
            ${programsHtml}
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <a href="#register" class="btn-primary" style="text-decoration: none;" onclick="this.closest('.university-modal').remove()">Apply Now</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Console welcome message
console.log('%cWelcome to Study Pro Global!', 'color: #2563eb; font-size: 20px; font-weight: bold;');
console.log('%cYour gateway to international education', 'color: #10b981; font-size: 14px;');
