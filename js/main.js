// Heard You Vegan - Review P// Heard You Vegan - Enhanced Review Page JavaScript with Table API Integration
// ==================================================================================

// Configuration
const CONFIG = {
    adminPassword: 'heardyouvegan2026', // Change this to your secure password
    tableName: 'reviews',
    itemsPerPage: 10
};

// State Management
let isAdminAuthenticated = false;
let currentPage = 1;
let allReviews = [];
let reviewStats = {
    total: 0,
    approved: 0,
    pending: 0,
    averageRating: 0
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeReviewPage();
});

// Initialize the review page
async function initializeReviewPage() {
    setupFormSubmission();
    setupFormValidation();
    await loadTestimonials();
    await loadReviewStats();
    setupAdminPanel();
    setupSocialSharing();
    checkAdminAuth();
}

// ==================================================================================
// FORM SUBMISSION & VALIDATION
// ==================================================================================

function setupFormSubmission() {
    const form = document.getElementById('reviewForm');
    const submitBtn = form.querySelector('.btn-submit');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button to prevent double submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Get form data with validation
        const formData = {
            customerName: sanitizeInput(document.getElementById('customerName').value),
            email: sanitizeInput(document.getElementById('email').value),
            product: document.getElementById('product').value,
            rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
            reviewTitle: sanitizeInput(document.getElementById('reviewTitle').value),
            reviewText: sanitizeInput(document.getElementById('reviewText').value),
            photoUrl: sanitizeInput(document.getElementById('photoUrl')?.value || ''),
            consent: document.getElementById('consent').checked,
            approved: false, // Reviews need approval by default
            adminReply: '',
            helpful: 0
        };
        
        // Additional validation
        if (!validateEmail(formData.email)) {
            alert('Please enter a valid email address, bestie!');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
            return;
        }
        
        try {
            // Submit the review via Table API
            const response = await fetch(`tables/${CONFIG.tableName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit review');
            }
            
            const result = await response.json();
            
            // Show success message
            form.classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            
            // Scroll to success message
            document.getElementById('successMessage').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Reload testimonials and stats
            setTimeout(async () => {
                await loadTestimonials();
                await loadReviewStats();
            }, 1000);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Oops! Something went wrong. Please try again, bestie!');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        }
    });
}

// Enhanced form validation
function setupFormValidation() {
    const form = document.getElementById('reviewForm');
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value && !validateEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }
    
    // URL validation for photo
    if (field.id === 'photoUrl' && value && !isValidUrl(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid image URL';
    }
    
    // Display validation feedback
    if (!isValid) {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    } else {
        field.classList.remove('error');
        removeFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    removeFieldError(field); // Remove existing error first
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// ==================================================================================
// TESTIMONIALS LOADING & DISPLAY
// ==================================================================================

async function loadTestimonials() {
    const testimonialsList = document.getElementById('testimonialsList');
    
    try {
        // Fetch approved reviews from Table API
        const response = await fetch(`tables/${CONFIG.tableName}?limit=100&sort=-created_at`);
        
        if (!response.ok) {
            throw new Error('Failed to load reviews');
        }
        
        const data = await response.json();
        allReviews = data.data || [];
        
        // Filter for approved reviews only
        const approvedReviews = allReviews.filter(review => review.approved === true);
        
        // Display testimonials
        if (approvedReviews.length === 0) {
            testimonialsList.innerHTML = `
                <div class="loading-message">
                    <p>Be the first to share your glow-up story! 🌟</p>
                </div>
            `;
            return;
        }
        
        testimonialsList.innerHTML = approvedReviews.map(review => createTestimonialCard(review)).join('');
        
        // Setup helpful buttons
        setupHelpfulButtons();
        
    } catch (error) {
        console.error('Error loading testimonials:', error);
        testimonialsList.innerHTML = `
            <div class="loading-message">
                <p>Unable to load reviews. Please refresh the page. 🔄</p>
            </div>
        `;
    }
}

// Create enhanced testimonial card HTML
function createTestimonialCard(review) {
    const stars = generateStarRating(review.rating);
    const date = formatDate(review.created_at);
    const productName = formatProductName(review.product);
    const photoHtml = review.photoUrl ? `<img src="${escapeHtml(review.photoUrl)}" alt="${escapeHtml(review.customerName)}" class="customer-photo">` : '';
    const adminReplyHtml = review.adminReply ? `
        <div class="admin-reply">
            <div class="admin-reply-header">
                <i class="fas fa-reply"></i>
                <strong>Response from Heard You Vegan:</strong>
            </div>
            <p>${escapeHtml(review.adminReply)}</p>
        </div>
    ` : '';
    
    return `
        <div class="testimonial-card" data-review-id="${review.id}">
            <div class="testimonial-header">
                <div class="testimonial-info">
                    ${photoHtml}
                    <div>
                        <h4>${escapeHtml(review.customerName)}</h4>
                        <p class="testimonial-product">${productName}</p>
                    </div>
                </div>
                <div class="testimonial-rating">${stars}</div>
            </div>
            <h5 class="testimonial-title">${escapeHtml(review.reviewTitle)}</h5>
            <p class="testimonial-text">${escapeHtml(review.reviewText)}</p>
            ${adminReplyHtml}
            <div class="testimonial-footer">
                <p class="testimonial-date">${date}</p>
                <div class="testimonial-actions">
                    <button class="btn-helpful" data-review-id="${review.id}" data-helpful="${review.helpful || 0}">
                        <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful || 0})
                    </button>
                    <button class="btn-share" data-review-id="${review.id}" data-title="${escapeHtml(review.reviewTitle)}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==================================================================================
// REVIEW STATISTICS & ANALYTICS
// ==================================================================================

async function loadReviewStats() {
    try {
        const response = await fetch(`tables/${CONFIG.tableName}?limit=1000`);
        
        if (!response.ok) {
            throw new Error('Failed to load review stats');
        }
        
        const data = await response.json();
        const reviews = data.data || [];
        
        // Calculate statistics
        reviewStats.total = reviews.length;
        reviewStats.approved = reviews.filter(r => r.approved).length;
        reviewStats.pending = reviews.filter(r => !r.approved).length;
        
        // Calculate average rating
        const approvedReviews = reviews.filter(r => r.approved);
        if (approvedReviews.length > 0) {
            const totalRating = approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            reviewStats.averageRating = (totalRating / approvedReviews.length).toFixed(1);
        } else {
            reviewStats.averageRating = 0;
        }
        
        // Update stats display
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error loading review stats:', error);
    }
}

function updateStatsDisplay() {
    const statsContainer = document.getElementById('reviewStats');
    
    if (!statsContainer) return;
    
    const stars = generateStarRating(Math.round(reviewStats.averageRating));
    
    statsContainer.innerHTML = `
        <div class="stats-card">
            <div class="stat-item">
                <div class="stat-number">${reviewStats.averageRating}</div>
                <div class="stat-label">${stars}</div>
                <div class="stat-sublabel">Average Rating</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${reviewStats.approved}</div>
                <div class="stat-label"><i class="fas fa-star"></i></div>
                <div class="stat-sublabel">Total Reviews</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${calculatePercentage(reviewStats.approved, 5)}%</div>
                <div class="stat-label"><i class="fas fa-heart"></i></div>
                <div class="stat-sublabel">5-Star Reviews</div>
            </div>
        </div>
    `;
}

function calculatePercentage(approved, rating) {
    if (approved === 0) return 0;
    const fiveStarReviews = allReviews.filter(r => r.approved && r.rating === rating).length;
    return Math.round((fiveStarReviews / approved) * 100);
}

// ==================================================================================
// ADMIN PANEL & AUTHENTICATION
// ==================================================================================

function setupAdminPanel() {
    const toggleBtn = document.getElementById('toggleAdmin');
    const adminPanel = document.getElementById('adminPanel');
    
    toggleBtn.addEventListener('click', function() {
        if (!isAdminAuthenticated) {
            showAdminLogin();
        } else {
            adminPanel.classList.toggle('hidden');
            if (!adminPanel.classList.contains('hidden')) {
                loadAdminReviews();
                loadAdminDashboard();
            }
        }
    });
}

function showAdminLogin() {
    const password = prompt('Enter admin password:');
    
    if (password === CONFIG.adminPassword) {
        isAdminAuthenticated = true;
        localStorage.setItem('adminAuth', 'true');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadAdminReviews();
        loadAdminDashboard();
        
        // Update button
        document.getElementById('toggleAdmin').innerHTML = '<i class="fas fa-cog"></i> Admin Panel';
    } else if (password !== null) {
        alert('Incorrect password, bestie! 🔒');
    }
}

function checkAdminAuth() {
    // Check if admin was previously authenticated (simple client-side check)
    if (localStorage.getItem('adminAuth') === 'true') {
        isAdminAuthenticated = true;
        document.getElementById('toggleAdmin').innerHTML = '<i class="fas fa-cog"></i> Admin Panel';
    }
}

async function loadAdminDashboard() {
    const dashboardContainer = document.getElementById('adminDashboard');
    
    if (!dashboardContainer) return;
    
    await loadReviewStats();
    
    dashboardContainer.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <i class="fas fa-comment-dots"></i>
                <div class="admin-stat-number">${reviewStats.total}</div>
                <div class="admin-stat-label">Total Submissions</div>
            </div>
            <div class="admin-stat-card approved">
                <i class="fas fa-check-circle"></i>
                <div class="admin-stat-number">${reviewStats.approved}</div>
                <div class="admin-stat-label">Approved Reviews</div>
            </div>
            <div class="admin-stat-card pending">
                <i class="fas fa-clock"></i>
                <div class="admin-stat-number">${reviewStats.pending}</div>
                <div class="admin-stat-label">Pending Approval</div>
            </div>
            <div class="admin-stat-card rating">
                <i class="fas fa-star"></i>
                <div class="admin-stat-number">${reviewStats.averageRating}</div>
                <div class="admin-stat-label">Average Rating</div>
            </div>
        </div>
    `;
}

async function loadAdminReviews() {
    const adminReviewsList = document.getElementById('adminReviewsList');
    
    try {
        const response = await fetch(`tables/${CONFIG.tableName}?limit=100&sort=-created_at`);
        
        if (!response.ok) {
            throw new Error('Failed to load reviews');
        }
        
        const data = await response.json();
        const reviews = data.data || [];
        
        if (reviews.length === 0) {
            adminReviewsList.innerHTML = '<p style="text-align: center; color: #666;">No reviews yet.</p>';
            return;
        }
        
        adminReviewsList.innerHTML = reviews.map(review => createAdminReviewItem(review)).join('');
        
        // Attach event listeners
        attachAdminEventListeners();
        
    } catch (error) {
        console.error('Error loading admin reviews:', error);
        adminReviewsList.innerHTML = '<p style="text-align: center; color: #e74c3c;">Error loading reviews.</p>';
    }
}

function createAdminReviewItem(review) {
    const stars = generateStarRating(review.rating);
    const date = formatDate(review.created_at);
    const productName = formatProductName(review.product);
    const status = review.approved ? 'approved' : 'pending';
    const statusText = review.approved ? 'Approved' : 'Pending';
    const photoPreview = review.photoUrl ? `<img src="${review.photoUrl}" alt="Customer photo" style="max-width: 60px; border-radius: 8px; margin-top: 10px;">` : '';
    
    return `
        <div class="admin-review-item" data-review-id="${review.id}">
            <div class="admin-review-header">
                <div>
                    <h4>${escapeHtml(review.customerName)} - ${escapeHtml(review.reviewTitle)}</h4>
                    <p style="margin: 5px 0; color: #666;">
                        ${productName} | ${stars} | ${date} | Helpful: ${review.helpful || 0}
                    </p>
                    <span class="review-status ${status}">${statusText}</span>
                </div>
                <div class="admin-review-actions">
                    ${!review.approved ? `<button class="btn-approve" data-action="approve" data-id="${review.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>` : ''}
                    <button class="btn-reply" data-action="reply" data-id="${review.id}">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-edit" data-action="edit" data-id="${review.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" data-action="delete" data-id="${review.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <p style="margin-top: 15px; color: #555;">${escapeHtml(review.reviewText)}</p>
            ${photoPreview}
            ${review.adminReply ? `<div class="admin-reply-preview"><strong>Your Reply:</strong> ${escapeHtml(review.adminReply)}</div>` : ''}
            <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                Email: ${escapeHtml(review.email)}
            </p>
        </div>
    `;
}

function attachAdminEventListeners() {
    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            approveReview(reviewId);
        });
    });
    
    // Reply buttons
    document.querySelectorAll('.btn-reply').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            replyToReview(reviewId);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            editReview(reviewId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            deleteReview(reviewId);
        });
    });
}

// ==================================================================================
// ADMIN ACTIONS (CRUD OPERATIONS)
// ==================================================================================

async function approveReview(reviewId) {
    try {
        const response = await fetch(`tables/${CONFIG.tableName}/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ approved: true })
        });
        
        if (!response.ok) {
            throw new Error('Failed to approve review');
        }
        
        // Reload admin panel and testimonials
        await loadAdminReviews();
        await loadTestimonials();
        await loadReviewStats();
        await loadAdminDashboard();
        
        alert('Review approved! It will now be visible to customers. 🎉');
        
    } catch (error) {
        console.error('Error approving review:', error);
        alert('Error approving review. Please try again.');
    }
}

async function replyToReview(reviewId) {
    try {
        // Find the review
        const response = await fetch(`tables/${CONFIG.tableName}/${reviewId}`);
        const review = await response.json();
        
        // Prompt for reply
        const replyText = prompt('Enter your reply:', review.adminReply || '');
        
        if (replyText === null) return; // User cancelled
        
        // Update review with reply
        const updateResponse = await fetch(`tables/${CONFIG.tableName}/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminReply: replyText.trim() })
        });
        
        if (!updateResponse.ok) {
            throw new Error('Failed to add reply');
        }
        
        // Reload admin panel and testimonials
        await loadAdminReviews();
        await loadTestimonials();
        
        alert('Reply added successfully! ✨');
        
    } catch (error) {
        console.error('Error adding reply:', error);
        alert('Error adding reply. Please try again.');
    }
}

async function editReview(reviewId) {
    try {
        // Find the review
        const response = await fetch(`tables/${CONFIG.tableName}/${reviewId}`);
        const review = await response.json();
        
        // Prompt for new review text
        const newReviewText = prompt('Edit review text:', review.reviewText);
        
        if (newReviewText === null || newReviewText.trim() === '') return;
        
        // Update review
        const updateResponse = await fetch(`tables/${CONFIG.tableName}/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewText: newReviewText.trim() })
        });
        
        if (!updateResponse.ok) {
            throw new Error('Failed to update review');
        }
        
        // Reload admin panel and testimonials
        await loadAdminReviews();
        await loadTestimonials();
        
        alert('Review updated successfully! ✨');
        
    } catch (error) {
        console.error('Error updating review:', error);
        alert('Error updating review. Please try again.');
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`tables/${CONFIG.tableName}/${reviewId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete review');
        }
        
        // Reload admin panel and testimonials
        await loadAdminReviews();
        await loadTestimonials();
        await loadReviewStats();
        await loadAdminDashboard();
        
        alert('Review deleted successfully.');
        
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review. Please try again.');
    }
}

// ==================================================================================
// SOCIAL SHARING & HELPFUL BUTTONS
// ==================================================================================

function setupSocialSharing() {
    // Social sharing will be setup after testimonials load
}

function setupHelpfulButtons() {
    document.querySelectorAll('.btn-helpful').forEach(btn => {
        btn.addEventListener('click', async function() {
            const reviewId = this.getAttribute('data-review-id');
            const currentHelpful = parseInt(this.getAttribute('data-helpful')) || 0;
            
            // Check if user already voted (simple localStorage check)
            const votedKey = `voted_${reviewId}`;
            if (localStorage.getItem(votedKey)) {
                alert('You\'ve already marked this review as helpful! 💚');
                return;
            }
            
            try {
                // Update helpful count
                const response = await fetch(`tables/${CONFIG.tableName}/${reviewId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ helpful: currentHelpful + 1 })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update helpful count');
                }
                
                // Mark as voted
                localStorage.setItem(votedKey, 'true');
                
                // Update button
                this.setAttribute('data-helpful', currentHelpful + 1);
                this.innerHTML = `<i class="fas fa-thumbs-up"></i> Helpful (${currentHelpful + 1})`;
                this.classList.add('voted');
                
            } catch (error) {
                console.error('Error updating helpful count:', error);
                alert('Error recording your vote. Please try again.');
            }
        });
    });
    
    document.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewTitle = this.getAttribute('data-title');
            shareReview(reviewTitle);
        });
    });
}

function shareReview(reviewTitle) {
    const url = window.location.href;
    const text = `Check out this review: "${reviewTitle}" - Heard You Vegan`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: reviewTitle,
            text: text,
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        const shareUrl = `${url}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copied to clipboard! Share it with your friends! 🌟');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            // Manual fallback
            prompt('Copy this link to share:', shareUrl);
        });
    }
}

// ==================================================================================
// UTILITY FUNCTIONS
// ==================================================================================

function generateStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function formatProductName(product) {
    const productNames = {
        'meal-plan': 'Meal Plan',
        'recipe-ebook': 'Recipe eBook',
        'wellness-guide': 'Wellness Guide',
        'coaching-session': 'Coaching Session',
        'other': 'Other Product/Service'
    };
    return productNames[product] || product;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeInput(input) {
    if (!input) return '';
    // Remove any HTML tags and trim
    return input.replace(/<[^>]*>/g, '').trim();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
age JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeReviewPage();
});

// Initialize the review page
function initializeReviewPage() {
    setupFormSubmission();
    loadTestimonials();
    setupAdminPanel();
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('reviewForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            customerName: document.getElementById('customerName').value,
            email: document.getElementById('email').value,
            product: document.getElementById('product').value,
            rating: document.querySelector('input[name="rating"]:checked').value,
            reviewTitle: document.getElementById('reviewTitle').value,
            reviewText: document.getElementById('reviewText').value,
            consent: document.getElementById('consent').checked,
            approved: false, // Reviews need approval by default
            createdAt: new Date().toISOString()
        };
        
        try {
            // Submit the review
            await submitReview(formData);
            
            // Show success message
            form.classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            
            // Scroll to success message
            document.getElementById('successMessage').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Reload testimonials
            setTimeout(() => {
                loadTestimonials();
            }, 1000);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Oops! Something went wrong. Please try again, bestie!');
        }
    });
}

// Submit review to storage
async function submitReview(reviewData) {
    // Store in localStorage for demo purposes
    // In production, this would be sent to a backend API
    
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    // Add unique ID
    reviewData.id = 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    reviews.push(reviewData);
    localStorage.setItem('heardYouVeganReviews', JSON.stringify(reviews));
    
    return reviewData;
}

// Load and display testimonials
function loadTestimonials() {
    const testimonialsList = document.getElementById('testimonialsList');
    
    // Get reviews from localStorage
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    // Filter for approved reviews only
    const approvedReviews = reviews.filter(review => review.approved === true);
    
    // Sort by date (newest first)
    approvedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display testimonials
    if (approvedReviews.length === 0) {
        testimonialsList.innerHTML = `
            <div class="loading-message">
                <p>Be the first to share your glow-up story! 🌟</p>
            </div>
        `;
        return;
    }
    
    testimonialsList.innerHTML = approvedReviews.map(review => createTestimonialCard(review)).join('');
}

// Create testimonial card HTML
function createTestimonialCard(review) {
    const stars = generateStarRating(review.rating);
    const date = formatDate(review.createdAt);
    const productName = formatProductName(review.product);
    
    return `
        <div class="testimonial-card">
            <div class="testimonial-header">
                <div class="testimonial-info">
                    <h4>${escapeHtml(review.customerName)}</h4>
                    <p class="testimonial-product">${productName}</p>
                </div>
                <div class="testimonial-rating">${stars}</div>
            </div>
            <h5 class="testimonial-title">${escapeHtml(review.reviewTitle)}</h5>
            <p class="testimonial-text">${escapeHtml(review.reviewText)}</p>
            <p class="testimonial-date">${date}</p>
        </div>
    `;
}

// Generate star rating HTML
function generateStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Format product name
function formatProductName(product) {
    const productNames = {
        'meal-plan': 'Meal Plan',
        'recipe-ebook': 'Recipe eBook',
        'wellness-guide': 'Wellness Guide',
        'coaching-session': 'Coaching Session',
        'other': 'Other Product/Service'
    };
    return productNames[product] || product;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup admin panel
function setupAdminPanel() {
    const toggleBtn = document.getElementById('toggleAdmin');
    const adminPanel = document.getElementById('adminPanel');
    
    toggleBtn.addEventListener('click', function() {
        adminPanel.classList.toggle('hidden');
        if (!adminPanel.classList.contains('hidden')) {
            loadAdminReviews();
        }
    });
}

// Load reviews in admin panel
function loadAdminReviews() {
    const adminReviewsList = document.getElementById('adminReviewsList');
    
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (reviews.length === 0) {
        adminReviewsList.innerHTML = '<p style="text-align: center; color: #666;">No reviews yet.</p>';
        return;
    }
    
    adminReviewsList.innerHTML = reviews.map(review => createAdminReviewItem(review)).join('');
    
    // Attach event listeners
    attachAdminEventListeners();
}

// Create admin review item HTML
function createAdminReviewItem(review) {
    const stars = generateStarRating(review.rating);
    const date = formatDate(review.createdAt);
    const productName = formatProductName(review.product);
    const status = review.approved ? 'approved' : 'pending';
    const statusText = review.approved ? 'Approved' : 'Pending';
    
    return `
        <div class="admin-review-item" data-review-id="${review.id}">
            <div class="admin-review-header">
                <div>
                    <h4>${escapeHtml(review.customerName)} - ${escapeHtml(review.reviewTitle)}</h4>
                    <p style="margin: 5px 0; color: #666;">
                        ${productName} | ${stars} | ${date}
                    </p>
                    <span class="review-status ${status}">${statusText}</span>
                </div>
                <div class="admin-review-actions">
                    ${!review.approved ? `<button class="btn-approve" data-action="approve" data-id="${review.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>` : ''}
                    <button class="btn-edit" data-action="edit" data-id="${review.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" data-action="delete" data-id="${review.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <p style="margin-top: 15px; color: #555;">${escapeHtml(review.reviewText)}</p>
            <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                Email: ${escapeHtml(review.email)}
            </p>
        </div>
    `;
}

// Attach event listeners to admin buttons
function attachAdminEventListeners() {
    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            approveReview(reviewId);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            editReview(reviewId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-id');
            deleteReview(reviewId);
        });
    });
}

// Approve review
function approveReview(reviewId) {
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
        reviews[reviewIndex].approved = true;
        localStorage.setItem('heardYouVeganReviews', JSON.stringify(reviews));
        
        // Reload admin panel and testimonials
        loadAdminReviews();
        loadTestimonials();
        
        alert('Review approved! It will now be visible to customers. 🎉');
    }
}

// Edit review
function editReview(reviewId) {
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    // Prompt for new review text
    const newReviewText = prompt('Edit review text:', review.reviewText);
    
    if (newReviewText !== null && newReviewText.trim() !== '') {
        review.reviewText = newReviewText.trim();
        localStorage.setItem('heardYouVeganReviews', JSON.stringify(reviews));
        
        // Reload admin panel and testimonials
        loadAdminReviews();
        loadTestimonials();
        
        alert('Review updated successfully! ✨');
    }
}

// Delete review
function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    let reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    reviews = reviews.filter(r => r.id !== reviewId);
    localStorage.setItem('heardYouVeganReviews', JSON.stringify(reviews));
    
    // Reload admin panel and testimonials
    loadAdminReviews();
    loadTestimonials();
    
    alert('Review deleted successfully.');
}

// Add some sample reviews for demonstration (only on first load)
function addSampleReviews() {
    const reviews = JSON.parse(localStorage.getItem('heardYouVeganReviews') || '[]');
    
    if (reviews.length === 0) {
        const sampleReviews = [
            {
                id: 'sample_1',
                customerName: 'Jasmine T.',
                email: 'jasmine@example.com',
                product: 'meal-plan',
                rating: '5',
                reviewTitle: 'Life-Changing Meal Plan!',
                reviewText: 'Honey, this meal plan is everything! Not only are the recipes delicious, but they\'re so easy to follow. I\'ve been glowing from the inside out, and I finally feel confident in the kitchen. This is exactly what I needed!',
                consent: true,
                approved: true,
                createdAt: new Date('2026-01-01').toISOString()
            },
            {
                id: 'sample_2',
                customerName: 'Maya R.',
                email: 'maya@example.com',
                product: 'recipe-ebook',
                rating: '5',
                reviewTitle: 'Southern Comfort Meets Healthy Living',
                reviewText: 'As a Southern girl trying to live healthier, this recipe book hits different! The flavors remind me of home but without the guilt. I\'m obsessed with the vegan mac and cheese recipe. Thank you for making healthy eating feel luxurious!',
                consent: true,
                approved: true,
                createdAt: new Date('2025-12-28').toISOString()
            },
            {
                id: 'sample_3',
                customerName: 'Keisha M.',
                email: 'keisha@example.com',
                product: 'wellness-guide',
                rating: '5',
                reviewTitle: 'Finally, a Guide That Gets Me!',
                reviewText: 'This wellness guide spoke to my soul! It\'s not just about food—it\'s about the whole lifestyle. The tips are practical, the advice is solid, and I love that it celebrates our culture while promoting health. 10/10 would recommend!',
                consent: true,
                approved: true,
                createdAt: new Date('2025-12-25').toISOString()
            }
        ];
        
        localStorage.setItem('heardYouVeganReviews', JSON.stringify(sampleReviews));
    }
}

// Initialize sample reviews
addSampleReviews();
