// Configuration for TON BOSS App
const AppConfig = {
    // App Information
    appName: "TON BOSS",
    version: "2.0.0",
    botUsername: "TONBOSS_BOT",
    
firebaseConfig: = {
  apiKey: "AIzaSyBgZVF60SotjtCvAjv52GfBZv4ppKdGYWk",
  authDomain: "new-you-6a04c.firebaseapp.com",
  databaseURL: "https://new-you-6a04c-default-rtdb.firebaseio.com",
  projectId: "new-you-6a04c",
  storageBucket: "new-you-6a04c.firebasestorage.app",
  messagingSenderId: "765835623631",
  appId: "1:765835623631:web:9c3e8425123239c26ccbba",
  measurementId: "G-TZGKT4GJ4L"
}, 
    
    // Exchange Rates
    exchangeRate: 10000, // 10,000 GOLD = 1 TON
    exchangeFee: 0.01, // 1% fee
    
    // Withdrawal Settings
    minWithdrawal: 0.10, // Minimum withdrawal in TON
    minWithdrawalReferrals: 0, // Minimum referrals required for withdrawal
    withdrawalFee: 0.01, // 1% withdrawal fee
    
    // Deposit Settings
    minDeposit: 0.05, // Minimum deposit in TON
    depositBonus: 0.05, // 5% bonus on deposits
    
    // Task Settings
    maxTasksPerUser: 10,
    taskReward: 10, // Default task reward in GOLD
    taskCostPer1000: 1, // Cost in TON per 1000 completions
    
    // Ad Settings
    dailyAdLimit: 20,
    adValue: 5, // GOLD per ad
    adsPerBreak: 5,
    breakDuration: 5, // minutes
    
    // Referral System
    referralBonus: 0.10, // 10% of referrals' earnings
    referralSignupBonus: 100, // GOLD bonus for new referral signup
    
    // Security Settings
    security: {
        requestCooldown: 1000, // 1 second between requests
        maxRequestsPerMinute: 30,
        botVerificationEnabled: true,
        ipCheckEnabled: true,
        multiAccountProtection: true,
        rateLimitingEnabled: true
    },
    
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
        },
        {
            id: "mytonwallet",
            name: "MyTonWallet",
            icon: "fas fa-wallet",
            url: "https://mytonwallet.io"
        }
    ],
    
    // Default Tasks
    defaultTasks: [
        {
            id: "daily_checkin",
            name: "Daily Check-in",
            type: "daily",
            reward: 20,
            description: "Check in daily to earn rewards",
            icon: "fas fa-calendar-check"
        },
        {
            id: "watch_news",
            name: "Watch News",
            type: "channel",
            reward: 10,
            description: "Stay updated with TON news",
            icon: "fas fa-newspaper",
            link: "https://t.me/TON_HUB_NEWS"
        },
        {
            id: "join_community",
            name: "Join Community",
            type: "group",
            reward: 50,
            description: "Join our Telegram community",
            icon: "fas fa-users",
            link: "https://t.me/TONHUB_S"
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
        },
        {
            name: "Support",
            description: "Get help and support",
            icon: "https://cdn-icons-png.flaticon.com/512/2948/2948039.png",
            url: "https://t.me/TONBOSS_SUPPORT"
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
    ],
    
    // Security Messages
    securityMessages: [
        "Bot verification completed",
        "Database connection secured",
        "User authentication validated",
        "Session encryption active",
        "Request rate limiting enabled",
        "IP address verified",
        "Multi-account protection active"
    ]
};

// Export configuration
window.AppConfig = AppConfig;
