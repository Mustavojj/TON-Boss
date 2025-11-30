// Enhanced Database class with API integration and fallback
class Database {
    constructor() {
        this.useLocalStorage = false;
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests
    }

    // Rate limiting and request queuing
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

    async apiRequest(endpoint, options = {}) {
        try {
            const baseURL = window.location.origin;
            const response = await fetch(`${baseURL}/.netlify/functions/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // User Management
    async getUser(userId) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest(`/users?telegramId=${userId}`);
            } catch (error) {
                console.warn('API failed, using localStorage fallback for getUser');
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                return users[userId] || null;
            }
        });
    }

    async createUser(userData) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for createUser');
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
                return await this.apiRequest('/users/update', {
                    method: 'POST',
                    body: JSON.stringify({ telegramId: userId, updates })
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for updateUser');
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

    // Task Management
    async createTask(taskData) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/tasks', {
                    method: 'POST',
                    body: JSON.stringify(taskData)
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for createTask');
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

    async getUserTasks(userId) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest(`/tasks/user?userId=${userId}`);
            } catch (error) {
                console.warn('API failed, using localStorage fallback for getUserTasks');
                const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
                return tasks.filter(task => task.userId === userId);
            }
        });
    }

    async getAllTasks() {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/tasks');
            } catch (error) {
                console.warn('API failed, using localStorage fallback for getAllTasks');
                return JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
            }
        });
    }

    async updateTaskCompletion(taskId) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/tasks/complete', {
                    method: 'POST',
                    body: JSON.stringify({ taskId })
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for updateTaskCompletion');
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

    async deleteTask(taskId) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest(`/tasks?taskId=${taskId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for deleteTask');
                const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
                const filteredTasks = tasks.filter(task => task.id !== taskId);
                localStorage.setItem('tonup_tasks', JSON.stringify(filteredTasks));
                return true;
            }
        });
    }

    // Statistics
    async getAppStatistics() {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/statistics');
            } catch (error) {
                console.warn('API failed, using localStorage fallback for getAppStatistics');
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                const tasks = JSON.parse(localStorage.getItem('tonup_tasks') || '[]');
                
                return {
                    totalUsers: Object.keys(users).length,
                    tasksCompleted: tasks.reduce((sum, task) => sum + (task.completions || 0), 0),
                    tasksCreated: tasks.length,
                    totalEarned: Object.values(users).reduce((sum, user) => sum + (user.totalEarned || 0), 0)
                };
            }
        });
    }

    // Transaction History
    async createTransaction(transactionData) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest('/transactions', {
                    method: 'POST',
                    body: JSON.stringify(transactionData)
                });
            } catch (error) {
                console.warn('API failed, using localStorage fallback for createTransaction');
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

    async getUserTransactions(userId) {
        return this.queueRequest(async () => {
            try {
                return await this.apiRequest(`/transactions/user?userId=${userId}`);
            } catch (error) {
                console.warn('API failed, using localStorage fallback for getUserTransactions');
                const transactions = JSON.parse(localStorage.getItem('tonup_transactions') || '[]');
                return transactions.filter(tx => tx.userId === userId).slice(0, 50);
            }
        });
    }

    // Get all users (for admin/statistics)
    async getAllUsers() {
        return this.queueRequest(async () => {
            try {
                // Note: This endpoint doesn't exist in our API, so it will always fallback
                throw new Error('Endpoint not available');
            } catch (error) {
                const users = JSON.parse(localStorage.getItem('tonup_users') || '{}');
                return Object.values(users);
            }
        });
    }
}


const db = new Database();
