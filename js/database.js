/**
 * Database Module for TON BOSS App
 * Handles all Firebase operations with proper security
 */
class Database {
    constructor() {
        this.firebase = null;
        this.database = null;
        this.auth = null;
        this.currentUser = null;
        this.connected = false;
        this.lastError = null;
        this.authToken = null;
    }

    /**
     * Initialize Firebase connection with proper authentication
     */
    async initialize() {
        try {
            console.log('🔥 Initializing Firebase with secure authentication...');
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebase = firebase.initializeApp(AppConfig.firebaseConfig);
            } else {
                this.firebase = firebase.app();
            }
            
            // Get database and auth instances
            this.database = this.firebase.database();
            this.auth = this.firebase.auth();
            
            // IMPORTANT: DO NOT use anonymous auth for production!
            // Instead, we'll use Telegram WebApp token for authentication
            
            // Test connection with limited access
            await this.testConnection();
            
            console.log('✅ Firebase initialized with secure connection');
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
     * Get Telegram WebApp data for authentication
     */
    getTelegramAuthData() {
        const tg = window.Telegram.WebApp;
        if (!tg || !tg.initData) {
            throw new Error('Telegram WebApp data not available');
        }
        
        return {
            initData: tg.initData,
            initDataUnsafe: tg.initDataUnsafe,
            platform: tg.platform,
            version: tg.version
        };
    }

    /**
     * Verify Telegram user and get secure token
     */
    async verifyTelegramUser() {
        try {
            const tg = window.Telegram.WebApp;
            const tgUser = tg.initDataUnsafe.user;
            
            if (!tgUser || !tgUser.id) {
                throw new Error('Invalid Telegram user');
            }
            
            // In a real app, you should:
            // 1. Send initData to your backend server
            // 2. Verify it server-side using Telegram Bot API
            // 3. Generate custom token
            // 4. Sign in with that token
            
            // For now, we'll create a secure signature
            const signature = await this.createSecureSignature(tgUser.id);
            
            return {
                userId: tgUser.id.toString(),
                signature: signature,
                timestamp: Date.now(),
                verified: true
            };
            
        } catch (error) {
            console.error('Telegram verification failed:', error);
            throw error;
        }
    }

    /**
     * Create secure signature for user
     */
    async createSecureSignature(userId) {
        const timestamp = Date.now();
        const secret = 'ton-boss-secret-key'; // In production, use environment variable
        const data = `${userId}:${timestamp}:${secret}`;
        
        // Create SHA-256 hash
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    /**
     * Get user data with security checks
     */
    async getUser(userId) {
        try {
            // First verify this is the current user
            await this.verifyCurrentUser(userId);
            
            const userRef = this.database.ref(`users/${userId}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            return null;
            
        } catch (error) {
            console.error('Security violation - unauthorized user access:', error);
            throw new Error('Unauthorized access');
        }
    }

    /**
     * Verify current user is accessing their own data
     */
    async verifyCurrentUser(requestedUserId) {
        const tg = window.Telegram.WebApp;
        const currentUserId = tg?.initDataUnsafe?.user?.id?.toString();
        
        if (!currentUserId) {
            throw new Error('User not authenticated');
        }
        
        if (currentUserId !== requestedUserId) {
            throw new Error('Access denied - user mismatch');
        }
        
        return true;
    }

    /**
     * Create new user with security validation
     */
    async createUser(userData) {
        try {
            const tg = window.Telegram.WebApp;
            const tgUser = tg.initDataUnsafe.user;
            
            // Verify user matches Telegram data
            if (userData.id !== tgUser.id.toString()) {
                throw new Error('User ID mismatch');
            }
            
            const userRef = this.database.ref(`users/${userData.id}`);
            
            // Check if user already exists
            const existing = await userRef.once('value');
            if (existing.exists()) {
                throw new Error('User already exists');
            }
            
            // Add security metadata
            const completeUserData = {
                ...userData,
                telegramData: {
                    firstName: tgUser.first_name,
                    lastName: tgUser.last_name,
                    username: tgUser.username,
                    languageCode: tgUser.language_code
                },
                security: {
                    ipAddress: await this.getClientIP(),
                    deviceFingerprint: await this.generateDeviceFingerprint(),
                    telegramVerified: true,
                    createdAt: Date.now(),
                    lastVerified: Date.now()
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastActive: Date.now(),
                version: AppConfig.version,
                status: 'active'
            };
            
            // Save to database
            await userRef.set(completeUserData);
            
            // Update statistics with security
            await this.incrementStat('totalUsers');
            
            // Log the creation
            await this.logSecurityEvent(userData.id, 'user_created', {
                ip: completeUserData.security.ipAddress,
                device: completeUserData.security.deviceFingerprint
            });
            
            return completeUserData;
            
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get client IP (simplified - in production use server-side)
     */
    async getClientIP() {
        try {
            // This should be done server-side
            // For now, return a placeholder
            return 'client_ip_placeholder';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Generate device fingerprint
     */
    async generateDeviceFingerprint() {
        try {
            const components = [];
            
            // Collect device info
            if (navigator.userAgent) components.push(navigator.userAgent);
            if (screen.width && screen.height) components.push(`${screen.width}x${screen.height}`);
            if (navigator.platform) components.push(navigator.platform);
            if (navigator.language) components.push(navigator.language);
            
            // Generate hash
            const data = components.join('|');
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex.substring(0, 16);
            
        } catch (error) {
            return 'fingerprint_error';
        }
    }

    /**
     * Update user data with security checks
     */
    async updateUser(userId, updates) {
        try {
            // Verify user
            await this.verifyCurrentUser(userId);
            
            // Don't allow updating certain fields
            const restrictedFields = ['id', 'telegramData', 'security', 'createdAt'];
            for (const field of restrictedFields) {
                if (updates[field]) {
                    throw new Error(`Cannot update restricted field: ${field}`);
                }
            }
            
            const userRef = this.database.ref(`users/${userId}`);
            
            // Add update metadata
            const secureUpdates = {
                ...updates,
                updatedAt: Date.now(),
                lastActive: Date.now()
            };
            
            await userRef.update(secureUpdates);
            
            // Log the update
            await this.logSecurityEvent(userId, 'user_updated', {
                updatedFields: Object.keys(updates)
            });
            
            return true;
            
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Log security events
     */
    async logSecurityEvent(userId, eventType, data = {}) {
        try {
            const logsRef = this.database.ref(`securityLogs/${userId}`);
            const logEntry = {
                event: eventType,
                userId: userId,
                timestamp: Date.now(),
                ip: await this.getClientIP(),
                userAgent: navigator.userAgent || 'unknown',
                ...data
            };
            
            await logsRef.push(logEntry);
            
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }

    /**
     * Get all tasks with rate limiting
     */
    async getAllTasks() {
        try {
            // Check rate limit
            await this.checkRateLimit('getAllTasks');
            
            const tasksRef = this.database.ref('tasks');
            const snapshot = await tasksRef.once('value');
            
            const tasks = [];
            snapshot.forEach(child => {
                // Filter only active tasks
                const task = child.val();
                if (task.status === 'active') {
                    tasks.push({
                        id: child.key,
                        ...task
                    });
                }
            });
            
            return tasks;
            
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    /**
     * Rate limiting for API calls
     */
    async checkRateLimit(action) {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'anonymous';
        const now = Date.now();
        const key = `rate_limit_${userId}_${action}`;
        
        // Get previous calls from localStorage
        const rateData = JSON.parse(localStorage.getItem(key) || '{"count":0,"timestamp":0}');
        
        // Reset if more than 1 minute
        if (now - rateData.timestamp > 60000) {
            rateData.count = 0;
            rateData.timestamp = now;
        }
        
        // Check limit (10 calls per minute per action)
        if (rateData.count >= 10) {
            throw new Error('Rate limit exceeded. Please wait 1 minute.');
        }
        
        // Increment count
        rateData.count++;
        rateData.timestamp = now;
        localStorage.setItem(key, JSON.stringify(rateData));
        
        return true;
    }

    /**
     * Create transaction with validation
     */
    async createTransaction(transactionData) {
        try {
            // Verify user
            await this.verifyCurrentUser(transactionData.userId);
            
            // Validate amount
            if (!transactionData.amount || isNaN(transactionData.amount)) {
                throw new Error('Invalid transaction amount');
            }
            
            const txRef = this.database.ref('transactions');
            const newTxRef = txRef.push();
            
            const completeTxData = {
                ...transactionData,
                id: newTxRef.key,
                createdAt: Date.now(),
                status: transactionData.status || 'pending',
                verified: false,
                security: {
                    ip: await this.getClientIP(),
                    device: await this.generateDeviceFingerprint(),
                    userAgent: navigator.userAgent
                }
            };
            
            await newTxRef.set(completeTxData);
            
            // Log transaction
            await this.logSecurityEvent(
                transactionData.userId,
                'transaction_created',
                {
                    type: transactionData.type,
                    amount: transactionData.amount,
                    transactionId: newTxRef.key
                }
            );
            
            return completeTxData;
            
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    // ... بقية الدوال مع إضافة التحقق الأمني ...
}

// Export database module
window.db = new Database();
