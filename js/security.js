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

class SecurityModule {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.requestLog = [];
        this.blockedIPs = new Set();
        this.securityChecks = {
            botVerified: false,
            databaseSecure: false,
            userValidated: false,
            rateLimitPassed: false,
            ipCheckPassed: false
        };
        
        // Get security config
        this.securityConfig = AppConfig?.security || {
            requestCooldown: 1000,
            maxRequestsPerMinute: 30,
            botVerificationEnabled: true,
            ipCheckEnabled: true,
            multiAccountProtection: true,
            rateLimitingEnabled: true
        };
    }

    /**
     * Initialize security checks
     */
    async initialize() {
        console.log('🔒 Initializing security module...');
        
        try {
            // Step 1: Verify Telegram Bot
            await this.verifyTelegramBot();
            
            // Step 2: Check IP and device
            await this.checkIPAndDevice();
            
            // Step 3: Validate user session
            await this.validateUserSession();
            
            // Step 4: Setup rate limiting
            this.setupRateLimiting();
            
            // Step 5: Setup request logging
            this.setupRequestLogging();
            
            console.log('✅ Security module initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Security initialization failed:', error);
            throw error;
        }
    }

    /**
     * Verify Telegram Bot authenticity
     */
    async verifyTelegramBot() {
        return new Promise((resolve, reject) => {
            if (!this.tg || !this.tg.initDataUnsafe) {
                reject(new Error('Telegram WebApp not available'));
                return;
            }

            // Verify bot data structure
            const initData = this.tg.initDataUnsafe;
            
            // Check required fields
            if (!initData.user || !initData.user.id) {
                reject(new Error('Invalid user data from Telegram'));
                return;
            }

            // Check if it's a real Telegram WebApp (basic check)
            const isTest = window.location.hostname.includes('localhost') || 
                          window.location.hostname.includes('127.0.0.1');
            
            if (!isTest && this.securityConfig.botVerificationEnabled) {
                // In production, validate WebAppData
                if (!initData.hash) {
                    reject(new Error('Invalid Telegram WebApp data'));
                    return;
                }
            }

            this.securityChecks.botVerified = true;
            resolve(true);
        });
    }

    /**
     * Check IP and device for multi-account protection
     */
    async checkIPAndDevice() {
        if (!this.securityConfig.ipCheckEnabled) {
            this.securityChecks.ipCheckPassed = true;
            return true;
        }

        try {
            // Get user's Telegram ID
            const tgUserId = this.tg.initDataUnsafe.user.id;
            
            // Get or generate device fingerprint
            const deviceFingerprint = await this.generateDeviceFingerprint();
            
            // Get IP info (simplified - in production use server-side verification)
            const ipData = JSON.parse(localStorage.getItem("ip_records")) || {};
            const currentIP = "local"; // In production, get from server
            
            // Check if this IP has another user
            if (this.securityConfig.multiAccountProtection && 
                ipData[currentIP] && 
                ipData[currentIP] !== tgUserId) {
                
                // Check time difference between registrations
                const timeDiff = Date.now() - ipData[`${currentIP}_time`];
                if (timeDiff < 24 * 60 * 60 * 1000) { // 24 hours
                    throw new Error('Multiple accounts detected from this device');
                }
            }
            
            // Store current user's IP
            ipData[currentIP] = tgUserId;
            ipData[`${currentIP}_time`] = Date.now();
            ipData[`${currentIP}_device`] = deviceFingerprint;
            
            localStorage.setItem("ip_records", JSON.stringify(ipData));
            this.securityChecks.ipCheckPassed = true;
            
            return true;
            
        } catch (error) {
            console.error('IP check failed:', error);
            throw error;
        }
    }

    /**
     * Generate device fingerprint
     */
    async generateDeviceFingerprint() {
        const components = [];
        
        // User agent
        components.push(navigator.userAgent);
        
        // Screen resolution
        components.push(`${screen.width}x${screen.height}`);
        
        // Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Languages
        components.push(navigator.languages.join(','));
        
        // Platform
        components.push(navigator.platform);
        
        // Hardware concurrency
        components.push(navigator.hardwareConcurrency || 'unknown');
        
        // Generate hash
        const fingerprint = components.join('|');
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        
        // Simple hash using SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex.substring(0, 16);
    }

    /**
     * Validate user session
     */
    async validateUserSession() {
        const tgUser = this.tg.initDataUnsafe.user;
        
        if (!tgUser || !tgUser.id) {
            throw new Error('Invalid user session');
        }
        
        // Check if user data is reasonable
        if (tgUser.id < 100000000) {
            throw new Error('Invalid Telegram user ID');
        }
        
        this.securityChecks.userValidated = true;
        return true;
    }

    /**
     * Setup rate limiting
     */
    setupRateLimiting() {
        if (!this.securityConfig.rateLimitingEnabled) {
            this.securityChecks.rateLimitPassed = true;
            return;
        }
        
        this.maxRequests = this.securityConfig.maxRequestsPerMinute;
        this.requestWindow = 60000; // 1 minute
        
        // Clear old logs periodically
        setInterval(() => {
            const now = Date.now();
            this.requestLog = this.requestLog.filter(log => now - log.time < this.requestWindow);
        }, 10000);
        
        this.securityChecks.rateLimitPassed = true;
    }

    /**
     * Setup request logging
     */
    setupRequestLogging() {
        // Override fetch to log requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const requestUrl = args[0];
            const timestamp = Date.now();
            
            this.logRequest({
                url: typeof requestUrl === 'string' ? requestUrl : requestUrl.url,
                time: timestamp,
                type: 'fetch'
            });
            
            return originalFetch(...args);
        };
    }

    /**
     * Log a request for monitoring
     */
    logRequest(request) {
        this.requestLog.push({
            ...request,
            ip: "local",
            userId: this.tg?.initDataUnsafe?.user?.id || "unknown"
        });
        
        // Keep only last 1000 requests
        if (this.requestLog.length > 1000) {
            this.requestLog = this.requestLog.slice(-500);
        }
    }

    /**
     * Check if request is allowed (rate limiting)
     */
    isRequestAllowed() {
        if (!this.securityConfig.rateLimitingEnabled) {
            return true;
        }
        
        const now = Date.now();
        const userId = this.tg?.initDataUnsafe?.user?.id || "unknown";
        
        // Count requests in the last minute for this user
        const userRequests = this.requestLog.filter(log => 
            log.userId === userId && 
            now - log.time < this.requestWindow
        );
        
        if (userRequests.length >= this.maxRequests) {
            console.warn('Rate limit exceeded for user:', userId);
            return false;
        }
        
        return true;
    }

    /**
     * Sanitize input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate TON wallet address
     */
    validateTONAddress(address) {
        if (!address || typeof address !== 'string') return false;
        
        // TON wallet address validation regex
        const tonAddressRegex = /^(?:[a-zA-Z0-9_-]{48}|0:[a-fA-F0-9]{64})$/;
        return tonAddressRegex.test(address.trim());
    }

    /**
     * Validate amount (positive number)
     */
    validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num < 1000000; // Sanity check
    }

    /**
     * Generate secure transaction ID
     */
    generateSecureId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userId = this.tg?.initDataUnsafe?.user?.id || "unknown";
        
        // Combine and hash
        const combined = `${timestamp}_${random}_${userId}`;
        return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            ...this.securityChecks,
            totalRequests: this.requestLog.length,
            blockedIPs: this.blockedIPs.size,
            config: this.securityConfig
        };
    }

    /**
     * Block an IP address
     */
    blockIP(ip) {
        this.blockedIPs.add(ip);
        console.log('🚫 Blocked IP:', ip);
    }

    /**
     * Check if IP is blocked
     */
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    /**
     * Encrypt sensitive data (basic implementation)
     */
    encryptData(data) {
        // In production, use proper encryption
        const stringData = JSON.stringify(data);
        return btoa(stringData);
    }

    /**
     * Decrypt data
     */
    decryptData(encrypted) {
        try {
            const stringData = atob(encrypted);
            return JSON.parse(stringData);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }
}

// Export security module
window.SecurityModule = SecurityModule;
