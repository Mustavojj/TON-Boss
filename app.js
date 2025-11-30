class TonUPApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.userState = {};
        this.appStatistics = {};
        this.db = db;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('🚀 Starting TonUP App...');
            this.showLoader();
            
            // Initialize Telegram Web App
            if (this.tg && this.tg.initDataUnsafe) {
                this.tg.ready();
                this.tg.expand();
                console.log('✅ Telegram WebApp initialized');
                
                // Get actual Telegram user data
                const tgUser = this.tg.initDataUnsafe.user;
                if (tgUser && tgUser.id) {
                    await this.loadActualUserData(tgUser);
                } else {
                    await this.loadDemoData();
                }
            } else {
                await this.loadDemoData();
            }
            
            // Load actual statistics
            await this.loadActualStatistics();
            
            // Setup all systems
            this.setupEventListeners();
            this.setupSwapSystem();
            this.setupTaskTypeSelection();
            this.renderUI();
            
            console.log('✅ App initialized successfully');
            this.isInitialized = true;
            
            setTimeout(() => {
                this.hideLoader();
                this.showApp();
                this.showNotification('Welcome!', 'TonUP is ready to use', 'success');
            }, 1000);

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showNotification('Error', 'Failed to initialize app', 'error');
            this.hideLoader();
            this.showApp();
        }
    }

    async loadActualUserData(tgUser) {
        try {
            console.log('👤 Loading actual user data...');
            
            // Try to get user from database
            let userData = await this.db.getUser(tgUser.id);
            
            if (!userData) {
                console.log('📝 Creating new user...');
                // Create new user with actual Telegram data
                userData = {
                    id: tgUser.id,
                    firstName: tgUser.first_name || 'User',
                    lastName: tgUser.last_name || '',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url || '',
                    balance: 0.000,
                    tub: 1000, // Starting bonus
                    referrals: 0,
                    referralEarnings: 0,
                    totalEarned: 0,
                    dailyAdCount: 0,
                    lifetimeAdCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await this.db.createUser(userData);
                console.log('✅ New user created');
            }
            
            this.currentUser = userData;
            this.userState = userData;
            console.log('✅ User data loaded:', this.userState);
            
        } catch (error) {
            console.error('❌ Failed to load actual user data:', error);
            await this.loadDemoData();
        }
    }

    async loadActualStatistics() {
        try {
            console.log('📊 Loading actual statistics...');
            const stats = await this.db.getAppStatistics();
            
            if (stats && stats.totalUsers > 0) {
                this.appStatistics = stats;
                console.log('✅ Actual statistics loaded:', this.appStatistics);
            } else {
                // Initialize with actual counts from database
                const users = await this.db.getAllUsers();
                const tasks = await this.db.getAllTasks();
                
                const totalEarned = users.reduce((sum, user) => sum + (user.totalEarned || 0), 0);
                const tasksCompleted = tasks.reduce((sum, task) => sum + (task.completions || 0), 0);
                
                this.appStatistics = {
                    totalUsers: users.length,
                    tasksCompleted: tasksCompleted,
                    tasksCreated: tasks.length,
                    totalEarned: totalEarned
                };
                
                console.log('✅ Statistics calculated from database');
            }
            
        } catch (error) {
            console.error('❌ Failed to load actual statistics:', error);
            // Fallback to demo statistics
            this.appStatistics = {
                totalUsers: 15427,
                tasksCompleted: 89234,
                tasksCreated: 1245,
                totalEarned: 2456.78
            };
        }
    }

    async loadDemoData() {
        console.log('🎮 Loading demo data...');
        // Create demo user data only as fallback
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
        this.currentUser = this.userState;
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
        document.getElementById('available-tub-balance').textContent = this.userState.tub.toLocaleString();
        document.getElementById('available-ton-balance').textContent = this.userState.balance.toFixed(3);
    }

    // ... باقي الدوال كما هي مع التأكد من استخدام await مع جميع استدعاءات database

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
                const progress = ((task.completions || 0) / task.targetcompletions) * 100;
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
                                <span>Progress: ${(task.completions || 0).toLocaleString()}/${task.targetcompletions.toLocaleString()}</span>
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
                    <p>Please try again later</p>
                </div>
            `;
        }
    }

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
                reward: 10,
                createdAt: new Date().toISOString()
            };

            // Save to actual database
            const createdTask = await this.db.createTask(taskData);
            console.log('✅ Task created in database:', createdTask);

            // Update user balance in database
            const newBalance = this.userState.balance - cost;
            await this.db.updateUser(this.userState.id, {
                balance: newBalance,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            this.userState.balance = newBalance;

            // Record transaction
            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'task_creation',
                amount: -cost,
                description: `Created task: ${name}`,
                status: 'completed',
                createdAt: new Date().toISOString()
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
            this.showNotification('Error', 'Failed to create task', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            // Get task from database
            const tasks = await this.db.getAllTasks();
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) {
                this.showNotification('Error', 'Task not found', 'error');
                return;
            }

            if (task.completions >= task.targetcompletions) {
                this.showNotification('Error', 'This task has reached its completion limit', 'error');
                return;
            }

            // Open task link
            window.open(task.link, '_blank');

            // Update task completions in database
            const newCompletions = (task.completions || 0) + 1;
            await this.db.updateTaskCompletion(taskId);

            // Reward user
            const reward = task.reward || 10;
            const newTub = this.userState.tub + reward;
            const newTotalEarned = this.userState.totalEarned + reward;

            await this.db.updateUser(this.userState.id, {
                tub: newTub,
                totalEarned: newTotalEarned,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            this.userState.tub = newTub;
            this.userState.totalEarned = newTotalEarned;

            // Record transaction
            await this.db.createTransaction({
                userId: this.userState.id,
                type: 'task_reward',
                amount: reward,
                description: `Completed: ${task.name}`,
                status: 'completed',
                createdAt: new Date().toISOString()
            });

            this.showNotification('Success', `You earned ${reward} GOLD!`, 'success');
            this.renderTasksPage();
            this.updateBalances();

            // Update statistics
            await this.loadActualStatistics();
            this.renderHomePage();

        } catch (error) {
            console.error('❌ Task completion failed:', error);
            this.showNotification('Error', 'Failed to complete task', 'error');
        }
    }

    async loadUserTasksInModal() {
        const container = document.getElementById('my-tasks-modal-list');
        if (!container) return;

        try {
            const userTasks = await this.db.getUserTasks(this.userState.id);
            console.log('📋 Loaded user tasks:', userTasks.length);

            if (userTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 20px;">
                        <i class="fas fa-plus-circle"></i>
                        <h3>No Tasks Created</h3>
                        <p>Create your first task above!</p>
                    </div>
                `;
