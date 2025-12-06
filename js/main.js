if (!window.AppConfig) {
    window.AppConfig = {
        security: {
            requestCooldown: 1000,
            maxRequestsPerMinute: 30,
            botVerificationEnabled: true,
            ipCheckEnabled: true,
            multiAccountProtection: true,
            rateLimitingEnabled: true
        },
        dailyAdLimit: 20,
        adValue: 5,
        adsPerBreak: 5,
        breakDuration: 5,
        exchangeRate: 10000,
        minWithdrawal: 0.10,
        minDeposit: 0.05,
        version: '2.0.0'
    };
}

if (!window.AppConfig.security) {
    window.AppConfig.security = {};
}

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
        this.initializationAttempts = 0;
        this.maxAttempts = 3;
        this.isOfflineMode = false;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Starting TON BOSS App...');
            this.initializationAttempts++;
            
            // Show loader with security check
            this.updateLoaderProgress(0, 'TON BOSS - Initializing...');
            this.updateSecurityStatus('Starting security checks...');
            
            // Step 1: Check for Telegram WebApp
            if (!this.tg || !this.tg.initDataUnsafe) {
                throw new Error('Telegram WebApp not available');
            }
            
            // Step 2: Initialize security module
            await this.initSecurity();
            
            // Step 3: Initialize Firebase database
            await this.initDatabaseWithRetry();
            
            // Step 4: Load user data
            await this.loadUserData();
            
            // Step 5: Load app statistics
            await this.loadAppStatistics();
            
            // Step 6: Initialize components
            this.initComponents();
            
            // Step 7: Setup event listeners
            this.setupGlobalEventListeners();
            
            // Complete initialization
            console.log('✅ TON BOSS App initialized successfully');
            this.isInitialized = true;
            this.isOfflineMode = false;
            
            // Hide loader and show app
            setTimeout(() => {
                this.updateLoaderProgress(100, 'Ready!');
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TON BOSS is ready to use', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            
            // Try to reconnect if we haven't exceeded max attempts
            if (this.initializationAttempts < this.maxAttempts) {
                console.log(`🔄 Retrying... (${this.initializationAttempts}/${this.maxAttempts})`);
                this.updateSecurityStatus(`Retrying... (${this.initializationAttempts}/${this.maxAttempts})`);
                
                setTimeout(() => {
                    this.showRetryButton();
                }, 2000);
            } else {
                this.showDatabaseError(error.message || 'Initialization failed');
            }
        }
    }

    /**
     * Show retry button
     */
    showRetryButton() {
        const retryButton = document.createElement('button');
        retryButton.className = 'btn btn-retry';
        retryButton.innerHTML = '<i class="fas fa-redo"></i> Retry';
        retryButton.onclick = () => {
            retryButton.remove();
            this.init();
        };
        
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.appendChild(retryButton);
        }
    }

    /**
     * Initialize database with retry logic
     */
    async initDatabaseWithRetry() {
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.updateLoaderProgress(20 + (attempt * 10), 'Connecting to database...');
                this.updateSecurityStatus(`Connection attempt... (${attempt}/${maxRetries})`);
                
                await window.db.initialize();
                this.updateSecurityStatus('✅ Database connection successful');
                return;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        throw lastError || new Error('Database connection failed');
    }

    /**
     * Initialize security module
     */
    async initSecurity() {
        this.updateLoaderProgress(10, 'Initializing security...');
        this.updateSecurityStatus('Loading security module...');
        
        this.security = new SecurityModule();
        await this.security.initialize();
        
        this.updateSecurityStatus('✅ Security checks passed');
    }

    /**
     * Load user data
     */
    async loadUserData() {
        this.updateLoaderProgress(50, 'Loading user data...');
        this.updateSecurityStatus('Loading user profile...');
        
        const tgUser = this.tg.initDataUnsafe.user;
        
        if (!tgUser || !tgUser.id) {
            throw new Error('Invalid Telegram user data');
        }
        
        // Try to load existing user
        let userData = await window.db.getUser(tgUser.id.toString());
        
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
                lastAdWatchDate: new Date().toISOString().slice(0, 10)
            };
            
            userData = await window.db.createUser(userData);
            this.updateSecurityStatus('✅ New user created');
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
            
            this.updateSecurityStatus('✅ User profile loaded');
        }
        
        this.userState = userData;
        
        // Update user activity
        await window.db.updateUserActivity(tgUser.id.toString());
    }

    /**
     * Load app statistics
     */
    async loadAppStatistics() {
        this.updateLoaderProgress(60, 'Loading statistics...');
        this.updateSecurityStatus('Loading app statistics...');
        
        this.appStatistics = await window.db.getAppStatistics();
        
        // Update online users
        const onlineUsers = await window.db.getOnlineUsers();
        this.appStatistics.onlineUsers = onlineUsers;
        
        this.updateSecurityStatus('✅ Statistics loaded');
    }

    /**
     * Initialize components
     */
    initComponents() {
        this.updateLoaderProgress(70, 'Initializing components...');
        this.updateSecurityStatus('Loading user interface...');
        
        // Create component instances
        this.header = new Header(this);
        this.navigation = new Navigation(this);
        this.homePage = new HomePage(this);
        this.tasksPage = new TasksPage(this);
        this.exchangePage = new ExchangePage(this);
        this.referralsPage = new ReferralsPage(this);
        this.walletPage = new WalletPage(this);
        this.walletModals = new WalletModals(this);
        
        this.updateSecurityStatus('✅ User interface loaded');
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        this.updateLoaderProgress(80, 'Setting up events...');
        this.updateSecurityStatus('Setting up event system...');
        
        // Handle visibility change
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
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            if (this.isOfflineMode) {
                this.showNotification('Connection Restored', 'Reconnecting to database...', 'info');
                this.reconnectToDatabase();
            }
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('Connection Lost', 'Switched to offline mode', 'warning');
        });
        
        this.updateSecurityStatus('✅ Event system ready');
    }

    /**
     * Reconnect to database
     */
    async reconnectToDatabase() {
        try {
            this.updateSecurityStatus('Reconnecting...');
            await window.db.initialize();
            await this.refreshUserData();
            this.isOfflineMode = false;
            this.showNotification('Reconnected', 'All data is now up to date', 'success');
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }

    /**
     * Update loader progress
     */
    updateLoaderProgress(percentage, text = '') {
        const progressElement = document.getElementById('loading-progress');
        const textElement = document.querySelector('.loading-text');
        
        if (progressElement) {
            progressElement.textContent = `${percentage}%`;
            const progressBar = document.querySelector('.loading-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
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
        if (this.header) this.header.render();
        if (this.navigation) this.navigation.render();
        this.renderPage('home-page');
    }

    /**
     * Show database error
     */
    showDatabaseError(errorMessage) {
        // Hide loader first
        this.hideLoader();
        
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
                    <p><strong>Attempts:</strong> ${this.initializationAttempts}/${this.maxAttempts}</p>
                </div>
                <button class="btn btn-retry" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Reload Page
                </button>
                <button class="btn btn-simulate" onclick="app.simulateOfflineMode()" style="margin-top: 10px; background: var(--color-warning);">
                    <i class="fas fa-wifi-slash"></i> Continue in Offline Mode
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Add CSS if not already added
        if (!document.querySelector('#error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .database-error-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }
                
                .database-error-content {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 400px;
                    width: 100%;
                    text-align: center;
                    border: 2px solid #4CAF50;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                .database-error-icon {
                    font-size: 4rem;
                    color: #f44336;
                    margin-bottom: 20px;
                }
                
                .database-error-content h2 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 1.5rem;
                }
                
                .error-message {
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 1rem;
                    line-height: 1.5;
                }
                
                .error-details {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 20px;
                    text-align: left;
                    font-size: 0.9rem;
                }
                
                .error-details p {
                    margin: 5px 0;
                    color: #666;
                }
                
                .error-details strong {
                    color: #333;
                }
                
                .btn-retry {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    border: none;
                    width: 100%;
                    padding: 15px;
                    font-size: 1.1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-top: 15px;
                    transition: transform 0.2s;
                }
                
                .btn-retry:hover {
                    transform: translateY(-2px);
                }
                
                .btn-simulate {
                    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                    color: white;
                    border: none;
                    width: 100%;
                    padding: 15px;
                    font-size: 1.1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .btn-simulate:hover {
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Simulate offline mode
     */
    simulateOfflineMode() {
        this.showNotification('Offline Mode', 'Activating demo mode...', 'info');
        
        // Remove error overlay
        const errorOverlay = document.querySelector('.database-error-overlay');
        if (errorOverlay) errorOverlay.remove();
        
        // Create mock data
        const tgUser = this.tg.initDataUnsafe.user;
        
        this.userState = {
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
            lastActive: Date.now()
        };
        
        this.appStatistics = {
            totalUsers: 1524,
            totalTransactions: 8923,
            totalGoldEarned: 52489,
            totalTonWithdrawn: 12.5,
            onlineUsers: 127
        };
        
        this.isOfflineMode = true;
        this.isInitialized = true;
        
        // Initialize mock components
        this.initMockComponents();
        
        // Show app in offline mode
        this.hideLoader();
        this.showApp();
        this.showNotification('Offline Mode', 'You are now in demo offline mode', 'warning');
    }

    /**
     * Initialize mock components for offline mode
     */
    initMockComponents() {
        // Mock header
        this.header = {
            render: () => {
                const headerElement = document.getElementById('app-header');
                if (headerElement) {
                    headerElement.innerHTML = `
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="user-details">
                                <h3>${this.userState.firstName} ${this.userState.lastName}</h3>
                                <p class="user-status"><i class="fas fa-wifi-slash"></i> Offline Mode</p>
                            </div>
                        </div>
                        <div class="balance-info">
                            <div class="balance-item">
                                <span class="balance-label">TON Balance</span>
                                <span class="balance-value">${this.userState.balance.toFixed(3)}</span>
                            </div>
                            <div class="balance-item">
                                <span class="balance-label">GOLD Balance</span>
                                <span class="balance-value">${this.userState.tub.toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }
            },
            updateBalances: () => {
                console.log('Updating balances (Offline Mode)');
            }
        };
        
        // Mock navigation
        this.navigation = {
            render: () => {
                const navElement = document.getElementById('app-navigation');
                if (navElement) {
                    navElement.innerHTML = `
                        <div class="nav-item active" onclick="app.renderPage('home-page')">
                            <i class="fas fa-home"></i>
                            <span>Home</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('tasks-page')">
                            <i class="fas fa-tasks"></i>
                            <span>Tasks</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('exchange-page')">
                            <i class="fas fa-exchange-alt"></i>
                            <span>Exchange</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('referrals-page')">
                            <i class="fas fa-users"></i>
                            <span>Referrals</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('wallet-page')">
                            <i class="fas fa-wallet"></i>
                            <span>Wallet</span>
                        </div>
                    `;
                }
            }
        };
        
        // Mock home page
        this.homePage = {
            render: () => {
                const contentElement = document.getElementById('app-content');
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="home-page">
                            <div class="welcome-banner">
                                <h2>Welcome ${this.userState.firstName}!</h2>
                                <p>You are in Offline Mode - Some features are limited</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <i class="fas fa-users"></i>
                                    <h3>${this.appStatistics.onlineUsers.toLocaleString()}</h3>
                                    <p>Active Users</p>
                                </div>
                                <div class="stat-card">
                                    <i class="fas fa-coins"></i>
                                    <h3>${this.appStatistics.totalGoldEarned.toLocaleString()}</h3>
                                    <p>GOLD Earned</p>
                                </div>
                                <div class="stat-card">
                                    <i class="fas fa-gem"></i>
                                    <h3>${this.userState.tub.toLocaleString()}</h3>
                                    <p>Your GOLD</p>
                                </div>
                            </div>
                            
                            <div class="quick-actions">
                                <button class="action-btn" onclick="app.handleWatchAd()">
                                    <i class="fas fa-play-circle"></i>
                                    <span>Watch Ad</span>
                                </button>
                                <button class="action-btn" onclick="app.showDepositModal()">
                                    <i class="fas fa-arrow-down"></i>
                                    <span>Deposit</span>
                                </button>
                                <button class="action-btn" onclick="app.showWithdrawModal()">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>Withdraw</span>
                                </button>
                            </div>
                            
                            <div class="offline-notice">
                                <i class="fas fa-info-circle"></i>
                                <p>Offline Mode: Data is temporarily saved and will sync when connection is restored</p>
                            </div>
                        </div>
                    `;
                }
            },
            updateStatistics: () => {
                console.log('Updating statistics (Offline Mode)');
            }
        };
        
        // Mock other pages
        this.tasksPage = {
            render: () => {
                const contentElement = document.getElementById('app-content');
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="tasks-page">
                            <h2><i class="fas fa-tasks"></i> Tasks</h2>
                            <div class="offline-notice">
                                <i class="fas fa-wifi-slash"></i>
                                <p>Tasks unavailable in Offline Mode</p>
                            </div>
                        </div>
                    `;
                }
            }
        };
        
        // Similar mock implementations for other pages...
        this.exchangePage = { render: () => {/* ... */} };
        this.referralsPage = { render: () => {/* ... */} };
        this.walletPage = { render: () => {/* ... */} };
        this.walletModals = {
            showDepositModal: () => {
                this.showNotification('Info', 'Deposit unavailable in Offline Mode', 'info');
            },
            showWithdrawModal: () => {
                this.showNotification('Info', 'Withdraw unavailable in Offline Mode', 'info');
            }
        };
    }

    /**
     * Render a specific page
     */
    renderPage(pageId) {
        this.currentPage = pageId;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length > 0) {
            const pageIndex = ['home-page', 'tasks-page', 'exchange-page', 'referrals-page', 'wallet-page'].indexOf(pageId);
            if (pageIndex >= 0 && navItems[pageIndex]) {
                navItems[pageIndex].classList.add('active');
            }
        }
        
        switch(pageId) {
            case 'home-page':
                if (this.homePage && this.homePage.render) {
                    this.homePage.render();
                }
                break;
            case 'tasks-page':
                if (this.tasksPage && this.tasksPage.render) {
                    this.tasksPage.render();
                }
                break;
            case 'exchange-page':
                if (this.exchangePage && this.exchangePage.render) {
                    this.exchangePage.render();
                }
                break;
            case 'referrals-page':
                if (this.referralsPage && this.referralsPage.render) {
                    this.referralsPage.render();
                }
                break;
            case 'wallet-page':
                if (this.walletPage && this.walletPage.render) {
                    this.walletPage.render();
                }
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
            
            // If in offline mode, update local state only
            if (this.isOfflineMode) {
                this.userState = {
                    ...this.userState,
                    ...updates,
                    updatedAt: Date.now(),
                    lastActive: Date.now()
                };
                
                // Update UI
                if (this.header && this.header.updateBalances) {
                    this.header.updateBalances();
                }
                
                this.showNotification('Updated', 'Changes saved locally', 'success');
                return true;
            }
            
            // Online mode - update in database
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
            if (this.header && this.header.updateBalances) {
                this.header.updateBalances();
            }
            
            // Update specific pages if they're active
            if (this.currentPage === 'home-page' && this.homePage && this.homePage.updateStatistics) {
                this.homePage.updateStatistics();
            } else if (this.currentPage === 'wallet-page' && this.walletPage && this.walletPage.updateWalletBalances) {
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
            if (!this.userState || this.isOfflineMode) return;
            
            const freshData = await window.db.getUser(this.userState.id);
            if (freshData) {
                this.userState = freshData;
                
                // Update UI
                if (this.header && this.header.updateBalances) {
                    this.header.updateBalances();
                }
                
                if (this.currentPage === 'home-page' && this.homePage && this.homePage.updateStatistics) {
                    this.homePage.updateStatistics();
                } else if (this.currentPage === 'wallet-page' && this.walletPage && this.walletPage.updateWalletBalances) {
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
        if (!container) {
            // Create container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'notification-container';
            newContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(newContainer);
            container = newContainer;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: ${type === 'success' ? '#4CAF50' : 
                        type === 'error' ? '#f44336' : 
                        type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
        `;
        
        notification.innerHTML = `
            <div class="notification-icon" style="margin-right: 10px; font-size: 1.2rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title" style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                <div class="notification-message" style="font-size: 0.9rem;">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            notification.style.transition = 'all 0.3s ease';
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
            if (this.isOfflineMode) {
                this.showNotification('Offline Mode', 'Promo code unavailable in offline mode', 'warning');
                return;
            }
            
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
            
            this.showNotification('Processing', 'Checking promo code...', 'info');
            
            // Simulate promo code check
            setTimeout(() => {
                const reward = 100;
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
            if (this.isOfflineMode) {
                // Simulate ad in offline mode
                this.showNotification('Ad', 'Loading ad (offline mode)...', 'info');
                
                setTimeout(() => {
                    const reward = 5;
                    this.userState.tub += reward;
                    this.userState.totalEarned += reward;
                    this.userState.dailyAdCount += 1;
                    
                    this.showNotification('Success!', `You earned ${reward} GOLD in offline mode!`, 'success');
                    
                    // Update UI
                    if (this.header && this.header.updateBalances) {
                        this.header.updateBalances();
                    }
                }, 2000);
                return;
            }
            
            // Online mode
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            if (!this.userState) {
                this.showNotification('Error', 'User data not loaded', 'error');
                return;
            }
            
            // Get config values
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
            if (this.isOfflineMode) {
                this.showNotification('Offline Mode', 'Tasks unavailable in offline mode', 'warning');
                return;
            }
            
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
        this.showNotification('Coming Soon', 'Task creation feature will be available soon', 'info');
    }

    /**
     * Show deposit modal
     */
    showDepositModal() {
        if (this.walletModals && this.walletModals.showDepositModal) {
            this.walletModals.showDepositModal();
        }
    }

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        if (this.walletModals && this.walletModals.showWithdrawModal) {
            this.walletModals.showWithdrawModal();
        }
    }

    /**
     * Show connect wallet modal
     */
    showConnectWalletModal() {
        if (this.walletModals && this.walletModals.showConnectWalletModal) {
            this.walletModals.showConnectWalletModal();
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TONBOSSApp();
});

// Make app available globally
window.app = app;
