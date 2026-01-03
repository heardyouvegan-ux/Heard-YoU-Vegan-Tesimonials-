// Heard You Vegan - Review Page JavaScript

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
