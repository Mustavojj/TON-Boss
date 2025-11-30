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
            }

            // Load user data and statistics
            await this.loadDemoData();
            
            // Setup all event listeners and systems
            this.setupEventListeners();
            this.setupSwapSystem();
            this.setupTaskTypeSelection();
            this.renderUI();
            
            console.log('✅ App initialized successfully');
            
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TonUP is ready to use', 'success');
            }, 1500);

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showNotification('Error', 'Failed to initialize app', 'error');
            this.hideLoader();
            this.showApp();
        }
    }

    async loadDemoData() {
        // Create comprehensive demo user data
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

        // Initialize demo tasks and user tasks
        await this.initializeDemoData();
    }

    async initializeDemoData() {
        // Demo available tasks
        const demoTasks = [
            {
                id: 'task_1',
                userId: 'demo_user_1',
                name: 'Join TON Community',
                link: 'https://t.me/ton_blockchain',
                type: 'channel',
                checkSubscription: true,
                targetCompletions: 5000,
                completions: 3241,
                cost: 5.0,
                status: 'active',
                reward: 10,
                createdAt: new Date().toISOString()
            },
            {
                id: 'task_2', 
                userId: 'demo_user_2',
                name: 'Crypto Hub Chat',
                link: 'https://t.me/cryptohub',
                type: 'group',
                checkSubscription: false,
                targetCompletions: 2000,
                completions: 1890,
                cost: 2.0,
                status: 'active',
                reward: 8,
                createdAt: new Date().toISOString()
            },
            {
                id: 'task_3',
                userId: 'demo_user_3',
                name: 'DeFi News Channel',
                link: 'https://t.me/defi_news',
                type: 'channel',
                checkSubscription: true,
                targetCompletions: 10000,
                completions: 7560,
                cost: 10.0,
                status: 'active',
                reward: 15,
                createdAt: new Date().toISOString()
            }
        ];

        // Demo user tasks
        const userTasks = [
            {
                id: 'user_task_1',
                userId: 123456789,
                name: 'My Crypto Channel',
                link: 'https://t.me/mychannel',
                type: 'channel',
                checkSubscription: true,
                targetCompletions: 5000,
                completions: 1245,
                cost: 5.0,
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_task_2',
                userId: 123456789,
                name: 'Trading Group',
                link: 'https://t.me/tradinggroup',
                type: 'group',
                checkSubscription: false,
                targetCompletions: 3000,
                completions: 890,
                cost: 3.0,
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];

        // Store in localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('tasks', JSON.stringify(demoTasks));
            localStorage.setItem('user_tasks', JSON.stringify(userTasks));
            localStorage.setItem('transactions', JSON.stringify([
                {
                    id: 'tx_1',
                    userId: 123456789,
                    type: 'task_reward',
                    amount: 10,
                    description: 'Completed: Join TON Community',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 'tx_2',
                    userId: 123456789,
                    type: 'exchange',
                    amount: 0.5,
                    description: 'Exchanged 5,000 GOLD to 0.5 TON',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                }
            ]));
        }
    }

    showLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.style.display = 'flex';
    }

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.style.display = 'none';
    }

    showApp() {
        const app = document.getElementById('app');
        if (app) app.style.display = 'block';
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.currentTarget.getAttribute('data-page');
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

        // Withdraw confirmation
        const withdrawBtn = document.getElementById('withdraw-confirm-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeWithdraw();
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
        document.querySelectorAll('.completion-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectCompletionOption(e.target);
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

    setupTaskTypeSelection() {
        const taskTypeOptions = document.querySelectorAll('.task-type-option');
        taskTypeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectTaskTypeOption(e.currentTarget);
            });
        });
    }

    selectTaskTypeOption(selectedOption) {
        const options = document.querySelectorAll('.task-type-option');
        options.forEach(option => {
            option.classList.remove('active');
        });
        selectedOption.classList.add('active');
    }

    calculateSwapAmount() {
        const tubInput = document.getElementById('swap-tub-amount');
        const tonInput = document.getElementById('swap-ton-amount');
        const swapBtn = document.getElementById('swap-confirm-btn');
        
        if (!tubInput || !tonInput || !swapBtn) return;

        const tubAmount = parseFloat(tubInput.value) || 0;
        const CONVERSION_RATE = 10000;
        const tonAmount = tubAmount / CONVERSION_RATE;
        
        tonInput.value = tonAmount.toFixed(6);
        
        const hasEnoughBalance = tubAmount > 0 && tubAmount <= this.userState.tub;
        const meetsMinimum = tubAmount >= 1000;
        
        swapBtn.disabled = !hasEnoughBalance || !meetsMinimum;
        
        if (!meetsMinimum && tubAmount > 0) {
            swapBtn.textContent = 'Minimum: 1,000 GOLD';
        } else {
            swapBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Exchange Now';
        }
    }

    showPage(pageId) {
        console.log('🔄 Showing page:', pageId);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
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
            case 'wallet-page':
                this.renderWalletPage();
                break;
        }
    }

    renderUI() {
        console.log('🎨 Rendering UI...');
        
        // Update user info
        this.updateUserInfo();
        
        // Update balances
        this.updateBalances();

        // Render home page
        this.renderHomePage();
        
        console.log('✅ UI rendering complete');
    }

    updateUserInfo() {
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
        
        if (userName) userName.textContent = this.userState.firstName;
        if (telegramIdText) telegramIdText.textContent = `ID: ${this.userState.id}`;
    }

    updateBalances() {
        const headerTonBalance = document.getElementById('header-ton-balance');
        const headerTubBalance = document.getElementById('header-tub-balance');
        const availableTonBalance = document.getElementById('available-ton-balance');
        const availableTubBalance = document.getElementById('available-tub-balance');
        const walletTonBalance = document.getElementById('wallet-ton-balance');
        const walletGoldBalance = document.getElementById('wallet-gold-balance');
        
        if (headerTonBalance) headerTonBalance.textContent = this.userState.balance.toFixed(3);
        if (headerTubBalance) headerTubBalance.textContent = Math.floor(this.userState.tub).toLocaleString();
        if (availableTonBalance) availableTonBalance.textContent = this.userState.balance.toFixed(3);
        if (availableTubBalance) availableTubBalance.textContent = Math.floor(this.userState.tub).toLocaleString();
        if (walletTonBalance) walletTonBalance.textContent = this.userState.balance.toFixed(3);
        if (walletGoldBalance) walletGoldBalance.textContent = Math.floor(this.userState.tub).toLocaleString();
    }

    renderHomePage() {
        console.log('🏠 Rendering home page...');
        
        // Update statistics
        const totalUsers = document.getElementById('total-users');
        const tasksCompleted = document.getElementById('tasks-completed');
        const tasksCreated = document.getElementById('tasks-created');
        const totalEarnedStat = document.getElementById('total-earned-stat');
        
        if (totalUsers) totalUsers.textContent = this.appStatistics.totalUsers.toLocaleString();
        if (tasksCompleted) tasksCompleted.textContent = this.appStatistics.tasksCompleted.toLocaleString();
        if (tasksCreated) tasksCreated.textContent = this.appStatistics.tasksCreated.toLocaleString();
        if (totalEarnedStat) totalEarnedStat.textContent = this.appStatistics.totalEarned.toFixed(2);

        // Setup referral link
        this.setupReferralLink();
    }

    async renderTasksPage() {
        const container = document.getElementById('available-tasks-container');
        if (!container) return;

        let tasks = [];
        try {
            tasks = await this.db.getAllTasks();
        } catch (error) {
            // Use demo tasks
            const demoTasks = localStorage.getItem('tasks');
            tasks = demoTasks ? JSON.parse(demoTasks) : [];
        }

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
            const progress = ((task.completions || 0) / task.targetCompletions) * 100;
            const progressPercent = Math.round(progress);
            
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon" style="background: ${this.getTaskTypeColor(task.type)};">
                            <i class="${this.getTaskTypeIcon(task.type)}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${task.name || this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.checkSubscription ? 'Subscription verification required' : 'Join and participate'}</p>
                            <div class="task-reward">
                                <i class="fas fa-coins" style="color: gold;"></i>
                                <span>Reward: ${task.reward || 10} GOLD</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-progress">
                        <div class="task-progress-info">
                            <span>Progress: ${(task.completions || 0).toLocaleString()}/${task.targetCompletions.toLocaleString()}</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="task-progress-bar">
                            <div class="task-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>${task.type.toUpperCase()} • ${task.checkSubscription ? 'Verified' : 'Free'}</span>
                        </div>
                        <button class="btn" onclick="app.completeTask('${task.id}')">
                            <i class="fas fa-play"></i> Start Task
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderReferralsPage() {
        document.getElementById('referrals-total-count').textContent = this.userState.referrals || 0;
        document.getElementById('referrals-total-earnings').textContent = (this.userState.referralEarnings || 0).toFixed(2);
        this.setupReferralLink();
    }

    async renderWalletPage() {
        const container = document.getElementById('wallet-transaction-list');
        if (!container) return;

        let transactions = [];
        try {
            transactions = await this.db.getUserTransactions(this.currentUser?.id || 123456789);
        } catch (error) {
            const demoTransactions = localStorage.getItem('transactions');
            transactions = demoTransactions ? JSON.parse(demoTransactions) : [];
        }

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No Transactions</h3>
                    <p>Your transaction history will appear here</p>
                </div>
            `;
            return;
        }

        let html = '';
        transactions.forEach(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString();
            const amountClass = tx.amount > 0 ? 'success' : 'danger';
            const icon = tx.amount > 0 ? 'fa-arrow-down' : 'fa-arrow-up';
            const sign = tx.amount > 0 ? '+' : '';
            
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon" style="background: var(--tg-${amountClass});">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${sign}${tx.amount} ${tx.type.includes('TON') ? 'TON' : 'GOLD'}</h3>
                            <p class="task-description">${tx.description}</p>
                            <div class="task-reward" style="color: var(--tg-${amountClass});">
                                <span>${tx.type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>${date}</span>
                        </div>
                        <span style="color: var(--tg-${amountClass}); font-weight: 600;">
                            ${sign}${tx.amount}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Modal Management
    showAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateTaskCost(1000);
            this.loadUserTasksInModal();
        }
    }

    closeAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) modal.style.display = 'none';
    }

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
            document.getElementById('swap-tub-amount').value = '0';
            document.getElementById('swap-ton-amount').value = '0';
        }
    }

    showWithdrawModal() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) modal.style.display = 'flex';
    }

    closeWithdrawModal() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) modal.style.display = 'none';
    }

    async loadUserTasksInModal() {
        const container = document.getElementById('my-tasks-modal-list');
        if (!container) return;

        let userTasks = [];
        try {
            userTasks = await this.db.getUserTasks(this.currentUser?.id || 123456789);
        } catch (error) {
            const demoUserTasks = localStorage.getItem('user_tasks');
            userTasks = demoUserTasks ? JSON.parse(demoUserTasks) : [];
        }

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
            const progress = ((task.completions || 0) / task.targetCompletions) * 100;
            
            html += `
                <div class="my-task-item">
                    <div class="my-task-header">
                        <div class="my-task-title">${task.name}</div>
                        <div class="my-task-actions">
                            <button class="my-task-action-btn" onclick="app.pauseTask('${task.id}')" title="Pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="my-task-action-btn delete" onclick="app.deleteTask('${task.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="my-task-progress">
                        Progress: ${task.completions || 0}/${task.targetCompletions} (${Math.round(progress)}%)
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    selectCompletionOption(element) {
        document.querySelectorAll('.completion-option').forEach(opt => {
            opt.classList.remove('active');
        });
        element.classList.add('active');
        
        const completions = parseInt(element.dataset.value);
        this.updateTaskCost(completions);
    }

    updateTaskCost(completions) {
        const cost = completions / 1000;
        document.getElementById('task-cost').textContent = cost.toFixed(3);
        document.getElementById('task-cost-btn').textContent = cost.toFixed(3) + ' TON';
    }

    // Core Functions
    async createTask() {
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
            // Update user balance
            this.userState.balance -= cost;

            // Create task object
            const taskData = {
                userId: this.currentUser?.id || 123456789,
                name: name,
                link: link,
                type: type,
                checkSubscription: type === 'channel',
                targetCompletions: targetCompletions,
                cost: cost,
                completions: 0,
                status: 'active',
                reward: 10,
                createdAt: new Date().toISOString()
            };

            // Save task
            let userTasks = [];
            const storedTasks = localStorage.getItem('user_tasks');
            if (storedTasks) {
                userTasks = JSON.parse(storedTasks);
            }
            userTasks.push({...taskData, id: 'task_' + Date.now()});
            localStorage.setItem('user_tasks', JSON.stringify(userTasks));

            // Record transaction
            let transactions = [];
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) {
                transactions = JSON.parse(storedTransactions);
            }
            transactions.unshift({
                id: 'tx_' + Date.now(),
                userId: this.currentUser?.id || 123456789,
                type: 'task_creation',
                amount: -cost,
                description: `Created task: ${name}`,
                status: 'completed',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('transactions', JSON.stringify(transactions));

            this.showNotification('Success', 'Task created successfully!', 'success');
            this.closeAddTaskModal();
            this.updateBalances();
            this.loadUserTasksInModal();

        } catch (error) {
            console.error('Task creation failed:', error);
            this.showNotification('Error', 'Failed to create task', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            let tasks = [];
            const storedTasks = localStorage.getItem('tasks');
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            }

            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                this.showNotification('Error', 'Task not found', 'error');
                return;
            }

            if (task.completions >= task.targetCompletions) {
                this.showNotification('Error', 'This task has reached its completion limit', 'error');
                return;
            }

            // Open task link
            window.open(task.link, '_blank');

            // Simulate task completion
            setTimeout(async () => {
                // Update task completions
                task.completions = (task.completions || 0) + 1;
                localStorage.setItem('tasks', JSON.stringify(tasks));

                // Reward user
                const reward = task.reward || 10;
                this.userState.tub += reward;
                this.userState.totalEarned += reward;

                // Record transaction
                let transactions = [];
                const storedTransactions = localStorage.getItem('transactions');
                if (storedTransactions) {
                    transactions = JSON.parse(storedTransactions);
                }
                transactions.unshift({
                    id: 'tx_' + Date.now(),
                    userId: this.currentUser?.id || 123456789,
                    type: 'task_reward',
                    amount: reward,
                    description: `Completed: ${task.name}`,
                    status: 'completed',
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));

                this.showNotification('Success', `You earned ${reward} GOLD!`, 'success');
                this.renderTasksPage();
                this.updateBalances();

            }, 2000);

        } catch (error) {
            console.error('Task completion failed:', error);
            this.showNotification('Error', 'Failed to complete task', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            let userTasks = [];
            const storedTasks = localStorage.getItem('user_tasks');
            if (storedTasks) {
                userTasks = JSON.parse(storedTasks);
            }

            const updatedTasks = userTasks.filter(task => task.id !== taskId);
            localStorage.setItem('user_tasks', JSON.stringify(updatedTasks));

            this.showNotification('Success', 'Task deleted successfully', 'success');
            this.loadUserTasksInModal();

        } catch (error) {
            console.error('Task deletion failed:', error);
            this.showNotification('Error', 'Failed to delete task', 'error');
        }
    }

    pauseTask(taskId) {
        this.showNotification('Info', 'Task pause feature coming soon', 'info');
    }

    async executeSwap() {
        const tubAmount = parseFloat(document.getElementById('swap-tub-amount').value) || 0;
        const tonAmount = parseFloat(document.getElementById('swap-ton-amount').value) || 0;

        if (tubAmount <= 0) {
            this.showNotification('Error', 'Please enter a valid amount', 'error');
            return;
        }

        if (tubAmount < 1000) {
            this.showNotification('Error', 'Minimum exchange: 1,000 GOLD', 'error');
            return;
        }

        if (tubAmount > this.userState.tub) {
            this.showNotification('Error', 'Insufficient GOLD balance', 'error');
            return;
        }

        try {
            // Update balances
            this.userState.tub -= tubAmount;
            this.userState.balance += tonAmount;

            // Record transaction
            let transactions = [];
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) {
                transactions = JSON.parse(storedTransactions);
            }
            transactions.unshift({
                id: 'tx_' + Date.now(),
                userId: this.currentUser?.id || 123456789,
                type: 'exchange',
                amount: tonAmount,
                description: `Exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`,
                status: 'completed',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('transactions', JSON.stringify(transactions));

            this.showNotification('Success', `Exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`, 'success');
            this.closeSwapModal();
            this.updateBalances();

        } catch (error) {
            console.error('Swap failed:', error);
            this.showNotification('Error', 'Exchange failed. Please try again.', 'error');
        }
    }

    async executeWithdraw() {
        const address = document.getElementById('withdraw-address').value;
        const amount = parseFloat(document.getElementById('withdraw-amount').value);

        if (!address) {
            this.showNotification('Error', 'Please enter wallet address', 'error');
            return;
        }

        if (isNaN(amount) || amount < 0.05) {
            this.showNotification('Error', 'Minimum withdrawal: 0.05 TON', 'error');
            return;
        }

        if (amount > this.userState.balance) {
            this.showNotification('Error', 'Insufficient balance', 'error');
            return;
        }

        try {
            // Update balance
            this.userState.balance -= amount;

            // Record transaction
            let transactions = [];
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) {
                transactions = JSON.parse(storedTransactions);
            }
            transactions.unshift({
                id: 'tx_' + Date.now(),
                userId: this.currentUser?.id || 123456789,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrawal to ${address.substring(0, 8)}...`,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('transactions', JSON.stringify(transactions));

            this.showNotification('Success', 'Withdrawal request submitted!', 'success');
            this.closeWithdrawModal();
            this.updateBalances();
            this.renderWalletPage();

        } catch (error) {
            console.error('Withdrawal failed:', error);
            this.showNotification('Error', 'Withdrawal failed', 'error');
        }
    }

    async applyPromoCode() {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        
        if (!code) {
            this.showNotification('Error', 'Please enter a promo code', 'error');
            return;
        }

        const promoCodes = {
            'WELCOME100': { reward: 100, type: 'GOLD' },
            'TONUP500': { reward: 500, type: 'GOLD' },
            'START1K': { reward: 1000, type: 'GOLD' },
            'BONUS5TON': { reward: 5, type: 'TON' }
        };

        const promo = promoCodes[code];
        if (!promo) {
            this.showNotification('Error', 'Invalid promo code', 'error');
            return;
        }

        try {
            if (promo.type === 'TON') {
                this.userState.balance += promo.reward;
            } else {
                this.userState.tub += promo.reward;
            }

            // Record transaction
            let transactions = [];
            const storedTransactions = localStorage.getItem('transactions');
            if (storedTransactions) {
                transactions = JSON.parse(storedTransactions);
            }
            transactions.unshift({
                id: 'tx_' + Date.now(),
                userId: this.currentUser?.id || 123456789,
                type: 'promo_reward',
                amount: promo.reward,
                description: `Promo code: ${code}`,
                status: 'completed',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('transactions', JSON.stringify(transactions));

            this.showNotification('Success', `You received ${promo.reward} ${promo.type}!`, 'success');
            document.getElementById('promoInput').value = '';
            this.updateBalances();

        } catch (error) {
            console.error('Promo code application failed:', error);
            this.showNotification('Error', 'Failed to apply promo code', 'error');
        }
    }

    // Utility Methods
    setupReferralLink() {
        const refLink = `https://t.me/your_bot_username?start=${this.currentUser?.id || 123456789}`;
        const refInput = document.getElementById('referral-link-input');
        if (refInput) refInput.value = refLink;
    }

    getTaskTypeColor(type) {
        const colors = {
            'channel': '#2962ff',
            'group': '#00c853',
            'bot': '#7b1fa2',
            'other': '#ff9800'
        };
        return colors[type] || '#2962ff';
    }

    getTaskTypeIcon(type) {
        const icons = {
            'channel': 'fas fa-broadcast-tower',
            'group': 'fas fa-users',
            'bot': 'fas fa-robot',
            'other': 'fas fa-link'
        };
        return icons[type] || 'fas fa-link';
    }

    getDomainFromUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '').split('.')[0];
        } catch {
            return 'Unknown';
        }
    }

    openLink(url) {
        if (this.tg && this.tg.openLink) {
            this.tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    }

    copyReferralLink() {
        const input = document.getElementById('referral-link-input');
        input.select();
        document.execCommand('copy');
        this.showNotification('Success', 'Referral link copied!', 'success');
    }

    copyTelegramId() {
        const telegramId = (this.currentUser?.id || 123456789).toString();
        navigator.clipboard.writeText(telegramId).then(() => {
            this.showNotification('Success', 'Telegram ID copied!', 'success');
        }).catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = telegramId;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            this.showNotification('Success', 'Telegram ID copied!', 'success');
        });
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

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

// Initialize database fallback
if (typeof db === 'undefined') {
    console.log('📦 Initializing database fallback...');
    const db = {
        async getUser() { return null; },
        async createUser() { return null; },
        async updateUser() { return null; },
        async createTask() { return null; },
        async getUserTasks() { 
            const tasks = localStorage.getItem('user_tasks');
            return tasks ? JSON.parse(tasks) : []; 
        },
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
        async getUserTransactions(userId) { 
            const transactions = localStorage.getItem('transactions');
            const allTransactions = transactions ? JSON.parse(transactions) : [];
            return allTransactions.filter(tx => tx.userId === userId);
        },
        async createWithdrawal() { return null; },
        async getUserWithdrawals() { return []; }
    };
    window.db = db;
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    app = new TonUPApp();
});

window.app = app;
