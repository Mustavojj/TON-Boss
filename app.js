import { DatabaseManager } from './supabase.js';
import { SecurityManager } from './security.js';
import { APP_CONFIG } from '../config.js';

class TonBossApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.userTasks = [];
        this.init();
    }

    async init() {
        try {
            this.tg.ready();
            this.tg.expand();
            
            // التحقق من VPN
            const isVPN = await SecurityManager.checkVPN();
            if (isVPN) {
                this.showVPNBlock();
                return;
            }

            await this.initializeUser();
            this.setupEventListeners();
            this.renderUI();
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showNotification('Error', 'Failed to initialize app', 'error');
        }
    }

    async initializeUser() {
        const tgUser = this.tg.initDataUnsafe.user;
        if (!tgUser) throw new Error('Telegram user data not found');

        let user = await DatabaseManager.getUser(tgUser.id);
        
        if (!user) {
            user = await DatabaseManager.createUser({
                telegram_id: tgUser.id,
                first_name: tgUser.first_name,
                last_name: tgUser.last_name || '',
                username: tgUser.username || '',
                photo_url: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name)}&background=6366F1&color=fff`,
                balance: 0,
                tub_balance: 0,
                total_earned: 0,
                referrals: 0,
                referral_earnings: 0,
                daily_ads: 0,
                lifetime_ads: 0,
                country_code: 'Unknown'
            });
        }

        this.currentUser = user;
        this.userTasks = await DatabaseManager.getUserTasks(user.id);
    }

    setupEventListeners() {
        // التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
        });

        // إضافة مهمة
        document.getElementById('add-task-btn').addEventListener('click', () => this.showAddTaskModal());
        document.getElementById('confirm-task-btn').addEventListener('click', () => this.createTask());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());

        // أنواع المهام
        document.querySelectorAll('.task-type-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectTaskType(e.target.dataset.type));
        });

        // عدد الأعضاء
        document.querySelectorAll('.members-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectMembersCount(parseInt(e.target.dataset.members)));
        });

        // التبويبات
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // المشاهدة والإعلانات
        document.getElementById('watch-ad-btn')?.addEventListener('click', () => this.watchAd());
        document.getElementById('convert-btn')?.addEventListener('click', () => this.convertCurrency());
        document.getElementById('withdraw-form')?.addEventListener('submit', (e) => this.handleWithdraw(e));
    }

    switchPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(pageId).classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        if (pageId === 'tasks-page') {
            this.loadTasks();
        } else if (pageId === 'my-tasks-page') {
            this.loadUserTasks();
        }
    }

    showAddTaskModal() {
        document.getElementById('modal-overlay').style.display = 'flex';
        this.switchTab('add-task');
        this.updateTaskCost();
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        this.resetTaskForm();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    selectTaskType(type) {
        document.querySelectorAll('.task-type-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
        this.selectedTaskType = type;
        this.updateTaskCost();
    }

    selectMembersCount(count) {
        document.querySelectorAll('.members-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`[data-members="${count}"]`).classList.add('selected');
        this.selectedMembersCount = count;
        this.updateTaskCost();
    }

    updateTaskCost() {
        const costElement = document.getElementById('task-cost');
        if (this.selectedMembersCount) {
            const cost = (this.selectedMembersCount / 1000) * APP_CONFIG.taskPricePer1k;
            costElement.textContent = `≈ ${cost.toFixed(1)} TON`;
            
            // تفعيل/تعطيل زر التأكيد
            const confirmBtn = document.getElementById('confirm-task-btn');
            confirmBtn.disabled = !this.currentUser || this.currentUser.balance < cost;
        } else {
            costElement.textContent = '≈ 0 TON';
        }
    }

    async createTask() {
        try {
            const taskName = document.getElementById('task-name').value.trim();
            const taskLink = document.getElementById('task-link').value.trim();

            if (!taskName || !taskLink) {
                this.showNotification('Error', 'Please fill all required fields', 'error');
                return;
            }

            if (!this.selectedTaskType || !this.selectedMembersCount) {
                this.showNotification('Error', 'Please select task type and members count', 'error');
                return;
            }

            if (!SecurityManager.validateInput(taskName) || !SecurityManager.validateURL(taskLink)) {
                this.showNotification('Error', 'Invalid input detected', 'error');
                return;
            }

            const cost = (this.selectedMembersCount / 1000) * APP_CONFIG.taskPricePer1k;
            
            if (this.currentUser.balance < cost) {
                this.showNotification('Error', 'Insufficient balance', 'error');
                return;
            }

            // خصم التكلفة
            await DatabaseManager.updateUser(this.currentUser.telegram_id, {
                balance: this.currentUser.balance - cost
            });

            // إنشاء المهمة
            const task = await DatabaseManager.createUserTask({
                user_id: this.currentUser.id,
                name: taskName,
                link: taskLink,
                type: this.selectedTaskType,
                target_members: this.selectedMembersCount,
                current_members: 0,
                cost: cost,
                status: 'active',
                progress: 0
            });

            // تحديث البيانات
            this.currentUser.balance -= cost;
            this.userTasks.unshift(task);

            this.showNotification('Success', 'Your task has been added!', 'success');
            this.closeModal();
            this.loadUserTasks();

        } catch (error) {
            console.error('Task creation failed:', error);
            this.showNotification('Error', 'Failed to create task', 'error');
        }
    }

    async loadTasks() {
        try {
            const tasks = await DatabaseManager.getTasks();
            const container = document.getElementById('tasks-container');
            
            if (tasks.length === 0) {
                container.innerHTML = '<div class="loading">No tasks available</div>';
                return;
            }

            container.innerHTML = tasks.map(task => `
                <div class="task-card">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${task.name}</div>
                            <div class="task-stats">Reward: ${task.reward} GOLD</div>
                        </div>
                        <div class="task-status status-active">Active</div>
                    </div>
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(task.current_completions / task.max_completions) * 100}%"></div>
                        </div>
                    </div>
                    <div class="task-footer">
                        <span>${task.current_completions}/${task.max_completions}</span>
                        <button class="btn" onclick="app.claimTask('${task.id}')">
                            <i class="fas fa-play"></i> Start
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    async loadUserTasks() {
        const container = document.getElementById('user-tasks-container');
        
        if (this.userTasks.length === 0) {
            container.innerHTML = '<div class="loading">No tasks created yet</div>';
            return;
        }

        container.innerHTML = this.userTasks.map(task => `
            <div class="task-card">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.name}</div>
                        <div class="task-stats">${task.current_members}/${task.target_members} members</div>
                    </div>
                    <div class="task-status status-${task.status}">${task.status}</div>
                </div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(task.current_members / task.target_members) * 100}%"></div>
                    </div>
                </div>
                <div class="task-footer">
                    <span>Cost: ${task.cost} TON</span>
                    <div>
                        ${task.status === 'active' ? `
                            <button class="btn btn-danger" onclick="app.stopTask('${task.id}')">
                                <i class="fas fa-stop"></i> Stop
                            </button>
                        ` : `
                            <button class="btn btn-secondary" onclick="app.deleteTask('${task.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async stopTask(taskId) {
        try {
            await DatabaseManager.updateUserTask(taskId, { status: 'stopped' });
            const task = this.userTasks.find(t => t.id === taskId);
            if (task) task.status = 'stopped';
            this.loadUserTasks();
            this.showNotification('Success', 'Task stopped successfully', 'success');
        } catch (error) {
            this.showNotification('Error', 'Failed to stop task', 'error');
        }
    }

    async deleteTask(taskId) {
        try {
            // في الواقع، قد ترغب في soft delete بدلاً من الحذف الفعلي
            this.userTasks = this.userTasks.filter(t => t.id !== taskId);
            this.loadUserTasks();
            this.showNotification('Success', 'Task deleted successfully', 'success');
        } catch (error) {
            this.showNotification('Error', 'Failed to delete task', 'error');
        }
    }

    async watchAd() {
        try {
            // محاكاة مشاهدة إعلان
            this.showNotification('Info', 'Loading advertisement...', 'info');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const reward = APP_CONFIG.adValue;
            await DatabaseManager.updateUser(this.currentUser.telegram_id, {
                tub_balance: this.currentUser.tub_balance + reward,
                total_earned: this.currentUser.total_earned + reward,
                daily_ads: this.currentUser.daily_ads + 1,
                lifetime_ads: this.currentUser.lifetime_ads + 1
            });

            this.currentUser.tub_balance += reward;
            this.currentUser.total_earned += reward;
            this.currentUser.daily_ads += 1;
            this.currentUser.lifetime_ads += 1;

            this.showNotification('Success', `You earned ${reward} GOLD!`, 'success');
            this.renderUI();

        } catch (error) {
            this.showNotification('Error', 'Failed to complete ad', 'error');
        }
    }

    async convertCurrency() {
        try {
            const tubAmount = parseFloat(document.getElementById('tub-amount').value) || 0;
            const tonAmount = tubAmount / APP_CONFIG.conversionRate;

            if (tubAmount <= 0 || tubAmount > this.currentUser.tub_balance) {
                this.showNotification('Error', 'Invalid amount', 'error');
                return;
            }

            await DatabaseManager.updateUser(this.currentUser.telegram_id, {
                tub_balance: this.currentUser.tub_balance - tubAmount,
                balance: this.currentUser.balance + tonAmount
            });

            this.currentUser.tub_balance -= tubAmount;
            this.currentUser.balance += tonAmount;

            this.showNotification('Success', `Converted ${tubAmount} GOLD to ${tonAmount.toFixed(3)} TON`, 'success');
            this.renderUI();

        } catch (error) {
            this.showNotification('Error', 'Conversion failed', 'error');
        }
    }

    async handleWithdraw(e) {
        e.preventDefault();
        // ... (كود السحب الحالي)
    }

    renderUI() {
        if (!this.currentUser) return;

        // تحديث الرصيد
        document.getElementById('header-ton-balance').textContent = this.currentUser.balance.toFixed(3);
        document.getElementById('header-tub-balance').textContent = Math.floor(this.currentUser.tub_balance);
        
        // تحديث الإحصائيات
        document.getElementById('daily-ads-watched').textContent = `${this.currentUser.daily_ads}/${APP_CONFIG.dailyAdLimit}`;
        document.getElementById('total-ads-watched').textContent = this.currentUser.lifetime_ads;
        document.getElementById('referral-count').textContent = this.currentUser.referrals;
        document.getElementById('total-earned').textContent = Math.floor(this.currentUser.total_earned);

        // تحديث معلومات المستخدم
        document.getElementById('user-name').textContent = this.currentUser.first_name;
        document.getElementById('user-telegram-id').textContent = `ID: ${this.currentUser.telegram_id}`;
        document.getElementById('user-avatar').src = this.currentUser.photo_url;
    }

    showNotification(title, message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.innerHTML = `
            <div class="notification ${type}">
                <strong>${title}:</strong> ${message}
            </div>
        `;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    showVPNBlock() {
        document.body.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; background: var(--background); color: var(--text-primary); height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div>
                    <div style="font-size: 3rem; margin-bottom: 20px;">🚫</div>
                    <h2>Access Restricted</h2>
                    <p>VPN/Proxy usage is not allowed. Please disable your VPN to continue.</p>
                </div>
            </div>
        `;
    }

    resetTaskForm() {
        document.getElementById('task-name').value = '';
        document.getElementById('task-link').value = '';
        document.querySelectorAll('.task-type-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.members-option').forEach(opt => opt.classList.remove('selected'));
        this.selectedTaskType = null;
        this.selectedMembersCount = null;
        this.updateTaskCost();
    }
}

const app = new TonBossApp();
window.app = app;
