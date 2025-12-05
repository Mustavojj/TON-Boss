if (!window.AppConfig) {
    window.AppConfig = {
        security: {
            requestCooldown: 1000,
            maxRequestsPerMinute: 30,
            botVerificationEnabled: true,
            ipCheckEnabled: true,
            multiAccountProtection: true,
            rateLimitingEnabled: true
        },
        dailyAdLimit: 20,
        adValue: 5,
        adsPerBreak: 5,
        breakDuration: 5,
        exchangeRate: 10000,
        minWithdrawal: 0.10,
        minDeposit: 0.05,
        version: '2.0.0'
    };
}

if (!window.AppConfig.security) {
    window.AppConfig.security = {};
}

class Database {
    constructor() {
        this.firebase = null;
        this.database = null;
        this.auth = null;
        this.currentUser = null;
        this.connected = false;
        this.lastError = null;
        this.authToken = null;
        this.isAnonymousUser = false;
    }

    /**
     * Initialize Firebase connection with Anonymous Authentication
     */
    async initialize() {
        try {
            console.log('🔥 جاري تهيئة Firebase مع المصادقة المجهولة...');
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebase = firebase.initializeApp(AppConfig.firebaseConfig);
                console.log('✅ تم إنشاء تطبيق Firebase جديد');
            } else {
                this.firebase = firebase.app();
                console.log('✅ تم استخدام تطبيق Firebase الموجود');
            }
            
            // Get database and auth instances
            this.database = this.firebase.database();
            this.auth = this.firebase.auth();
            
            // Step 1: Setup Authentication State Listener
            await this.setupAuthStateListener();
            
            // Step 2: Try to sign in anonymously
            await this.signInAnonymously();
            
            // Step 3: Test connection
            await this.verifyConnection();
            
            console.log('✅ Firebase جاهز للاستخدام - User ID:', this.currentUser?.uid);
            this.connected = true;
            
            return true;
            
        } catch (error) {
            console.error('❌ فشل تهيئة Firebase:', error);
            this.lastError = error.message;
            this.connected = false;
            throw error;
        }
    }

    /**
     * Setup Authentication State Listener
     */
    async setupAuthStateListener() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('🔐 حالة المصادقة: مستخدم مسجل -', user.uid);
                    this.currentUser = user;
                    this.isAnonymousUser = user.isAnonymous;
                    resolve(user);
                } else {
                    console.log('🔐 حالة المصادقة: لا يوجد مستخدم');
                    this.currentUser = null;
                    this.isAnonymousUser = false;
                    resolve(null);
                }
            });
        });
    }

    /**
     * Sign in anonymously to Firebase
     */
    async signInAnonymously() {
        try {
            console.log('🔄 جاري تسجيل الدخول المجهول...');
            
            // Check if already signed in
            if (this.auth.currentUser) {
                console.log('⚠️ مستخدم مسجل بالفعل:', this.auth.currentUser.uid);
                this.currentUser = this.auth.currentUser;
                this.isAnonymousUser = this.auth.currentUser.isAnonymous;
                return this.auth.currentUser;
            }
            
            // Sign in anonymously
            const userCredential = await this.auth.signInAnonymously();
            const user = userCredential.user;
            
            console.log('✅ تسجيل الدخول المجهول ناجح:', user.uid);
            console.log('🔍 معلومات المستخدم:', {
                uid: user.uid,
                isAnonymous: user.isAnonymous,
                createdAt: user.metadata.creationTime
            });
            
            this.currentUser = user;
            this.isAnonymousUser = true;
            
            return user;
            
        } catch (error) {
            console.error('❌ فشل تسجيل الدخول المجهول:', error);
            
            // Check specific error
            if (error.code === 'auth/operation-not-allowed') {
                throw new Error('يجب تفعيل Anonymous Authentication في Firebase Console');
            }
            
            throw error;
        }
    }

    /**
     * Verify database connection
     */
    async verifyConnection() {
        try {
            console.log('📡 جاري اختبار اتصال قاعدة البيانات...');
            
            const testRef = this.database.ref('.info/connected');
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    testRef.off();
                    reject(new Error('انتهت مهلة اختبار الاتصال'));
                }, 5000);
                
                testRef.on('value', (snapshot) => {
                    clearTimeout(timeout);
                    testRef.off();
                    
                    if (snapshot.val() === true) {
                        console.log('✅ اتصال قاعدة البيانات نشط');
                        resolve(true);
                    } else {
                        console.log('❌ اتصال قاعدة البيانات غير نشط');
                        reject(new Error('الاتصال غير نشط'));
                    }
                });
            });
            
        } catch (error) {
            console.warn('⚠️ تحذير في اختبار الاتصال:', error.message);
            // نستمر حتى لو فشل الاختبار
            return true;
        }
    }

    /**
     * Get Telegram WebApp data for authentication
     */
    getTelegramAuthData() {
        const tg = window.Telegram.WebApp;
        if (!tg || !tg.initData) {
            throw new Error('بيانات Telegram WebApp غير متوفرة');
        }
        
        return {
            initData: tg.initData,
            initDataUnsafe: tg.initDataUnsafe,
            platform: tg.platform,
            version: tg.version
        };
    }

    /**
     * Create or get user data with security checks
     */
    async getUser(userId) {
        try {
            // First verify we have authentication
            if (!this.currentUser) {
                throw new Error('لم يتم تسجيل الدخول بعد');
            }
            
            const userRef = this.database.ref(`users/${userId}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                console.log('📄 تم تحميل بيانات المستخدم:', userId);
                return userData;
            }
            
            console.log('⚠️ المستخدم غير موجود:', userId);
            return null;
            
        } catch (error) {
            console.error('خطأ في جلب بيانات المستخدم:', error);
            throw error;
        }
    }

    /**
     * Create new user with security validation
     */
    async createUser(userData) {
        try {
            const tg = window.Telegram.WebApp;
            const tgUser = tg.initDataUnsafe.user;
            
            if (!tgUser || !tgUser.id) {
                throw new Error('بيانات مستخدم Telegram غير صالحة');
            }
            
            // Verify user matches Telegram data
            if (userData.id !== tgUser.id.toString()) {
                throw new Error('رقم المستخدم لا يتطابق مع بيانات Telegram');
            }
            
            // Verify we're authenticated
            if (!this.currentUser || !this.currentUser.uid) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }
            
            const userRef = this.database.ref(`users/${userData.id}`);
            
            // Check if user already exists
            const existing = await userRef.once('value');
            if (existing.exists()) {
                console.log('⚠️ المستخدم موجود بالفعل:', userData.id);
                return existing.val();
            }
            
            // Add security metadata
            const completeUserData = {
                ...userData,
                firebaseUid: this.currentUser.uid, // ربط مع Firebase UID
                telegramData: {
                    firstName: tgUser.first_name || '',
                    lastName: tgUser.last_name || '',
                    username: tgUser.username || '',
                    languageCode: tgUser.language_code || 'en'
                },
                security: {
                    isAnonymous: this.isAnonymousUser,
                    ipAddress: await this.getClientIP(),
                    deviceFingerprint: await this.generateDeviceFingerprint(),
                    telegramVerified: true,
                    createdAt: Date.now(),
                    lastVerified: Date.now()
                },
                balance: userData.balance || 0,
                tub: userData.tub || 1000,
                referrals: userData.referrals || 0,
                referralEarnings: userData.referralEarnings || 0,
                totalEarned: userData.totalEarned || 0,
                dailyAdCount: userData.dailyAdCount || 0,
                lifetimeAdCount: userData.lifetimeAdCount || 0,
                breakUntil: userData.breakUntil || 0,
                lastAdWatchDate: userData.lastAdWatchDate || new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastActive: Date.now(),
                version: AppConfig?.version || '2.0.0',
                status: 'active'
            };
            
            // Save to database
            await userRef.set(completeUserData);
            
            console.log('✅ تم إنشاء مستخدم جديد:', userData.id);
            
            // Update statistics
            await this.incrementStat('totalUsers');
            
            // Log the creation
            await this.logSecurityEvent(userData.id, 'user_created', {
                firebaseUid: this.currentUser.uid,
                isAnonymous: this.isAnonymousUser
            });
            
            return completeUserData;
            
        } catch (error) {
            console.error('خطأ في إنشاء المستخدم:', error);
            throw error;
        }
    }

    /**
     * Update user activity
     */
    async updateUserActivity(userId) {
        try {
            if (!userId || !this.currentUser) return;
            
            const updates = {
                lastActive: Date.now(),
                updatedAt: Date.now()
            };
            
            const userRef = this.database.ref(`users/${userId}`);
            await userRef.update(updates);
            
        } catch (error) {
            console.error('خطأ في تحديث نشاط المستخدم:', error);
        }
    }

    /**
     * Increment statistic
     */
    async incrementStat(statName) {
        try {
            const statRef = this.database.ref(`statistics/${statName}`);
            const snapshot = await statRef.once('value');
            const currentValue = snapshot.val() || 0;
            await statRef.set(currentValue + 1);
        } catch (error) {
            console.error('خطأ في تحديث الإحصائيات:', error);
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
            
            // Default statistics
            return {
                totalUsers: 0,
                totalTransactions: 0,
                totalGoldEarned: 0,
                totalTonWithdrawn: 0,
                onlineUsers: 1
            };
            
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            return {
                totalUsers: 0,
                totalTransactions: 0,
                totalGoldEarned: 0,
                totalTonWithdrawn: 0,
                onlineUsers: 1
            };
        }
    }

    /**
     * Get online users count
     */
    async getOnlineUsers() {
        try {
            // Simple implementation - count users active in last 5 minutes
            const usersRef = this.database.ref('users');
            const snapshot = await usersRef.once('value');
            
            let onlineCount = 0;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            snapshot.forEach(child => {
                const user = child.val();
                if (user.lastActive && (now - user.lastActive) < fiveMinutes) {
                    onlineCount++;
                }
            });
            
            return Math.max(1, onlineCount); // At least 1 (current user)
            
        } catch (error) {
            console.error('خطأ في حساب المستخدمين النشطين:', error);
            return 1;
        }
    }

    /**
     * Get client IP (simplified)
     */
    async getClientIP() {
        try {
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
            
            if (navigator.userAgent) components.push(navigator.userAgent);
            if (screen.width && screen.height) components.push(`${screen.width}x${screen.height}`);
            if (navigator.platform) components.push(navigator.platform);
            if (navigator.language) components.push(navigator.language);
            
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
     * Update user data
     */
    async updateUser(userId, updates) {
        try {
            const userRef = this.database.ref(`users/${userId}`);
            
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
            console.error('خطأ في تحديث المستخدم:', error);
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
            console.error('خطأ في تسجيل الحدث الأمني:', error);
        }
    }

    /**
     * Create transaction
     */
    async createTransaction(transactionData) {
        try {
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
            console.error('خطأ في إنشاء المعاملة:', error);
            throw error;
        }
    }

    /**
     * Get all tasks
     */
    async getAllTasks() {
        try {
            const tasksRef = this.database.ref('tasks');
            const snapshot = await tasksRef.once('value');
            
            const tasks = [];
            snapshot.forEach(child => {
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
            console.error('خطأ في جلب المهام:', error);
            throw error;
        }
    }

    /**
     * Validate task
     */
    async validateTask(taskId) {
        try {
            const taskRef = this.database.ref(`tasks/${taskId}`);
            const snapshot = await taskRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            return null;
            
        } catch (error) {
            console.error('خطأ في التحقق من المهمة:', error);
            return null;
        }
    }

    /**
     * Update task completion count
     */
    async updateTaskCompletion(taskId) {
        try {
            const taskRef = this.database.ref(`tasks/${taskId}`);
            const snapshot = await taskRef.once('value');
            
            if (snapshot.exists()) {
                const task = snapshot.val();
                const completions = (task.completions || 0) + 1;
                await taskRef.update({ completions: completions });
            }
            
        } catch (error) {
            console.error('خطأ في تحديث إكمال المهمة:', error);
        }
    }
}

window.db = new Database();
