class AdminPanel {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadStats();
        this.setupEventListeners();
        this.loadPublicTasks();
        this.loadUsers();
    }

    setupEventListeners() {
        // التبويبات
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // تحميل الإعدادات الحالية
        this.loadCurrentSettings();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async loadCurrentSettings() {
        try {
            await loadAppConfig();
            
            // تعبئة الإعدادات الحالية
            document.getElementById('task-price').value = APP_CONFIG.taskPricePer1k;
            document.getElementById('min-members').value = APP_CONFIG.minMembers;
            document.getElementById('max-members').value = APP_CONFIG.maxMembers;
            document.getElementById('ad-value').value = APP_CONFIG.adValue;
            document.getElementById('ad-limit').value = APP_CONFIG.dailyAdLimit;
            document.getElementById('conversion-rate').value = APP_CONFIG.conversionRate;
            
        } catch (error) {
            console.error('Error loading current settings:', error);
        }
    }

    async loadStats() {
        try {
            // إحصائيات المستخدمين
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*');
            
            if (!usersError) {
                document.getElementById('total-users').textContent = users.length;
                
                const totalEarnings = users.reduce((sum, user) => sum + parseFloat(user.total_earned || 0), 0);
                document.getElementById('total-earnings').textContent = Math.floor(totalEarnings);
                
                const todayAds = users.reduce((sum, user) => sum + (user.daily_ads || 0), 0);
                document.getElementById('today-ads').textContent = todayAds;
            }

            // إحصائيات المهام
            const { data: tasks, error: tasksError } = await supabase
                .from('public_tasks')
                .select('*')
                .eq('is_active', true);
            
            if (!tasksError) {
                document.getElementById('active-tasks').textContent = tasks.length;
            }

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async updateTaskSettings() {
        try {
            const taskPricing = {
                price_per_1k: parseFloat(document.getElementById('task-price').value),
                min_members: parseInt(document.getElementById('min-members').value),
                max_members: parseInt(document.getElementById('max-members').value)
            };

            await updateAppSetting('task_pricing', taskPricing);
            this.showNotification('Task settings updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating task settings:', error);
            this.showNotification('Failed to update task settings', 'error');
        }
    }

    async updateAdSettings() {
        try {
            const adsConfig = {
                ad_value: parseInt(document.getElementById('ad-value').value),
                daily_limit: parseInt(document.getElementById('ad-limit').value),
                conversion_rate: parseInt(document.getElementById('conversion-rate').value)
            };

            await updateAppSetting('ads_config', adsConfig);
            this.showNotification('Ads settings updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating ad settings:', error);
            this.showNotification('Failed to update ads settings', 'error');
        }
    }

    async loadPublicTasks() {
        try {
            const { data: tasks, error } = await supabase
                .from('public_tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const container = document.getElementById('public-tasks-list');
            
            if (tasks.length === 0) {
                container.innerHTML = '<div class="task-item">No public tasks found</div>';
                return;
            }

            container.innerHTML = tasks.map(task => `
                <div class="task-item">
                    <div class="task-info">
                        <h4>${task.name}</h4>
                        <div class="task-stats">
                            Reward: ${task.reward} GOLD | 
                            Progress: ${task.current_completions}/${task.max_completions} |
                            Status: ${task.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-${task.is_active ? 'danger' : 'success'}" 
                                onclick="admin.toggleTask('${task.id}', ${!task.is_active})">
                            ${task.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-danger" onclick="admin.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading public tasks:', error);
        }
    }

    async loadUsers() {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const container = document.getElementById('users-list');
            
            if (users.length === 0) {
                container.innerHTML = '<div class="task-item">No users found</div>';
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="task-item">
                    <div class="task-info">
                        <h4>${user.first_name} ${user.last_name || ''}</h4>
                        <div class="task-stats">
                            ID: ${user.telegram_id} | 
                            Balance: ${user.balance} TON | 
                            Ads: ${user.lifetime_ads} | 
                            Referrals: ${user.referrals}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn" onclick="admin.viewUserDetails('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    showAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'flex';
    }

    hideAddTaskModal() {
        document.getElementById('add-task-modal').style.display = 'none';
    }

    async addPublicTask() {
        try {
            const taskData = {
                name: document.getElementById('new-task-name').value,
                description: document.getElementById('new-task-desc').value,
                url: document.getElementById('new-task-url').value,
                reward: parseFloat(document.getElementById('new-task-reward').value),
                max_completions: parseInt(document.getElementById('new-task-max').value),
                is_active: true
            };

            const { error } = await supabase
                .from('public_tasks')
                .insert([taskData]);

            if (error) throw error;

            this.showNotification('Public task added successfully!', 'success');
            this.hideAddTaskModal();
            this.loadPublicTasks();

        } catch (error) {
            console.error('Error adding public task:', error);
            this.showNotification('Failed to add task', 'error');
        }
    }

    async toggleTask(taskId, isActive) {
        try {
            const { error } = await supabase
                .from('public_tasks')
                .update({ is_active: isActive })
                .eq('id', taskId);

            if (error) throw error;

            this.showNotification(`Task ${isActive ? 'activated' : 'deactivated'}!`, 'success');
            this.loadPublicTasks();

        } catch (error) {
            console.error('Error toggling task:', error);
            this.showNotification('Failed to update task', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const { error } = await supabase
                .from('public_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            this.showNotification('Task deleted successfully!', 'success');
            this.loadPublicTasks();

        } catch (error) {
            console.error('Error deleting task:', error);
            this.showNotification('Failed to delete task', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('admin-notification');
        notification.textContent = message;
        notification.style.background = type === 'success' ? '#10B981' : '#EF4444';
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

const admin = new AdminPanel();
window.admin = admin;
