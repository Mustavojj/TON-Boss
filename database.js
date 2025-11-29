// Neon Database Configuration
const NEON_CONFIG = {
    connectionString: 'postgresql://neondb_owner:npg_vkqRln4jO8gp@ep-tiny-unit-aekcf9vq-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: true
};

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    async init() {
        // Initialize database connection
        try {
            // For Neon PostgreSQL
            const { Pool } = await import('pg');
            this.pool = new Pool({
                connectionString: NEON_CONFIG.connectionString,
                ssl: NEON_CONFIG.ssl
            });
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            // Fallback to localStorage for demo
            this.useLocalStorage = true;
        }
    }

    // User Management
    async getUser(userId) {
        if (this.useLocalStorage) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            return users[userId] || null;
        }

        const result = await this.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0] || null;
    }

    async createUser(userData) {
        if (this.useLocalStorage) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[userData.id] = {
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
            return userData;
        }

        const result = await this.pool.query(
            `INSERT INTO users (id, first_name, last_name, username, photo_url, balance, tub, referrals, total_earned, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                userData.id, userData.firstName, userData.lastName, 
                userData.username, userData.photoUrl, userData.balance || 0,
                userData.tub || 0, userData.referrals || 0, userData.totalEarned || 0,
                new Date(), new Date()
            ]
        );
        return result.rows[0];
    }

    async updateUser(userId, updates) {
        if (this.useLocalStorage) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[userId]) {
                users[userId] = {
                    ...users[userId],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('users', JSON.stringify(users));
            }
            return users[userId];
        }

        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = Object.values(updates);
        values.unshift(userId);

        const result = await this.pool.query(
            `UPDATE users SET ${setClause}, updated_at = $${values.length + 1} WHERE id = $1 RETURNING *`,
            [...values, new Date()]
        );
        return result.rows[0];
    }

    // Task Management
    async createTask(taskData) {
        if (this.useLocalStorage) {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const newTask = {
                id: 'task_' + Date.now(),
                ...taskData,
                createdAt: new Date().toISOString(),
                completions: 0
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            return newTask;
        }

        const result = await this.pool.query(
            `INSERT INTO tasks (user_id, link, check_subscription, target_completions, cost, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                taskData.userId, taskData.link, taskData.checkSubscription,
                taskData.targetCompletions, taskData.cost, 'active', new Date()
            ]
        );
        return result.rows[0];
    }

    async getUserTasks(userId) {
        if (this.useLocalStorage) {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            return tasks.filter(task => task.userId === userId);
        }

        const result = await this.pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    async getAllTasks() {
        if (this.useLocalStorage) {
            return JSON.parse(localStorage.getItem('tasks') || '[]');
        }

        const result = await this.pool.query(
            'SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC',
            ['active']
        );
        return result.rows;
    }

    async updateTaskCompletion(taskId) {
        if (this.useLocalStorage) {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].completions = (tasks[taskIndex].completions || 0) + 1;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                return tasks[taskIndex];
            }
            return null;
        }

        const result = await this.pool.query(
            'UPDATE tasks SET completions = completions + 1 WHERE id = $1 RETURNING *',
            [taskId]
        );
        return result.rows[0];
    }

    async deleteTask(taskId) {
        if (this.useLocalStorage) {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            return true;
        }

        await this.pool.query(
            'DELETE FROM tasks WHERE id = $1',
            [taskId]
        );
        return true;
    }

    // Statistics
    async getAppStatistics() {
        if (this.useLocalStorage) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            
            return {
                totalUsers: Object.keys(users).length,
                tasksCompleted: tasks.reduce((sum, task) => sum + (task.completions || 0), 0),
                tasksCreated: tasks.length,
                totalEarned: Object.values(users).reduce((sum, user) => sum + (user.totalEarned || 0), 0)
            };
        }

        const usersCount = await this.pool.query('SELECT COUNT(*) FROM users');
        const tasksCompleted = await this.pool.query('SELECT SUM(completions) FROM tasks');
        const tasksCreated = await this.pool.query('SELECT COUNT(*) FROM tasks');
        const totalEarned = await this.pool.query('SELECT SUM(total_earned) FROM users');

        return {
            totalUsers: parseInt(usersCount.rows[0].count),
            tasksCompleted: parseInt(tasksCompleted.rows[0].sum || 0),
            tasksCreated: parseInt(tasksCreated.rows[0].count),
            totalEarned: parseFloat(totalEarned.rows[0].sum || 0)
        };
    }

    // Transaction History
    async createTransaction(transactionData) {
        if (this.useLocalStorage) {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const newTransaction = {
                id: 'tx_' + Date.now(),
                ...transactionData,
                createdAt: new Date().toISOString()
            };
            transactions.push(newTransaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            return newTransaction;
        }

        const result = await this.pool.query(
            `INSERT INTO transactions (user_id, type, amount, description, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                transactionData.userId, transactionData.type, transactionData.amount,
                transactionData.description, transactionData.status, new Date()
            ]
        );
        return result.rows[0];
    }

    async getUserTransactions(userId) {
        if (this.useLocalStorage) {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            return transactions.filter(tx => tx.userId === userId);
        }

        const result = await this.pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }
}

// Initialize database
const db = new Database();
