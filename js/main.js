/**
 * Main Application Class for TON BOSS
 */
class TONBOSSApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userState = null;
        this.appStatistics = null;
        this.currentPage = 'home-page';
        
        // Components
        this.security = null;
        this.header = null;
        this.navigation = null;
        this.homePage = null;
        this.tasksPage = null;
        this.exchangePage = null;
        this.referralsPage = null;
        this.walletPage = null;
        this.walletModals = null;
        
        // State
        this.isInitialized = false;
        this.lastRequestTime = 0;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Starting TON BOSS App...');
            
            // Show loader with security check
            this.updateLoaderProgress(0, 'TON BOSS - Initializing...');
            this.updateSecurityStatus('Starting security checks...');
            
            // Initialize security module
            await this.initSecurity();
            
            // Initialize Telegram WebApp
            await this.initTelegram();
            
            // Initialize Firebase database
            await this.initDatabase();
            
            // Load user data
            await this.loadUserData();
            
            // Load app statistics
            await this.loadAppStatistics();
            
            // Initialize components
            this.initComponents();
            
            // Setup event listeners
            this.setupGlobalEventListeners();
            
            // Complete initialization
            console.log('✅ TON BOSS App initialized successfully');
            this.isInitialized = true;
            
            // Hide loader and show app
            setTimeout(() => {
                this.updateLoaderProgress(100, 'Ready!');
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TON BOSS is ready to use', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showDatabaseError(error.message || 'Initialization failed');
        }
    }

    /**
     * Initialize security module
     */
    async initSecurity() {
        this.updateLoaderProgress(10, 'Initializing security...');
        this.updateSecurityStatus('Loading security module...');
        
        this.security = new SecurityModule();
        await this.security.initialize();
        
        this.updateSecurityStatus('Security checks passed ✓');
    }

    /**
     * Initialize Telegram WebApp
     */
    async initTelegram() {
        this.updateLoaderProgress(20, 'Connecting to Telegram...');
        this.updateSecurityStatus('Verifying Telegram WebApp...');
        
        if (!this.tg || !this.tg.initDataUnsafe) {
            throw new Error('Telegram Web App not available');
        }
        
        this.tg.ready();
        this.tg.expand();
        
        // Validate Telegram user
        const tgUser = this.tg.initDataUnsafe.user;
        if (!tgUser || !tgUser.id) {
            throw new Error('Invalid Telegram user data');
        }
        
        this.updateSecurityStatus('Telegram verification passed ✓');
    }

    /**
     * Initialize database
     */
    async initDatabase() {
        this.updateLoaderProgress(30, 'Connecting to database...');
        this.updateSecurityStatus('Establishing database connection...');
        
        await window.db.initialize();
        
        this.updateSecurityStatus('Database connection established ✓');
    }

    /**
     * Load user data
     */
    async loadUserData() {
        this.updateLoaderProgress(50, 'Loading user data...');
        this.updateSecurityStatus('Loading user profile...');
        
        const tgUser = this.tg.initDataUnsafe.user;
        
        // Try to load existing user
        let userData = await window.db.getUser(tgUser.id);
        
        if (!userData) {
            // Create new user
            this.updateSecurityStatus('Creating new user profile...');
            
            userData = {
                id: tgUser.id.toString(),
                firstName: tgUser.first_name || 'User',
                lastName: tgUser.last_name || '',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || '',
                balance: 0.000,
                tub: 1000,
                referrals: 0,
                referralEarnings: 0,
                totalEarned: 0,
                dailyAdCount: 0,
                lifetimeAdCount: 0,
                breakUntil: 0,
                lastAdWatchDate: new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastActive: Date.now(),
                version: AppConfig?.version || '2.0.0'
            };
            
            userData = await window.db.createUser(userData);
            this.updateSecurityStatus('New user created ✓');
        } else {
            // Reset daily ad count if new day
            const today = new Date().toISOString().slice(0, 10);
            if (userData.lastAdWatchDate !== today) {
                userData.dailyAdCount = 0;
                userData.lastAdWatchDate = today;
                await window.db.updateUser(userData.id, {
                    dailyAdCount: 0,
                    lastAdWatchDate: today
                });
            }
            
            this.updateSecurityStatus('User profile loaded ✓');
        }
        
        this.userState = userData;
        
        // Update user activity
        await window.db.updateUserActivity(tgUser.id);
    }

    /**
     * Load app statistics
     */
    async loadAppStatistics() {
        this.updateLoaderProgress(60, 'Loading statistics...');
        
        this.appStatistics = await window.db.getAppStatistics();
        
        // Update online users
        const onlineUsers = await window.db.getOnlineUsers();
        this.appStatistics.onlineUsers = onlineUsers;
        
        this.updateSecurityStatus('Statistics loaded ✓');
    }

    /**
     * Initialize components
     */
    initComponents() {
        this.updateLoaderProgress(70, 'Initializing components...');
        
        // Create component instances
        this.header = new Header(this);
        this.navigation = new Navigation(this);
        this.homePage = new HomePage(this);
        this.tasksPage = new TasksPage(this);
        this.exchangePage = new ExchangePage(this);
        this.referralsPage = new ReferralsPage(this);
        this.walletPage = new WalletPage(this);
        this.walletModals = new WalletModals(this);
        
        this.updateSecurityStatus('Components initialized ✓');
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        this.updateLoaderProgress(80, 'Setting up events...');
        
        // Handle visibility change (update activity)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.userState) {
                window.db.updateUserActivity(this.userState.id);
            }
        });
        
        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.userState) {
                window.db.updateUserActivity(this.userState.id);
            }
        });
        
        this.updateSecurityStatus('Event listeners configured ✓');
    }

    /**
     * Update loader progress
     */
    updateLoaderProgress(percentage, text = '') {
        const progressElement = document.getElementById('loading-progress');
        const textElement = document.querySelector('.loading-text');
        
        if (progressElement) {
            progressElement.textContent = `${percentage}%`;
        }
        
        if (text && textElement) {
            textElement.textContent = text;
        }
    }

    /**
     * Update security status
     */
    updateSecurityStatus(status) {
        const securityStatus = document.querySelector('.security-status');
        if (securityStatus) {
            securityStatus.textContent = status;
        }
    }

    /**
     * Show loader
     */
    showLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    /**
     * Hide loader
     */
    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Show app
     */
    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'block';
        }
        
        // Render components
        this.header.render();
        this.navigation.render();
        this.renderPage('home-page');
    }

    /**
     * Show database error
     */
    showDatabaseError(errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'database-error-overlay';
        errorDiv.innerHTML = `
            <div class="database-error-content">
                <div class="database-error-icon">
                    <i class="fas fa-database"></i>
                </div>
                <h2>Database Connection Error</h2>
                <p class="error-message">${errorMessage}</p>
                <div class="error-details">
                    <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    <p><strong>Status:</strong> Cannot connect to live database</p>
                </div>
                <button class="btn btn-retry" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry Connection
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Add CSS for error
        const style = document.createElement('style');
        style.textContent = `
            .database-error-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--gradient-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            }
            
            .database-error-content {
                background: var(--bg-card);
                border-radius: var(--radius-large);
                padding: 30px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                border: 2px solid var(--color-accent-blue);
                box-shadow: var(--shadow-heavy);
            }
            
            .database-error-icon {
                font-size: 4rem;
                color: var(--color-accent-blue);
                margin-bottom: 20px;
            }
            
            .database-error-content h2 {
                color: var(--text-primary);
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            
            .error-message {
                color: var(--text-secondary);
                margin-bottom: 20px;
                font-size: 1rem;
                line-height: 1.5;
            }
            
            .error-details {
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-medium);
                padding: 15px;
                margin-bottom: 20px;
                text-align: left;
                font-size: 0.9rem;
            }
            
            .error-details p {
                margin: 5px 0;
                color: var(--text-secondary);
            }
            
            .error-details strong {
                color: var(--text-primary);
            }
            
            .btn-retry {
                background: var(--gradient-accent);
                width: 100%;
                padding: 15px;
                font-size: 1.1rem;
                margin-top: 15px;
            }
        `;
        document.head.appendChild(style);
        
        this.hideLoader();
    }

    /**
     * Render a specific page
     */
    renderPage(pageId) {
        this.currentPage = pageId;
        
        switch(pageId) {
            case 'home-page':
                this.homePage.render();
                break;
            case 'tasks-page':
                this.tasksPage.render();
                break;
            case 'exchange-page':
                this.exchangePage.render();
                break;
            case 'referrals-page':
                this.referralsPage.render();
                break;
            case 'wallet-page':
                this.walletPage.render();
                break;
        }
    }

    /**
     * Update user data
     */
    async updateUserData(updates, actionType = 'update') {
        try {
            if (!this.userState) {
                throw new Error('User data not loaded');
            }
            
            // Security check
            if (this.security && !this.security.isRequestAllowed()) {
                throw new Error('Rate limit exceeded');
            }
            
            // Update in database
            await window.db.updateUser(this.userState.id, updates);
            
            // Update local state
            this.userState = {
                ...this.userState,
                ...updates,
                updatedAt: Date.now(),
                lastActive: Date.now()
            };
            
            // Update UI
            this.header.updateBalances();
            
            // Update specific pages if they're active
            if (this.currentPage === 'home-page') {
                this.homePage.updateStatistics();
            } else if (this.currentPage === 'wallet-page') {
                this.walletPage.updateWalletBalances();
            }
            
            return true;
            
        } catch (error) {
            console.error('Error updating user data:', error);
            this.showNotification('Update Error', error.message, 'error');
            return false;
        }
    }

    /**
     * Refresh user data from database
     */
    async refreshUserData() {
        try {
            if (!this.userState) return;
            
            const freshData = await window.db.getUser(this.userState.id);
            if (freshData) {
                this.userState = freshData;
                
                // Update UI
                this.header.updateBalances();
                
                if (this.currentPage === 'home-page') {
                    this.homePage.updateStatistics();
                } else if (this.currentPage === 'wallet-page') {
                    this.walletPage.updateWalletBalances();
                }
                
                this.showNotification('Refreshed', 'User data updated', 'success');
            }
            
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Claim promo code
     */
    async claimPromoCode() {
        try {
            // Security check
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            const promoInput = document.getElementById('promoInput');
            if (!promoInput) return;
            
            const code = promoInput.value.trim().toUpperCase();
            if (!code) {
                this.showNotification('Error', 'Please enter a promo code', 'error');
                return;
            }
            
            // In a real app, this would validate with database
            // For now, we'll simulate
            this.showNotification('Processing', 'Checking promo code...', 'info');
            
            setTimeout(() => {
                const reward = 100; // Mock reward
                this.updateUserData({
                    tub: (this.userState.tub || 0) + reward
                }, 'promo_reward');
                
                this.showNotification('Success!', `You received ${reward} GOLD!`, 'success');
                promoInput.value = '';
                
            }, 1500);
            
        } catch (error) {
            console.error('Promo code error:', error);
            this.showNotification('Error', 'Failed to claim promo code', 'error');
        }
    }

    /**
     * Handle watch ad
     */
    async handleWatchAd() {
        try {
            // Security check
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            if (!this.userState) {
                this.showNotification('Error', 'User data not loaded', 'error');
                return;
            }
            
            // Get config values with defaults
            const dailyAdLimit = AppConfig?.dailyAdLimit || 20;
            const adValue = AppConfig?.adValue || 5;
            const adsPerBreak = AppConfig?.adsPerBreak || 5;
            const breakDuration = AppConfig?.breakDuration || 5;
            
            // Check daily limit
            if (this.userState.dailyAdCount >= dailyAdLimit) {
                this.showNotification('Limit Reached', 'Daily ad limit reached', 'warning');
                return;
            }
            
            // Check break time
            const now = Date.now();
            if (this.userState.breakUntil && now < this.userState.breakUntil) {
                const remaining = Math.ceil((this.userState.breakUntil - now) / 60000);
                this.showNotification('Break Time', `Please wait ${remaining} minutes`, 'warning');
                return;
            }
            
            // Simulate ad watching
            this.showNotification('Loading Ad', 'Please wait...', 'info');
            
            setTimeout(async () => {
                try {
                    const updates = {
                        tub: (this.userState.tub || 0) + adValue,
                        dailyAdCount: (this.userState.dailyAdCount || 0) + 1,
                        lifetimeAdCount: (this.userState.lifetimeAdCount || 0) + 1,
                        totalEarned: (this.userState.totalEarned || 0) + adValue
                    };
                    
                    // Set break if needed
                    if (adsPerBreak > 0 && (updates.dailyAdCount) % adsPerBreak === 0) {
                        updates.breakUntil = now + (breakDuration * 60000);
                    }
                    
                    await this.updateUserData(updates, 'watch_ad');
                    
                    // Record transaction
                    await window.db.createTransaction({
                        userId: this.userState.id,
                        type: 'ad_reward',
                        amount: adValue,
                        description: 'Watched ad'
                    });
                    
                    this.showNotification('Ad Rewarded!', `You earned ${adValue} GOLD!`, 'success');
                    
                    // Update tasks page if active
                    if (this.currentPage === 'tasks-page') {
                        this.tasksPage.renderAdProgress();
                        this.tasksPage.renderAdTask();
                    }
                    
                } catch (error) {
                    console.error('Ad reward error:', error);
                    this.showNotification('Error', 'Failed to process ad reward', 'error');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Watch ad error:', error);
            this.showNotification('Error', 'Failed to watch ad', 'error');
        }
    }

    /**
     * Complete a task
     */
    async completeTask(taskId) {
        try {
            // Security check
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            // Validate task
            const task = await window.db.validateTask(taskId);
            if (!task) {
                this.showNotification('Error', 'Task not found or completed', 'error');
                return;
            }
            
            // Open task link
            if (task.link) {
                window.open(task.link, '_blank');
            }
            
            this.showNotification('Task Started', 'Please complete the task in the opened window', 'info');
            
            // Simulate task completion delay
            setTimeout(async () => {
                try {
                    const reward = task.reward || 10;
                    const updates = {
                        tub: (this.userState.tub || 0) + reward,
                        totalEarned: (this.userState.totalEarned || 0) + reward
                    };
                    
                    await this.updateUserData(updates, 'task_reward');
                    
                    // Update task completion count
                    await window.db.updateTaskCompletion(taskId);
                    
                    // Record transaction
                    await window.db.createTransaction({
                        userId: this.userState.id,
                        type: 'task_reward',
                        amount: reward,
                        description: `Completed task: ${task.name}`
                    });
                    
                    this.showNotification('Task Completed!', `You earned ${reward} GOLD!`, 'success');
                    
                    // Update tasks page if active
                    if (this.currentPage === 'tasks-page') {
                        this.tasksPage.renderDynamicTasks();
                    }
                    
                } catch (error) {
                    console.error('Task completion error:', error);
                    this.showNotification('Error', 'Failed to complete task', 'error');
                }
            }, 3000);
            
        } catch (error) {
            console.error('Task error:', error);
            this.showNotification('Error', 'Failed to start task', 'error');
        }
    }

    /**
     * Show add task modal
     */
    showAddTaskModal() {
        // This would open the task creation modal
        // Implementation would be in task-modal.js
        this.showNotification('Coming Soon', 'Task creation feature will be available soon', 'info');
    }

    /**
     * Show deposit modal
     */
    showDepositModal() {
        this.walletModals.showDepositModal();
    }

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        this.walletModals.showWithdrawModal();
    }

    /**
     * Show connect wallet modal
     */
    showConnectWalletModal() {
        this.walletModals.showConnectWalletModal();
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TONBOSSApp();
});

// Make app available globally
window.app = app;
