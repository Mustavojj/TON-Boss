// app.js - Fixed Version
class MoneyCatsApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.db = window.db;
        this.wallet = window.tonWallet;
        this.currentUser = null;
        this.currentPage = 'home';
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Starting Money Cats App...');
            
            // Check if running in Telegram
            if (this.tg && this.tg.initDataUnsafe) {
                this.tg.ready();
                this.tg.expand();
                console.log('✅ Telegram WebApp initialized');
                
                // Hide loader and show app
                this.hideLoader();
                this.showApp();
                
                // Initialize database
                await this.initializeDatabase();
                
                // Load user data
                await this.loadUser();
                
                // Setup UI
                this.setupEventListeners();
                this.renderUI();
                
                console.log('✅ App initialized successfully');
            } else {
                console.log('⚠️ Not running in Telegram, using demo mode');
                this.hideLoader();
                this.showApp();
                this.setupEventListeners();
                this.renderUIDemo(); // Render demo data
            }
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.hideLoader();
            this.showError('Failed to initialize app: ' + error.message);
        }
    }

    async initializeDatabase() {
        if (!this.db) {
            console.error('Database not available');
            throw new Error('Database connection failed');
        }
        
        // Wait for database to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const status = this.db.getConnectionStatus ? this.db.getConnectionStatus() : { status: 'unknown' };
        console.log('Database status:', status);
        
        return true;
    }

    async loadUser() {
        try {
            if (!this.tg?.initDataUnsafe?.user) {
                throw new Error('No Telegram user data');
            }
            
            const tgUser = this.tg.initDataUnsafe.user;
            console.log('Loading user:', tgUser.id);
            
            // Try to get user from database
            let user = null;
            if (this.db && this.db.getUser) {
                user = await this.db.getUser(tgUser.id);
            }
            
            if (!user) {
                // Create demo user for testing
                user = {
                    userId: tgUser.id.toString(),
                    telegramId: tgUser.id.toString(),
                    firstName: tgUser.first_name || 'User',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url || '',
                    walletAddress: '',
                    level: 1,
                    xp: 15,
                    balances: {
                        cats: 250,
                        ton: 0.0000,
                        pirate: 1,
                        tasks: 0
                    },
                    referrals: 0,
                    totalEarned: 0
                };
                
                console.log('Created demo user:', user);
            }
            
            this.currentUser = user;
            return user;
            
        } catch (error) {
            console.error('Error loading user:', error);
            
            // Fallback to demo user
            this.currentUser = {
                userId: 'demo_user_123',
                telegramId: 'demo_user_123',
                firstName: 'Demo User',
                username: 'demo_user',
                level: 1,
                xp: 15,
                balances: {
                    cats: 250,
                    ton: 0.0000,
                    pirate: 1,
                    tasks: 0
                },
                referrals: 0,
                totalEarned: 250
            };
            
            return this.currentUser;
        }
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Task tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTaskTab(tab);
            });
        });

        // Add task button
        const addTaskBtn = document.querySelector('.add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal-overlay').id;
                this.closeModal(modalId);
            });
        });

        // Wallet connect
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // Copy referral link
        const copyBtn = document.querySelector('button[onclick*="copyReferralLink"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyReferralLink());
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

    showPage(page) {
        this.currentPage = page;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });
        
        // Load page content
        if (page === 'tasks') {
            this.loadTasks();
        } else if (page === 'wallet') {
            this.loadWallet();
        } else if (page === 'home') {
            this.loadHome();
        } else if (page === 'referrals') {
            this.loadReferrals();
        }
    }

    showTaskTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
        
        // Show selected tab content
        document.querySelectorAll('.task-tab').forEach(tabContent => {
            tabContent.style.display = 'none';
            if (tabContent.id === `${tab}-tasks`) {
                tabContent.style.display = 'block';
            }
        });
        
        // Load tab content
        if (tab === 'daily') {
            this.loadDailyTasks();
        } else if (tab === 'community') {
            this.loadCommunityTasks();
        } else if (tab === 'my') {
            this.loadMyTasks();
        }
    }

    renderUI() {
        if (!this.currentUser) return;
        
        // Update user info
        document.getElementById('user-name').textContent = 
            `@${this.currentUser.username || this.currentUser.firstName || 'User'}`;
        document.getElementById('user-level').textContent = this.currentUser.level;
        document.getElementById('user-xp').textContent = `${this.currentUser.xp} XP`;
        
        // Update balances
        const balances = this.currentUser.balances || {};
        document.getElementById('cats-balance').textContent = balances.cats || 0;
        document.getElementById('ton-balance').textContent = (balances.ton || 0).toFixed(4);
        document.getElementById('pirate-balance').textContent = balances.pirate || 0;
        document.getElementById('tasks-balance').textContent = balances.tasks || 0;
        
        // Update referral link
        const refLink = `https://t.me/your_bot?start=${this.currentUser.userId}`;
        const refInput = document.getElementById('referral-link');
        if (refInput) refInput.value = refLink;
        
        // Load home page
        this.loadHome();
    }

    renderUIDemo() {
        // Demo user data
        this.currentUser = {
            userId: 'demo_123',
            firstName: 'Demo User',
            username: 'demo',
            level: 1,
            xp: 15,
            balances: {
                cats: 250,
                ton: 0.0000,
                pirate: 1,
                tasks: 0
            },
            referrals: 2,
            totalEarned: 250
        };
        
        this.renderUI();
        
        // Demo statistics
        document.getElementById('total-users').textContent = '1,542';
        document.getElementById('online-users').textContent = '324';
        document.getElementById('tasks-created').textContent = '89';
        document.getElementById('tasks-completed').textContent = '2,345';
        
        // Demo referral stats
        document.getElementById('total-referrals').textContent = '2';
        document.getElementById('referral-earnings').textContent = '0.05';
        
        // Load demo tasks
        this.loadDemoTasks();
    }

    async loadHome() {
        // Load statistics
        if (this.db && this.db.getAppStatistics) {
            try {
                const stats = await this.db.getAppStatistics();
                this.renderStatistics(stats);
            } catch (error) {
                console.error('Error loading statistics:', error);
                this.renderStatistics({
                    totalUsers: 1542,
                    onlineUsers: 324,
                    tasksCreated: 89,
                    tasksCompleted: 2345,
                    totalEarned: 1250.50
                });
            }
        } else {
            // Demo stats
            this.renderStatistics({
                totalUsers: 1542,
                onlineUsers: 324,
                tasksCreated: 89,
                tasksCompleted: 2345,
                totalEarned: 1250.50
            });
        }
    }

    renderStatistics(stats) {
        if (!stats) return;
        
        const elements = {
            'total-users': stats.totalUsers?.toLocaleString() || '0',
            'online-users': stats.onlineUsers?.toLocaleString() || '0',
            'tasks-created': stats.tasksCreated?.toLocaleString() || '0',
            'tasks-completed': stats.tasksCompleted?.toLocaleString() || '0'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    async loadTasks() {
        this.loadDailyTasks();
    }

    async loadDailyTasks() {
        const container = document.getElementById('daily-tasks-container');
        if (!container) return;
        
        // Demo daily tasks (like in screenshot)
        const demoDailyTasks = [
            {
                id: '1',
                title: 'AddExtra',
                description: 'Complete AddExtra task',
                reward: { cats: 250, xp: 15, pirate: 1 },
                completions: 45,
                requirements: { target: 100 }
            },
            {
                id: '2',
                title: 'Addagram',
                description: 'Complete Addagram task',
                reward: { cats: 250, xp: 15, pirate: 1 },
                completions: 30,
                requirements: { target: 100 }
            },
            {
                id: '3',
                title: 'Monetag',
                description: 'Complete Monetag task',
                reward: { cats: 250, xp: 15, pirate: 1 },
                completions: 60,
                requirements: { target: 100 }
            },
            {
                id: '4',
                title: 'Refer 2 Friends',
                description: 'Refer 2 friends to join',
                reward: { cats: 10000, xp: 30 },
                completions: 1,
                requirements: { target: 2 }
            },
            {
                id: '5',
                title: 'Check our Channel',
                description: 'Join and check our channel',
                reward: { cats: 1000, xp: 10 },
                completions: 85,
                requirements: { target: 100 }
            }
        ];
        
        this.renderTasks(container, demoDailyTasks);
    }

    async loadCommunityTasks() {
        const container = document.getElementById('community-tasks-container');
        if (!container) return;
        
        // Demo community tasks
        const demoCommunityTasks = [
            {
                id: '6',
                title: 'Money Cats',
                description: 'Join Money Cats channel',
                reward: { cats: 5000, xp: 25 },
                completions: 150,
                requirements: { target: 200 }
            },
            {
                id: '7',
                title: 'Money Cats Community',
                description: 'Join community chat',
                reward: { cats: 5000, xp: 25 },
                completions: 120,
                requirements: { target: 200 }
            },
            {
                id: '8',
                title: 'Gift Fest',
                description: 'Participate in gift fest',
                reward: { cats: 5000, xp: 25 },
                completions: 80,
                requirements: { target: 200 }
            },
            {
                id: '9',
                title: 'Join Profit Channel',
                description: 'Join profit channel',
                reward: { cats: 5000, xp: 25 },
                completions: 95,
                requirements: { target: 200 }
            },
            {
                id: '10',
                title: 'Join + React',
                description: 'Join and react to post',
                reward: { cats: 5000, xp: 25 },
                completions: 110,
                requirements: { target: 200 }
            }
        ];
        
        this.renderTasks(container, demoCommunityTasks);
    }

    async loadMyTasks() {
        const container = document.getElementById('user-tasks-container');
        if (!container) return;
        
        if (!this.currentUser || !this.db) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks created yet</p>
                </div>
            `;
            return;
        }
        
        // Try to load user's tasks
        try {
            const userTasks = await this.db.getUserTasks(this.currentUser.userId);
            if (userTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-plus-circle"></i>
                        <p>Create your first task!</p>
                        <button class="btn" onclick="app.showAddTaskModal()" style="margin-top: 10px;">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                `;
            } else {
                this.renderTasks(container, userTasks);
            }
        } catch (error) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading tasks</p>
                </div>
            `;
        }
    }

    loadDemoTasks() {
        this.loadDailyTasks();
        this.loadCommunityTasks();
    }

    renderTasks(container, tasks) {
        if (!container || !tasks) return;
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks available</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        tasks.forEach(task => {
            const progress = task.completions || 0;
            const target = task.requirements?.target || 100;
            const progressPercent = Math.min((progress / target) * 100, 100);
            
            html += `
                <div class="task-item">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-reward">
                            <span>+${task.reward?.cats || 0}</span>
                            <i class="fas fa-paw"></i>
                            <span>+${task.reward?.xp || 0} XP</span>
                            ${task.reward?.pirate ? `<span>+${task.reward.pirate} <i class="fas fa-skull-crossbones"></i></span>` : ''}
                        </div>
                    </div>
                    <div class="task-description">${task.description || 'Complete this task to earn rewards'}</div>
                    ${target > 1 ? `
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${progress}/${target}</div>
                    </div>
                    ` : ''}
                    <div class="task-actions">
                        <button class="btn btn-sm" onclick="app.startTask('${task.id}')">
                            Start →
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadWallet() {
        const statusEl = document.getElementById('wallet-status');
        if (!statusEl) return;
        
        if (this.wallet && this.wallet.isConnected && this.wallet.isConnected()) {
            try {
                const balance = await this.wallet.getBalance();
                statusEl.innerHTML = `
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
            } catch (error) {
                statusEl.innerHTML = `
                    <button class="btn" id="connect-wallet-btn">
                        <i class="fas fa-wallet"></i>
                        Connect TON Wallet
                    </button>
                `;
                document.getElementById('connect-wallet-btn')?.addEventListener('click', () => this.connectWallet());
            }
        } else {
            statusEl.innerHTML = `
                <button class="btn" id="connect-wallet-btn">
                    <i class="fas fa-wallet"></i>
                    Connect TON Wallet
                </button>
            `;
            document.getElementById('connect-wallet-btn')?.addEventListener('click', () => this.connectWallet());
        }
        
        // Load transactions
        this.loadTransactions();
    }

    async loadTransactions() {
        const container = document.getElementById('transactions-list');
        if (!container) return;
        
        // Demo transactions
        const demoTransactions = [
            { description: 'Task: AddExtra', amount: '+250 Cats', date: 'Today', type: 'task' },
            { description: 'Task: Addagram', amount: '+250 Cats', date: 'Today', type: 'task' },
            { description: 'Referral Bonus', amount: '+5000 Cats', date: 'Yesterday', type: 'referral' },
            { description: 'Withdrawal Request', amount: '-0.05 TON', date: '2 days ago', type: 'withdrawal' }
        ];
        
        let html = '';
        demoTransactions.forEach(tx => {
            const isPositive = tx.amount.startsWith('+');
            html += `
                <div class="task-item" style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${tx.description}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${tx.date}</div>
                        </div>
                        <div style="color: ${isPositive ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                            ${tx.amount}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadReferrals() {
        if (!this.currentUser) return;
        
        document.getElementById('total-referrals').textContent = this.currentUser.referrals || 0;
        document.getElementById('referral-earnings').textContent = '0.05'; // Demo
    }

    // Modal functions
    showAddTaskModal() {
        this.showModal('add-task-modal');
    }

    showDepositModal() {
        this.showModal('deposit-modal');
    }

    showWithdrawModal() {
        this.showModal('withdraw-modal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Action functions
    async connectWallet() {
        if (!this.wallet) {
            this.showNotification('Wallet Error', 'TON wallet module not loaded', 'error');
            return;
        }
        
        try {
            const result = await this.wallet.connect();
            if (result.success) {
                this.showNotification('Success', 'Wallet connected successfully!', 'success');
                this.loadWallet();
            } else {
                this.showNotification('Error', `Failed to connect: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Error', 'Wallet connection failed', 'error');
        }
    }

    async disconnectWallet() {
        if (this.wallet && this.wallet.disconnect) {
            await this.wallet.disconnect();
            this.showNotification('Info', 'Wallet disconnected', 'info');
            this.loadWallet();
        }
    }

    startTask(taskId) {
        this.showNotification('Task Started', 'Opening task...', 'info');
        
        // Simulate task completion after 3 seconds
        setTimeout(() => {
            this.completeTask(taskId);
        }, 3000);
    }

    async completeTask(taskId) {
        if (!this.currentUser) return;
        
        // Simulate reward
        const reward = 250; // Cats
        const newBalance = (this.currentUser.balances?.cats || 0) + reward;
        
        // Update UI
        this.currentUser.balances = this.currentUser.balances || {};
        this.currentUser.balances.cats = newBalance;
        this.currentUser.totalEarned = (this.currentUser.totalEarned || 0) + reward;
        
        // Update display
        document.getElementById('cats-balance').textContent = newBalance;
        
        this.showNotification('Task Completed', `You earned ${reward} Cats!`, 'success');
        
        // Reload tasks to update progress
        this.loadTasks();
    }

    async createTask() {
        const title = document.getElementById('task-title')?.value;
        const link = document.getElementById('task-link')?.value;
        const rewardCats = parseInt(document.getElementById('task-reward-cats')?.value) || 1000;
        const rewardXP = parseInt(document.getElementById('task-reward-xp')?.value) || 25;
        
        if (!title || !link) {
            this.showNotification('Error', 'Please fill all fields', 'error');
            return;
        }
        
        if (this.db && this.db.createTask) {
            try {
                const taskData = {
                    title: title,
                    link: link,
                    type: 'community',
                    reward: { cats: rewardCats, xp: rewardXP },
                    createdBy: this.currentUser.userId,
                    requirements: { target: 100 }
                };
                
                await this.db.createTask(taskData);
                this.showNotification('Success', 'Task created successfully!', 'success');
                this.closeModal('add-task-modal');
                this.loadMyTasks();
            } catch (error) {
                this.showNotification('Error', 'Failed to create task', 'error');
            }
        } else {
            // Demo mode
            this.showNotification('Demo', 'Task creation would save to database in production', 'info');
            this.closeModal('add-task-modal');
        }
    }

    async depositTON() {
        const amount = parseFloat(document.getElementById('deposit-amount')?.value) || 0.05;
        
        if (amount < 0.05) {
            this.showNotification('Error', 'Minimum deposit is 0.05 TON', 'error');
            return;
        }
        
        if (this.wallet && this.wallet.depositToApp) {
            try {
                const result = await this.wallet.depositToApp(amount);
                if (result.success) {
                    this.showNotification('Success', `Deposited ${amount} TON successfully!`, 'success');
                    this.closeModal('deposit-modal');
                } else {
                    this.showNotification('Error', `Deposit failed: ${result.error}`, 'error');
                }
            } catch (error) {
                this.showNotification('Error', 'Deposit failed', 'error');
            }
        } else {
            this.showNotification('Demo', `Would deposit ${amount} TON to your account`, 'info');
            this.closeModal('deposit-modal');
        }
    }

    async withdrawTON() {
        const amount = parseFloat(document.getElementById('withdraw-amount')?.value) || 0.05;
        
        if (amount < 0.05) {
            this.showNotification('Error', 'Minimum withdrawal is 0.05 TON', 'error');
            return;
        }
        
        if (this.wallet && this.wallet.withdrawFromApp) {
            try {
                const result = await this.wallet.withdrawFromApp(amount);
                if (result.success) {
                    this.showNotification('Success', 'Withdrawal request submitted!', 'success');
                    this.closeModal('withdraw-modal');
                } else {
                    this.showNotification('Error', `Withdrawal failed: ${result.error}`, 'error');
                }
            } catch (error) {
                this.showNotification('Error', 'Withdrawal failed', 'error');
            }
        } else {
            this.showNotification('Demo', `Would withdraw ${amount} TON to your wallet`, 'info');
            this.closeModal('withdraw-modal');
        }
    }

    copyReferralLink() {
        const input = document.getElementById('referral-link');
        if (!input) return;
        
        input.select();
        input.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(input.value);
            this.showNotification('Success', 'Referral link copied!', 'success');
        } catch (err) {
            this.showNotification('Error', 'Failed to copy link', 'error');
        }
    }

    // Utility functions
    showNotification(title, message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}:</strong> ${message}
            </div>
        `;
        
        // Add styles if not exist
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--bg-card);
                    border-radius: var(--border-radius);
                    padding: 16px 20px;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow);
                    max-width: 300px;
                    z-index: 1001;
                    animation: slideIn 0.3s ease;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-success { border-left: 4px solid var(--success); }
                .notification-error { border-left: 4px solid var(--danger); }
                .notification-info { border-left: 4px solid var(--info); }
                .notification-content { font-size: 0.9rem; }
                .notification-content strong { display: block; margin-bottom: 4px; }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 40px 20px; text-align: center;">
                    <div style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 style="margin-bottom: 10px;">Error</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
                    <button onclick="location.reload()" style="
                        background: var(--primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 12px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MoneyCatsApp();
    window.app = app;
});
