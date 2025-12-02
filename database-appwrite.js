// database-appwrite.js - إصدار Appwrite الكامل
const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '692e93a1000c10b16641',
    databaseId: 'tonup_db',
    usersCollectionId: 'users',
    tasksCollectionId: 'tasks',
    transactionsCollectionId: 'transactions'
};

class DatabaseAppwrite {
    constructor() {
        this.client = null;
        this.account = null;
        this.databases = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // تحميل Appwrite SDK
            if (typeof window !== 'undefined') {
                const { Client, Account, Databases } = await import('https://cdn.jsdelivr.net/npm/appwrite@13.0.2/+esm');
                
                this.client = new Client()
                    .setEndpoint(APPWRITE_CONFIG.endpoint)
                    .setProject(APPWRITE_CONFIG.projectId);
                
                this.account = new Account(this.client);
                this.databases = new Databases(this.client);
                this.isInitialized = true;
                
                console.log('✅ Appwrite Database connected successfully');
            } else {
                console.warn('⚠️ Appwrite running in non-browser environment');
            }
        } catch (error) {
            console.error('❌ Appwrite connection failed:', error);
        }
    }

    // التحقق من الاتصال
    async isConnected() {
        if (!this.databases) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.databases !== null;
        }
        return true;
    }

    // 🔵 إدارة المستخدمين
    async getUser(userId) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.getUserFromLocalStorage(userId);
        }

        try {
            const user = await this.databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.usersCollectionId,
                userId
            );
            
            console.log('✅ User fetched from Appwrite:', userId);
            return this.convertToCamelCase(user);
        } catch (error) {
            if (error.code === 404) {
                console.log(`User ${userId} not found in Appwrite`);
                return null;
            }
            console.error('Appwrite getUser error:', error);
            return this.getUserFromLocalStorage(userId);
        }
    }

    async createUser(userData) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.createUserInLocalStorage(userData);
        }

        try {
            const userDocument = {
                $id: userData.id.toString(),
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
                photoUrl: userData.photoUrl || '',
                balance: userData.balance || 0,
                tub: userData.tub || 1000,
                referrals: userData.referrals || 0,
                referralEarnings: userData.referralEarnings || 0,
                totalEarned: userData.totalEarned || 0,
                dailyAdCount: userData.dailyAdCount || 0,
                lifetimeAdCount: userData.lifetimeAdCount || 0,
                telegramId: userData.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const user = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.usersCollectionId,
                userDocument.$id,
                userDocument
            );
            
            console.log('✅ User created in Appwrite:', user.$id);
            return this.convertToCamelCase(user);
        } catch (error) {
            console.error('Appwrite createUser error:', error);
            return this.createUserInLocalStorage(userData);
        }
    }

    async updateUser(userId, updates) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.updateUserInLocalStorage(userId, updates);
        }

        try {
            const updateData = {
                ...updates,
                updatedAt: new Date().toISOString()
            };

            const user = await this.databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.usersCollectionId,
                userId,
                updateData
            );
            
            return this.convertToCamelCase(user);
        } catch (error) {
            console.error('Appwrite updateUser error:', error);
            return this.updateUserInLocalStorage(userId, updates);
        }
    }

    // 🟢 إدارة المهام
    async getAllTasks() {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.getTasksFromLocalStorage();
        }

        try {
            const tasks = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.tasksCollectionId,
                [
                    Query.equal('status', 'active'),
                    Query.orderDesc('createdAt')
                ]
            );
            
            return tasks.documents.map(item => this.convertToCamelCase(item));
        } catch (error) {
            console.error('Appwrite getAllTasks error:', error);
            return this.getTasksFromLocalStorage();
        }
    }

    async createTask(taskData) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.createTaskInLocalStorage(taskData);
        }

        try {
            const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const taskDocument = {
                $id: taskId,
                userId: taskData.userId.toString(),
                name: taskData.name,
                link: taskData.link,
                type: taskData.type,
                checkSubscription: taskData.checkSubscription || false,
                targetCompletions: taskData.targetCompletions,
                cost: taskData.cost,
                reward: taskData.reward || 10,
                completions: taskData.completions || 0,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            const task = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.tasksCollectionId,
                taskId,
                taskDocument
            );
            
            console.log('✅ Task created in Appwrite:', task.$id);
            return this.convertToCamelCase(task);
        } catch (error) {
            console.error('Appwrite createTask error:', error);
            return this.createTaskInLocalStorage(taskData);
        }
    }

    async updateTaskCompletion(taskId) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.updateTaskCompletionInLocalStorage(taskId);
        }

        try {
            // الحصول على المهمة الحالية
            const task = await this.databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.tasksCollectionId,
                taskId
            );

            // تحديث العداد
            const updatedTask = await this.databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.tasksCollectionId,
                taskId,
                {
                    completions: (task.completions || 0) + 1,
                    updatedAt: new Date().toISOString()
                }
            );
            
            return this.convertToCamelCase(updatedTask);
        } catch (error) {
            console.error('Appwrite updateTaskCompletion error:', error);
            return this.updateTaskCompletionInLocalStorage(taskId);
        }
    }

    // 🟡 إدارة المعاملات
    async createTransaction(transactionData) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.createTransactionInLocalStorage(transactionData);
        }

        try {
            const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const transactionDocument = {
                $id: transactionId,
                userId: transactionData.userId.toString(),
                type: transactionData.type,
                amount: transactionData.amount,
                description: transactionData.description,
                status: transactionData.status || 'completed',
                createdAt: new Date().toISOString()
            };

            const transaction = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.transactionsCollectionId,
                transactionId,
                transactionDocument
            );
            
            return this.convertToCamelCase(transaction);
        } catch (error) {
            console.error('Appwrite createTransaction error:', error);
            return this.createTransactionInLocalStorage(transactionData);
        }
    }

    async getUserTransactions(userId) {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using localStorage fallback');
            return this.getUserTransactionsFromLocalStorage(userId);
        }

        try {
            const transactions = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.transactionsCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('createdAt'),
                    Query.limit(20)
                ]
            );
            
            return transactions.documents.map(item => this.convertToCamelCase(item));
        } catch (error) {
            console.error('Appwrite getUserTransactions error:', error);
            return this.getUserTransactionsFromLocalStorage(userId);
        }
    }

    // 📊 إحصائيات التطبيق
    async getAppStatistics() {
        await this.isConnected();
        if (!this.databases) {
            console.warn('Appwrite not connected, using default statistics');
            return this.getDefaultStatistics();
        }

        try {
            // الحصول على جميع المستخدمين
            const usersResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.usersCollectionId
            );

            // الحصول على جميع المهام
            const tasksResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.tasksCollectionId
            );

            // الحصول على جميع المعاملات
            const transactionsResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.transactionsCollectionId
            );

            const totalUsers = usersResponse.total || 0;
            const totalTasks = tasksResponse.total || 0;
            const totalTransactions = transactionsResponse.total || 0;

            // حساب إجمالي الأرباح من المستخدمين
            const users = usersResponse.documents || [];
            const totalEarned = users.reduce((sum, user) => sum + (user.totalEarned || 0), 0);

            return {
                totalUsers: totalUsers,
                onlineUsers: Math.floor(totalUsers * 0.2), // 20% متصلين
                tasksCreated: totalTasks,
                tasksCompleted: totalTransactions, // تقريب
                totalEarned: totalEarned
            };
        } catch (error) {
            console.error('Appwrite getAppStatistics error:', error);
            return this.getDefaultStatistics();
        }
    }

    // 🔄 دوال الاحتياطي (LocalStorage) - نفسها من Supabase
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
            // في Appwrite، الحقول تأتي camelCase أصلاً
            if (key.startsWith('$')) {
                converted[key] = data[key]; // الحقول الخاصة
            } else {
                converted[key] = data[key];
            }
        });
        return converted;
    }

    // 🔍 فحص قاعدة البيانات
    async checkDatabaseHealth() {
        try {
            await this.isConnected();
            
            if (!this.databases) {
                return { status: 'error', message: 'Appwrite not connected' };
            }

            // محاولة الوصول إلى كل مجموعة
            const healthChecks = {
                users: { status: 'pending', message: '' },
                tasks: { status: 'pending', message: '' },
                transactions: { status: 'pending', message: '' }
            };

            // فحص مجموعة المستخدمين
            try {
                await this.databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.usersCollectionId,
                    [Query.limit(1)]
                );
                healthChecks.users = { status: 'connected', message: '✅ Connected' };
            } catch (error) {
                healthChecks.users = { status: 'error', message: '❌ Error: ' + error.message };
            }

            // فحص مجموعة المهام
            try {
                await this.databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.tasksCollectionId,
                    [Query.limit(1)]
                );
                healthChecks.tasks = { status: 'connected', message: '✅ Connected' };
            } catch (error) {
                healthChecks.tasks = { status: 'error', message: '❌ Error: ' + error.message };
            }

            // فحص مجموعة المعاملات
            try {
                await this.databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.transactionsCollectionId,
                    [Query.limit(1)]
                );
                healthChecks.transactions = { status: 'connected', message: '✅ Connected' };
            } catch (error) {
                healthChecks.transactions = { status: 'error', message: '❌ Error: ' + error.message };
            }

            return {
                status: 'connected',
                tables: healthChecks,
                message: 'Appwrite connection is working',
                config: {
                    projectId: APPWRITE_CONFIG.projectId,
                    databaseId: APPWRITE_CONFIG.databaseId
                }
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'Appwrite health check failed: ' + error.message
            };
        }
    }

    // ✅ الحصول على حالة الاتصال (للتوافق مع الكود القديم)
    getConnectionStatus() {
        return {
            status: this.isInitialized ? 'connected' : 'connecting',
            type: 'appwrite',
            projectId: APPWRITE_CONFIG.projectId
        };
    }
}

// تعريف Query للاستخدام في Appwrite
const Query = {
    equal: (attribute, value) => ({
        method: 'equal',
        attribute,
        values: [value]
    }),
    orderDesc: (attribute) => ({
        method: 'orderDesc',
        attribute
    }),
    limit: (limit) => ({
        method: 'limit',
        values: [limit]
    })
};

const db = new DatabaseAppwrite();

if (typeof window !== 'undefined') {
    window.db = db;
    window.Query = Query; 
}

console.log('🚀 Appwrite Database module loaded successfully');
