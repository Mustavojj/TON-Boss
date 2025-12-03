class MoneyCatsApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.db = window.db;
        this.wallet = window.tonWallet;
        this.currentUser = null;
        this.currentPage = 'home';
        
        this.init();
    }

    async init() {
        try {
            // Initialize Telegram
            this.tg.ready();
            this.tg.expand();
            
            // Load user
            await this.loadUser();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial UI
            this.renderUI();
            
            console.log('✅ Money Cats App initialized');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app');
        }
    }

    async loadUser() {
        const tgUser = this.tg.initDataUnsafe.user;
        if (!tgUser) return;
        
        let user = await this.db.getUser(tgUser.id);
        
        if (!user) {
            // Check for referral
            const startParam = this.tg.initDataUnsafe.start_param;
            const referredBy = startParam && startParam !== tgUser.id.toString() ? startParam : null;
            
            user = await this.db.createUser({
                id: tgUser.id.toString(),
                firstName: tgUser.first_name,
                lastName: tgUser.last_name,
                username: tgUser.username,
                photoUrl: tgUser.photo_url,
                referredBy: referredBy
            });
            
            // Handle referral
            if (referredBy) {
                await this.db.addReferral(referredBy, tgUser.id.toString());
            }
        }
        
        this.currentUser = user;
        return user;
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Wallet connect
        document.getElementById('connect-wallet-btn')?.addEventListener('click', () => this.connectWallet());
        
        // Task tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTaskTab(tab);
            });
        });
    }

    showPage(page) {
        this.currentPage = page;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Show page content
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = p.id === `${page}-page` ? 'block' : 'none';
        });
        
        // Load page specific data
        if (page === 'tasks') {
            this.loadTasks();
        } else if (page === 'wallet') {
            this.loadWallet();
        } else if (page === 'home') {
            this.loadHome();
        }
    }

    showTaskTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.task-tab').forEach(tabContent => {
            tabContent.style.display = tabContent.id === `${tab}-tasks` ? 'block' : 'none';
        });
    }

    async loadHome() {
        // Load statistics
        const stats = await this.db.getAppStatistics();
        this.renderStatistics(stats);
        
        // Update user info
        this.renderUserInfo();
    }

    renderStatistics(stats) {
        document.getElementById('total-users').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('online-users').textContent = stats.onlineUsers.toLocaleString();
        document.getElementById('tasks-created').textContent = stats.totalTasks.toLocaleString();
        document.getElementById('tasks-completed').textContent = stats.tasksCompleted.toLocaleString();
        document.getElementById('total-earned').textContent = stats.totalEarned.toLocaleString();
    }

    renderUserInfo() {
        if (!this.currentUser) return;
        
        document.getElementById('user-name').textContent = `@${this.currentUser.username || this.currentUser.firstName}`;
        document.getElementById('user-level').textContent = `Level ${this.currentUser.level}`;
        document.getElementById('user-xp').textContent = `${this.currentUser.xp} XP`;
        
        // Update balances
        document.getElementById('cats-balance').textContent = this.currentUser.balances?.cats || 0;
        document.getElementById('ton-balance').textContent = (this.currentUser.balances?.ton || 0).toFixed(4);
        document.getElementById('pirate-balance').textContent = this.currentUser.balances?.pirate || 0;
        document.getElementById('tasks-balance').textContent = this.currentUser.balances?.tasks || 0;
    }

    async loadTasks() {
        // Load daily tasks
        const dailyTasks = await this.db.getDailyTasks();
        this.renderTasks('daily-tasks-container', dailyTasks);
        
        // Load community tasks
        const communityTasks = await this.db.getCommunityTasks();
        this.renderTasks('community-tasks-container', communityTasks);
        
        // Load user tasks
        const userTasks = await this.db.getUserTasks(this.currentUser.userId);
        this.renderTasks('user-tasks-container', userTasks);
    }

    renderTasks(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks available</div>';
            return;
        }
        
        let html = '';
        tasks.forEach(task => {
            const progressPercent = ((task.completions || 0) / (task.requirements?.target || 1)) * 100;
            
            html += `
                <div class="task-item">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-reward">
                            <span>+${task.reward?.cats || 0}</span>
                            <i class="fas fa-paw"></i>
                            <span>+${task.reward?.xp || 0} XP</span>
                        </div>
                    </div>
                    <div class="task-description">${task.description}</div>
                    ${task.requirements?.target ? `
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${task.completions || 0}/${task.requirements.target}</div>
                    </div>
                    ` : ''}
                    <div class="task-actions">
                        <button class="btn btn-sm" onclick="app.startTask('${task.$id}')">
                            Start →
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async startTask(taskId) {
        if (!this.currentUser) return;
        
        try {
            // Open task link
            const task = await this.db.getTask(taskId);
            if (task.link) {
                window.open(task.link, '_blank');
            }
            
            // Complete task after verification (simulated)
            setTimeout(async () => {
                await this.completeTask(taskId);
            }, 3000);
            
        } catch (error) {
            this.showError('Failed to start task');
        }
    }

    async completeTask(taskId) {
        try {
            await this.db.completeTask(this.currentUser.userId, taskId);
            
            // Get task rewards
            const task = await this.db.getTask(taskId);
            
            // Update user balances
            if (task.reward?.cats) {
                await this.db.updateBalance(this.currentUser.userId, 'cats', task.reward.cats);
            }
            if (task.reward?.xp) {
                await this.updateXP(task.reward.xp);
            }
            if (task.reward?.pirate) {
                await this.db.updateBalance(this.currentUser.userId, 'pirate', task.reward.pirate);
            }
            
            this.showSuccess(`Task completed! +${task.reward?.cats || 0} Cats, +${task.reward?.xp || 0} XP`);
            
            // Refresh UI
            this.renderUserInfo();
            this.loadTasks();
            
        } catch (error) {
            this.showError('Failed to complete task');
        }
    }

    async updateXP(xp) {
        const newXP = (this.currentUser.xp || 0) + xp;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        await this.db.updateUser(this.currentUser.userId, {
            xp: newXP,
            level: newLevel
        });
        
        this.currentUser.xp = newXP;
        this.currentUser.level = newLevel;
    }

    async connectWallet() {
        const result = await this.wallet.connect();
        
        if (result.success) {
            // Save wallet address to user
            await this.db.updateUser(this.currentUser.userId, {
                walletAddress: result.address
            });
            
            this.showSuccess('Wallet connected successfully!');
            this.loadWallet();
        } else {
            this.showError(`Failed to connect wallet: ${result.error}`);
        }
    }

    async loadWallet() {
        if (this.wallet.isConnected()) {
            const balance = await this.wallet.getBalance();
            
            document.getElementById('wallet-status').innerHTML = `
                <div class="wallet-connected">
                    <div class="wallet-address">
                        ${this.wallet.getAddress().slice(0, 8)}...${this.wallet.getAddress().slice(-6)}
                    </div>
                    <div class="wallet-balance">
                        ${balance.balance} TON
                    </div>
                    <button class="btn btn-sm" onclick="app.disconnectWallet()">
                        Disconnect
                    </button>
                </div>
            `;
        } else {
            document.getElementById('wallet-status').innerHTML = `
                <button class="btn" id="connect-wallet-btn">
                    Connect TON Wallet
                </button>
            `;
            
            // Re-add event listener
            document.getElementById('connect-wallet-btn')?.addEventListener('click', () => this.connectWallet());
        }
    }

    async disconnectWallet() {
        await this.wallet.disconnect();
        this.loadWallet();
        this.showSuccess('Wallet disconnected');
    }

    async depositTON(amount) {
        if (!this.wallet.isConnected()) {
            this.showError('Please connect your wallet first');
            return;
        }
        
        const result = await this.wallet.depositToApp(amount);
        
        if (result.success) {
            this.showSuccess(`Deposited ${amount} TON successfully!`);
        } else {
            this.showError(`Deposit failed: ${result.error}`);
        }
    }

    async withdrawTON(amount) {
        if (!this.wallet.isConnected()) {
            this.showError('Please connect your wallet first');
            return;
        }
        
        const result = await this.wallet.withdrawFromApp(amount);
        
        if (result.success) {
            this.showSuccess('Withdrawal request submitted!');
        } else {
            this.showError(`Withdrawal failed: ${result.error}`);
        }
    }

    // Utility functions
    showSuccess(message) {
        this.showNotification('Success', message, 'success');
    }

    showError(message) {
        this.showNotification('Error', message, 'error');
    }

    showNotification(title, message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}:</strong> ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    renderUI() {
        this.renderUserInfo();
        this.showPage('home');
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MoneyCatsApp();
    window.app = app;
});
