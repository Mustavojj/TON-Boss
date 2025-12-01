// database.js - إصدار المتصفح الكامل
const SUPABASE_CONFIG = {
    url: 'https://ztjokngpzbsuykwpcscz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0am9rbmdwemJzdXlrd3Bjc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5OTU0MTcsImV4cCI6MjA0ODU3MTQxN30.8dRLfC-3kzCfIH9c6FCwzva5X4W5j2w1M75Q0q4Jc9A'
};

class Database {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // تحميل Supabase للعمل في المتصفح
            if (typeof window !== 'undefined') {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/+esm');
                this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
                this.isInitialized = true;
                console.log('✅ Database connected in browser');
            } else {
                console.warn('⚠️ Database running in non-browser environment');
            }
        } catch (error) {
            console.error('❌ Database connection failed:', error);
        }
    }

    // التحقق من الاتصال
    async isConnected() {
        if (!this.supabase) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.supabase !== null;
        }
        return true;
    }

    // 🔵 إدارة المستخدمين
    async getUser(userId) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.getUserFromLocalStorage(userId);
        }

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`User ${userId} not found in database`);
                    return null;
                }
                console.error('Supabase getUser error:', error);
                return this.getUserFromLocalStorage(userId);
            }
            
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database getUser error:', error);
            return this.getUserFromLocalStorage(userId);
        }
    }

    async createUser(userData) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.createUserInLocalStorage(userData);
        }

        try {
            // تحويل camelCase إلى snake_case
            const userRecord = {
                id: userData.id.toString(),
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
                lifetime_ad_count: userData.lifetimeAdCount || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('users')
                .insert([userRecord])
                .select()
                .single();

            if (error) {
                console.error('Supabase createUser error:', error);
                return this.createUserInLocalStorage(userData);
            }
            
            console.log('✅ User created in Supabase:', data.id);
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database createUser error:', error);
            return this.createUserInLocalStorage(userData);
        }
    }

    async updateUser(userId, updates) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.updateUserInLocalStorage(userId, updates);
        }

        try {
            const updateData = {
                updated_at: new Date().toISOString()
            };

            // تحويل camelCase إلى snake_case
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

            if (error) {
                console.error('Supabase updateUser error:', error);
                return this.updateUserInLocalStorage(userId, updates);
            }
            
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database updateUser error:', error);
            return this.updateUserInLocalStorage(userId, updates);
        }
    }

    // 🟢 إدارة المهام
    async getAllTasks() {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.getTasksFromLocalStorage();
        }

        try {
            const { data, error } = await this.supabase
                .from('tasks')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase getAllTasks error:', error);
                return this.getTasksFromLocalStorage();
            }
            
            return (data || []).map(item => this.convertToCamelCase(item));
        } catch (error) {
            console.error('Database getAllTasks error:', error);
            return this.getTasksFromLocalStorage();
        }
    }

    async createTask(taskData) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.createTaskInLocalStorage(taskData);
        }

        try {
            const taskRecord = {
                id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 9),
                user_id: taskData.userId.toString(),
                name: taskData.name,
                link: taskData.link,
                type: taskData.type,
                check_subscription: taskData.checkSubscription || false,
                target_completions: taskData.targetCompletions,
                cost: taskData.cost,
                reward: taskData.reward || 10,
                completions: taskData.completions || 0,
                status: 'active',
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('tasks')
                .insert([taskRecord])
                .select()
                .single();

            if (error) {
                console.error('Supabase createTask error:', error);
                return this.createTaskInLocalStorage(taskData);
            }
            
            console.log('✅ Task created in Supabase:', data.id);
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database createTask error:', error);
            return this.createTaskInLocalStorage(taskData);
        }
    }

    async updateTaskCompletion(taskId) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.updateTaskCompletionInLocalStorage(taskId);
        }

        try {
            // الحصول على المهمة الحالية
            const { data: task, error: fetchError } = await this.supabase
                .from('tasks')
                .select('completions')
                .eq('id', taskId)
                .single();

            if (fetchError) {
                console.error('Error fetching task:', fetchError);
                return this.updateTaskCompletionInLocalStorage(taskId);
            }

            // تحديث العداد
            const { data, error } = await this.supabase
                .from('tasks')
                .update({ 
                    completions: (task.completions || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();

            if (error) {
                console.error('Supabase updateTaskCompletion error:', error);
                return this.updateTaskCompletionInLocalStorage(taskId);
            }
            
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database updateTaskCompletion error:', error);
            return this.updateTaskCompletionInLocalStorage(taskId);
        }
    }

    // 🟡 إدارة المعاملات
    async createTransaction(transactionData) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.createTransactionInLocalStorage(transactionData);
        }

        try {
            const transactionRecord = {
                id: 'tx_' + Date.now() + Math.random().toString(36).substr(2, 9),
                user_id: transactionData.userId.toString(),
                type: transactionData.type,
                amount: transactionData.amount,
                description: transactionData.description,
                status: transactionData.status || 'completed',
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('transactions')
                .insert([transactionRecord])
                .select()
                .single();

            if (error) {
                console.error('Supabase createTransaction error:', error);
                return this.createTransactionInLocalStorage(transactionData);
            }
            
            return this.convertToCamelCase(data);
        } catch (error) {
            console.error('Database createTransaction error:', error);
            return this.createTransactionInLocalStorage(transactionData);
        }
    }

    async getUserTransactions(userId) {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using localStorage fallback');
            return this.getUserTransactionsFromLocalStorage(userId);
        }

        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Supabase getUserTransactions error:', error);
                return this.getUserTransactionsFromLocalStorage(userId);
            }
            
            return (data || []).map(item => this.convertToCamelCase(item));
        } catch (error) {
            console.error('Database getUserTransactions error:', error);
            return this.getUserTransactionsFromLocalStorage(userId);
        }
    }

    // 📊 إحصائيات التطبيق
    async getAppStatistics() {
        await this.isConnected();
        if (!this.supabase) {
            console.warn('Supabase not connected, using default statistics');
            return this.getDefaultStatistics();
        }

        try {
            // احصل على عدد المستخدمين
            const { count: userCount, error: userError } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // احصل على عدد المهام
            const { count: taskCount, error: taskError } = await this.supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true });

            // احصل على إجمالي الأرباح
            const { data: users, error: earningsError } = await this.supabase
                .from('users')
                .select('total_earned');

            if (userError || taskError || earningsError) {
                console.warn('Error fetching statistics:', { userError, taskError, earningsError });
                return this.getDefaultStatistics();
            }

            const totalEarned = (users || []).reduce((sum, user) => sum + (user.total_earned || 0), 0);
            const tasksCompleted = 0; // يمكنك حساب هذا من جدول transactions

            return {
                totalUsers: userCount || 0,
                onlineUsers: Math.floor((userCount || 0) * 0.2), // 20% متصلين
                tasksCreated: taskCount || 0,
                tasksCompleted: tasksCompleted,
                totalEarned: totalEarned
            };
        } catch (error) {
            console.error('Database getAppStatistics error:', error);
            return this.getDefaultStatistics();
        }
    }

    // 🔄 دوال الاحتياطي (LocalStorage)
    getUserFromLocalStorage(userId) {
        try {
            const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
            return users[userId] || null;
        } catch {
            return null;
        }
    }

    createUserInLocalStorage(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
            const newUser = {
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            users[userData.id] = newUser;
            localStorage.setItem('tonup_users', JSON.stringify(users));
            return newUser;
        } catch (error) {
            console.error('LocalStorage createUser error:', error);
            return userData;
        }
    }

    updateUserInLocalStorage(userId, updates) {
        try {
            const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
            if (users[userId]) {
                users[userId] = {
                    ...users[userId],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('tonup_users', JSON.stringify(users));
                return users[userId];
            }
            return null;
        } catch (error) {
            console.error('LocalStorage updateUser error:', error);
            return null;
        }
    }

    getTasksFromLocalStorage() {
        try {
            return JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
        } catch {
            return [];
        }
    }

    createTaskInLocalStorage(taskData) {
        try {
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
        } catch (error) {
            console.error('LocalStorage createTask error:', error);
            return taskData;
        }
    }

    updateTaskCompletionInLocalStorage(taskId) {
        try {
            const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].completions = (tasks[taskIndex].completions || 0) + 1;
                tasks[taskIndex].updatedAt = new Date().toISOString();
                localStorage.setItem('tonup_tasks', JSON.stringify(tasks));
                return tasks[taskIndex];
            }
            return null;
        } catch (error) {
            console.error('LocalStorage updateTaskCompletion error:', error);
            return null;
        }
    }

    createTransactionInLocalStorage(transactionData) {
        try {
            const transactions = JSON.parse(localStorage.getItem('tonup_transactions') || '[]');
            const newTransaction = {
                id: 'tx_' + Date.now(),
                ...transactionData,
                createdAt: new Date().toISOString()
            };
            transactions.push(newTransaction);
            localStorage.setItem('tonup_transactions', JSON.stringify(transactions));
            return newTransaction;
        } catch (error) {
            console.error('LocalStorage createTransaction error:', error);
            return transactionData;
        }
    }

    getUserTransactionsFromLocalStorage(userId) {
        try {
            const transactions = JSON.parse(localStorage.getItem('tonup_transactions') || '[]');
            return transactions.filter(tx => tx.userId === userId);
        } catch {
            return [];
        }
    }

    getDefaultStatistics() {
        return {
            totalUsers: 15427,
            onlineUsers: 3241,
            tasksCompleted: 89234,
            tasksCreated: 1245,
            totalEarned: 2456.78
        };
    }

    // 🛠️ دوال مساعدة
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

    // 🔍 فحص قاعدة البيانات
    async checkDatabaseHealth() {
        try {
            await this.isConnected();
            
            if (!this.supabase) {
                return { status: 'error', message: 'Database not connected' };
            }

            // فحص جدول المستخدمين
            const { data: users, error: usersError } = await this.supabase
                .from('users')
                .select('id')
                .limit(1);

            // فحص جدول المهام
            const { data: tasks, error: tasksError } = await this.supabase
                .from('tasks')
                .select('id')
                .limit(1);

            // فحص جدول المعاملات
            const { data: transactions, error: transactionsError } = await this.supabase
                .from('transactions')
                .select('id')
                .limit(1);

            const hasUsers = !usersError && users;
            const hasTasks = !tasksError && tasks;
            const hasTransactions = !transactionsError && transactions;

            return {
                status: 'connected',
                tables: {
                    users: hasUsers ? '✅ Connected' : '❌ Error: ' + (usersError?.message || 'No data'),
                    tasks: hasTasks ? '✅ Connected' : '❌ Error: ' + (tasksError?.message || 'No data'),
                    transactions: hasTransactions ? '✅ Connected' : '❌ Error: ' + (transactionsError?.message || 'No data')
                },
                message: 'Supabase connection is working'
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Database health check failed: ' + error.message
            };
        }
    }
}

// إنشاء نسخة عالمية من قاعدة البيانات
const db = new Database();

// تصدير للاستخدام العالمي
if (typeof window !== 'undefined') {
    window.db = db;
}

console.log('🚀 Database module loaded successfully');
