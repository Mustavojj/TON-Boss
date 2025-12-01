
const SUPABASE_CONFIG = {
    url: 'https://ztjokngpzbsuykwpcscz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0am9rbmdwemJzdXlrd3Bjc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5OTU0MTcsImV4cCI6MjA0ODU3MTQxN30.8dRLfC-3kzCfIH9c6FCwzva5X4W5j2w1M75Q0q4Jc9A'
};

class Database {
    constructor() {
        this.supabase = null;
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.MIN_REQUEST_INTERVAL = 100;
        this.init();
    }

    async init() {
        try {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/+esm');
            this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('✅ Main App Database connected successfully');
        } catch (error) {
            console.error('❌ Main App Database connection failed:', error);
            this.useLocalStorage = true;
        }
    }

    // نظام الطلبات المتسلسل (نفس system Admin)
    async queueRequest(operation) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            
            if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                await new Promise(resolve => 
                    setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
                );
            }
            
            const { operation, resolve, reject } = this.requestQueue.shift();
            this.lastRequestTime = Date.now();
            
            try {
                const result = await operation();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.isProcessing = false;
    }

    // User Management - متوافق مع Admin
    async getUser(userId) {
        return this.queueRequest(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') return null;
                    throw error;
                }
                
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for getUser');
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                return users[userId] || null;
            }
        });
    }

    async createUser(userData) {
        return this.queueRequest(async () => {
            try {
                const userRecord = {
                    id: userData.id,
                    first_name: userData.firstName || '',
                    last_name: userData.lastName || '',
                    username: userData.username || '',
                    photo_url: userData.photoUrl || '',
                    balance: userData.balance || 0,
                    tub: userData.tub || 1000,
                    referrals: userData.referrals || 0,
                    referral_earnings: userData.referralEarnings || 0,
                    total_earned: userData.totalEarned || 0,
                    daily_ad_count: userData.dailyAdCount || 0,
                    lifetime_ad_count: userData.lifetimeAdCount || 0
                };

                const { data, error } = await this.supabase
                    .from('users')
                    .insert([userRecord])
                    .select()
                    .single();

                if (error) throw error;
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for createUser');
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                const newUser = {
                    ...userData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                users[userData.id] = newUser;
                localStorage.setItem('tonup_users', JSON.stringify(users));
                return newUser;
            }
        });
    }

    async updateUser(userId, updates) {
        return this.queueRequest(async () => {
            try {
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                // Convert camelCase to snake_case
                Object.keys(updates).forEach(key => {
                    if (key === 'firstName') updateData.first_name = updates[key];
                    else if (key === 'lastName') updateData.last_name = updates[key];
                    else if (key === 'photoUrl') updateData.photo_url = updates[key];
                    else if (key === 'referralEarnings') updateData.referral_earnings = updates[key];
                    else if (key === 'totalEarned') updateData.total_earned = updates[key];
                    else if (key === 'dailyAdCount') updateData.daily_ad_count = updates[key];
                    else if (key === 'lifetimeAdCount') updateData.lifetime_ad_count = updates[key];
                    else updateData[key] = updates[key];
                });

                const { data, error } = await this.supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for updateUser');
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                if (users[userId]) {
                    users[userId] = {
                        ...users[userId],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    localStorage.setItem('tonup_users', JSON.stringify(users));
                }
                return users[userId];
            }
        });
    }

    // Task Management - متوافق مع Admin
    async createTask(taskData) {
        return this.queueRequest(async () => {
            try {
                const taskRecord = {
                    user_id: taskData.userId,
                    name: taskData.name,
                    link: taskData.link,
                    type: taskData.type,
                    check_subscription: taskData.checkSubscription || false,
                    target_completions: taskData.targetCompletions,
                    cost: taskData.cost,
                    reward: taskData.reward || 10,
                    status: 'active'
                };

                const { data, error } = await this.supabase
                    .from('tasks')
                    .insert([taskRecord])
                    .select()
                    .single();

                if (error) throw error;
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for createTask');
                const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
                const newTask = {
                    id: 'task_' + Date.now(),
                    ...taskData,
                    createdAt: new Date().toISOString(),
                    completions: 0
                };
                tasks.push(newTask);
                localStorage.setItem('tonup_tasks', JSON.stringify(tasks));
                return newTask;
            }
        });
    }

    async getAllTasks() {
        return this.queueRequest(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('tasks')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return (data || []).map(item => this.convertToCamelCase(item));
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for getAllTasks');
                return JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
            }
        });
    }

    async updateTaskCompletion(taskId) {
        return this.queueRequest(async () => {
            try {
                const { data: task, error: fetchError } = await this.supabase
                    .from('tasks')
                    .select('completions')
                    .eq('id', taskId)
                    .single();

                if (fetchError) throw fetchError;

                const { data, error } = await this.supabase
                    .from('tasks')
                    .update({ completions: (task.completions || 0) + 1 })
                    .eq('id', taskId)
                    .select()
                    .single();

                if (error) throw error;
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for updateTaskCompletion');
                const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
                const taskIndex = tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completions = (tasks[taskIndex].completions || 0) + 1;
                    localStorage.setItem('tonup_tasks', JSON.stringify(tasks));
                    return tasks[taskIndex];
                }
                return null;
            }
        });
    }

    // Transactions - متوافق مع Admin
    async createTransaction(transactionData) {
        return this.queueRequest(async () => {
            try {
                const transactionRecord = {
                    user_id: transactionData.userId,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    description: transactionData.description,
                    status: transactionData.status || 'completed'
                };

                const { data, error } = await this.supabase
                    .from('transactions')
                    .insert([transactionRecord])
                    .select()
                    .single();

                if (error) throw error;
                return this.convertToCamelCase(data);
            } catch (error) {
                console.warn('Supabase failed, using localStorage fallback for createTransaction');
                const transactions = JSON.parse(localStorage.getItem('tonup_transactions') || '[]');
                const newTransaction = {
                    id: 'tx_' + Date.now(),
                    ...transactionData,
                    createdAt: new Date().toISOString()
                };
                transactions.push(newTransaction);
                localStorage.setItem('tonup_transactions', JSON.stringify(transactions));
                return newTransaction;
            }
        });
    }

    // Helper function
    convertToCamelCase(data) {
        if (!data) return data;
        
        const converted = {};
        Object.keys(data).forEach(key => {
            let camelKey = key;
            if (key.includes('_')) {
                camelKey = key.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
            }
            converted[camelKey] = data[key];
        });
        return converted;
    }
}


const db = new Database();
