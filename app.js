class TonUPApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.userState = null;
        this.appStatistics = null;
        this.db = window.db;
        this.isInitialized = false;
        this.lastRequestTime = 0;
        this.REQUEST_COOLDOWN = 1000;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('🚀 Starting TonUP App...');
            this.showLoader();
            
            // التحقق من اتصال قاعدة البيانات
            await this.checkDatabaseConnection();
            
            // تهيئة Telegram Web App
            if (this.tg && this.tg.initDataUnsafe) {
                this.tg.ready();
                this.tg.expand();
                console.log('✅ Telegram WebApp initialized');
                
                // تحميل بيانات المستخدم الفعلية
                const tgUser = this.tg.initDataUnsafe.user;
                if (tgUser && tgUser.id) {
                    await this.loadActualUserData(tgUser);
                } else {
                    throw new Error('No Telegram user data available');
                }
            } else {
                throw new Error('Telegram Web App not available');
            }
            
            // تحميل الإحصائيات الفعلية
            await this.loadActualStatistics();
            
            // إعداد الأنظمة
            this.setupEventListeners();
            this.setupSwapSystem();
            this.setupTaskTypeSelection();
            this.renderUI();
            
            console.log('✅ App initialized successfully');
            this.isInitialized = true;
            
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TonUP is connected to live database', 'success');
            }, 1000);

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            
            // إظهار رسالة خطأ واضحة
            this.showDatabaseError(error.message || 'Failed to connect to database');
            
            this.hideLoader();
            
            // إظهار واجهة مع رسالة خطأ
            this.showAppWithError('Database Connection Failed', 
                'Cannot connect to live database. Please check your connection and try again.');
        }
    }

    // التحقق من اتصال قاعدة البيانات
    async checkDatabaseConnection() {
        console.log('🔗 Checking database connection...');
        
        try {
            // انتظار تهيئة قاعدة البيانات
            await new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    const status = this.db.getConnectionStatus();
                    if (status.status === 'connected') {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (status.status === 'error') {
                        clearInterval(checkInterval);
                        reject(new Error(`Database connection failed: ${status.error}`));
                    }
                }, 100);
                
                // مهلة 10 ثواني
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Database connection timeout (10s)'));
                }, 10000);
            });
            
            console.log('✅ Database connection verified');
        } catch (error) {
            console.error('❌ Database connection check failed:', error);
            throw error;
        }
    }

    // عرض خطأ قاعدة البيانات
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
                    <p><strong>URL:</strong> https://ztjokngpzbsuykwpcscz.supabase.co</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                </div>
                <button class="btn btn-retry" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry Connection
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // إضافة CSS للخطأ
        const style = document.createElement('style');
        style.textContent = `
            .database-error-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--tg-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            }
            
            .database-error-content {
                background: var(--tg-secondary);
                border-radius: var(--radius-large);
                padding: 30px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                border: 2px solid var(--tg-danger);
                box-shadow: var(--shadow-heavy);
            }
            
            .database-error-icon {
                font-size: 4rem;
                color: var(--tg-danger);
                margin-bottom: 20px;
            }
            
            .database-error-content h2 {
                color: var(--tg-text);
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            
            .error-message {
                color: var(--tg-text-secondary);
                margin-bottom: 20px;
                font-size: 1rem;
                line-height: 1.5;
            }
            
            .error-details {
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-small);
                padding: 15px;
                margin-bottom: 20px;
                text-align: left;
                font-size: 0.9rem;
            }
            
            .error-details p {
                margin: 5px 0;
                color: var(--tg-text-secondary);
            }
            
            .error-details strong {
                color: var(--tg-text);
            }
            
            .btn-retry {
                background: var(--tg-accent);
                width: 100%;
                padding: 15px;
                font-size: 1.1rem;
                margin-top: 15px;
            }
            
            .btn-retry:hover {
                background: var(--tg-accent-hover);
            }
        `;
        document.head.appendChild(style);
    }

    // إظهار التطبيق مع رسالة خطأ
    showAppWithError(title, message) {
        const app = document.getElementById('app');
        app.style.display = 'block';
        
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // إظهار صفحة الخطأ
        const errorPage = document.createElement('div');
        errorPage.className = 'page active';
        errorPage.id = 'error-page';
        errorPage.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        
        document.querySelector('.main-content').appendChild(errorPage);
        
        // إخفاء التنقل السفلي
        document.querySelector('.bottom-nav').style.display = 'none';
        document.querySelector('.floating-add-btn').style.display = 'none';
    }

    async loadActualUserData(tgUser) {
        try {
            console.log('👤 Loading actual user data from database...');
            
            // محاولة جلب المستخدم من قاعدة البيانات
            let userData = await this.db.getUser(tgUser.id);
            
            if (!userData) {
                console.log('📝 Creating new user in database...');
                // إنشاء مستخدم جديد ببيانات التلغرام الفعلية
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
                    lifetimeAdCount: 0
                };
                
                userData = await this.db.createUser(userData);
                console.log('✅ New user created in database');
            }
            
            this.currentUser = userData;
            this.userState = userData;
            console.log('✅ User data loaded from database:', this.userState);
            
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            throw new Error(`Cannot load user data: ${error.message}`);
        }
    }

    async loadActualStatistics() {
        try {
            console.log('📊 Loading actual statistics from database...');
            
            const stats = await this.db.getAppStatistics();
            
            this.appStatistics = stats;
            console.log('✅ Actual statistics loaded:', this.appStatistics);
            
        } catch (error) {
            console.error('❌ Failed to load statistics:', error);
            throw new Error(`Cannot load statistics: ${error.message}`);
        }
    }

    // Request cooldown check
    canMakeRequest() {
        const now = Date.now();
        if (now - this.lastRequestTime < this.REQUEST_COOLDOWN) {
            this.showNotification('Warning', 'Please wait before making another request', 'warning');
            return false;
        }
        this.lastRequestTime = now;
        return true;
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Quick actions
        document.getElementById('promo-btn')?.addEventListener('click', () => this.claimPromoCode());
        document.getElementById('promoInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.claimPromoCode();
        });

        // Referrals
        document.getElementById('copy-referral-link-btn')?.addEventListener('click', () => this.copyReferralLink());

        // Swap modal
        document.getElementById('swap-tub-amount')?.addEventListener('input', (e) => this.calculateSwapAmount(e.target.value));
        document.getElementById('swap-confirm-btn')?.addEventListener('click', () => this.confirmSwap());

        // Withdraw modal
        document.getElementById('withdraw-confirm-btn')?.addEventListener('click', () => this.confirmWithdrawal());

        // Add task modal
        document.getElementById('create-task-btn')?.addEventListener('click', () => this.createTask());

        // Task type selection
        document.querySelectorAll('.task-type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.task-type-option').forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateTaskCost();
            });
        });

        // Completion options
        document.querySelectorAll('.completion-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.completion-option').forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateTaskCost();
            });
        });
    }

    setupSwapSystem() {
        this.swapRate = 10000; // 10,000 GOLD = 1 TON
    }

    setupTaskTypeSelection() {
        this.updateTaskCost();
    }

    updateTaskCost() {
        const completionsElement = document.querySelector('.completion-option.active');
        if (!completionsElement) return;

        const completions = parseInt(completionsElement.dataset.value);
        const cost = completions / 1000;

        document.getElementById('task-cost').textContent = cost.toFixed(3);
        document.getElementById('task-cost-btn').textContent = cost.toFixed(3) + ' TON';
    }

    calculateSwapAmount(tubAmount) {
        const tonAmount = tubAmount / this.swapRate;
        document.getElementById('swap-ton-amount').value = tonAmount.toFixed(6);
        
        // Update available balances
        this.updateSwapBalances();
    }

    updateSwapBalances() {
        if (!this.userState) return;
        
        document.getElementById('available-tub-balance').textContent = this.userState.tub.toLocaleString();
        document.getElementById('available-ton-balance').textContent = this.userState.balance.toFixed(3);
    }

    showLoader() {
        document.getElementById('app-loader').style.display = 'flex';
    }

    hideLoader() {
        document.getElementById('app-loader').style.display = 'none';
    }

    showApp() {
        document.getElementById('app').style.display = 'block';
        document.querySelector('.floating-add-btn').style.display = 'flex';
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });

        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === pageId) {
                btn.classList.add('active');
            }
        });

        // Load page-specific content
        if (pageId === 'tasks-page') {
            this.renderTasksPage();
        } else if (pageId === 'wallet-page') {
            this.renderWalletPage();
        }
    }

    updateBalances() {
        if (!this.userState) return;
        
        document.getElementById('header-tub-balance').textContent = this.userState.tub.toLocaleString();
        document.getElementById('header-ton-balance').textContent = this.userState.balance.toFixed(3);
        
        document.getElementById('wallet-gold-balance').textContent = this.userState.tub.toLocaleString();
        document.getElementById('wallet-ton-balance').textContent = this.userState.balance.toFixed(3);
        
        document.getElementById('referrals-total-count').textContent = this.userState.referrals;
        document.getElementById('referrals-total-earnings').textContent = this.userState.referralEarnings.toFixed(2);
    }

    renderHomePage() {
        if (!this.appStatistics) return;
        
        document.getElementById('total-users').textContent = this.appStatistics.totalUsers.toLocaleString();
        document.getElementById('online-users').textContent = this.appStatistics.onlineUsers.toLocaleString();
        document.getElementById('tasks-created').textContent = this.appStatistics.tasksCreated.toLocaleString();
        document.getElementById('tasks-completed').textContent = this.appStatistics.tasksCompleted.toLocaleString();
        
        this.updateBalances();
    }

    renderUI() {
        if (!this.userState) return;
        
        // Update user info
        document.getElementById('user-name').textContent = this.userState.firstName;
        document.getElementById('telegram-id-text').textContent = `ID: ${this.userState.id}`;
        
        if (this.userState.photoUrl) {
            document.getElementById('user-avatar').innerHTML = `<img src="${this.userState.photoUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }

        // Update referral link
        document.getElementById('referral-link-input').value = `https://t.me/your_bot?start=${this.userState.id}`;

        // Render home page
        this.renderHomePage();
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
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
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getTaskTypeIcon(type) {
        const icons = {
            channel: 'broadcast-tower',
            group: 'users',
            bot: 'robot',
            other: 'link'
        };
        return icons[type] || 'link';
    }

    getDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    // Modal functions
    showAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'flex';
        this.loadUserTasksInModal();
    }

    closeAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'none';
        // Reset form
        document.getElementById('task-name').value = '';
        document.getElementById('task-link').value = '';
    }

    showSwapModal() {
        document.getElementById('swap-modal').style.display = 'flex';
        this.updateSwapBalances();
        document.getElementById('swap-tub-amount').value = '';
        document.getElementById('swap-ton-amount').value = '';
    }

    closeSwapModal() {
        document.getElementById('swap-modal').style.display = 'none';
    }

    showWithdrawModal() {
        document.getElementById('withdraw-modal').style.display = 'flex';
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-address').value = '';
    }

    closeWithdrawModal() {
        document.getElementById('withdraw-modal').style.display = 'none';
    }

    // Action functions
    async confirmSwap() {
        if (!this.canMakeRequest()) return;
        if (!this.userState) {
            this.showNotification('Error', 'User data not loaded', 'error');
            return;
        }

        const tubAmount = parseFloat(document.getElementById('swap-tub-amount').value);
        const tonAmount = parseFloat(document.getElementById('swap-ton-amount').value);

        if (!tubAmount || tubAmount <= 0) {
            this.showNotification('Error', 'Please enter a valid amount', 'error');
            return;
        }

        if (tubAmount > this.userState.tub) {
            this.showNotification('Error', 'Insufficient GOLD balance', 'error');
            return;
        }

        try {
            const newTub = this.userState.tub - tubAmount;
            const newBalance = this.userState.balance + tonAmount;

            await this.db.updateUser(this.userState.id, {
                tub: newTub,
                balance: newBalance
            });

            this.userState.tub = newTub;
            this.userState.balance = newBalance;

            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'swap',
                amount: tonAmount,
                description: `Exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`
            });

            this.showNotification('Success', `Successfully exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`, 'success');
            this.closeSwapModal();
            this.updateBalances();

        } catch (error) {
            console.error('Swap failed:', error);
            this.showNotification('Error', `Exchange failed: ${error.message}`, 'error');
        }
    }

    async confirmWithdrawal() {
        if (!this.canMakeRequest()) return;
        if (!this.userState) {
            this.showNotification('Error', 'User data not loaded', 'error');
            return;
        }

        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const address = document.getElementById('withdraw-address').value.trim();

        if (!amount || amount < 0.05) {
            this.showNotification('Error', 'Minimum withdrawal is 0.05 TON', 'error');
            return;
        }

        if (amount > this.userState.balance) {
            this.showNotification('Error', 'Insufficient TON balance', 'error');
            return;
        }

        if (!address) {
            this.showNotification('Error', 'Please enter your TON wallet address', 'error');
            return;
        }

        try {
            const newBalance = this.userState.balance - amount;

            await this.db.updateUser(this.userState.id, {
                balance: newBalance
            });

            this.userState.balance = newBalance;

            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrew ${amount} TON to ${address}`,
                status: 'pending'
            });

            this.showNotification('Success', `Withdrawal request for ${amount} TON submitted!`, 'success');
            this.closeWithdrawModal();
            this.updateBalances();

        } catch (error) {
            console.error('Withdrawal failed:', error);
            this.showNotification('Error', `Withdrawal failed: ${error.message}`, 'error');
        }
    }

    claimPromoCode() {
        if (!this.canMakeRequest()) return;
        this.showNotification('Info', 'Promo code feature coming soon!', 'info');
    }

    copyReferralLink() {
        const input = document.getElementById('referral-link-input');
        input.select();
        document.execCommand('copy');
        this.showNotification('Success', 'Referral link copied!', 'success');
    }

    openLink(url) {
        window.open(url, '_blank');
    }

    async renderTasksPage() {
        const container = document.getElementById('available-tasks-container');
        if (!container) return;

        try {
            // Load actual tasks from database
            const tasks = await this.db.getAllTasks();
            console.log('📋 Loaded tasks from database:', tasks.length);

            if (tasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h3>No Tasks Available</h3>
                        <p>Check back later for new tasks!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            tasks.forEach(task => {
                // إصلاح: استخدام targetCompletions أو target_completions
                const targetCompletions = task.targetCompletions || task.target_completions || 1;
                const completions = task.completions || 0;
                const progress = (completions / targetCompletions) * 100;
                const progressPercent = Math.round(progress);
                const taskTypeClass = `task-type-${task.type || 'other'}`;
                
                html += `
                    <div class="task-card">
                        <div class="task-header">
                            <div class="task-icon ${taskTypeClass}">
                                <i class="${this.getTaskTypeIcon(task.type)}"></i>
                            </div>
                            <div class="task-content">
                                <h3 class="task-title">${task.name || this.getDomainFromUrl(task.link)}</h3>
                                <p class="task-description">${task.check_subscription ? 'Subscription verification required' : 'Join and participate'}</p>
                                <div class="task-reward">
                                    <i class="fas fa-coins" style="color: gold;"></i>
                                    <span>Reward: ${task.reward || 10} GOLD</span>
                                </div>
                            </div>
                        </div>
                        <div class="task-progress">
                            <div class="task-progress-info">
                                <span>Progress: ${completions.toLocaleString()}/${targetCompletions.toLocaleString()}</span>
                                <span>${progressPercent}%</span>
                            </div>
                            <div class="task-progress-bar">
                                <div class="task-progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="task-action">
                            <div class="task-status">
                                <span>${(task.type || 'other').toUpperCase()} • ${task.check_subscription ? 'Verified' : 'Free'}</span>
                            </div>
                            <button class="btn" onclick="app.completeTask('${task.id}')">
                                <i class="fas fa-play"></i> Start Task
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('❌ Failed to load tasks:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Tasks</h3>
                    <p>Failed to load tasks from database: ${error.message}</p>
                </div>
            `;
        }
    }

    async createTask() {
        if (!this.canMakeRequest()) return;
        if (!this.userState) {
            this.showNotification('Error', 'User data not loaded', 'error');
            return;
        }

        const name = document.getElementById('task-name').value;
        const link = document.getElementById('task-link').value;
        const typeElement = document.querySelector('.task-type-option.active');
        const completionsElement = document.querySelector('.completion-option.active');
        
        if (!name || !link || !typeElement || !completionsElement) {
            this.showNotification('Error', 'Please fill all fields', 'error');
            return;
        }

        const type = typeElement.dataset.type;
        const targetCompletions = parseInt(completionsElement.dataset.value);
        const cost = targetCompletions / 1000;

        if (this.userState.balance < cost) {
            this.showNotification('Error', `Insufficient balance. Need ${cost.toFixed(3)} TON`, 'error');
            return;
        }

        try {
            // Create task object
            const taskData = {
                userId: this.userState.id,
                name: name,
                link: link,
                type: type,
                checkSubscription: type === 'channel',
                targetCompletions: targetCompletions,
                cost: cost,
                completions: 0,
                status: 'active',
                reward: 10
            };

            // Save to actual database
            const createdTask = await this.db.createTask(taskData);
            console.log('✅ Task created in database:', createdTask);

            // Update user balance in database
            const newBalance = this.userState.balance - cost;
            await this.db.updateUser(this.userState.id, {
                balance: newBalance
            });

            // Update local state
            this.userState.balance = newBalance;

            // Record transaction
            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'task_creation',
                amount: -cost,
                description: `Created task: ${name}`
            });

            this.showNotification('Success', 'Task created successfully!', 'success');
            this.closeAddTaskModal();
            this.updateBalances();
            this.loadUserTasksInModal();

            // Update statistics
            await this.loadActualStatistics();
            this.renderHomePage();

        } catch (error) {
            console.error('❌ Task creation failed:', error);
            this.showNotification('Error', `Failed to create task: ${error.message}`, 'error');
        }
    }

    async completeTask(taskId) {
        if (!this.canMakeRequest()) return;
        if (!this.userState) {
            this.showNotification('Error', 'User data not loaded', 'error');
            return;
        }

        try {
            // Get task from database
            const tasks = await this.db.getAllTasks();
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) {
                this.showNotification('Error', 'Task not found', 'error');
                return;
            }

            const targetCompletions = task.targetCompletions || task.target_completions || 1;
            if (task.completions >= targetCompletions) {
                this.showNotification('Error', 'This task has reached its completion limit', 'error');
                return;
            }

            // Open task link
            window.open(task.link, '_blank');

            // Update task completions in database
            await this.db.updateTaskCompletion(taskId);

            // Reward user
            const reward = task.reward || 10;
            const newTub = this.userState.tub + reward;
            const newTotalEarned = this.userState.totalEarned + reward;

            await this.db.updateUser(this.userState.id, {
                tub: newTub,
                totalEarned: newTotalEarned
            });

            // Update local state
            this.userState.tub = newTub;
            this.userState.totalEarned = newTotalEarned;

            // Record transaction
            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'task_reward',
                amount: reward,
                description: `Completed: ${task.name}`
            });

            this.showNotification('Success', `You earned ${reward} GOLD!`, 'success');
            this.renderTasksPage();
            this.updateBalances();

            // Update statistics
            await this.loadActualStatistics();
            this.renderHomePage();

        } catch (error) {
            console.error('❌ Task completion failed:', error);
            this.showNotification('Error', `Failed to complete task: ${error.message}`, 'error');
        }
    }

    async loadUserTasksInModal() {
        const container = document.getElementById('my-tasks-modal-list');
        if (!container) return;

        try {
            // لأغراض العرض، نستخدم جميع المهام ثم نفلتر حسب المستخدم
            const allTasks = await this.db.getAllTasks();
            const userTasks = allTasks.filter(task => task.userId === this.userState.id || task.user_id === this.userState.id);
            
            console.log('📋 Loaded user tasks:', userTasks.length);

            if (userTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 20px;">
                        <i class="fas fa-plus-circle"></i>
                        <h3>No Tasks Created</h3>
                        <p>Create your first task above!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            userTasks.forEach(task => {
                const targetCompletions = task.targetCompletions || task.target_completions || 1;
                const completions = task.completions || 0;
                const progress = (completions / targetCompletions) * 100;
                
                html += `
                    <div class="my-task-item">
                        <div class="my-task-header">
                            <div class="my-task-title">${task.name}</div>
                            <div class="my-task-actions">
                                <button class="my-task-action-btn delete" onclick="app.deleteTask('${task.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="my-task-progress">
                            Progress: ${completions}/${targetCompletions} (${Math.round(progress)}%)
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('❌ Failed to load user tasks:', error);
            container.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Tasks</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async deleteTask(taskId) {
        if (!this.canMakeRequest()) return;
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            // هذه الدالة تحتاج للتطبيق في database.js
            // لأغراض التوضيح، سنرمي خطأ
            throw new Error('Delete task function not implemented in database yet');
        } catch (error) {
            console.error('❌ Task deletion failed:', error);
            this.showNotification('Error', `Failed to delete task: ${error.message}`, 'error');
        }
    }

    async renderWalletPage() {
        const container = document.getElementById('wallet-transaction-list');
        if (!container) return;

        try {
            const transactions = await this.db.getUserTransactions(this.userState.id);
            
            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>No Transactions</h3>
                        <p>Your transaction history will appear here</p>
                    </div>
                `;
                return;
            }

            let html = '';
            transactions.forEach(tx => {
                const amount = parseFloat(tx.amount);
                const isPositive = amount >= 0;
                const type = tx.type || 'transaction';
                
                html += `
                    <div class="task-card">
                        <div class="task-header">
                            <div class="task-icon" style="background: ${isPositive ? 'var(--tg-success)' : 'var(--tg-danger)'};">
                                <i class="fas fa-${this.getTransactionIcon(type)}"></i>
                            </div>
                            <div class="task-content">
                                <h3 class="task-title">${tx.description}</h3>
                                <p class="task-description">${new Date(tx.createdat || tx.createdAt).toLocaleDateString()}</p>
                                <div class="task-reward" style="color: ${isPositive ? 'var(--tg-success)' : 'var(--tg-danger)'};">
                                    <i class="fas fa-${isPositive ? 'plus' : 'minus'}"></i>
                                    <span>${isPositive ? '+' : ''}${amount} ${type.includes('swap') || type.includes('withdrawal') ? 'TON' : 'GOLD'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('Failed to load transactions:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Transactions</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    getTransactionIcon(type) {
        const icons = {
            task_reward: 'coins',
            task_creation: 'plus-circle',
            swap: 'exchange-alt',
            withdrawal: 'paper-plane',
            referral: 'user-plus'
        };
        return icons[type] || 'receipt';
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TonUPApp();
});
