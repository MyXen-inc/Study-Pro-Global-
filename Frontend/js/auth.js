/**
 * Study Pro Global - Authentication Handler
 * Manages user authentication state and operations
 */

const Auth = {
  /**
   * Get stored authentication token
   * @returns {string|null} - JWT token or null if not authenticated
   */
  getToken() {
    return localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
  },

  /**
   * Get stored user data
   * @returns {object|null} - User data or null if not authenticated
   */
  getUser() {
    const userData = localStorage.getItem(CONFIG.AUTH.USER_KEY);
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  },

  /**
   * Store authentication data
   * @param {string} token - JWT token
   * @param {object} user - User data
   */
  setAuth(token, user) {
    localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(user));
    this.updateUI();
  },

  /**
   * Clear authentication data (logout)
   */
  clearAuth() {
    localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(CONFIG.AUTH.USER_KEY);
    this.updateUI();
  },

  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} - Registration result
   */
  async register(userData) {
    try {
      const response = await API.auth.register(userData);
      if (response.success && response.data.token) {
        this.setAuth(response.data.token, response.data.user);
        this.showNotification('Registration successful! Welcome to Study Pro Global.', 'success');
        return { success: true, user: response.data.user };
      }
      return { success: false, error: response.error };
    } catch (error) {
      this.showNotification(error.message || 'Registration failed', 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - Login result
   */
  async login(email, password) {
    try {
      const response = await API.auth.login({ email, password });
      if (response.success && response.data.token) {
        this.setAuth(response.data.token, response.data.user);
        this.showNotification('Welcome back!', 'success');
        return { success: true, user: response.data.user };
      }
      return { success: false, error: response.error };
    } catch (error) {
      this.showNotification(error.message || 'Login failed', 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.isAuthenticated()) {
        await API.auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      this.showNotification('You have been logged out', 'info');
      window.location.hash = '#home';
    }
  },

  /**
   * Refresh user profile from API
   * @returns {Promise<object|null>} - Updated user data or null
   */
  async refreshProfile() {
    if (!this.isAuthenticated()) return null;

    try {
      const response = await API.auth.getProfile();
      if (response.success) {
        const token = this.getToken();
        this.setAuth(token, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
    return null;
  },

  /**
   * Update UI based on authentication state
   */
  updateUI() {
    const isAuth = this.isAuthenticated();
    const user = this.getUser();

    // Update navigation
    const registerBtn = document.querySelector('a[href="#register"]');
    const loginBtn = document.querySelector('a[href="#login"]');
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isAuth && user) {
      // User is logged in
      if (registerBtn) registerBtn.style.display = 'none';
      if (loginBtn) {
        loginBtn.textContent = user.fullName || 'Dashboard';
        loginBtn.href = '#dashboard';
      }
      
      // Show dashboard link if it exists
      if (dashboardLink) dashboardLink.style.display = 'block';
      
      // Create logout button if it doesn't exist
      if (!logoutBtn) {
        this.createLogoutButton();
      }
    } else {
      // User is logged out
      if (registerBtn) registerBtn.style.display = 'inline-block';
      if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = '#login';
      }
      if (dashboardLink) dashboardLink.style.display = 'none';
      if (logoutBtn) logoutBtn.remove();
    }
  },

  /**
   * Create and add logout button to navigation
   */
  createLogoutButton() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    const logoutLi = document.createElement('li');
    const logoutBtn = document.createElement('a');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.href = '#';
    logoutBtn.className = 'btn-secondary-nav';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      this.logout();
    };
    logoutLi.appendChild(logoutBtn);
    navMenu.appendChild(logoutLi);
  },

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, info, warning)
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.auth-notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-notification auth-notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">&times;</button>
    `;

    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 16px;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;

    // Set colors based on type
    const colors = {
      success: { bg: '#10b981', text: '#fff' },
      error: { bg: '#ef4444', text: '#fff' },
      info: { bg: '#3b82f6', text: '#fff' },
      warning: { bg: '#f59e0b', text: '#fff' }
    };
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;

    // Add close button style
    const closeBtn = notification.querySelector('button');
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${color.text};
      font-size: 20px;
      cursor: pointer;
      padding: 0;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  /**
   * Check if user has required subscription
   * @param {string} requiredPlan - Minimum required plan (asia, europe, global)
   * @returns {boolean}
   */
  hasSubscription(requiredPlan) {
    const user = this.getUser();
    if (!user) return false;

    const planLevels = { free: 0, asia: 1, europe: 2, global: 3 };
    const userLevel = planLevels[user.subscriptionType] || 0;
    const requiredLevel = planLevels[requiredPlan] || 0;

    return userLevel >= requiredLevel;
  },

  /**
   * Get remaining free applications
   * @returns {number}
   */
  getRemainingFreeApplications() {
    const user = this.getUser();
    if (!user) return CONFIG.APP.FREE_APPLICATIONS;
    
    if (user.subscriptionType === 'global') return Infinity;
    
    const used = user.freeApplicationsUsed || 0;
    const limit = CONFIG.PLANS[user.subscriptionType?.toUpperCase()]?.applications || CONFIG.APP.FREE_APPLICATIONS;
    
    return Math.max(0, limit - used);
  },

  /**
   * Require authentication for an action
   * @param {Function} action - Action to perform if authenticated
   * @param {string} redirectTo - URL to redirect to after login
   */
  requireAuth(action, redirectTo = null) {
    if (this.isAuthenticated()) {
      return action();
    }
    
    // Store intended action for after login
    if (redirectTo) {
      sessionStorage.setItem('authRedirect', redirectTo);
    }
    
    this.showNotification('Please login to continue', 'info');
    window.location.hash = '#login';
  }
};

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(notificationStyles);

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateUI();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
