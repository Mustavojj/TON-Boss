// js/config-loader.js
/**
 * Configuration Loader for TON BOSS App
 * Ensures AppConfig is always defined
 */

// Default configuration
const DefaultConfig = {
    // App Information
    appName: "TON BOSS",
    version: "2.0.0",
    botUsername: "TONBOSS_BOT",
    
    // Security Settings (with defaults)
    security: {
        requestCooldown: 1000,
        maxRequestsPerMinute: 30,
        botVerificationEnabled: true,
        ipCheckEnabled: true,
        multiAccountProtection: true,
        rateLimitingEnabled: true
    },
    
    // Exchange Rates
    exchangeRate: 10000,
    exchangeFee: 0.01,
    
    // Withdrawal Settings
    minWithdrawal: 0.10,
    minWithdrawalReferrals: 0,
    withdrawalFee: 0.01,
    
    // Deposit Settings
    minDeposit: 0.05,
    depositBonus: 0.05,
    
    // Task Settings
    maxTasksPerUser: 10,
    taskReward: 10,
    taskCostPer1000: 1,
    
    // Ad Settings
    dailyAdLimit: 20,
    adValue: 5,
    adsPerBreak: 5,
    breakDuration: 5,
    
    // Referral System
    referralBonus: 0.10,
    referralSignupBonus: 100,
    
    // API Endpoints
    tonApi: "https://tonapi.io",
    tonScan: "https://tonscan.org",
    
    // Wallet Providers
    walletProviders: [
        {
            id: "tonkeeper",
            name: "Tonkeeper",
            icon: "fas fa-shield-alt",
            url: "https://tonkeeper.com"
        },
        {
            id: "tonhub",
            name: "Tonhub",
            icon: "fas fa-wallet",
            url: "https://tonhub.com"
        }
    ],
    
    // Quick Links
    quickLinks: [
        {
            name: "TON News",
            description: "Latest TON Blockchain updates",
            icon: "https://cdn-icons-png.flaticon.com/512/1828/1828634.png",
            url: "https://t.me/TON_HUB_NEWS"
        },
        {
            name: "Community",
            description: "Join our active community",
            icon: "https://cdn-icons-png.flaticon.com/512/2111/2111646.png",
            url: "https://t.me/TONHUB_S"
        }
    ],
    
    // Payment Methods
    paymentMethods: [
        {
            id: "ton",
            name: "TON",
            symbol: "TON",
            icon: "fas fa-coins",
            decimals: 9
        },
        {
            id: "gold",
            name: "GOLD",
            symbol: "GOLD",
            icon: "fas fa-gem",
            decimals: 0
        }
    ]
};

// Initialize AppConfig
function initializeAppConfig() {
    // If AppConfig already exists, merge with defaults
    if (window.AppConfig) {
        window.AppConfig = deepMerge(DefaultConfig, window.AppConfig);
    } else {
        window.AppConfig = DefaultConfig;
    }
    
    // Ensure all required properties exist
    ensureRequiredConfig();
    
    console.log('✅ AppConfig initialized:', window.AppConfig);
    return window.AppConfig;
}

// Deep merge objects
function deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    
    return output;
}

// Check if value is an object
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// Ensure all required config properties exist
function ensureRequiredConfig() {
    const config = window.AppConfig;
    
    // Ensure security config exists
    if (!config.security) {
        config.security = DefaultConfig.security;
    }
    
    // Ensure arrays exist
    if (!config.walletProviders) config.walletProviders = [];
    if (!config.quickLinks) config.quickLinks = [];
    if (!config.paymentMethods) config.paymentMethods = [];
    
    // Set default values for critical properties
    config.dailyAdLimit = config.dailyAdLimit || 20;
    config.adValue = config.adValue || 5;
    config.exchangeRate = config.exchangeRate || 10000;
    config.minWithdrawal = config.minWithdrawal || 0.10;
    config.minDeposit = config.minDeposit || 0.05;
}

// Initialize immediately
initializeAppConfig();

// Export helper functions
window.getConfig = () => window.AppConfig;
window.updateConfig = (updates) => {
    window.AppConfig = deepMerge(window.AppConfig, updates);
    return window.AppConfig;
};
