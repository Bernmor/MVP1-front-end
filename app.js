// Movie Tracker - Main Application Script

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Element References
const viewContainer = document.getElementById('view-container');
const loadingSpinner = document.getElementById('loading-spinner');
const toastElement = document.getElementById('toast-notification');
const toast = new bootstrap.Toast(toastElement);

// User State Management
let currentUser = null;
let currentUserId = null;

// Charts References
let genresChart = null;

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners for navigation
    setupNavigation();

    // Setup authentication listeners
    setupAuthListeners();

    // Check if a user is already logged in from localStorage
    checkLoggedInUser();

    // Load the initial view based on the URL hash
    router();

    // Listen for hash changes to update the view
    window.addEventListener('hashchange', router);
});

// Router Function - Handle navigation and render appropriate views
function router() {
    const hash = window.location.hash || '#dashboard';
    const route = hash.split('/')[0];

    // Update active navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === route) {
            link.classList.add('active');
        }
    });

    // Check authentication for all routes except login/register
    if (!currentUser && route !== '#login' && route !== '#register') {
        showToast('Please log in to access the app', 'Login Required');
        renderLoginView();
        return;
    }

    // Redirect old routes
    if (route === '#movies' || route === '#my-movies') {
        window.location.hash = '#watchlist';
        return;
    }

    // Render the appropriate view
    switch (route) {
        case '#dashboard':
            renderDashboardView();
            break;
        case '#movie':
            const movieId = hash.split('/')[1];
            if (movieId) {
                renderMovieDetailView(movieId);
            } else {
                renderNotFoundView();
            }
            break;
        case '#add-movie':
            renderAddMovieView();
            break;
        case '#watchlist':
            renderWatchlistView();
            break;
        case '#watched':
            renderWatchedView();
            break;
        case '#login':
            renderLoginView();
            break;
        default:
            renderNotFoundView();
    }
}

// Simple Login View for non-authenticated users
function renderLoginView() {
    viewContainer.innerHTML = `
        <div class="login-view text-center py-5">
            <h1 class="mb-4">Welcome to Movie Tracker</h1>
            <p class="lead mb-4">Please log in or register to track your movies.</p>
            <div class="d-grid gap-3 col-md-6 mx-auto">
                <button class="btn btn-lg btn-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                    <i class="fas fa-sign-in-alt me-2"></i> Login
                </button>
                <button class="btn btn-lg btn-outline-primary" data-bs-toggle="modal" data-bs-target="#registerModal">
                    <i class="fas fa-user-plus me-2"></i> Register
                </button>
            </div>
        </div>
    `;
}

// Setup Navigation Event Listeners
function setupNavigation() {
    // Mobile navbar collapse when clicking a nav item
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                bootstrap.Collapse.getInstance(navbarCollapse).hide();
            }
        });
    });
}

// Setup Authentication Event Listeners
function setupAuthListeners() {
    // Register Form Submission
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        registerUser(username);
    });

    // Login Form Submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        loginUser(username);
    });

    // Logout Button Click
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function() {
        logoutUser();
    });
}

// Check for Logged In User
function checkLoggedInUser() {
    const savedUser = localStorage.getItem('currentUser');
    const savedUserId = localStorage.getItem('currentUserId');

    if (savedUser && savedUserId) {
        currentUser = savedUser;
        currentUserId = savedUserId;
        updateUIForLoggedInUser();
    }
}

// Update UI for Logged In User
function updateUIForLoggedInUser() {
    if (currentUser) {
        document.getElementById('user-info').classList.remove('d-none');
        document.getElementById('login-register-buttons').classList.add('d-none');
        document.getElementById('username-display').textContent = currentUser;
    } else {
        document.getElementById('user-info').classList.add('d-none');
        document.getElementById('login-register-buttons').classList.remove('d-none');
    }
}

// Register User
function registerUser(username) {
    if (!username) {
        showError('register-error', 'Username cannot be empty');
        return;
    }

    showLoading();

    fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            currentUser = data.username;
            currentUserId = data.id;

            // Save to localStorage
            localStorage.setItem('currentUser', currentUser);
            localStorage.setItem('currentUserId', currentUserId);

            // Update UI
            updateUIForLoggedInUser();

            // Close modal
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            registerModal.hide();

            // Clear form
            document.getElementById('register-username').value = '';
            document.getElementById('register-error').classList.add('d-none');

            showToast('Account created successfully!', 'Welcome');

            // Redirect to dashboard
            window.location.hash = '#dashboard';
        })
        .catch(error => {
            showError('register-error', error.message);
        })
        .finally(() => {
            hideLoading();
        });
}

// Login User
function loginUser(username) {
    if (!username) {
        showError('login-error', 'Username cannot be empty');
        return;
    }

    showLoading();

    // First fetch all users to find the one with matching username
    fetch(`${API_BASE_URL}/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        })
        .then(users => {
            const user = users.find(u => u.username === username);

            if (user) {
                currentUser = user.username;
                currentUserId = user.id;

                // Save to localStorage
                localStorage.setItem('currentUser', currentUser);
                localStorage.setItem('currentUserId', currentUserId);

                // Update UI
                updateUIForLoggedInUser();

                // Close modal
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();

                // Clear form
                document.getElementById('login-username').value = '';
                document.getElementById('login-error').classList.add('d-none');

                showToast('Logged in successfully!', 'Welcome back');

                // Redirect to dashboard
                window.location.hash = '#dashboard';
            } else {
                throw new Error('User not found');
            }
        })
        .catch(error => {
            showError('login-error', error.message);
        })
        .finally(() => {
            hideLoading();
        });
}

// Logout User
function logoutUser() {
    // Clear user data
    currentUser = null;
    currentUserId = null;

    // Remove from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');

    // Update UI
    updateUIForLoggedInUser();

    showToast('Logged out successfully', 'Goodbye');

    // Redirect to login
    window.location.hash = '#login';
}

// Render Dashboard View
function renderDashboardView() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    const template = document.getElementById('dashboard-template');
    const content = template.content.cloneNode(true);

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);

    // Show loading state
    showLoading();

    // Fetch user statistics
    fetch(`${API_BASE_URL}/users/${currentUserId}/stats`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }
            return response.json();
        })
        .then(stats => {
            // Update statistics in the DOM
            document.getElementById('watched-count').textContent = stats.total_watched || 0;
            document.getElementById('watchlist-count').textContent = stats.watchlist_count || 0;

            // Create genres chart
            createGenresChart(stats.genres || {});

            // Load recently watched movies
            loadRecentlyWatched(stats.recently_watched || []);

            // Load watchlist preview
            loadWatchlistPreview();
        })
        .catch(error => {
            console.error('Error fetching statistics:', error);
            showToast('Failed to load dashboard data', 'Error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Create Genres Chart
function createGenresChart(genresData) {
    const ctx = document.getElementById('genres-chart').getContext('2d');

    // Convert genres object to arrays for chart data
    const labels = Object.keys(genresData);
    const data = Object.values(genresData);

    // Destroy existing chart if it exists
    if (genresChart) {
        genresChart.destroy();
    }

    // Create new chart
    genresChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Movies Watched',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load Recently Watched Movies
function loadRecentlyWatched(recentMovies) {
    const recentMoviesContainer = document.getElementById('recent-movies');

    if (!recentMovies || recentMovies.length === 0) {
        recentMoviesContainer.innerHTML = createEmptyState('No movies watched yet', 'Start watching some movies!');
        return;
    }

    recentMoviesContainer.innerHTML = '';

    recentMovies.forEach(movie => {
        const recentItem = document.createElement('div');
        recentItem.className = 'recent-item';

        const ratingStars = movie.rating ? `<div class="recent-item-rating">${'★'.repeat(movie.rating)}</div>` : '';

        recentItem.innerHTML = `
            <div>
                <div class="recent-item-title">
                    <a href="#movie/${movie.id}" class="text-decoration-none">${movie.title}</a>
                </div>
                <div class="recent-item-date">${formatDate(movie.date_watched)}</div>
            </div>
            ${ratingStars}
        `;

        recentMoviesContainer.appendChild(recentItem);
    });
}

// Load Watchlist Preview
function loadWatchlistPreview() {
    fetch(`${API_BASE_URL}/users/${currentUserId}/watchlist`)
        .then(response => response.json())
        .then(watchlist => {
            const watchlistContainer = document.getElementById('watchlist-preview');

            if (!watchlist || watchlist.length === 0) {
                watchlistContainer.innerHTML = createEmptyState('Your watchlist is empty', 'Add some movies to watch later!');
                return;
            }

            // Limit to max 4 items
            const previewItems = watchlist.slice(0, 4);

            watchlistContainer.innerHTML = '';

            previewItems.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-sm-6 col-md-3 mb-4';

                col.innerHTML = `
                    <div class="movie-card">
                        <a href="#movie/${item.movie_id}" class="text-decoration-none">
                            <div class="movie-poster-container">
                                <img src="${item.cover || '/api/placeholder/300/450'}" alt="${item.title}" class="img-fluid">
                            </div>
                            <div class="movie-card-body">
                                <h5 class="movie-card-title">${item.title}</h5>
                                <div class="movie-card-meta">
                                    ${item.year} • ${item.director}
                                </div>
                            </div>
                        </a>
                        <div class="movie-card-actions">
                            <button class="btn btn-sm btn-outline-success mark-watched-btn" data-movie-id="${item.movie_id}" data-movie-title="${item.title}">
                                <i class="fas fa-check-circle me-1"></i> Watched it
                            </button>
                        </div>
                    </div>
                `;

                watchlistContainer.appendChild(col);
            });

            // Setup watched buttons
            document.querySelectorAll('.mark-watched-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const movieId = this.dataset.movieId;
                    const movieTitle = this.dataset.movieTitle;
                    openMovieActionModal(movieId, movieTitle);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching watchlist:', error);
            document.getElementById('watchlist-preview').innerHTML = createErrorState('Failed to load watchlist');
        });
}

// Render Movie Detail View
function renderMovieDetailView(movieId) {
    const template = document.getElementById('movie-detail-template');
    const content = template.content.cloneNode(true);

    // Update the back button link
    const backButton = content.querySelector('.movie-detail-view a[href="#movies"]');
    if (backButton) {
        backButton.setAttribute('href', '#watchlist');
        backButton.innerHTML = '<i class="fas fa-arrow-left me-1"></i> Back to Watchlist';
    }

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);

    // Show loading state
    showLoading();

    // Fetch movie details with user_id parameter
    fetch(`${API_BASE_URL}/movies/${movieId}?user_id=${currentUserId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Movie not found or unauthorized');
            }
            return response.json();
        })
        .then(movie => {
            // Update movie details in the DOM
            document.getElementById('movie-title').textContent = movie.title;
            document.getElementById('movie-year').textContent = movie.year;
            document.getElementById('movie-director').textContent = `Directed by ${movie.director}`;
            document.getElementById('movie-description').textContent = movie.description;

            // Remove the "added by" information since all movies are added by the current user
            const posterInfo = document.querySelector('.poster-info');
            if (posterInfo) {
                posterInfo.classList.add('d-none');
            }

            // Update poster if available
            if (movie.cover) {
                document.getElementById('movie-poster').src = movie.cover;
            }

            // Populate genres
            const genresContainer = document.getElementById('movie-genres');
            genresContainer.innerHTML = '';

            movie.genres.forEach(genre => {
                const genrePill = document.createElement('span');
                genrePill.className = 'genre-pill';
                genrePill.textContent = genre;
                genresContainer.appendChild(genrePill);
            });

            // Setup delete button
            const deleteMovieBtn = document.getElementById('delete-movie-btn');
            deleteMovieBtn.classList.remove('d-none');
            deleteMovieBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
                    deleteMovie(movie.id);
                }
            });

            // Check if movie is in user's lists
            checkMovieUserStatus(movie.id);

            // Update the action button
            updateMovieDetailButtons();
        })
        .catch(error => {
            console.error('Error fetching movie details:', error);
            renderNotFoundView();
        })
        .finally(() => {
            hideLoading();
        });
}

// Update movie detail buttons
function updateMovieDetailButtons() {
    // Replace any "Add to Lists" button with a direct "Mark as Watched" button
    const actionBtn = document.getElementById('movie-action-btn');
    if (actionBtn) {
        actionBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Mark as Watched';
        actionBtn.className = 'btn btn-success me-2';

        // Update the event listener
        const newActionBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

        newActionBtn.addEventListener('click', () => {
            const movieId = window.location.hash.split('/')[1];
            const movieTitle = document.getElementById('movie-title').textContent;
            openMovieActionModal(movieId, movieTitle);
        });
    }
}

// Check if movie is in user's watchlist or watched list
function checkMovieUserStatus(movieId) {
    const userStatusContainer = document.getElementById('user-status');
    const watchlistStatus = document.querySelector('.watchlist-status');
    const watchedStatus = document.querySelector('.watched-status');

    Promise.all([
        fetch(`${API_BASE_URL}/users/${currentUserId}/watchlist`).then(res => res.json()),
        fetch(`${API_BASE_URL}/users/${currentUserId}/watched`).then(res => res.json())
    ])
        .then(([watchlist, watched]) => {
            let isInWatchlist = false;
            let isWatched = false;
            let watchlistItemId = null;
            let watchedItemId = null;
            let watchedDetails = null;

            // Check if in watchlist
            const watchlistItem = watchlist.find(item => item.movie_id == movieId);
            if (watchlistItem) {
                isInWatchlist = true;
                watchlistItemId = watchlistItem.id;
            }

            // Check if watched
            const watchedItem = watched.find(item => item.movie_id == movieId);
            if (watchedItem) {
                isWatched = true;
                watchedItemId = watchedItem.id;
                watchedDetails = watchedItem;
            }

            // Update UI
            if (isInWatchlist || isWatched) {
                userStatusContainer.classList.remove('d-none');

                if (isInWatchlist) {
                    watchlistStatus.classList.remove('d-none');
                    const removeBtn = watchlistStatus.querySelector('.remove-watchlist-btn');
                    removeBtn.addEventListener('click', () => removeFromWatchlist(watchlistItemId));
                }

                if (isWatched) {
                    watchedStatus.classList.remove('d-none');

                    // Show watched details
                    const watchedDetailsContainer = document.getElementById('watched-details');

                    let detailsHTML = '';
                    if (watchedDetails.date_watched) {
                        detailsHTML += `<div>Watched on: ${formatDate(watchedDetails.date_watched)}</div>`;
                    }

                    if (watchedDetails.rating) {
                        detailsHTML += `<div class="watched-rating">${'★'.repeat(watchedDetails.rating)}</div>`;
                    }

                    if (watchedDetails.notes) {
                        detailsHTML += `<div class="watched-notes">${watchedDetails.notes}</div>`;
                    }

                    watchedDetailsContainer.innerHTML = detailsHTML;

                    const removeBtn = watchedStatus.querySelector('.remove-watched-btn');
                    removeBtn.addEventListener('click', () => removeFromWatched(watchedItemId));
                }

                // Hide action button if the movie is both in watchlist and watched
                if (isInWatchlist && isWatched) {
                    document.getElementById('movie-action-btn').classList.add('d-none');
                }
            }
        })
        .catch(error => {
            console.error('Error checking movie status:', error);
        });
}

// Open Movie Action Modal (simplified to only handle watched status)
function openMovieActionModal(movieId, movieTitle) {
    const modal = new bootstrap.Modal(document.getElementById('movieActionModal'));
    const modalTitle = document.getElementById('movie-action-title');

    // Set movie id in hidden input
    document.getElementById('movie-action-id').value = movieId;

    // Set modal title
    modalTitle.textContent = `Mark "${movieTitle}" as Watched`;

    // Reset form
    document.getElementById('watched-form').reset();
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
    });
    document.getElementById('movie-rating').value = 0;

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-watched').value = today;

    // Setup star rating
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            document.getElementById('movie-rating').value = rating;

            // Update stars visual
            document.querySelectorAll('.star-rating i').forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });

    // Setup form submission
    const form = document.getElementById('watched-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        markAsWatched(movieId);
        modal.hide();
    };

    modal.show();
}

// Mark as Watched
function markAsWatched(movieId) {
    const rating = parseInt(document.getElementById('movie-rating').value) || null;
    const dateWatched = document.getElementById('date-watched').value;
    const notes = document.getElementById('movie-notes').value.trim() || null;

    showLoading();

    const data = {
        movie_id: parseInt(movieId),
        rating: rating,
        notes: notes
    };

    if (dateWatched) {
        data.date_watched = new Date(dateWatched).toISOString();
    }

    fetch(`${API_BASE_URL}/users/${currentUserId}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to mark as watched');
                });
            }
            return response.json();
        })
        .then(() => {
            showToast('Movie marked as watched', 'Success');

            // Reload current page if it's the movie detail page
            if (window.location.hash.startsWith('#movie/')) {
                const movieId = window.location.hash.split('/')[1];
                renderMovieDetailView(movieId);
            } else if (window.location.hash === '#watchlist') {
                // Refresh watchlist if we're on that page
                renderWatchlistView();
            } else if (window.location.hash === '#dashboard') {
                renderDashboardView(); // this will re-run loadWatchlistPreview()
            }
        })
        .catch(error => {
            console.error('Error marking as watched:', error);
            showToast(error.message, 'Error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Remove from Watchlist
function removeFromWatchlist(itemId) {
    if (!confirm('Remove this movie from your watchlist?')) {
        return;
    }

    showLoading();

    fetch(`${API_BASE_URL}/users/${currentUserId}/watchlist/${itemId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to remove from watchlist');
            }
            return response.json();
        })
        .then(() => {
            showToast('Movie removed from your watchlist', 'Success');

            // Reload current page
            if (window.location.hash.startsWith('#movie/')) {
                const movieId = window.location.hash.split('/')[1];
                renderMovieDetailView(movieId);
            } else if (window.location.hash === '#watchlist') {
                renderWatchlistView();
            } else if (window.location.hash === '#dashboard') {
                renderDashboardView();
            }
        })
        .catch(error => {
            console.error('Error removing from watchlist:', error);
            showToast('Failed to remove from watchlist', 'Error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Remove from Watched
function removeFromWatched(itemId) {
    if (!confirm('Remove this movie from your watched list?')) {
        return;
    }

    showLoading();

    fetch(`${API_BASE_URL}/users/${currentUserId}/watched/${itemId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to remove from watched list');
            }
            return response.json();
        })
        .then(() => {
            showToast('Movie removed from your watched list', 'Success');

            // Reload current page
            if (window.location.hash.startsWith('#movie/')) {
                const movieId = window.location.hash.split('/')[1];
                renderMovieDetailView(movieId);
            } else if (window.location.hash === '#watched') {
                renderWatchedView();
            } else if (window.location.hash === '#dashboard') {
                renderDashboardView();
            }
        })
        .catch(error => {
            console.error('Error removing from watched list:', error);
            showToast('Failed to remove from watched list', 'Error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Render Watchlist View
function renderWatchlistView() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    const template = document.getElementById('watchlist-template');
    const content = template.content.cloneNode(true);

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);

    // Show loading state
    showLoading();

    // Fetch watchlist
    fetch(`${API_BASE_URL}/users/${currentUserId}/watchlist`)
        .then(response => response.json())
        .then(watchlist => {
            const container = document.getElementById('watchlist-container');

            if (!watchlist || watchlist.length === 0) {
                container.innerHTML = createEmptyState('Your watchlist is empty', 'Add some movies to watch later!');
                return;
            }

            container.innerHTML = '';

            watchlist.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4';

                col.innerHTML = `
                    <div class="list-item-card">
                        <div class="list-item-header">
                            <h5 class="list-item-title">${item.title}</h5>
                            <div class="list-item-date">Added: ${formatDate(item.date_added)}</div>
                        </div>
                        <div class="list-item-body">
                            <div class="list-item-poster">
                                <img src="${item.cover || '/api/placeholder/300/450'}" alt="${item.title}">
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-meta">
                                    ${item.year} • ${item.director} • ${item.genre}
                                </div>
                                <div class="list-item-actions">
                                    <a href="#movie/${item.movie_id}" class="btn btn-sm btn-outline-secondary">
                                        <i class="fas fa-info-circle me-1"></i> Details
                                    </a>
                                    <button class="btn btn-sm btn-success mark-watched-btn" data-movie-id="${item.movie_id}" data-movie-title="${item.title}">
                                        <i class="fas fa-check-circle me-1"></i> Watched it
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger remove-btn" data-item-id="${item.id}">
                                        <i class="fas fa-trash me-1"></i> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                container.appendChild(col);
            });

            // Setup action buttons
            document.querySelectorAll('.mark-watched-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const movieId = this.dataset.movieId;
                    const movieTitle = this.dataset.movieTitle;
                    openMovieActionModal(movieId, movieTitle);
                });
            });

            document.querySelectorAll('.remove-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    removeFromWatchlist(itemId);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching watchlist:', error);
            document.getElementById('watchlist-container').innerHTML = createErrorState('Failed to load watchlist');
        })
        .finally(() => {
            hideLoading();
        });
}

// Render Watched Movies View
function renderWatchedView() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    const template = document.getElementById('watched-template');
    const content = template.content.cloneNode(true);

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);

    // Show loading state
    showLoading();

    // Fetch watched movies
    fetch(`${API_BASE_URL}/users/${currentUserId}/watched`)
        .then(response => response.json())
        .then(watched => {
            const container = document.getElementById('watched-container');

            if (!watched || watched.length === 0) {
                container.innerHTML = createEmptyState('No movies watched yet', 'Start watching some movies!');
                return;
            }

            // Sort by date watched (newest first)
            watched.sort((a, b) => new Date(b.date_watched) - new Date(a.date_watched));

            container.innerHTML = '';

            watched.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4';

                // Create rating stars if available
                const ratingStars = item.rating
                    ? `<div class="watched-rating">${'★'.repeat(item.rating)}</div>`
                    : '';

                // Create notes section if available
                const notes = item.notes
                    ? `<div class="watched-notes">${item.notes}</div>`
                    : '';

                col.innerHTML = `
                    <div class="list-item-card">
                        <div class="list-item-header">
                            <h5 class="list-item-title">${item.title}</h5>
                            <div class="list-item-date">Watched: ${formatDate(item.date_watched)}</div>
                        </div>
                        <div class="list-item-body">
                            <div class="list-item-poster">
                                <img src="${item.cover || '/api/placeholder/300/450'}" alt="${item.title}">
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-meta">
                                    ${item.year} • ${item.director} • ${item.genre}
                                </div>
                                ${ratingStars}
                                ${notes}
                                <div class="list-item-actions mt-2">
                                    <a href="#movie/${item.movie_id}" class="btn btn-sm btn-outline-secondary">
                                        <i class="fas fa-info-circle me-1"></i> Details
                                    </a>
                                    <button class="btn btn-sm btn-outline-danger remove-btn" data-item-id="${item.id}">
                                        <i class="fas fa-trash me-1"></i> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                container.appendChild(col);
            });

            // Setup remove buttons
            document.querySelectorAll('.remove-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const itemId = this.dataset.itemId;
                    removeFromWatched(itemId);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching watched movies:', error);
            document.getElementById('watched-container').innerHTML = createErrorState('Failed to load watched movies');
        })
        .finally(() => {
            hideLoading();
        });
}

// Render Add Movie View
function renderAddMovieView() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    const template = document.getElementById('add-movie-template');
    const content = template.content.cloneNode(true);

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);

    // Set current year as the default year
    document.getElementById('movie-year').value = new Date().getFullYear();

    // Setup form submission
    document.getElementById('add-movie-form').addEventListener('submit', submitMovie);
}

// Submit Movie
function submitMovie(e) {
    e.preventDefault();

    const title = document.getElementById('movie-title').value.trim();
    const director = document.getElementById('movie-director').value.trim();
    const year = parseInt(document.getElementById('movie-year').value);
    const genre = document.getElementById('movie-genres').value.trim();
    const description = document.getElementById('movie-description').value.trim();
    const cover = document.getElementById('movie-cover').value.trim();

    // Validate inputs
    if (!title || !director || !year || !genre || !description) {
        showError('add-movie-error', 'Please fill in all required fields');
        return;
    }

    if (year < 1888 || year > 2099) {
        showError('add-movie-error', 'Please enter a valid year (1888-2099)');
        return;
    }

    showLoading();

    const movieData = {
        title,
        director,
        year,
        genre,
        description,
        user_id: parseInt(currentUserId)
    };

    if (cover) {
        movieData.cover = cover;
    }

    fetch(`${API_BASE_URL}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to add movie');
                });
            }
            return response.json();
        })
        .then(data => {
            showToast(`"${data.title}" added to your watchlist!`, 'Success');

            // Redirect to watchlist page
            window.location.hash = '#watchlist';
        })
        .catch(error => {
            showError('add-movie-error', error.message);
        })
        .finally(() => {
            hideLoading();
        });
}

// Delete Movie
function deleteMovie(movieId) {
    showLoading();

    fetch(`${API_BASE_URL}/movies/${movieId}?user_id=${currentUserId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to delete movie');
                });
            }
            return response.json();
        })
        .then(() => {
            showToast('Movie deleted successfully', 'Deleted');

            // Redirect to watchlist page
            window.location.hash = '#watchlist';
        })
        .catch(error => {
            console.error('Error deleting movie:', error);
            showToast(error.message, 'Error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Render Not Found View
function renderNotFoundView() {
    const template = document.getElementById('not-found-template');
    const content = template.content.cloneNode(true);

    // Clear the view container and append the new content
    viewContainer.innerHTML = '';
    viewContainer.appendChild(content);
}

// Helper Functions
// Format Date
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Show Loading Spinner
function showLoading() {
    loadingSpinner.classList.remove('d-none');
}

// Hide Loading Spinner
function hideLoading() {
    loadingSpinner.classList.add('d-none');
}

// Show Toast Notification
function showToast(message, title = 'Notification') {
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    toast.show();
}

// Show Error Message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

// Create Empty State
function createEmptyState(title, subtitle) {
    return `
        <div class="empty-state">
            <i class="fas fa-film"></i>
            <h4 class="mt-3">${title}</h4>
            <p class="empty-state-text">${subtitle}</p>
        </div>
    `;
}

// Create Error State
function createErrorState(message) {
    return `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h4 class="mt-3">Oops! Something went wrong</h4>
            <p class="empty-state-text">${message}</p>
        </div>
    `;
}