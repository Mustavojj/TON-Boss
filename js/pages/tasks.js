
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

class TasksPage {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('tasks-page');
        this.tasks = [];
    }

    /**
     * Render tasks page
     */
    async render() {
        this.element.innerHTML = `
            <div class="tasks-content">
                <!-- Watch & Earn Section -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <h2>Watch & Earn</h2>
                </div>
                
                <div id="ad-progress-container" class="glass-card"></div>
                <div id="ad-task-container"></div>

                <!-- Daily Tasks -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-calendar-day"></i>
                    </div>
                    <h2>Daily Tasks</h2>
                </div>
                
                <div id="daily-tasks-container" class="tasks-grid"></div>

                <!-- Partner Tasks -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h2>Partner Tasks</h2>
                </div>
                
                <div id="dynamic-tasks-container" class="tasks-grid"></div>
                
                <!-- Add Task Button -->
                <button class="floating-add-btn" id="add-task-float-btn">
                    <i class="fas fa-plus"></i>
                    <span>Add Task</span>
                    <div class="add-task-badge">NEW</div>
                </button>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        await this.loadTasks();
        this.renderAdTask();
        this.renderAdProgress();
        this.renderDailyTasks();
        this.renderDynamicTasks();
    }

    /**
     * Add tasks page styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tasks-content {
                padding-bottom: 100px;
            }
            
            #ad-progress-container {
                margin-bottom: 16px;
            }
            
            .ad-progress-section {
                margin: 15px 0;
            }
            
            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .progress-title {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .progress-stats {
                font-size: 0.9rem;
                font-weight: 700;
                color: var(--color-accent-blue);
            }
            
            .ad-task-card {
                background: var(--bg-card);
                border-radius: var(--radius-large);
                padding: 20px;
                margin-bottom: 12px;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all var(--transition-normal);
            }
            
            .ad-task-card:hover {
                border-color: var(--color-accent-blue);
                transform: translateY(-2px);
                box-shadow: var(--shadow-medium);
            }
            
            .ad-task-icon {
                width: 60px;
                height: 60px;
                border-radius: var(--radius-medium);
                background: var(--gradient-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .ad-task-content {
                flex: 1;
            }
            
            .ad-task-title {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
            }
            
            .reward-display-horizontal {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .reward-text {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .reward-amount {
                font-size: 1.1rem;
                font-weight: 800;
                color: var(--color-accent-blue);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .watch-ad-btn {
                background: var(--gradient-accent);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: var(--radius-medium);
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
                transition: all var(--transition-normal);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.95rem;
            }
            
            .watch-ad-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: var(--shadow-medium);
            }
            
            .watch-ad-btn:disabled {
                background: var(--text-secondary);
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            .tasks-grid {
                display: grid;
                gap: 12px;
                margin: 20px 0;
            }
            
            .task-card {
                background: var(--bg-card);
                border-radius: var(--radius-large);
                padding: 20px;
                border: 1px solid var(--border-color);
                transition: all var(--transition-normal);
                position: relative;
                overflow: hidden;
            }
            
            .task-card:hover {
                border-color: var(--color-accent-blue);
                transform: translateY(-2px);
                box-shadow: var(--shadow-medium);
            }
            
            .task-card.completed {
                background: rgba(46, 204, 113, 0.05);
                border-color: rgba(46, 204, 113, 0.3);
            }
            
            .task-header {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .task-icon {
                width: 60px;
                height: 60px;
                border-radius: var(--radius-medium);
                background: var(--gradient-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.3rem;
                flex-shrink: 0;
                position: relative;
            }
            
            .task-icon.completed::after {
                content: '✓';
                position: absolute;
                top: -5px;
                right: -5px;
                background: #2ecc71;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: var(--radius-circle);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                border: 2px solid var(--bg-card);
            }
            
            .task-content {
                flex: 1;
            }
            
            .task-title {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .task-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.5;
                margin-bottom: 12px;
            }
            
            .task-reward {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--color-accent-blue);
            }
            
            .task-reward i {
                color: gold;
            }
            
            .task-progress {
                margin: 15px 0;
            }
            
            .task-progress-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 0.85rem;
            }
            
            .task-progress-info span:first-child {
                color: var(--text-secondary);
            }
            
            .task-progress-info span:last-child {
                color: var(--color-accent-blue);
                font-weight: 600;
            }
            
            .task-progress-bar {
                background: var(--bg-surface);
                border-radius: 8px;
                height: 8px;
                overflow: hidden;
                position: relative;
            }
            
            .task-progress-fill {
                background: var(--gradient-accent);
                height: 100%;
                border-radius: 8px;
                transition: width 0.5s ease;
                position: relative;
                overflow: hidden;
            }
            
            .task-progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }
            
            .task-action {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid var(--border-color);
            }
            
            .task-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .join-btn {
                background: var(--gradient-accent);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: var(--radius-medium);
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-normal);
                white-space: nowrap;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 0.9rem;
            }
            
            .join-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: var(--shadow-light);
            }
            
            .join-btn:disabled {
                background: #2ecc71;
                cursor: default;
            }
            
            .join-btn.completed {
                background: #2ecc71;
            }
            
            .floating-add-btn {
                position: fixed;
                bottom: 90px;
                right: 20px;
                background: var(--gradient-accent);
                color: white;
                border: none;
                border-radius: var(--radius-large);
                padding: 16px 24px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: var(--shadow-heavy);
                z-index: 999;
                transition: all var(--transition-normal);
            }
            
            .floating-add-btn:hover {
                transform: translateY(-4px) scale(1.05);
                box-shadow: var(--shadow-heavy), 0 0 20px rgba(52, 152, 219, 0.5);
            }
            
            .add-task-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                font-size: 0.7rem;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 12px;
                animation: pulse 2s infinite;
            }
            
            @media (max-width: 480px) {
                .ad-task-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 12px;
                }
                
                .watch-ad-btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .task-header {
                    gap: 12px;
                }
                
                .task-icon {
                    width: 50px;
                    height: 50px;
                    font-size: 1.1rem;
                }
                
                .floating-add-btn {
                    bottom: 80px;
                    right: 16px;
                    padding: 14px 20px;
                    font-size: 0.9rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add task button
        const addTaskBtn = document.getElementById('add-task-float-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.app.showAddTaskModal();
            });
        }
    }

    /**
     * Load tasks from database
     */
    async loadTasks() {
        try {
            this.tasks = await window.db.getAllTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    /**
     * Render ad progress
     */
    renderAdProgress() {
        const container = document.getElementById('ad-progress-container');
        if (!container || !this.app.userState) return;
        
        const user = this.app.userState;
        const dailyLimit = AppConfig.dailyAdLimit || 20;
        const watchedCount = user.dailyAdCount || 0;
        const percentage = Math.min((watchedCount / dailyLimit) * 100, 100);
        
        container.innerHTML = `
            <div class="ad-progress-section">
                <div class="progress-header">
                    <span class="progress-title">Daily Ad Progress</span>
                    <span class="progress-stats">${watchedCount} / ${dailyLimit}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    /**
     * Render ad task
     */
    renderAdTask() {
        const container = document.getElementById('ad-task-container');
        if (!container || !this.app.userState) return;
        
        const user = this.app.userState;
        const now = Date.now();
        const onBreak = user.breakUntil && now < user.breakUntil;
        const limitReached = user.dailyAdCount >= (AppConfig.dailyAdLimit || 20);
        
        let html = '';
        
        if (onBreak) {
            const remaining = Math.ceil((user.breakUntil - now) / 60000);
            html = `
                <div class="ad-task-card break-state">
                    <div class="ad-task-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="ad-task-content">
                        <h3 class="ad-task-title">Break Time!</h3>
                        <div class="reward-display-horizontal">
                            <span class="reward-text">Please wait for</span>
                            <span class="reward-amount">${remaining}</span>
                            <span class="reward-text">more minutes</span>
                        </div>
                        <p class="break-message">Taking a short break to optimize your experience</p>
                    </div>
                    <button class="watch-ad-btn" disabled>
                        <i class="fas fa-pause"></i>
                        Paused
                    </button>
                </div>
            `;
        } else if (limitReached) {
            html = `
                <div class="ad-task-card break-state">
                    <div class="ad-task-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="ad-task-content">
                        <h3 class="ad-task-title">Daily Limit Reached</h3>
                        <div class="reward-display-horizontal">
                            <span class="reward-text">Come back</span>
                            <span class="reward-amount">Tomorrow</span>
                            <span class="reward-text">for more ADS</span>
                        </div>
                        <p class="break-message">You've completed your daily ad limit</p>
                    </div>
                    <button class="watch-ad-btn" disabled>
                        <i class="fas fa-check"></i>
                        Completed
                    </button>
                </div>
            `;
        } else {
            html = `
                <div class="ad-task-card">
                    <div class="ad-task-icon">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="ad-task-content">
                        <h3 class="ad-task-title">WATCH & EARN</h3>
                        <div class="reward-display-horizontal">
                            <span class="reward-text">Earn</span>
                            <span class="reward-amount">${AppConfig.adValue || 5}
                                <i class="fas fa-gem" style="color: gold;"></i>
                            </span>
                            <span class="reward-text">Per AD</span>
                        </div>
                        <p class="task-description">Watch a short ad to earn GOLD instantly</p>
                    </div>
                    <button id="watch-ad-btn" class="watch-ad-btn">
                        <i class="fas fa-play"></i>
                        Watch Ad
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Add event listener to watch ad button
        if (!onBreak && !limitReached) {
            const watchBtn = document.getElementById('watch-ad-btn');
            if (watchBtn) {
                watchBtn.addEventListener('click', () => {
                    this.app.handleWatchAd();
                });
            }
        }
    }

    /**
     * Render daily tasks
     */
    renderDailyTasks() {
        const container = document.getElementById('daily-tasks-container');
        if (!container) return;
        
        // Mock daily tasks - in real app, these would come from database
        const dailyTasks = [
            {
                id: 'daily_checkin',
                name: 'Daily Check-in',
                description: 'Check in daily to claim your reward',
                reward: 20,
                completed: false,
                icon: 'fas fa-calendar-check'
            },
            {
                id: 'watch_news',
                name: 'Watch TON News',
                description: 'Stay updated with latest TON news',
                reward: 15,
                completed: false,
                icon: 'fas fa-newspaper'
            },
            {
                id: 'join_community',
                name: 'Join Community',
                description: 'Join our Telegram community',
                reward: 50,
                completed: false,
                icon: 'fas fa-users'
            }
        ];
        
        let html = '';
        
        dailyTasks.forEach(task => {
            html += `
                <div class="task-card ${task.completed ? 'completed' : ''}">
                    <div class="task-header">
                        <div class="task-icon ${task.completed ? 'completed' : ''}">
                            <i class="${task.icon}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">
                                ${task.name}
                                ${task.completed ? '<i class="fas fa-check-circle" style="color: #2ecc71;"></i>' : ''}
                            </h3>
                            <p class="task-description">${task.description}</p>
                            <div class="task-reward">
                                <i class="fas fa-gem" style="color: gold;"></i>
                                <span>Reward: ${task.reward} GOLD</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-action">
                        <div class="task-status">
                            <span>${task.completed ? 'Claimed' : 'Available'}</span>
                        </div>
                        <button class="join-btn ${task.completed ? 'completed' : ''}" 
                                data-task-id="${task.id}"
                                ${task.completed ? 'disabled' : ''}>
                            ${task.completed ? 
                                '<i class="fas fa-check"></i> Claimed' : 
                                '<i class="fas fa-play"></i> Start'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to daily task buttons
        container.querySelectorAll('.join-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                this.handleDailyTask(taskId);
            });
        });
    }

    /**
     * Render dynamic tasks
     */
    async renderDynamicTasks() {
        const container = document.getElementById('dynamic-tasks-container');
        if (!container) return;
        
        if (this.tasks.length === 0) {
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
        
        this.tasks.forEach(task => {
            if (task.status !== 'active') return;
            
            const progress = ((task.completions || 0) / (task.targetCompletions || 1)) * 100;
            const progressPercent = Math.round(progress);
            
            html += `
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-icon">
                            <i class="fas fa-${task.icon || 'link'}"></i>
                        </div>
                        <div class="task-content">
                            <h3 class="task-title">${task.name || 'Task'}</h3>
                            <p class="task-description">${task.description || 'Complete this task to earn rewards'}</p>
                            <div class="task-reward">
                                <i class="fas fa-gem" style="color: gold;"></i>
                                <span>Reward: ${task.reward || 10} GOLD</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="task-progress">
                        <div class="task-progress-info">
                            <span>Progress: ${task.completions || 0}/${task.targetCompletions || 1}</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="task-progress-bar">
                            <div class="task-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="task-action">
                        <div class="task-status">
                            <span>${(task.type || 'task').toUpperCase()} • ${task.checkSubscription ? 'Verified' : 'Free'}</span>
                        </div>
                        <button class="join-btn" data-task-id="${task.id}">
                            <i class="fas fa-play"></i>
                            Start Task
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to task buttons
        container.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                this.app.completeTask(taskId);
            });
        });
    }

    /**
     * Handle daily task completion
     */
    async handleDailyTask(taskId) {
        try {
            // Check security
            if (!window.security?.isRequestAllowed?.()) {
                this.app.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            // Find the task
            let task = null;
            let taskIndex = -1;
            
            if (taskId === 'daily_checkin') {
                task = {
                    id: taskId,
                    name: 'Daily Check-in',
                    reward: 20,
                    type: 'daily'
                };
            } else if (taskId === 'watch_news') {
                task = {
                    id: taskId,
                    name: 'Watch TON News',
                    reward: 15,
                    type: 'channel',
                    link: 'https://t.me/TON_HUB_NEWS'
                };
            } else if (taskId === 'join_community') {
                task = {
                    id: taskId,
                    name: 'Join Community',
                    reward: 50,
                    type: 'group',
                    link: 'https://t.me/TONHUB_S'
                };
            }
            
            if (!task) {
                this.app.showNotification('Error', 'Task not found', 'error');
                return;
            }
            
            // Open task link if available
            if (task.link) {
                window.open(task.link, '_blank');
            }
            
            // Show loading state
            const button = document.querySelector(`.join-btn[data-task-id="${taskId}"]`);
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            button.disabled = true;
            
            // Simulate task completion delay
            setTimeout(async () => {
                try {
                    // Update user balance
                    const user = this.app.userState;
                    const updates = {
                        tub: (user.tub || 0) + task.reward,
                        totalEarned: (user.totalEarned || 0) + task.reward
                    };
                    
                    await this.app.updateUserData(updates, 'daily_task');
                    
                    // Record transaction
                    await window.db.createTransaction({
                        userId: user.id,
                        type: 'task_reward',
                        amount: task.reward,
                        description: `Completed daily task: ${task.name}`
                    });
                    
                    // Show success message
                    this.app.showNotification('Task Completed!', `You earned ${task.reward} GOLD!`, 'success');
                    
                    // Update UI
                    this.renderDailyTasks();
                    this.app.header.updateBalances();
                    
                } catch (error) {
                    console.error('Task completion error:', error);
                    this.app.showNotification('Error', 'Failed to complete task', 'error');
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            }, 2000);
            
        } catch (error) {
            console.error('Daily task error:', error);
            this.app.showNotification('Error', 'Task failed', 'error');
        }
    }

    /**
     * Refresh tasks data
     */
    async refresh() {
        await this.loadTasks();
        this.renderAdProgress();
        this.renderAdTask();
        this.renderDynamicTasks();
    }
}
