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
            this.showLoader();
            
            this.tg.ready();
            this.tg.expand();
            
            const tgUser = this.tg.initDataUnsafe.user;
            if (!tgUser || !tgUser.id) {
                throw new Error('User data not found');
            }

            await this.loadUserData(tgUser);
            await this.loadAppStatistics();
            
            this.setupEventListeners();
            this.setupSwapSystem();
            this.renderUI();
            
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
            }, 1500);

        } catch (error) {
            console.error('App initialization failed:', error);
            this.showNotification('Error', 'Failed to initialize app', 'error');
        }
    }

    showLoader() {
        document.getElementById('app-loader').style.display = 'flex';
    }

    hideLoader() {
        document.getElementById('app-loader').style.display = 'none';
    }

    showApp() {
        document.getElementById('app').style.display = 'block';
    }

    async loadUserData(tgUser) {
        let userData = await this.db.getUser(tgUser.id);
        
        if (!userData) {
            userData = {
                id: tgUser.id,
                firstName: tgUser.first_name || 'User',
                lastName: tgUser.last_name || '',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || '',
                balance: 0.000,
                tub: 1500,
                referrals: 0,
                referralEarnings: 0,
                totalEarned: 0,
                dailyAdCount: 0,
                lifetimeAdCount: 0,
                createdAt: new Date().toISOString()
            };
            await this.db.createUser(userData);
        }
        
        this.currentUser = userData;
        this.userState = userData;
    }

    async loadAppStatistics() {
        const stats = await this.db.getAppStatistics();
        this.appStatistics = stats;
        
        // Update statistics with real data
        if (stats.totalUsers === 0) {
            // Set initial demo data
            this.appStatistics = {
                totalUsers: 15427,
                tasksCompleted: 89234,
                tasksCreated: 1245,
                totalEarned: 2456.78
            };
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.currentTarget.dataset.page;
                this.showPage(pageId);
            });
        });

        // Promo code
        document.getElementById('promo-btn').addEventListener('click', () => {
            this.applyPromoCode();
        });

        // Copy referral link
        document.getElementById('copy-referral-link-btn').addEventListener('click', () => {
            this.copyReferralLink();
        });

        // Withdraw form
        document.getElementById('withdraw-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWithdraw();
        });

        // Task creation
        document.getElementById('create-task-btn').addEventListener('click', () => {
            this.createTask();
        });

        // Swap confirmation
        document.getElementById('swap-confirm-btn').addEventListener('click', () => {
            this.executeSwap();
        });

        // Copy Telegram ID
        document.getElementById('user-telegram-id').addEventListener('click', () => {
            this.copyTelegramId();
        });

        // Task completion options
        document.querySelectorAll('.completion-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectCompletionOption(e.target);
            });
        });

        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectToggleOption(e.target);
            });
        });
    }

    setupSwapSystem() {
        const tubInput = document.getElementById('swap-tub-amount');
        const tonInput = document.getElementById('swap-ton-amount');
        
        tubInput.addEventListener('input', () => {
            this.calculateSwapAmount();
        });
    }

    calculateSwapAmount() {
        const tubAmount = parseFloat(document.getElementById('swap-tub-amount').value) || 0;
        const CONVERSION_RATE = 10000; // 10,000 GOLD = 1 TON
        const tonAmount = tubAmount / CONVERSION_RATE;
        
        document.getElementById('swap-ton-amount').value = tonAmount.toFixed(6);
        
        // Update button state
        const swapBtn = document.getElementById('swap-confirm-btn');
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
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        document.getElementById(pageId).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

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
        // Update user info
        const userAvatar = document.getElementById('user-avatar');
        if (this.userState.photoUrl) {
            userAvatar.innerHTML = `<img src="${this.userState.photoUrl}" alt="User" style="width: 100%; height: 100%; border-radius: 50%;">`;
        } else {
            const initials = this.userState.firstName.charAt(0).toUpperCase();
            userAvatar.innerHTML = initials;
        }
        
        document.getElementById('user-name').textContent = this.userState.firstName;
        document.getElementById('telegram-id-text').textContent = `ID: ${this.userState.id}`;
        
        // Update balances
        document.getElementById('header-ton-balance').textContent = this.userState.balance.toFixed(3);
        document.getElementById('header-tub-balance').textContent = Math.floor(this.userState.tub).toLocaleString();
        
        // Update available balances for swap
        document.getElementById('available-ton-balance').textContent = this.userState.balance.toFixed(3);
        document.getElementById('available-tub-balance').textContent = Math.floor(this.userState.tub).toLocaleString();

        // Render home page
        this.renderHomePage();
    }

    renderHomePage() {
        // Update statistics with real data
        document.getElementById('total-users').textContent = this.appStatistics.totalUsers.toLocaleString();
        document.getElementById('tasks-completed').textContent = this.appStatistics.tasksCompleted.toLocaleString();
        document.getElementById('tasks-created').textContent = this.appStatistics.tasksCreated.toLocaleString();
        document.getElementById('total-earned-stat').textContent = this.appStatistics.totalEarned.toFixed(2);

        // Load recent tasks
        this.loadRecentTasks();
    }

    async loadRecentTasks() {
        const container = document.getElementById('recent-tasks-container');
        const tasks = await this.db.getAllTasks();
        
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

    async renderTasksPage() {
        await this.renderMyTasks();
        await this.renderAvailableTasks();
    }

    async renderMyTasks() {
        const container = document.getElementById('my-tasks-container');
        const tasks = await this.db.getUserTasks(this.currentUser.id);

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <h3>No Tasks Created</h3>
                    <p>Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        let html = '';
        tasks.forEach(task => {
            const progress = ((task.completions || 0) / task.targetCompletions) * 100;
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon" style="background: var(--card-purple);">
                            <i class="fas fa-link"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.link}</p>
                            <div class="task-reward">
                                <span>Target: ${task.targetCompletions.toLocaleString()} completions</span>
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
                            <span>Cost: ${task.cost} TON</span>
                        </div>
                        <button class="btn btn-danger" onclick="app.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async renderAvailableTasks() {
        const container = document.getElementById('available-tasks-container');
        const tasks = await this.db.getAllTasks();

        // Filter out user's own tasks
        const availableTasks = tasks.filter(task => task.userId !== this.currentUser.id);

        if (availableTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Available Tasks</h3>
                    <p>Check back later for new tasks!</p>
                </div>
            `;
            return;
        }

        let html = '';
        availableTasks.forEach(task => {
            const progress = ((task.completions || 0) / task.targetCompletions) * 100;
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon">
                            <i class="fas fa-external-link-alt"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">Join ${this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.checkSubscription ? 'Verify subscription' : 'Visit and join'}</p>
                            <div class="task-reward">
                                <span>Earn: 10 GOLD</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-progress">
                        <div class="task-progress-info">
                            <span>Completed: ${task.completions || 0}/${task.targetCompletions}</span>
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

    renderReferralsPage() {
        const refLink = `https://t.me/your_bot_username?start=${this.currentUser.id}`;
        document.getElementById('referral-link-input').value = refLink;
        
        document.getElementById('referrals-total-count').textContent = this.userState.referrals || 0;
        document.getElementById('referrals-total-earnings').textContent = (this.userState.referralEarnings || 0).toFixed(2);
    }

    renderWithdrawPage() {
        this.renderWithdrawalHistory();
    }

    async renderWithdrawalHistory() {
        const container = document.getElementById('withdrawal-history-list');
        const withdrawals = await this.db.getUserWithdrawals(this.currentUser.id);

        if (withdrawals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Withdrawals Yet</h3>
                    <p>Your withdrawal history will appear here</p>
                </div>
            `;
            return;
        }

        let html = '';
        withdrawals.forEach(wd => {
            const date = new Date(wd.createdAt).toLocaleDateString();
            const statusClass = wd.status === 'completed' ? 'success' : wd.status === 'pending' ? 'warning' : 'danger';
            
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon" style="background: var(--${statusClass === 'success' ? 'tg-success' : statusClass === 'warning' ? 'tg-warning' : 'tg-danger'});">
                            <i class="fas ${statusClass === 'success' ? 'fa-check' : statusClass === 'pending' ? 'fa-clock' : 'fa-times'}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${wd.amount} TON</h3>
                            <p class="task-description">To: ${wd.wallet_address.substring(0, 8)}...${wd.wallet_address.substring(wd.wallet_address.length - 8)}</p>
                            <div class="task-reward">
                                <span>Status: <span style="color: var(--tg-${statusClass}); text-transform: capitalize;">${wd.status}</span></span>
                            </div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>${date}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async renderHistoryPage() {
        const container = document.getElementById('transaction-history-list');
        const transactions = await this.db.getUserTransactions(this.currentUser.id);

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
            const icon = tx.amount > 0 ? 'fa-plus' : 'fa-minus';
            
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon" style="background: var(--tg-${amountClass});">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${tx.amount > 0 ? '+' : ''}${tx.amount} ${tx.type.includes('TON') ? 'TON' : 'GOLD'}</h3>
                            <p class="task-description">${tx.description}</p>
                            <div class="task-reward">
                                <span style="color: var(--tg-${amountClass});">${tx.type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>${date}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Modal Management
    showSwapModal() {
        document.getElementById('swap-modal').style.display = 'flex';
        this.calculateSwapAmount();
    }

    closeSwapModal() {
        document.getElementById('swap-modal').style.display = 'none';
        // Reset inputs
        document.getElementById('swap-tub-amount').value = '0';
        document.getElementById('swap-ton-amount').value = '0';
    }

    showAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'flex';
        this.updateTaskCost(1000); // Default to 1000 completions
    }

    closeAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'none';
    }

    selectCompletionOption(element) {
        document.querySelectorAll('.completion-option').forEach(opt => {
            opt.classList.remove('active');
        });
        element.classList.add('active');
        
        const completions = parseInt(element.dataset.value);
        this.updateTaskCost(completions);
    }

    selectToggleOption(element) {
        const group = element.parentElement;
        group.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');
    }

    updateTaskCost(completions) {
        const cost = completions / 1000; // 1 TON per 1000 completions
        document.getElementById('task-cost').textContent = cost.toFixed(3);
        document.getElementById('task-cost-btn').textContent = cost.toFixed(3) + ' TON';
    }

    // Core Functions
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
            // Update user balances
            await this.db.updateUser(this.currentUser.id, {
                tub: this.userState.tub - tubAmount,
                balance: this.userState.balance + tonAmount
            });

            // Update local state
            this.userState.tub -= tubAmount;
            this.userState.balance += tonAmount;

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'exchange',
                amount: tonAmount,
                description: `Exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`
            });

            this.showNotification('Success', `Exchanged ${tubAmount.toLocaleString()} GOLD to ${tonAmount.toFixed(6)} TON`, 'success');
            this.closeSwapModal();
            this.renderUI();

        } catch (error) {
            console.error('Swap failed:', error);
            this.showNotification('Error', 'Exchange failed. Please try again.', 'error');
        }
    }

    async createTask() {
        const link = document.getElementById('task-link').value;
        const checkSubscription = document.querySelector('.toggle-btn.active').dataset.value === 'true';
        const completionsElement = document.querySelector('.completion-option.active');
        
        if (!link || !completionsElement) {
            this.showNotification('Error', 'Please fill all fields', 'error');
            return;
        }

        const targetCompletions = parseInt(completionsElement.dataset.value);
        const cost = targetCompletions / 1000;

        if (this.userState.balance < cost) {
            this.showNotification('Error', `Insufficient balance. Need ${cost.toFixed(3)} TON`, 'error');
            return;
        }

        try {
            // Deduct cost from balance
            await this.db.updateUser(this.currentUser.id, {
                balance: this.userState.balance - cost
            });

            // Update local state
            this.userState.balance -= cost;

            // Create task
            const taskData = {
                userId: this.currentUser.id,
                link: link,
                checkSubscription: checkSubscription,
                targetCompletions: targetCompletions,
                cost: cost,
                completions: 0
            };

            await this.db.createTask(taskData);

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'task_creation',
                amount: -cost,
                description: `Created task for ${targetCompletions.toLocaleString()} completions`
            });

            this.showNotification('Success', 'Task created successfully!', 'success');
            this.closeAddTaskModal();
            this.renderTasksPage();
            this.renderUI();

        } catch (error) {
            console.error('Task creation failed:', error);
            this.showNotification('Error', 'Failed to create task', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            const tasks = await this.db.getAllTasks();
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) {
                this.showNotification('Error', 'Task not found', 'error');
                return;
            }

            if (task.completions >= task.targetCompletions) {
                this.showNotification('Error', 'This task has reached its completion limit', 'error');
                return;
            }

            // Open task link in new tab
            window.open(task.link, '_blank');

            // Simulate task completion
            setTimeout(async () => {
                await this.db.updateTaskCompletion(taskId);
                
                // Reward user with GOLD
                const reward = 10;
                await this.db.updateUser(this.currentUser.id, {
                    tub: this.userState.tub + reward,
                    totalEarned: this.userState.totalEarned + reward
                });

                // Update local state
                this.userState.tub += reward;
                this.userState.totalEarned += reward;

                // Record transaction
                await this.db.createTransaction({
                    userId: this.currentUser.id,
                    type: 'task_reward',
                    amount: reward,
                    description: `Completed task: ${this.getDomainFromUrl(task.link)}`
                });

                this.showNotification('Success', `You earned ${reward} GOLD!`, 'success');
                this.renderTasksPage();
                this.renderUI();

            }, 2000);

        } catch (error) {
            console.error('Task completion failed:', error);
            this.showNotification('Error', 'Failed to complete task', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await this.db.deleteTask(taskId);
            this.showNotification('Success', 'Task deleted successfully', 'success');
            this.renderTasksPage();
        } catch (error) {
            console.error('Task deletion failed:', error);
            this.showNotification('Error', 'Failed to delete task', 'error');
        }
    }

    async applyPromoCode() {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        
        if (!code) {
            this.showNotification('Error', 'Please enter a promo code', 'error');
            return;
        }

        // Promo codes database
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
            const updates = {};
            if (promo.type === 'TON') {
                updates.balance = this.userState.balance + promo.reward;
            } else {
                updates.tub = this.userState.tub + promo.reward;
            }

            await this.db.updateUser(this.currentUser.id, updates);

            // Update local state
            if (promo.type === 'TON') {
                this.userState.balance += promo.reward;
            } else {
                this.userState.tub += promo.reward;
            }

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'promo_reward',
                amount: promo.reward,
                description: `Promo code: ${code}`
            });

            this.showNotification('Success', `You received ${promo.reward} ${promo.type}!`, 'success');
            document.getElementById('promoInput').value = '';
            this.renderUI();

        } catch (error) {
            console.error('Promo code application failed:', error);
            this.showNotification('Error', 'Failed to apply promo code', 'error');
        }
    }

    async handleWithdraw() {
        const address = document.getElementById('account-number').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);

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
            // Deduct from balance
            await this.db.updateUser(this.currentUser.id, {
                balance: this.userState.balance - amount
            });

            // Update local state
            this.userState.balance -= amount;

            // Create withdrawal record
            await this.db.createWithdrawal({
                userId: this.currentUser.id,
                amount: amount,
                wallet_address: address,
                status: 'pending'
            });

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrawal to ${address.substring(0, 8)}...`
            });

            this.showNotification('Success', 'Withdrawal request submitted!', 'success');
            document.getElementById('withdraw-form').reset();
            this.renderUI();
            this.renderWithdrawalHistory();

        } catch (error) {
            console.error('Withdrawal failed:', error);
            this.showNotification('Error', 'Withdrawal failed', 'error');
        }
    }

    // Utility Methods
    getDomainFromUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '').split('.')[0];
        } catch {
            return 'Unknown';
        }
    }

    copyReferralLink() {
        const input = document.getElementById('referral-link-input');
        input.select();
        document.execCommand('copy');
        this.showNotification('Success', 'Referral link copied!', 'success');
    }

    copyTelegramId() {
        const telegramId = this.currentUser.id.toString();
        navigator.clipboard.writeText(telegramId).then(() => {
            this.showNotification('Success', 'Telegram ID copied!', 'success');
        }).catch(() => {
            // Fallback for older browsers
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
            if (notif) {
                notif.style.opacity = '0';
                notif.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (notif.parentNode) {
                        notif.parentNode.removeChild(notif);
                    }
                }, 300);
            }
        }, 5000);
    }
}


let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TonUPApp();
});
