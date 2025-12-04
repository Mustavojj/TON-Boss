/**
 * Database Module for TON BOSS App
 * Handles all Firebase operations with security measures
 */
class Database {
    constructor() {
        this.firebase = null;
        this.database = null;
        this.auth = null;
        this.currentUser = null;
        this.connected = false;
        this.lastError = null;
    }

    /**
     * Initialize Firebase connection
     */
    async initialize() {
        try {
            console.log('🔥 Initializing Firebase...');
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebase = firebase.initializeApp(AppConfig.firebaseConfig);
            } else {
                this.firebase = firebase.app();
            }
            
            // Get database and auth instances
            this.database = this.firebase.database();
            this.auth = this.firebase.auth();
            
            // Test connection
            await this.testConnection();
            
            // Sign in anonymously for database access
            await this.auth.signInAnonymously();
            this.currentUser = this.auth.currentUser;
            
            console.log('✅ Firebase initialized successfully');
            this.connected = true;
            
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.lastError = error.message;
            this.connected = false;
            throw error;
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        return new Promise((resolve, reject) => {
            const testRef = this.database.ref('.info/connected');
            
            testRef.on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    console.log('✅ Database connected');
                    testRef.off();
                    resolve(true);
                }
            });
            
            setTimeout(() => {
                testRef.off();
                reject(new Error('Database connection timeout'));
            }, 10000);
        });
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            status: this.connected ? 'connected' : 'error',
            error: this.lastError,
            timestamp: Date.now()
        };
    }

    /**
     * Get user data from database
     */
    async getUser(userId) {
        try {
            const userRef = this.database.ref(`users/${userId}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            return null;
            
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    /**
     * Create new user in database
     */
    async createUser(userData) {
        try {
            const userRef = this.database.ref(`users/${userData.id}`);
            
            // Check if user already exists
            const existing = await userRef.once('value');
            if (existing.exists()) {
                return existing.val();
            }
            
            // Add metadata
            const completeUserData = {
                ...userData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ipAddress: "local",
                deviceFingerprint: await window.security?.generateDeviceFingerprint?.() || "unknown",
                lastActive: Date.now(),
                version: AppConfig.version
            };
            
            // Save to database
            await userRef.set(completeUserData);
            
            // Update statistics
            await this.incrementStat('totalUsers');
            
            return completeUserData;
            
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user data
     */
    async updateUser(userId, updates) {
        try {
            const userRef = this.database.ref(`users/${userId}`);
            
            // Add update timestamp
            const completeUpdates = {
                ...updates,
                updatedAt: Date.now(),
                lastActive: Date.now()
            };
            
            await userRef.update(completeUpdates);
            
            return true;
            
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Get app statistics
     */
    async getAppStatistics() {
        try {
            const statsRef = this.database.ref('statistics');
            const snapshot = await statsRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            // Return default stats if none exist
            return {
                totalUsers: 0,
                onlineUsers: 0,
                tasksCreated: 0,
                tasksCompleted: 0,
                totalVolume: 0,
                totalWithdrawals: 0,
                totalDeposits: 0,
                lastUpdated: Date.now()
            };
            
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw error;
        }
    }

    /**
     * Increment a statistic
     */
    async incrementStat(statName, amount = 1) {
        try {
            const statRef = this.database.ref(`statistics/${statName}`);
            
            await statRef.transaction(currentValue => {
                return (currentValue || 0) + amount;
            });
            
            return true;
            
        } catch (error) {
            console.error('Error incrementing stat:', error);
        }
    }

    /**
     * Get all tasks from database
     */
    async getAllTasks() {
        try {
            const tasksRef = this.database.ref('tasks');
            const snapshot = await tasksRef.once('value');
            
            const tasks = [];
            snapshot.forEach(child => {
                tasks.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            return tasks;
            
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    /**
     * Create a new task
     */
    async createTask(taskData) {
        try {
            const tasksRef = this.database.ref('tasks');
            const newTaskRef = tasksRef.push();
            
            const completeTaskData = {
                ...taskData,
                id: newTaskRef.key,
                createdAt: Date.now(),
                status: 'active',
                completions: 0,
                activeUsers: []
            };
            
            await newTaskRef.set(completeTaskData);
            
            // Update statistics
            await this.incrementStat('tasksCreated');
            
            return completeTaskData;
            
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Update task completion count
     */
    async updateTaskCompletion(taskId) {
        try {
            const taskRef = this.database.ref(`tasks/${taskId}`);
            
            await taskRef.transaction(currentData => {
                if (currentData) {
                    currentData.completions = (currentData.completions || 0) + 1;
                    currentData.updatedAt = Date.now();
                    
                    // Check if task is complete
                    if (currentData.completions >= (currentData.targetCompletions || 1)) {
                        currentData.status = 'completed';
                    }
                }
                return currentData;
            });
            
            // Update statistics
            await this.incrementStat('tasksCompleted');
            
            return true;
            
        } catch (error) {
            console.error('Error updating task completion:', error);
            throw error;
        }
    }

    /**
     * Get user transactions
     */
    async getUserTransactions(userId) {
        try {
            const txRef = this.database.ref('transactions');
            const snapshot = await txRef.orderByChild('userId').equalTo(userId).once('value');
            
            const transactions = [];
            snapshot.forEach(child => {
                transactions.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            // Sort by date (newest first)
            transactions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            return transactions;
            
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw error;
        }
    }

    /**
     * Create a transaction
     */
    async createTransaction(transactionData) {
        try {
            const txRef = this.database.ref('transactions');
            const newTxRef = txRef.push();
            
            const completeTxData = {
                ...transactionData,
                id: newTxRef.key,
                createdAt: Date.now(),
                status: transactionData.status || 'completed'
            };
            
            await newTxRef.set(completeTxData);
            
            // Update statistics based on transaction type
            if (transactionData.type === 'withdrawal') {
                await this.incrementStat('totalWithdrawals', Math.abs(transactionData.amount));
                await this.incrementStat('totalVolume', Math.abs(transactionData.amount));
            } else if (transactionData.type === 'deposit') {
                await this.incrementStat('totalDeposits', transactionData.amount);
                await this.incrementStat('totalVolume', transactionData.amount);
            }
            
            return completeTxData;
            
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    /**
     * Create withdrawal request
     */
    async createWithdrawalRequest(requestData) {
        try {
            const withdrawalsRef = this.database.ref('withdrawals/pending');
            const newRequestRef = withdrawalsRef.push();
            
            const completeRequest = {
                ...requestData,
                id: newRequestRef.key,
                createdAt: Date.now(),
                status: 'pending',
                processed: false
            };
            
            await newRequestRef.set(completeRequest);
            
            return completeRequest;
            
        } catch (error) {
            console.error('Error creating withdrawal request:', error);
            throw error;
        }
    }

    /**
     * Get user's withdrawal requests
     */
    async getUserWithdrawals(userId) {
        try {
            const withdrawalsRef = this.database.ref('withdrawals');
            const pendingSnap = await withdrawalsRef.child('pending').orderByChild('userId').equalTo(userId).once('value');
            const completedSnap = await withdrawalsRef.child('completed').orderByChild('userId').equalTo(userId).once('value');
            
            const withdrawals = [];
            
            pendingSnap.forEach(child => {
                withdrawals.push({
                    id: child.key,
                    ...child.val(),
                    type: 'withdrawal',
                    status: 'pending'
                });
            });
            
            completedSnap.forEach(child => {
                withdrawals.push({
                    id: child.key,
                    ...child.val(),
                    type: 'withdrawal',
                    status: 'completed'
                });
            });
            
            // Sort by date (newest first)
            withdrawals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            return withdrawals;
            
        } catch (error) {
            console.error('Error getting withdrawals:', error);
            throw error;
        }
    }

    /**
     * Save user's connected wallet
     */
    async saveUserWallet(userId, walletData) {
        try {
            const walletRef = this.database.ref(`userWallets/${userId}`);
            
            const completeWalletData = {
                ...walletData,
                connectedAt: Date.now(),
                lastUsed: Date.now(),
                verified: false // Will be verified by checking transactions
            };
            
            await walletRef.set(completeWalletData);
            
            return completeWalletData;
            
        } catch (error) {
            console.error('Error saving wallet:', error);
            throw error;
        }
    }

    /**
     * Get user's wallet
     */
    async getUserWallet(userId) {
        try {
            const walletRef = this.database.ref(`userWallets/${userId}`);
            const snapshot = await walletRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            return null;
            
        } catch (error) {
            console.error('Error getting wallet:', error);
            throw error;
        }
    }

    /**
     * Record deposit transaction
     */
    async recordDeposit(depositData) {
        try {
            const depositsRef = this.database.ref('deposits/pending');
            const newDepositRef = depositsRef.push();
            
            const completeDeposit = {
                ...depositData,
                id: newDepositRef.key,
                createdAt: Date.now(),
                status: 'pending',
                verified: false
            };
            
            await newDepositRef.set(completeDeposit);
            
            return completeDeposit;
            
        } catch (error) {
            console.error('Error recording deposit:', error);
            throw error;
        }
    }

    /**
     * Get user's deposits
     */
    async getUserDeposits(userId) {
        try {
            const depositsRef = this.database.ref('deposits');
            const pendingSnap = await depositsRef.child('pending').orderByChild('userId').equalTo(userId).once('value');
            const completedSnap = await depositsRef.child('completed').orderByChild('userId').equalTo(userId).once('value');
            
            const deposits = [];
            
            pendingSnap.forEach(child => {
                deposits.push({
                    id: child.key,
                    ...child.val(),
                    type: 'deposit',
                    status: 'pending'
                });
            });
            
            completedSnap.forEach(child => {
                deposits.push({
                    id: child.key,
                    ...child.val(),
                    type: 'deposit',
                    status: 'completed'
                });
            });
            
            // Sort by date (newest first)
            deposits.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            return deposits;
            
        } catch (error) {
            console.error('Error getting deposits:', error);
            throw error;
        }
    }

    /**
     * Verify deposit by transaction hash
     */
    async verifyDeposit(transactionHash, userId) {
        try {
            // This would normally check the TON blockchain
            // For now, we'll simulate verification
            
            const depositsRef = this.database.ref('deposits/pending');
            const snapshot = await depositsRef.orderByChild('transactionHash').equalTo(transactionHash).once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Deposit not found');
            }
            
            let depositData = null;
            let depositKey = null;
            
            snapshot.forEach(child => {
                if (child.val().userId === userId) {
                    depositData = child.val();
                    depositKey = child.key;
                }
            });
            
            if (!depositData) {
                throw new Error('Deposit not found for this user');
            }
            
            // Move to completed
            await depositsRef.child(depositKey).remove();
            
            const completedRef = this.database.ref('deposits/completed').child(depositKey);
            await completedRef.set({
                ...depositData,
                status: 'completed',
                verifiedAt: Date.now(),
                verified: true
            });
            
            // Update user balance
            await this.updateUser(userId, {
                balance: firebase.database.ServerValue.increment(depositData.amount)
            });
            
            // Record transaction
            await this.createTransaction({
                userId: userId,
                type: 'deposit',
                amount: depositData.amount,
                description: `Deposit ${depositData.amount} TON`,
                status: 'completed',
                reference: transactionHash
            });
            
            return true;
            
        } catch (error) {
            console.error('Error verifying deposit:', error);
            throw error;
        }
    }

    /**
     * Get online users count
     */
    async getOnlineUsers() {
        try {
            const usersRef = this.database.ref('users');
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            
            const snapshot = await usersRef.orderByChild('lastActive').startAt(fiveMinutesAgo).once('value');
            
            return snapshot.numChildren();
            
        } catch (error) {
            console.error('Error getting online users:', error);
            return 0;
        }
    }

    /**
     * Update user's last active timestamp
     */
    async updateUserActivity(userId) {
        try {
            const userRef = this.database.ref(`users/${userId}/lastActive`);
            await userRef.set(Date.now());
            
            return true;
            
        } catch (error) {
            console.error('Error updating user activity:', error);
        }
    }

    /**
     * Check if task exists and is active
     */
    async validateTask(taskId) {
        try {
            const taskRef = this.database.ref(`tasks/${taskId}`);
            const snapshot = await taskRef.once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Task not found');
            }
            
            const task = snapshot.val();
            
            if (task.status !== 'active') {
                throw new Error('Task is not active');
            }
            
            if (task.completions >= (task.targetCompletions || 1)) {
                throw new Error('Task is already completed');
            }
            
            return task;
            
        } catch (error) {
            console.error('Error validating task:', error);
            throw error;
        }
    }
}

// Export database module
window.db = new Database();
