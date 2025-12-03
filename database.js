// database.js - Appwrite Database Integration
const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '692e93a1000c10b16641',
    databaseId: 'ton_earn_db',
    collections: {
        users: 'users',
        tasks: 'tasks',
        transactions: 'transactions',
        withdrawals: 'withdrawals',
        stats: 'app_stats'
    }
};

class AppwriteDatabase {
    constructor() {
        this.client = null;
        this.databases = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Load Appwrite SDK
            if (typeof window !== 'undefined') {
                const { Client, Databases } = await import('https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm');
                
                this.client = new Client();
                this.client
                    .setEndpoint(APPWRITE_CONFIG.endpoint)
                    .setProject(APPWRITE_CONFIG.projectId);
                
                this.databases = new Databases(this.client);
                this.isInitialized = true;
                console.log('✅ Appwrite connected successfully');
            }
        } catch (error) {
            console.error('❌ Appwrite initialization failed:', error);
        }
    }

    async isConnected() {
        return this.isInitialized && this.databases !== null;
    }

    // 🔵 User Management
    async getUser(userId) {
        try {
            const response = await this.databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.users,
                userId
            );
            return response;
        } catch (error) {
            console.log(`User ${userId} not found, creating new...`);
            return null;
        }
    }

    async createUser(userData) {
        try {
            const userDocument = {
                userId: userData.id.toString(),
                telegramId: userData.id.toString(),
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
                photoUrl: userData.photoUrl || '',
                walletAddress: '',
                level: 1,
                xp: 0,
                balances: {
                    cats: 1000,  // Starting balance like Money Cats
                    ton: 0.0000,
                    pirate: 0,
                    tasks: 0
                },
                referralCode: this.generateReferralCode(),
                referredBy: userData.referredBy || null,
                totalEarned: 0,
                createdAt: new Date().toISOString()
            };

            const response = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.users,
                userData.id.toString(),
                userDocument
            );

            console.log('✅ User created in Appwrite');
            return response;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(userId, updates) {
        try {
            const response = await this.databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.users,
                userId,
                updates
            );
            return response;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // 🟢 Tasks Management
    async getDailyTasks() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                [
                    this.databases.Query.equal('type', 'daily'),
                    this.databases.Query.equal('active', true)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting daily tasks:', error);
            return [];
        }
    }

    async getCommunityTasks() {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                [
                    this.databases.Query.equal('type', 'community'),
                    this.databases.Query.equal('active', true)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting community tasks:', error);
            return [];
        }
    }

    async getUserTasks(userId) {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                [
                    this.databases.Query.equal('createdBy', userId)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting user tasks:', error);
            return [];
        }
    }

    async createTask(taskData) {
        try {
            const taskDocument = {
                title: taskData.title,
                description: taskData.description,
                type: taskData.type, // 'daily' or 'community'
                reward: {
                    cats: taskData.rewardCats || 0,
                    xp: taskData.rewardXP || 0,
                    pirate: taskData.rewardPirate || 0
                },
                link: taskData.link,
                requirements: taskData.requirements || {},
                createdBy: taskData.createdBy,
                completions: 0,
                active: true,
                createdAt: new Date().toISOString()
            };

            const response = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                'unique()',
                taskDocument
            );

            console.log('✅ Task created in Appwrite');
            return response;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async completeTask(userId, taskId) {
        try {
            // Record task completion
            const completionDoc = {
                userId: userId,
                taskId: taskId,
                completedAt: new Date().toISOString()
            };

            await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                'task_completions',
                'unique()',
                completionDoc
            );

            // Update task completions count
            const task = await this.databases.getDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                taskId
            );

            await this.databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                taskId,
                { completions: (task.completions || 0) + 1 }
            );

            return true;
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }

    // 💰 Wallet & Transactions
    async updateBalance(userId, currency, amount) {
        try {
            const user = await this.getUser(userId);
            const currentBalance = user.balances[currency] || 0;
            const newBalance = currentBalance + amount;

            const updateData = {
                [`balances.${currency}`]: newBalance
            };

            if (amount > 0) {
                updateData.totalEarned = (user.totalEarned || 0) + amount;
            }

            await this.updateUser(userId, updateData);

            // Record transaction
            await this.createTransaction({
                userId: userId,
                type: 'balance_update',
                currency: currency,
                amount: amount,
                description: `${amount > 0 ? '+' : ''}${amount} ${currency}`,
                status: 'completed'
            });

            return newBalance;
        } catch (error) {
            console.error('Error updating balance:', error);
            throw error;
        }
    }

    async createTransaction(transactionData) {
        try {
            const transactionDoc = {
                userId: transactionData.userId,
                type: transactionData.type,
                currency: transactionData.currency,
                amount: transactionData.amount,
                description: transactionData.description,
                status: transactionData.status || 'pending',
                walletAddress: transactionData.walletAddress || '',
                createdAt: new Date().toISOString()
            };

            const response = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.transactions,
                'unique()',
                transactionDoc
            );

            return response;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    async getUserTransactions(userId) {
        try {
            const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.transactions,
                [
                    this.databases.Query.equal('userId', userId),
                    this.databases.Query.orderDesc('createdAt')
                ]
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    async createWithdrawal(withdrawalData) {
        try {
            const withdrawalDoc = {
                userId: withdrawalData.userId,
                amount: withdrawalData.amount,
                currency: withdrawalData.currency,
                walletAddress: withdrawalData.walletAddress,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const response = await this.databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.withdrawals,
                'unique()',
                withdrawalDoc
            );

            return response;
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            throw error;
        }
    }

    // 📊 Statistics
    async getAppStatistics() {
        try {
            // Get total users
            const usersResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.users
            );
            const totalUsers = usersResponse.total;

            // Get total tasks
            const tasksResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tasks,
                [this.databases.Query.equal('active', true)]
            );
            const totalTasks = tasksResponse.total;

            // Get total completed tasks
            const completionsResponse = await this.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                'task_completions'
            );
            const tasksCompleted = completionsResponse.total;

            // Calculate total earned
            const allUsers = usersResponse.documents;
            const totalEarned = allUsers.reduce((sum, user) => sum + (user.totalEarned || 0), 0);

            return {
                totalUsers,
                onlineUsers: Math.floor(totalUsers * 0.3), // 30% online estimate
                totalTasks,
                tasksCompleted,
                totalEarned: Math.round(totalEarned)
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                totalUsers: 0,
                onlineUsers: 0,
                totalTasks: 0,
                tasksCompleted: 0,
                totalEarned: 0
            };
        }
    }

    // 🔗 Referral System
    async addReferral(referrerId, referredId) {
        try {
            // Update referrer's stats
            const referrer = await this.getUser(referrerId);
            await this.updateUser(referrerId, {
                referrals: (referrer.referrals || 0) + 1
            });

            // Give referral bonus
            await this.updateBalance(referrerId, 'cats', 5000);
            await this.updateBalance(referrerId, 'xp', 25);

            return true;
        } catch (error) {
            console.error('Error adding referral:', error);
            throw error;
        }
    }

    // 🛠️ Helper Methods
    generateReferralCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    getConnectionStatus() {
        return {
            status: this.isInitialized ? 'connected' : 'disconnected',
            service: 'Appwrite',
            projectId: APPWRITE_CONFIG.projectId
        };
    }
}

// Create global instance
const db = new AppwriteDatabase();

// Export for global use
if (typeof window !== 'undefined') {
    window.db = db;
}

console.log('🚀 Appwrite Database module loaded');
