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
            console.log('🚀 بدء تطبيق TON BOSS...');
            this.initializationAttempts++;
            
            // Show loader with security check
            this.updateLoaderProgress(0, 'TON BOSS - جاري التهيئة...');
            this.updateSecurityStatus('بدء الفحوصات الأمنية...');
            
            // Step 1: Check for Telegram WebApp
            if (!this.tg || !this.tg.initDataUnsafe) {
                throw new Error('تطبيق Telegram WebApp غير متاح');
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
            console.log('✅ تم تهيئة تطبيق TON BOSS بنجاح');
            this.isInitialized = true;
            this.isOfflineMode = false;
            
            // Hide loader and show app
            setTimeout(() => {
                this.updateLoaderProgress(100, 'جاهز!');
                this.hideLoader();
                this.showApp();
                this.showNotification('مرحباً!', 'TON BOSS جاهز للاستخدام', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('❌ فشل تهيئة التطبيق:', error);
            
            // Try to reconnect if we haven't exceeded max attempts
            if (this.initializationAttempts < this.maxAttempts) {
                console.log(`🔄 إعادة المحاولة... (${this.initializationAttempts}/${this.maxAttempts})`);
                this.updateSecurityStatus(`إعادة المحاولة... (${this.initializationAttempts}/${this.maxAttempts})`);
                
                setTimeout(() => {
                    this.showRetryButton();
                }, 2000);
            } else {
                this.showDatabaseError(error.message || 'فشل التهيئة');
            }
        }
    }

    /**
     * Show retry button
     */
    showRetryButton() {
        const retryButton = document.createElement('button');
        retryButton.className = 'btn btn-retry';
        retryButton.innerHTML = '<i class="fas fa-redo"></i> إعادة المحاولة';
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
                this.updateLoaderProgress(20 + (attempt * 10), 'الاتصال بقاعدة البيانات...');
                this.updateSecurityStatus(`محاولة الاتصال... (${attempt}/${maxRetries})`);
                
                await window.db.initialize();
                this.updateSecurityStatus('✅ اتصال قاعدة البيانات ناجح');
                return;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ محاولة ${attempt} فشلت:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        throw lastError || new Error('فشل الاتصال بقاعدة البيانات');
    }

    /**
     * Initialize security module
     */
    async initSecurity() {
        this.updateLoaderProgress(10, 'جاري تهيئة الأمن...');
        this.updateSecurityStatus('جاري تحميل وحدة الأمن...');
        
        this.security = new SecurityModule();
        await this.security.initialize();
        
        this.updateSecurityStatus('✅ فحوصات الأمن ناجحة');
    }

    /**
     * Load user data
     */
    async loadUserData() {
        this.updateLoaderProgress(50, 'جاري تحميل بيانات المستخدم...');
        this.updateSecurityStatus('جاري تحميل الملف الشخصي...');
        
        const tgUser = this.tg.initDataUnsafe.user;
        
        if (!tgUser || !tgUser.id) {
            throw new Error('بيانات مستخدم Telegram غير صالحة');
        }
        
        // Try to load existing user
        let userData = await window.db.getUser(tgUser.id.toString());
        
        if (!userData) {
            // Create new user
            this.updateSecurityStatus('جاري إنشاء مستخدم جديد...');
            
            userData = {
                id: tgUser.id.toString(),
                firstName: tgUser.first_name || 'مستخدم',
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
            this.updateSecurityStatus('✅ تم إنشاء مستخدم جديد');
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
            
            this.updateSecurityStatus('✅ تم تحميل الملف الشخصي');
        }
        
        this.userState = userData;
        
        // Update user activity
        await window.db.updateUserActivity(tgUser.id.toString());
    }

    /**
     * Load app statistics
     */
    async loadAppStatistics() {
        this.updateLoaderProgress(60, 'جاري تحميل الإحصائيات...');
        this.updateSecurityStatus('جاري تحميل إحصائيات التطبيق...');
        
        this.appStatistics = await window.db.getAppStatistics();
        
        // Update online users
        const onlineUsers = await window.db.getOnlineUsers();
        this.appStatistics.onlineUsers = onlineUsers;
        
        this.updateSecurityStatus('✅ تم تحميل الإحصائيات');
    }

    /**
     * Initialize components
     */
    initComponents() {
        this.updateLoaderProgress(70, 'جاري تهيئة المكونات...');
        this.updateSecurityStatus('جاري تحميل واجهة المستخدم...');
        
        // Create component instances
        this.header = new Header(this);
        this.navigation = new Navigation(this);
        this.homePage = new HomePage(this);
        this.tasksPage = new TasksPage(this);
        this.exchangePage = new ExchangePage(this);
        this.referralsPage = new ReferralsPage(this);
        this.walletPage = new WalletPage(this);
        this.walletModals = new WalletModals(this);
        
        this.updateSecurityStatus('✅ تم تحميل واجهة المستخدم');
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        this.updateLoaderProgress(80, 'جاري إعداد الأحداث...');
        this.updateSecurityStatus('جاري إعداد نظام الأحداث...');
        
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
                this.showNotification('تم استعادة الاتصال', 'جاري إعادة الاتصال بقاعدة البيانات...', 'info');
                this.reconnectToDatabase();
            }
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('فقدان الاتصال', 'تم الانتقال إلى الوضع المحلي', 'warning');
        });
        
        this.updateSecurityStatus('✅ تم إعداد نظام الأحداث');
    }

    /**
     * Reconnect to database
     */
    async reconnectToDatabase() {
        try {
            this.updateSecurityStatus('جاري إعادة الاتصال...');
            await window.db.initialize();
            await this.refreshUserData();
            this.isOfflineMode = false;
            this.showNotification('تمت إعادة الاتصال', 'جميع البيانات محدثة الآن', 'success');
        } catch (error) {
            console.error('فشل إعادة الاتصال:', error);
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
                <h2>خطأ في اتصال قاعدة البيانات</h2>
                <p class="error-message">${errorMessage}</p>
                <div class="error-details">
                    <p><strong>الوقت:</strong> ${new Date().toLocaleTimeString()}</p>
                    <p><strong>الحالة:</strong> لا يمكن الاتصال بقاعدة البيانات الحية</p>
                    <p><strong>المحاولات:</strong> ${this.initializationAttempts}/${this.maxAttempts}</p>
                </div>
                <button class="btn btn-retry" onclick="location.reload()">
                    <i class="fas fa-redo"></i> إعادة تحميل الصفحة
                </button>
                <button class="btn btn-simulate" onclick="app.simulateOfflineMode()" style="margin-top: 10px; background: var(--color-warning);">
                    <i class="fas fa-wifi-slash"></i> المتابعة في الوضع المحلي
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
        this.showNotification('الوضع المحلي', 'جاري تفعيل الوضع التجريبي...', 'info');
        
        // Remove error overlay
        const errorOverlay = document.querySelector('.database-error-overlay');
        if (errorOverlay) errorOverlay.remove();
        
        // Create mock data
        const tgUser = this.tg.initDataUnsafe.user;
        
        this.userState = {
            id: tgUser.id.toString(),
            firstName: tgUser.first_name || 'مستخدم',
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
        this.showNotification('الوضع المحلي', 'أنت الآن في الوضع المحلي التجريبي', 'warning');
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
                                <p class="user-status"><i class="fas fa-wifi-slash"></i> الوضع المحلي</p>
                            </div>
                        </div>
                        <div class="balance-info">
                            <div class="balance-item">
                                <span class="balance-label">رصيد TON</span>
                                <span class="balance-value">${this.userState.balance.toFixed(3)}</span>
                            </div>
                            <div class="balance-item">
                                <span class="balance-label">رصيد GOLD</span>
                                <span class="balance-value">${this.userState.tub.toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }
            },
            updateBalances: () => {
                console.log('تحديث الأرصدة (الوضع المحلي)');
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
                            <span>الرئيسية</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('tasks-page')">
                            <i class="fas fa-tasks"></i>
                            <span>المهام</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('exchange-page')">
                            <i class="fas fa-exchange-alt"></i>
                            <span>الصرف</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('referrals-page')">
                            <i class="fas fa-users"></i>
                            <span>الإحالات</span>
                        </div>
                        <div class="nav-item" onclick="app.renderPage('wallet-page')">
                            <i class="fas fa-wallet"></i>
                            <span>المحفظة</span>
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
                                <h2>مرحباً ${this.userState.firstName}!</h2>
                                <p>أنت في الوضع المحلي - بعض الميزات محدودة</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <i class="fas fa-users"></i>
                                    <h3>${this.appStatistics.onlineUsers.toLocaleString()}</h3>
                                    <p>مستخدم نشط</p>
                                </div>
                                <div class="stat-card">
                                    <i class="fas fa-coins"></i>
                                    <h3>${this.appStatistics.totalGoldEarned.toLocaleString()}</h3>
                                    <p>GOLD مكتسب</p>
                                </div>
                                <div class="stat-card">
                                    <i class="fas fa-gem"></i>
                                    <h3>${this.userState.tub.toLocaleString()}</h3>
                                    <p>GOLD لديك</p>
                                </div>
                            </div>
                            
                            <div class="quick-actions">
                                <button class="action-btn" onclick="app.handleWatchAd()">
                                    <i class="fas fa-play-circle"></i>
                                    <span>مشاهدة إعلان</span>
                                </button>
                                <button class="action-btn" onclick="app.showDepositModal()">
                                    <i class="fas fa-arrow-down"></i>
                                    <span>إيداع</span>
                                </button>
                                <button class="action-btn" onclick="app.showWithdrawModal()">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>سحب</span>
                                </button>
                            </div>
                            
                            <div class="offline-notice">
                                <i class="fas fa-info-circle"></i>
                                <p>الوضع المحلي: البيانات محفوظة مؤقتاً وسيتم مزامنتها عند استعادة الاتصال</p>
                            </div>
                        </div>
                    `;
                }
            },
            updateStatistics: () => {
                console.log('تحديث الإحصائيات (الوضع المحلي)');
            }
        };
        
        // Mock other pages
        this.tasksPage = {
            render: () => {
                const contentElement = document.getElementById('app-content');
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="tasks-page">
                            <h2><i class="fas fa-tasks"></i> المهام</h2>
                            <div class="offline-notice">
                                <i class="fas fa-wifi-slash"></i>
                                <p>المهام غير متاحة في الوضع المحلي</p>
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
                this.showNotification('معلومات', 'الإيداع غير متاح في الوضع المحلي', 'info');
            },
            showWithdrawModal: () => {
                this.showNotification('معلومات', 'السحب غير متاح في الوضع المحلي', 'info');
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
                throw new Error('بيانات المستخدم غير محملة');
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
                
                this.showNotification('تم التحديث', 'تم حفظ التغييرات محلياً', 'success');
                return true;
            }
            
            // Online mode - update in database
            if (this.security && !this.security.isRequestAllowed()) {
                throw new Error('تم تجاوز حد الطلبات');
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
            console.error('خطأ في تحديث بيانات المستخدم:', error);
            this.showNotification('خطأ في التحديث', error.message, 'error');
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
                
                this.showNotification('تم التحديث', 'بيانات المستخدم محدثة', 'success');
            }
            
        } catch (error) {
            console.error('خطأ في تحديث بيانات المستخدم:', error);
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
                this.showNotification('الوضع المحلي', 'كود الخصم غير متاح في الوضع المحلي', 'warning');
                return;
            }
            
            // Security check
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('تحذير', 'يرجى الانتظار قبل إجراء طلب آخر', 'warning');
                return;
            }
            
            const promoInput = document.getElementById('promoInput');
            if (!promoInput) return;
            
            const code = promoInput.value.trim().toUpperCase();
            if (!code) {
                this.showNotification('خطأ', 'يرجى إدخال كود الخصم', 'error');
                return;
            }
            
            this.showNotification('جاري المعالجة', 'جاري التحقق من كود الخصم...', 'info');
            
            // Simulate promo code check
            setTimeout(() => {
                const reward = 100;
                this.updateUserData({
                    tub: (this.userState.tub || 0) + reward
                }, 'promo_reward');
                
                this.showNotification('نجاح!', `لقد حصلت على ${reward} GOLD!`, 'success');
                promoInput.value = '';
                
            }, 1500);
            
        } catch (error) {
            console.error('خطأ في كود الخصم:', error);
            this.showNotification('خطأ', 'فشل في استخدام كود الخصم', 'error');
        }
    }

    /**
     * Handle watch ad
     */
    async handleWatchAd() {
        try {
            if (this.isOfflineMode) {
                // Simulate ad in offline mode
                this.showNotification('إعلان', 'جاري تحميل الإعلان (وضع محلي)...', 'info');
                
                setTimeout(() => {
                    const reward = 5;
                    this.userState.tub += reward;
                    this.userState.totalEarned += reward;
                    this.userState.dailyAdCount += 1;
                    
                    this.showNotification('نجاح!', `لقد حصلت على ${reward} GOLD في الوضع المحلي!`, 'success');
                    
                    // Update UI
                    if (this.header && this.header.updateBalances) {
                        this.header.updateBalances();
                    }
                }, 2000);
                return;
            }
            
            // Online mode
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('تحذير', 'يرجى الانتظار قبل إجراء طلب آخر', 'warning');
                return;
            }
            
            if (!this.userState) {
                this.showNotification('خطأ', 'بيانات المستخدم غير محملة', 'error');
                return;
            }
            
            // Get config values
            const dailyAdLimit = AppConfig?.dailyAdLimit || 20;
            const adValue = AppConfig?.adValue || 5;
            const adsPerBreak = AppConfig?.adsPerBreak || 5;
            const breakDuration = AppConfig?.breakDuration || 5;
            
            // Check daily limit
            if (this.userState.dailyAdCount >= dailyAdLimit) {
                this.showNotification('تم الوصول للحد', 'تم الوصول للحد اليومي من الإعلانات', 'warning');
                return;
            }
            
            // Check break time
            const now = Date.now();
            if (this.userState.breakUntil && now < this.userState.breakUntil) {
                const remaining = Math.ceil((this.userState.breakUntil - now) / 60000);
                this.showNotification('وقت الاستراحة', `يرجى الانتظار ${remaining} دقائق`, 'warning');
                return;
            }
            
            this.showNotification('تحميل الإعلان', 'يرجى الانتظار...', 'info');
            
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
                        description: 'مشاهدة إعلان'
                    });
                    
                    this.showNotification('مكافأة الإعلان!', `لقد حصلت على ${adValue} GOLD!`, 'success');
                    
                } catch (error) {
                    console.error('خطأ في مكافأة الإعلان:', error);
                    this.showNotification('خطأ', 'فشل في معالجة مكافأة الإعلان', 'error');
                }
            }, 2000);
            
        } catch (error) {
            console.error('خطأ في مشاهدة الإعلان:', error);
            this.showNotification('خطأ', 'فشل في مشاهدة الإعلان', 'error');
        }
    }

    /**
     * Complete a task
     */
    async completeTask(taskId) {
        try {
            if (this.isOfflineMode) {
                this.showNotification('الوضع المحلي', 'المهام غير متاحة في الوضع المحلي', 'warning');
                return;
            }
            
            if (this.security && !this.security.isRequestAllowed()) {
                this.showNotification('تحذير', 'يرجى الانتظار قبل إجراء طلب آخر', 'warning');
                return;
            }
            
            // Validate task
            const task = await window.db.validateTask(taskId);
            if (!task) {
                this.showNotification('خطأ', 'المهمة غير موجودة أو مكتملة', 'error');
                return;
            }
            
            // Open task link
            if (task.link) {
                window.open(task.link, '_blank');
            }
            
            this.showNotification('بدء المهمة', 'يرجى إكمال المهمة في النافذة المفتوحة', 'info');
            
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
                        description: `إكمال المهمة: ${task.name}`
                    });
                    
                    this.showNotification('تم إكمال المهمة!', `لقد حصلت على ${reward} GOLD!`, 'success');
                    
                } catch (error) {
                    console.error('خطأ في إكمال المهمة:', error);
                    this.showNotification('خطأ', 'فشل في إكمال المهمة', 'error');
                }
            }, 3000);
            
        } catch (error) {
            console.error('خطأ في المهمة:', error);
            this.showNotification('خطأ', 'فشل في بدء المهمة', 'error');
        }
    }

    /**
     * Show add task modal
     */
    showAddTaskModal() {
        this.showNotification('قريباً', 'ميزة إنشاء المهام ستكون متاحة قريباً', 'info');
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
