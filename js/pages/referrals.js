
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

class ReferralsPage {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('referrals-page');
        this.referrals = [];
    }

    /**
     * Render referrals page
     */
    async render() {
        this.element.innerHTML = `
            <div class="referrals-content">
                <!-- Referral Stats -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <h2>Referral Statistics</h2>
                </div>
                
                <div class="referral-stats-grid">
                    <div class="referral-stat-card primary">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3>Total Referrals</h3>
                        <p id="referrals-total-count">0</p>
                    </div>
                    
                    <div class="referral-stat-card secondary">
                        <div class="stat-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <h3>Referral Earnings</h3>
                        <p id="referrals-total-earnings">0</p>
                    </div>
                </div>

                <!-- Referral Link -->
                <div class="glass-card referral-link-card">
                    <div class="section-header">
                        <div class="section-icon">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <h2>Your Referral Link</h2>
                    </div>
                    
                    <div class="referral-link-container">
                        <div class="referral-link-input">
                            <input type="text" 
                                   id="referral-link-input" 
                                   class="form-input" 
                                   readonly 
                                   value="Loading...">
                            <button class="btn" id="copy-referral-link-btn">
                                <i class="fas fa-copy"></i>
                                Copy
                            </button>
                        </div>
                        
                        <div class="referral-actions">
                            <button class="btn btn-secondary" id="share-telegram-btn">
                                <i class="fab fa-telegram"></i>
                                Share on Telegram
                            </button>
                            <button class="btn btn-secondary" id="share-other-btn">
                                <i class="fas fa-share"></i>
                                Other Apps
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Referral Benefits -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h2>Referral Benefits</h2>
                </div>
                
                <div class="benefits-grid">
                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <h3>Up to 100% Commission</h3>
                        <p>Earn up to 100% commission from all your referrals' earnings</p>
                    </div>
                    
                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h3>Instant Bonuses</h3>
                        <p>Receive bonuses immediately when referrals complete tasks</p>
                    </div>
                    
                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-infinity"></i>
                        </div>
                        <h3>Unlimited Earnings</h3>
                        <p>No limits on referrals or how much you can earn</p>
                    </div>
                    
                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <h3>Extra Rewards</h3>
                        <p>Special bonuses for top referrers each month</p>
                    </div>
                </div>

                <!-- Referral Leaderboard -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h2>Top Referrers</h2>
                </div>
                
                <div id="referral-leaderboard" class="leaderboard-container"></div>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        await this.loadReferralData();
        this.updateReferralStats();
        this.updateReferralLink();
        this.loadLeaderboard();
    }

    /**
     * Add referrals page styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .referrals-content {
                padding-bottom: 80px;
            }
            
            .referral-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin: 20px 0;
            }
            
            .referral-stat-card {
                background: var(--gradient-primary);
                border-radius: var(--radius-large);
                padding: 25px 20px;
                text-align: center;
                border: 1px solid var(--border-color);
                position: relative;
                overflow: hidden;
                transition: all var(--transition-normal);
            }
            
            .referral-stat-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-medium);
            }
            
            .referral-stat-card.primary {
                border-color: var(--color-accent-blue);
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 52, 96, 0.9) 100%);
            }
            
            .referral-stat-card.secondary {
                border-color: var(--color-accent-teal);
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(26, 188, 156, 0.3) 100%);
            }
            
            .stat-icon {
                font-size: 2rem;
                margin-bottom: 15px;
                color: var(--color-accent-blue);
            }
            
            .referral-stat-card.secondary .stat-icon {
                color: var(--color-accent-teal);
            }
            
            .referral-stat-card h3 {
                font-size: 0.9rem;
                font-weight: 600;
                margin-bottom: 10px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .referral-stat-card p {
                font-size: 1.8rem;
                font-weight: 800;
                color: var(--text-primary);
                font-family: monospace;
            }
            
            .referral-link-card {
                margin: 25px 0;
                position: relative;
                overflow: hidden;
            }
            
            .referral-link-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-accent);
            }
            
            .referral-link-container {
                margin-top: 20px;
            }
            
            .referral-link-input {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .referral-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            
            .benefits-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin: 20px 0;
            }
            
            .benefit-card {
                background: var(--bg-surface);
                border-radius: var(--radius-large);
                padding: 20px;
                border: 1px solid var(--border-color);
                transition: all var(--transition-normal);
                text-align: center;
            }
            
            .benefit-card:hover {
                background: var(--bg-card);
                border-color: var(--color-accent-blue);
                transform: translateY(-2px);
            }
            
            .benefit-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 15px;
                background: var(--gradient-accent);
                border-radius: var(--radius-circle);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
            }
            
            .benefit-card h3 {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
                line-height: 1.3;
            }
            
            .benefit-card p {
                font-size: 0.85rem;
                color: var(--text-secondary);
                line-height: 1.4;
            }
            
            .leaderboard-container {
                margin-top: 15px;
            }
            
            .leaderboard-item {
                background: var(--bg-surface);
                border-radius: var(--radius-medium);
                padding: 16px;
                margin-bottom: 10px;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 15px;
                transition: var(--transition-normal);
            }
            
            .leaderboard-item:hover {
                background: var(--bg-card);
                border-color: var(--color-accent-blue);
                transform: translateX(4px);
            }
            
            .leaderboard-item.current-user {
                background: rgba(52, 152, 219, 0.1);
                border-color: var(--color-accent-blue);
            }
            
            .leaderboard-rank {
                width: 40px;
                height: 40px;
                border-radius: var(--radius-circle);
                background: var(--gradient-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 1.1rem;
                flex-shrink: 0;
            }
            
            .leaderboard-rank.rank-1 {
                background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
            }
            
            .leaderboard-rank.rank-2 {
                background: linear-gradient(135deg, #c0c0c0 0%, #a9a9a9 100%);
            }
            
            .leaderboard-rank.rank-3 {
                background: linear-gradient(135deg, #cd7f32 0%, #b5651d 100%);
            }
            
            .leaderboard-info {
                flex: 1;
            }
            
            .leaderboard-name {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .leaderboard-name i {
                color: var(--color-accent-blue);
                font-size: 0.8rem;
            }
            
            .leaderboard-stats {
                display: flex;
                gap: 15px;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            .leaderboard-referrals {
                font-weight: 700;
                color: var(--color-accent-blue);
                font-size: 1rem;
            }
            
            @media (max-width: 480px) {
                .referral-stats-grid,
                .benefits-grid {
                    grid-template-columns: 1fr;
                }
                
                .referral-actions {
                    grid-template-columns: 1fr;
                }
                
                .referral-link-input {
                    flex-direction: column;
                }
                
                .benefit-card {
                    padding: 15px;
                }
                
                .benefit-icon {
                    width: 50px;
                    height: 50px;
                    font-size: 1.2rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Copy referral link
        const copyBtn = document.getElementById('copy-referral-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyReferralLink();
            });
        }
        
        // Share on Telegram
        const shareTelegramBtn = document.getElementById('share-telegram-btn');
        if (shareTelegramBtn) {
            shareTelegramBtn.addEventListener('click', () => {
                this.shareOnTelegram();
            });
        }
        
        // Share on other apps
        const shareOtherBtn = document.getElementById('share-other-btn');
        if (shareOtherBtn) {
            shareOtherBtn.addEventListener('click', () => {
                this.shareOnOtherApps();
            });
        }
    }

    /**
     * Load referral data
     */
    async loadReferralData() {
        try {
            // In a real app, this would fetch referral data from database
            // For now, we'll use mock data
            this.referrals = [
                { id: '1', name: 'John Doe', earnings: 1500, joined: '2024-01-15' },
                { id: '2', name: 'Jane Smith', earnings: 1200, joined: '2024-01-20' },
                { id: '3', name: 'Bob Wilson', earnings: 800, joined: '2024-01-25' }
            ];
        } catch (error) {
            console.error('Error loading referral data:', error);
            this.referrals = [];
        }
    }

    /**
     * Update referral statistics
     */
    updateReferralStats() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        
        const totalCount = document.getElementById('referrals-total-count');
        const totalEarnings = document.getElementById('referrals-total-earnings');
        
        if (totalCount) {
            totalCount.textContent = user.referrals || 0;
        }
        
        if (totalEarnings) {
            totalEarnings.textContent = user.referralEarnings?.toLocaleString() || '0';
        }
    }

    /**
     * Update referral link
     */
    updateReferralLink() {
        if (!this.app.userState) return;
        
        const userId = this.app.userState.id;
        const botUsername = AppConfig.botUsername || 'TONBOSS_BOT';
        const referralLink = `https://t.me/${botUsername}?startapp=${userId}`;
        
        const linkInput = document.getElementById('referral-link-input');
        if (linkInput) {
            linkInput.value = referralLink;
        }
    }

    /**
     * Copy referral link to clipboard
     */
    copyReferralLink() {
        const linkInput = document.getElementById('referral-link-input');
        if (!linkInput) return;
        
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                this.app.showNotification('Copied!', 'Referral link copied to clipboard', 'success');
            });
        } catch (err) {
            document.execCommand('copy');
            this.app.showNotification('Copied!', 'Referral link copied to clipboard', 'success');
        }
    }

    /**
     * Share referral link on Telegram
     */
    shareOnTelegram() {
        const linkInput = document.getElementById('referral-link-input');
        if (!linkInput) return;
        
        const text = `Join TON BOSS and start earning TON & GOLD! Use my referral link: ${linkInput.value}`;
        const url = `https://t.me/share/url?url=${encodeURIComponent(linkInput.value)}&text=${encodeURIComponent(text)}`;
        
        window.open(url, '_blank');
        this.app.showNotification('Shared!', 'Link shared on Telegram', 'success');
    }

    /**
     * Share referral link on other apps
     */
    shareOnOtherApps() {
        const linkInput = document.getElementById('referral-link-input');
        if (!linkInput || !navigator.share) {
            this.copyReferralLink();
            return;
        }
        
        navigator.share({
            title: 'Join TON BOSS',
            text: 'Join TON BOSS and start earning TON & GOLD!',
            url: linkInput.value
        }).then(() => {
            this.app.showNotification('Shared!', 'Link shared successfully', 'success');
        }).catch(() => {
            this.copyReferralLink();
        });
    }

    /**
     * Load referral leaderboard
     */
    async loadLeaderboard() {
        const container = document.getElementById('referral-leaderboard');
        if (!container) return;
        
        try {
            // In a real app, this would fetch from database
            // Mock leaderboard data
            const leaderboard = [
                { id: '123456789', name: 'Alex Johnson', referrals: 42, earnings: 4200 },
                { id: '987654321', name: 'Maria Garcia', referrals: 38, earnings: 3800 },
                { id: '456123789', name: 'David Chen', referrals: 35, earnings: 3500 },
                { id: '789123456', name: 'Sarah Williams', referrals: 28, earnings: 2800 },
                { id: '321654987', name: 'Michael Brown', referrals: 25, earnings: 2500 }
            ];
            
            if (leaderboard.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Leaderboard Data</h3>
                        <p>Be the first to refer friends!</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            leaderboard.forEach((user, index) => {
                const isCurrentUser = user.id === this.app.userState.id;
                const rankClass = `rank-${index + 1}`;
                
                html += `
                    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                        <div class="leaderboard-rank ${rankClass}">
                            ${index + 1}
                        </div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">
                                ${user.name}
                                ${isCurrentUser ? '<i class="fas fa-user" title="You"></i>' : ''}
                            </div>
                            <div class="leaderboard-stats">
                                <span>${user.referrals} Referrals</span>
                                <span>${user.earnings.toLocaleString()} GOLD</span>
                            </div>
                        </div>
                        <div class="leaderboard-referrals">
                            ${user.referrals}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Leaderboard</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Refresh referral data
     */
    async refresh() {
        await this.loadReferralData();
        this.updateReferralStats();
        this.updateReferralLink();
        this.loadLeaderboard();
    }
}
