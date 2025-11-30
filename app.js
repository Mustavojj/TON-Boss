class TonUPApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.userState = {};
        this.appStatistics = {};
        this.db = db;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Starting TonUP App...');
            this.showLoader();
            
            // Initialize Telegram Web App
            if (this.tg) {
                this.tg.ready();
                this.tg.expand();
                console.log('✅ Telegram WebApp initialized');
            } else {
                console.warn('⚠️ Telegram WebApp not found, running in standalone mode');
            }

            // Simulate user data for demo
            await this.loadDemoData();
            
            this.setupEventListeners();
            this.setupSwapSystem();
            this.renderUI();
            
            console.log('✅ App initialized successfully');
            
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TonUP is ready to use', 'success');
            }, 2000);

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showNotification('Error', 'Failed to initialize app', 'error');
            // Fallback: show app anyway
            this.hideLoader();
            this.showApp();
        }
    }

    async loadDemoData() {
        // Create demo user data
        this.userState = {
            id: 123456789,
            firstName: 'Telegram',
            lastName: 'User',
            username: 'telegram_user',
            photoUrl: '',
            balance: 2.456,
            tub: 12500,
            referrals: 12,
            referralEarnings: 45.67,
            totalEarned: 245.89,
            dailyAdCount: 3,
            lifetimeAdCount: 45,
            createdAt: new Date().toISOString()
        };

        // Demo app statistics
        this.appStatistics = {
            totalUsers: 15427,
            tasksCompleted: 89234,
            tasksCreated: 1245,
            totalEarned: 2456.78
        };

        // Initialize demo tasks
        await this.initializeDemoTasks();
    }

    async initializeDemoTasks() {
        // Demo tasks data
        const demoTasks = [
            {
                id: 'task_1',
                userId: 'demo_user_1',
                link: 'https://t.me/ton_blockchain',
                checkSubscription: true,
                targetCompletions: 5000,
                completions: 3241,
                cost: 5.0,
                status: 'active'
            },
            {
                id: 'task_2', 
                userId: 'demo_user_2',
                link: 'https://t.me/cryptohub',
                checkSubscription: false,
                targetCompletions: 2000,
                completions: 1890,
                cost: 2.0,
                status: 'active'
            },
            {
                id: 'task_3',
                userId: 'demo_user_3',
                link: 'https://t.me/defi_news',
                checkSubscription: true,
                targetCompletions: 10000,
                completions: 7560,
                cost: 10.0,
                status: 'active'
            }
        ];

        // Store demo tasks in localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('tasks', JSON.stringify(demoTasks));
        }
    }

    showLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'block';
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.currentTarget.getAttribute('data-page');
                console.log('📱 Navigating to:', pageId);
                this.showPage(pageId);
            });
        });

        // Promo code
        const promoBtn = document.getElementById('promo-btn');
        if (promoBtn) {
            promoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyPromoCode();
            });
        }

        // Copy referral link
        const copyRefBtn = document.getElementById('copy-referral-link-btn');
        if (copyRefBtn) {
            copyRefBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyReferralLink();
            });
        }

        // Withdraw form
        const withdrawForm = document.getElementById('withdraw-form');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleWithdraw();
            });
        }

        // Task creation
        const createTaskBtn = document.getElementById('create-task-btn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createTask();
            });
        }

        // Swap confirmation
        const swapBtn = document.getElementById('swap-confirm-btn');
        if (swapBtn) {
            swapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeSwap();
            });
        }

        // Copy Telegram ID
        const telegramId = document.getElementById('user-telegram-id');
        if (telegramId) {
            telegramId.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyTelegramId();
            });
        }

        // Task completion options
        const completionOptions = document.querySelectorAll('.completion-option');
        completionOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectCompletionOption(e.target);
            });
        });

        // Toggle buttons
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectToggleOption(e.target);
            });
        });

        // Modal close buttons
        const modalCloses = document.querySelectorAll('.modal-close');
        modalCloses.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        console.log('✅ Event listeners setup complete');
    }

    setupSwapSystem() {
        const tubInput = document.getElementById('swap-tub-amount');
        if (tubInput) {
            tubInput.addEventListener('input', () => {
                this.calculateSwapAmount();
            });
        }
    }

    calculateSwapAmount() {
        const tubInput = document.getElementById('swap-tub-amount');
        const tonInput = document.getElementById('swap-ton-amount');
        const swapBtn = document.getElementById('swap-confirm-btn');
        
        if (!tubInput || !tonInput || !swapBtn) return;

        const tubAmount = parseFloat(tubInput.value) || 0;
        const CONVERSION_RATE = 10000; // 10,000 GOLD = 1 TON
        const tonAmount = tubAmount / CONVERSION_RATE;
        
        tonInput.value = tonAmount.toFixed(6);
        
        // Update button state
        const hasEnoughBalance = tubAmount > 0 && tubAmount <= this.userState.tub;
        const meetsMinimum = tubAmount >= 1000; // Minimum 1000 GOLD
        
        swapBtn.disabled = !hasEnoughBalance || !meetsMinimum;
        
        if (!meetsMinimum && tubAmount > 0) {
            swapBtn.textContent = 'Minimum: 1,000 GOLD';
        } else {
            swapBtn.textContent = 'Exchange Now';
        }
    }

    showPage(pageId) {
        console.log('🔄 Showing page:', pageId);
        
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${pageId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Load page-specific data
        switch (pageId) {
            case 'home-page':
                this.renderHomePage();
                break;
            case 'tasks-page':
                this.renderTasksPage();
                break;
            case 'referrals-page':
                this.renderReferralsPage();
                break;
            case 'withdraw-page':
                this.renderWithdrawPage();
                break;
            case 'history-page':
                this.renderHistoryPage();
                break;
        }
    }

    renderUI() {
        console.log('🎨 Rendering UI...');
        
        // Update user info
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const telegramIdText = document.getElementById('telegram-id-text');
        
        if (userAvatar) {
            if (this.userState.photoUrl) {
                userAvatar.innerHTML = `<img src="${this.userState.photoUrl}" alt="User" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                const initials = this.userState.firstName.charAt(0).toUpperCase();
                userAvatar.textContent = initials;
            }
        }
        
        if (userName) {
            userName.textContent = this.userState.firstName;
        }
        
        if (telegramIdText) {
            telegramIdText.textContent = `ID: ${this.userState.id}`;
        }
        
        // Update balances
        const headerTonBalance = document.getElementById('header-ton-balance');
        const headerTubBalance = document.getElementById('header-tub-balance');
        
        if (headerTonBalance) {
            headerTonBalance.textContent = this.userState.balance.toFixed(3);
        }
        
        if (headerTubBalance) {
            headerTubBalance.textContent = Math.floor(this.userState.tub).toLocaleString();
        }
        
        // Update available balances for swap
        const availableTonBalance = document.getElementById('available-ton-balance');
        const availableTubBalance = document.getElementById('available-tub-balance');
        
        if (availableTonBalance) {
            availableTonBalance.textContent = this.userState.balance.toFixed(3);
        }
        
        if (availableTubBalance) {
            availableTubBalance.textContent = Math.floor(this.userState.tub).toLocaleString();
        }

        // Render home page
        this.renderHomePage();
        
        console.log('✅ UI rendering complete');
    }

    renderHomePage() {
        console.log('🏠 Rendering home page...');
        
        // Update statistics with real data
        const totalUsers = document.getElementById('total-users');
        const tasksCompleted = document.getElementById('tasks-completed');
        const tasksCreated = document.getElementById('tasks-created');
        const totalEarnedStat = document.getElementById('total-earned-stat');
        
        if (totalUsers) {
            totalUsers.textContent = this.appStatistics.totalUsers.toLocaleString();
        }
        
        if (tasksCompleted) {
            tasksCompleted.textContent = this.appStatistics.tasksCompleted.toLocaleString();
        }
        
        if (tasksCreated) {
            tasksCreated.textContent = this.appStatistics.tasksCreated.toLocaleString();
        }
        
        if (totalEarnedStat) {
            totalEarnedStat.textContent = this.appStatistics.totalEarned.toFixed(2);
        }

        // Load recent tasks
        this.loadRecentTasks();
    }

    async loadRecentTasks() {
        const container = document.getElementById('recent-tasks-container');
        if (!container) return;

        let tasks = [];
        try {
            tasks = await this.db.getAllTasks();
        } catch (error) {
            console.log('Using demo tasks');
            // Use demo tasks if database fails
            const demoTasks = localStorage.getItem('tasks');
            if (demoTasks) {
                tasks = JSON.parse(demoTasks);
            }
        }
        
        const recentTasks = tasks.slice(0, 3); // Show only 3 recent tasks
        
        if (recentTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Tasks Available</h3>
                    <p>Be the first to create a task!</p>
                </div>
            `;
            return;
        }

        let html = '';
        recentTasks.forEach(task => {
            const progress = ((task.completions || 0) / task.targetCompletions) * 100;
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon">
                            <i class="fas fa-external-link-alt"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">Join ${this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.checkSubscription ? 'Subscription required' : 'Visit and join'}</p>
                            <div class="task-reward">
                                <span>Earn: 10 GOLD</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-progress">
                        <div class="task-progress-info">
                            <span>Progress: ${task.completions || 0}/${task.targetCompletions}</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="task-progress-bar">
                            <div class="task-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>Available</span>
                        </div>
                        <button class="btn" onclick="app.completeTask('${task.id}')">
                            <i class="fas fa-play"></i> Start
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ... باقي الدوال تبقى كما هي مع إضافة console.log للتتبع

    showSwapModal() {
        const modal = document.getElementById('swap-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.calculateSwapAmount();
        }
    }

    closeSwapModal() {
        const modal = document.getElementById('swap-modal');
        if (modal) {
            modal.style.display = 'none';
            // Reset inputs
            const tubInput = document.getElementById('swap-tub-amount');
            const tonInput = document.getElementById('swap-ton-amount');
            if (tubInput) tubInput.value = '0';
            if (tonInput) tonInput.value = '0';
        }
    }

    showAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateTaskCost(1000); // Default to 1000 completions
        }
    }

    closeAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // ... باقي الدوال تبقى كما هي

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.log('Notification container not found');
            return;
        }

        const notificationId = 'notification-' + Date.now();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = notificationId;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const notif = document.getElementById(notificationId);
            if (notif && notif.parentNode) {
                notif.style.opacity = '0';
                notif.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    notif.parentNode.removeChild(notif);
                }, 300);
            }
        }, 5000);
    }
}

// تأكد من أن الكائن db موجود
if (typeof db === 'undefined') {
    console.log('📦 Initializing database...');
    // إنشاء كائن db بسيط للـ demo
    const db = {
        async getUser() { return null; },
        async createUser() { return null; },
        async updateUser() { return null; },
        async createTask() { return null; },
        async getUserTasks() { return []; },
        async getAllTasks() { 
            const tasks = localStorage.getItem('tasks');
            return tasks ? JSON.parse(tasks) : []; 
        },
        async updateTaskCompletion() { return null; },
        async deleteTask() { return true; },
        async getAppStatistics() { 
            return {
                totalUsers: 15427,
                tasksCompleted: 89234,
                tasksCreated: 1245,
                totalEarned: 2456.78
            };
        },
        async createTransaction() { return null; },
        async getUserTransactions() { return []; },
        async createWithdrawal() { return null; },
        async getUserWithdrawals() { return []; }
    };
    window.db = db;
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    app = new TonUPApp();
});

// Global functions for HTML onclick events
window.showPage = function(pageId) {
    if (app) app.showPage(pageId);
};

window.showAddTaskModal = function() {
    if (app) app.showAddTaskModal();
};

window.closeAddTaskModal = function() {
    if (app) app.closeAddTaskModal();
};

window.createTask = function() {
    if (app) app.createTask();
};

window.showSwapModal = function() {
    if (app) app.showSwapModal();
};

window.closeSwapModal = function() {
    if (app) app.closeSwapModal();
};
