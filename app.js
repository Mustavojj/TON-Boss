class TonUPApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.userState = {};
        this.appConfig = {};
        this.db = db;
        
        this.init();
    }

    async init() {
        try {
            this.showLoader();
            this.updateProgress(10, 'Connecting to Telegram...');
            
            this.tg.ready();
            this.tg.expand();
            
            const tgUser = this.tg.initDataUnsafe.user;
            if (!tgUser || !tgUser.id) {
                throw new Error('User data not found');
            }

            this.updateProgress(30, 'Loading user data...');
            await this.loadUserData(tgUser);
            
            this.updateProgress(60, 'Loading app statistics...');
            await this.loadAppStatistics();
            
            this.updateProgress(80, 'Setting up interface...');
            this.setupEventListeners();
            this.renderUI();
            
            this.updateProgress(100, 'Ready!');
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
            }, 1000);

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

    updateProgress(percentage, text) {
        const progressElement = document.getElementById('loading-progress');
        const textElement = document.querySelector('.loading-text');
        
        if (progressElement) progressElement.textContent = `${percentage}%`;
        if (textElement) textElement.textContent = text;
    }

    async loadUserData(tgUser) {
        let userData = await this.db.getUser(tgUser.id);
        
        if (!userData) {
            userData = {
                id: tgUser.id,
                firstName: tgUser.first_name || '',
                lastName: tgUser.last_name || '',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || '',
                balance: 0,
                tub: 1000, // Starting bonus
                referrals: 0,
                totalEarned: 0,
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

        // Exchange
        document.getElementById('convert-btn').addEventListener('click', () => {
            this.executeConversion();
        });

        // Withdraw
        document.getElementById('withdraw-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWithdraw();
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
            case 'history-page':
                this.renderHistoryPage();
                break;
        }
    }

    renderUI() {
        // Update user info
        document.getElementById('user-photo').src = this.userState.photoUrl || 'https://via.placeholder.com/50';
        document.getElementById('user-name').textContent = this.userState.firstName;
        document.getElementById('telegram-id-text').textContent = `ID: ${this.userState.id}`;
        
        // Update balances
        document.getElementById('header-ton-balance').textContent = (this.userState.balance || 0).toFixed(3);
        document.getElementById('header-tub-balance').textContent = (this.userState.tub || 0).toFixed(0);
        
        // Update available balances for exchange
        document.getElementById('available-ton-balance').textContent = (this.userState.balance || 0).toFixed(3);
        document.getElementById('available-tub-balance').textContent = (this.userState.tub || 0).toFixed(0);

        // Render home page
        this.renderHomePage();
    }

    renderHomePage() {
        // Update statistics
        if (this.appStatistics) {
            document.getElementById('total-users').textContent = this.appStatistics.totalUsers.toLocaleString();
            document.getElementById('tasks-completed').textContent = this.appStatistics.tasksCompleted.toLocaleString();
            document.getElementById('tasks-created').textContent = this.appStatistics.tasksCreated.toLocaleString();
            document.getElementById('total-earned-stat').textContent = this.appStatistics.totalEarned.toFixed(2) + ' TON';
        }

        // Update referral stats
        document.getElementById('referrals-total-count').textContent = this.userState.referrals || 0;
        document.getElementById('referrals-total-earnings').textContent = (this.userState.referralEarnings || 0).toFixed(0);
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
                <div class="no-tasks-message">
                    <i class="fas fa-tasks"></i>
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
                        <div class="task-icon">
                            <i class="fas fa-link"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.link}</p>
                            <div class="task-reward">
                                <span>Target: ${task.targetCompletions} completions</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-progress">
                        <div class="task-progress-info">
                            <span>Progress: ${task.completions || 0}/${task.targetCompletions}</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="task-progress-bar-container">
                            <div class="task-progress-bar-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>Cost: ${task.cost} TON</span>
                        </div>
                        <button class="action-btn danger" onclick="app.deleteTask('${task.id}')">
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
                <div class="no-tasks-message">
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
                            <h3 class="task-title">Visit ${this.getDomainFromUrl(task.link)}</h3>
                            <p class="task-description">${task.checkSubscription ? 'Subscription check required' : 'No subscription check'}</p>
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
                        <div class="task-progress-bar-container">
                            <div class="task-progress-bar-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>Available</span>
                        </div>
                        <button class="action-btn" onclick="app.completeTask('${task.id}')">
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
        document.getElementById('referrals-total-earnings').textContent = (this.userState.referralEarnings || 0).toFixed(0);
    }

    async renderHistoryPage() {
        const container = document.getElementById('transaction-history-list');
        const transactions = await this.db.getUserTransactions(this.currentUser.id);

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="no-tasks-message">
                    <i class="fas fa-history"></i>
                    <h3>No Transactions</h3>
                    <p>Your transaction history will appear here</p>
                </div>
            `;
            return;
        }

        let html = '';
        transactions.forEach(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString();
            const amountClass = tx.amount > 0 ? 'positive' : 'negative';
            const icon = tx.amount > 0 ? 'fa-plus' : 'fa-minus';
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-icon ${amountClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${tx.description}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${tx.amount > 0 ? '+' : ''}${tx.amount} TON
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Task Management
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
            this.showNotification('Error', `Insufficient balance. Need ${cost} TON`, 'error');
            return;
        }

        try {
            // Deduct cost from balance
            await this.db.updateUser(this.currentUser.id, {
                balance: (this.userState.balance || 0) - cost
            });

            // Create task
            const taskData = {
                userId: this.currentUser.id,
                link: link,
                checkSubscription: checkSubscription,
                targetCompletions: targetCompletions,
                cost: cost
            };

            await this.db.createTask(taskData);

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'task_creation',
                amount: -cost,
                description: `Created task for ${targetCompletions} completions`,
                status: 'completed'
            });

            this.showNotification('Success', 'Task created successfully!', 'success');
            this.closeAddTaskModal();
            this.renderTasksPage();
            this.renderUI(); // Update balances

        } catch (error) {
            console.error('Task creation failed:', error);
            this.showNotification('Error', 'Failed to create task', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            const task = (await this.db.getAllTasks()).find(t => t.id === taskId);
            if (!task) {
                this.showNotification('Error', 'Task not found', 'error');
                return;
            }

            // Open task link
            window.open(task.link, '_blank');

            // Simulate task completion after delay
            setTimeout(async () => {
                await this.db.updateTaskCompletion(taskId);
                
                // Reward user
                const reward = 10; // GOLD
                await this.db.updateUser(this.currentUser.id, {
                    tub: (this.userState.tub || 0) + reward,
                    totalEarned: (this.userState.totalEarned || 0) + reward
                });

                // Record transaction
                await this.db.createTransaction({
                    userId: this.currentUser.id,
                    type: 'task_reward',
                    amount: reward,
                    description: `Completed task: ${this.getDomainFromUrl(task.link)}`,
                    status: 'completed'
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

    // Exchange System
    async executeConversion() {
        const tubAmount = parseInt(document.getElementById('tub-amount').value) || 0;
        const tonAmount = parseFloat(document.getElementById('ton-amount').value) || 0;

        if (tubAmount <= 0) {
            this.showNotification('Error', 'Please enter a valid amount', 'error');
            return;
        }

        if (tubAmount < 1000) {
            this.showNotification('Error', 'Minimum conversion: 1,000 GOLD', 'error');
            return;
        }

        if (tubAmount > this.userState.tub) {
            this.showNotification('Error', 'Insufficient GOLD balance', 'error');
            return;
        }

        try {
            await this.db.updateUser(this.currentUser.id, {
                tub: (this.userState.tub || 0) - tubAmount,
                balance: (this.userState.balance || 0) + tonAmount
            });

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'exchange',
                amount: tonAmount,
                description: `Exchanged ${tubAmount} GOLD to ${tonAmount} TON`,
                status: 'completed'
            });

            this.showNotification('Success', `Exchanged ${tubAmount} GOLD to ${tonAmount} TON`, 'success');
            this.renderUI();

            // Reset form
            document.getElementById('tub-amount').value = '0';
            document.getElementById('ton-amount').value = '0';

        } catch (error) {
            console.error('Conversion failed:', error);
            this.showNotification('Error', 'Conversion failed', 'error');
        }
    }

    // Promo Code System
    async applyPromoCode() {
        const code = document.getElementById('promoInput').value.trim().toUpperCase();
        
        if (!code) {
            this.showNotification('Error', 'Please enter a promo code', 'error');
            return;
        }

        // Simple promo code system
        const promoCodes = {
            'WELCOME100': { reward: 100, type: 'GOLD' },
            'TONUP500': { reward: 500, type: 'GOLD' },
            'START1K': { reward: 1000, type: 'GOLD' }
        };

        const promo = promoCodes[code];
        if (!promo) {
            this.showNotification('Error', 'Invalid promo code', 'error');
            return;
        }

        try {
            const updates = {};
            if (promo.type === 'TON') {
                updates.balance = (this.userState.balance || 0) + promo.reward;
            } else {
                updates.tub = (this.userState.tub || 0) + promo.reward;
            }

            await this.db.updateUser(this.currentUser.id, updates);

            // Record transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'promo_reward',
                amount: promo.reward,
                description: `Promo code: ${code}`,
                status: 'completed'
            });

            this.showNotification('Success', `You received ${promo.reward} ${promo.type}!`, 'success');
            document.getElementById('promoInput').value = '';
            this.renderUI();

        } catch (error) {
            console.error('Promo code application failed:', error);
            this.showNotification('Error', 'Failed to apply promo code', 'error');
        }
    }

    // Withdrawal System
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
            await this.db.updateUser(this.currentUser.id, {
                balance: (this.userState.balance || 0) - amount
            });

            // Record withdrawal transaction
            await this.db.createTransaction({
                userId: this.currentUser.id,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrawal to ${address.substring(0, 8)}...`,
                status: 'pending'
            });

            this.showNotification('Success', 'Withdrawal request submitted!', 'success');
            document.getElementById('withdraw-form').reset();
            this.renderUI();

        } catch (error) {
            console.error('Withdrawal failed:', error);
            this.showNotification('Error', 'Withdrawal failed', 'error');
        }
    }

    // Utility Methods
    getDomainFromUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
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

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notificationId = 'notification-' + Date.now();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = notificationId;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        
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
            if (notif) {
                notif.style.opacity = '0';
                setTimeout(() => {
                    if (notif.parentNode) {
                        notif.parentNode.removeChild(notif);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
function showPage(pageId) {
    app.showPage(pageId);
}

function showAddTaskModal() {
    app.showAddTaskModal();
}

function closeAddTaskModal() {
    app.closeAddTaskModal();
}

function createTask() {
    app.createTask();
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TonUPApp();
});
