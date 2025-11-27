// js/app.js - محدث للعمل مع Neon
class TonBossApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentUser = null;
        this.currentPage = 'home';
        this.selectedTaskType = null;
        this.selectedMembersCount = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing TON BOSS App with Neon...');
            
            if (!this.tg.initDataUnsafe?.user) {
                this.showError('⚠️ Please open this app in Telegram');
                return;
            }

            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();

            await this.initializeUser();
            this.renderApp();
            this.setupEventListeners();

            console.log('✅ App initialized successfully with Neon');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    async initializeUser() {
        const tgUser = this.tg.initDataUnsafe.user;
        console.log('👤 Telegram User:', tgUser);

        try {
            // البحث عن المستخدم
            let user = await NeonAPI.getUser(tgUser.id);
            
            // إنشاء مستخدم جديد إذا لم يكن موجوداً
            if (!user) {
                user = await NeonAPI.createUser({
                    telegram_id: tgUser.id,
                    first_name: tgUser.first_name,
                    last_name: tgUser.last_name || '',
                    username: tgUser.username || '',
                    photo_url: tgUser.photo_url || this.generateAvatar(tgUser.first_name),
                    balance: 0.5,
                    tub_balance: 1000,
                    total_earned: 0,
                    referrals: 0,
                    referral_earnings: 0,
                    daily_ads: 0,
                    lifetime_ads: 0
                });
            }

            this.currentUser = user;
            console.log('✅ User initialized with Neon:', user);
        } catch (error) {
            console.error('Error initializing user:', error);
            // استخدام بيانات افتراضية مؤقتة
            this.currentUser = {
                telegram_id: tgUser.id,
                first_name: tgUser.first_name,
                last_name: tgUser.last_name || '',
                username: tgUser.username || '',
                photo_url: tgUser.photo_url || this.generateAvatar(tgUser.first_name),
                balance: 0.5,
                tub_balance: 1000,
                total_earned: 0,
                referrals: 0,
                daily_ads: 0,
                lifetime_ads: 0
            };
        }
    }

    generateAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366F1&color=fff&size=128`;
    }

    renderApp() {
        const app = document.getElementById('app');
        app.innerHTML = this.getAppHTML();
        this.updateUI();
    }

    getAppHTML() {
        return `
            <!-- الهيدر -->
            <header class="app-header">
                <div class="user-info">
                    <img class="user-avatar" src="${this.currentUser.photo_url}" alt="${this.currentUser.first_name}">
                    <div class="user-details">
                        <h2>${this.currentUser.first_name} ${this.currentUser.last_name || ''}</h2>
                        <span>@${this.currentUser.username || 'No username'}</span>
                    </div>
                </div>
                <div class="balance-display">
                    <div class="balance-card">
                        <span class="balance-amount">${this.currentUser.balance.toFixed(3)}</span>
                        <small>TON</small>
                    </div>
                    <div class="balance-card">
                        <span class="balance-amount">${Math.floor(this.currentUser.tub_balance)}</span>
                        <small>GOLD</small>
                    </div>
                </div>
            </header>

            <!-- المحتوى الرئيسي -->
            <main>
                <!-- الصفحة الرئيسية -->
                <div id="home-page" class="page active">
                    <!-- مشاهدة الإعلانات -->
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-play-circle"></i>
                            </div>
                            <h3>Watch & Earn</h3>
                        </div>
                        <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.95rem;">
                            Watch ads and earn ${APP_CONFIG.adValue} GOLD per ad
                        </p>
                        <button class="btn btn-primary" onclick="app.watchAd()">
                            <i class="fas fa-play"></i> Watch Ad & Earn ${APP_CONFIG.adValue} GOLD
                        </button>
                    </div>

                    <!-- الإحصائيات -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Today ADS</h3>
                            <p>${this.currentUser.daily_ads}/${APP_CONFIG.dailyAdLimit}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Total ADS</h3>
                            <p>${this.currentUser.lifetime_ads}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Referrals</h3>
                            <p>${this.currentUser.referrals}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Earnings</h3>
                            <p>${Math.floor(this.currentUser.total_earned)}</p>
                        </div>
                    </div>

                    <!-- الإجراءات السريعة -->
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-bolt"></i>
                            </div>
                            <h3>Quick Actions</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn btn-secondary" onclick="app.showAddTask()">
                                <i class="fas fa-plus"></i> Add New Task
                            </button>
                            <button class="btn btn-secondary" onclick="app.switchPage('tasks')">
                                <i class="fas fa-tasks"></i> Browse Tasks
                            </button>
                        </div>
                    </div>

                    <!-- التحويل -->
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <h3>Exchange Center</h3>
                        </div>
                        <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.95rem;">
                            Convert GOLD to TON: ${APP_CONFIG.conversionRate} GOLD = 1 TON
                        </p>
                        <button class="btn btn-success" onclick="app.switchPage('exchange')">
                            <i class="fas fa-sync-alt"></i> Exchange Now
                        </button>
                    </div>
                </div>

                <!-- صفحات أخرى تبقى كما هي -->
                <div id="tasks-page" class="page">
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <h3>Available Tasks</h3>
                        </div>
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                            <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <h3>Tasks Coming Soon</h3>
                            <p>We're preparing amazing tasks for you!</p>
                        </div>
                    </div>
                </div>

                <div id="exchange-page" class="page">
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <h3>Exchange GOLD to TON</h3>
                        </div>
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                            <i class="fas fa-sync-alt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <h3>Exchange Coming Soon</h3>
                            <p>Exchange feature will be available soon!</p>
                        </div>
                    </div>
                </div>

                <div id="withdraw-page" class="page">
                    <div class="glass-card">
                        <div class="section-header">
                            <div class="section-icon">
                                <i class="fas fa-wallet"></i>
                            </div>
                            <h3>Withdraw TON</h3>
                        </div>
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                            <i class="fas fa-wallet" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <h3>Withdrawal Coming Soon</h3>
                            <p>Withdrawal feature will be available soon!</p>
                        </div>
                    </div>
                </div>
            </main>

            <!-- التنقل السفلي -->
            <nav class="bottom-nav">
                <button class="nav-btn active" onclick="app.switchPage('home')">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </button>
                <button class="nav-btn" onclick="app.switchPage('tasks')">
                    <i class="fas fa-tasks"></i>
                    <span>Tasks</span>
                </button>
                <button class="nav-btn" onclick="app.switchPage('exchange')">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Exchange</span>
                </button>
                <button class="nav-btn" onclick="app.switchPage('withdraw')">
                    <i class="fas fa-wallet"></i>
                    <span>Withdraw</span>
                </button>
            </nav>
        `;
    }

    updateUI() {
        console.log('✅ UI Updated with Neon');
    }

    setupEventListeners() {
        console.log('✅ Event listeners setup with Neon');
    }

    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${page}-page`).classList.add('active');
        
        const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
            btn.onclick && btn.onclick.toString().includes(`'${page}'`)
        );
        if (activeBtn) activeBtn.classList.add('active');
        
        this.currentPage = page;
        console.log(`🔄 Switched to ${page} page`);
    }

    async watchAd() {
        try {
            if (this.currentUser.daily_ads >= APP_CONFIG.dailyAdLimit) {
                this.showNotification('🎯 Daily ad limit reached! Come back tomorrow.', 'warning');
                return;
            }

            this.showNotification('📺 Loading advertisement...', 'info');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const reward = APP_CONFIG.adValue;
            
            // تحديث البيانات محلياً أولاً
            this.currentUser.tub_balance += reward;
            this.currentUser.total_earned += reward;
            this.currentUser.daily_ads += 1;
            this.currentUser.lifetime_ads += 1;

            // محاولة حفظ في قاعدة البيانات
            try {
                await NeonAPI.updateUser(this.currentUser.telegram_id, {
                    tub_balance: this.currentUser.tub_balance,
                    total_earned: this.currentUser.total_earned,
                    daily_ads: this.currentUser.daily_ads,
                    lifetime_ads: this.currentUser.lifetime_ads
                });
            } catch (dbError) {
                console.log('Database update failed, using local data:', dbError);
            }

            if (this.tg.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('success');
            }

            this.showNotification(`🎉 You earned ${reward} GOLD!`, 'success');
            this.renderApp();

        } catch (error) {
            console.error('Error watching ad:', error);
            this.showNotification('❌ Failed to complete ad. Please try again.', 'error');
        }
    }

    showAddTask() {
        this.showNotification('🚀 Add Task feature coming soon!', 'info');
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showError(message) {
        document.getElementById('app').innerHTML = `
            <div style="padding: 40px 20px; text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: var(--background);">
                <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
                <h2 style="color: var(--danger); margin-bottom: 15px;">Error</h2>
                <p style="color: var(--text-secondary); margin-bottom: 25px; line-height: 1.5;">${message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="width: auto; padding: 12px 24px;">
                    <i class="fas fa-redo"></i> Reload App
                </button>
            </div>
        `;
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new TonBossApp();
    });
} else {
    window.app = new TonBossApp();
}
