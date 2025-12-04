
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

class HomePage {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('home-page');
    }

    /**
     * Render home page
     */
    render() {
        if (!this.app.userState || !this.app.appStatistics) return;
        
        const user = this.app.userState;
        const stats = this.app.appStatistics;
        
        this.element.innerHTML = `
            <div class="home-content">
                <!-- Welcome Banner -->
                <div class="welcome-banner glass-card">
                    <div class="welcome-content">
                        <h2>Welcome to TON BOSS! 👑</h2>
                        <p>Earn GOLD and TON by completing tasks and watching ads</p>
                    </div>
                    <div class="welcome-stats">
                        <div class="welcome-stat">
                            <i class="fas fa-users"></i>
                            <span>${stats.totalUsers?.toLocaleString() || '0'} Users</span>
                        </div>
                        <div class="welcome-stat">
                            <i class="fas fa-tasks"></i>
                            <span>${stats.tasksCompleted?.toLocaleString() || '0'} Tasks</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h2>Your Statistics</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Today ADS</h3>
                        <p>${user.dailyAdCount || 0} / ${AppConfig.dailyAdLimit || 20}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total ADS</h3>
                        <p>${user.lifetimeAdCount || 0}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Referrals</h3>
                        <p>${user.referrals || 0}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Earnings</h3>
                        <p>${user.totalEarned?.toLocaleString() || '0'}</p>
                    </div>
                </div>

                <!-- Promo Code -->
                <div class="glass-card promo-card">
                    <div class="section-header">
                        <div class="section-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <h2>Promo Code</h2>
                    </div>
                    <div class="promo-body">
                        <input type="text" id="promoInput" class="form-input" placeholder="Enter promo code">
                        <button class="btn" id="promo-btn">
                            <i class="fas fa-gift"></i>
                            Claim
                        </button>
                    </div>
                </div>

                <!-- Earnings Chart -->
                <div class="glass-card chart-container">
                    <div class="section-header">
                        <div class="section-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <h2>Weekly Earnings</h2>
                    </div>
                    <div id="earnings-chart" class="chart"></div>
                    <div id="earnings-chart-labels" class="chart-labels"></div>
                </div>

                <!-- Quick Links -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2>Quick Links</h2>
                </div>
                
                <div id="quick-links-container" class="links-grid"></div>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        this.renderEarningsChart();
        this.renderQuickLinks();
    }

    /**
     * Add home page styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .home-content {
                padding-bottom: 80px;
            }
            
            .welcome-banner {
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 52, 96, 0.9) 100%);
                border: 2px solid var(--color-accent-blue);
                position: relative;
                overflow: hidden;
            }
            
            .welcome-banner::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-accent);
            }
            
            .welcome-content h2 {
                font-size: 1.4rem;
                margin-bottom: 8px;
                color: var(--text-primary);
                background: var(--gradient-silver);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .welcome-content p {
                color: var(--text-secondary);
                font-size: 0.95rem;
                line-height: 1.4;
            }
            
            .welcome-stats {
                display: flex;
                gap: 20px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--border-color);
            }
            
            .welcome-stat {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .welcome-stat i {
                color: var(--color-accent-blue);
                font-size: 1.1rem;
            }
            
            .promo-card {
                position: relative;
            }
            
            .promo-body {
                display: flex;
                gap: 12px;
                margin-top: 15px;
            }
            
            .promo-body input {
                flex: 1;
            }
            
            .chart-container {
                position: relative;
            }
            
            .chart {
                display: flex;
                justify-content: space-around;
                align-items: flex-end;
                height: 150px;
                padding: 20px 0 10px;
                position: relative;
            }
            
            .chart::before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 5%;
                right: 5%;
                height: 1px;
                background: var(--border-color);
            }
            
            .bar {
                width: 10%;
                background: var(--gradient-accent);
                border-radius: 8px 8px 0 0;
                position: relative;
                cursor: pointer;
                transition: all var(--transition-normal);
                min-height: 20px;
            }
            
            .bar:hover {
                transform: scaleY(1.1);
            }
            
            .bar .tooltip {
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-surface);
                color: var(--text-primary);
                padding: 8px 12px;
                border-radius: var(--radius-small);
                font-size: 0.8rem;
                white-space: nowrap;
                opacity: 0;
                transition: opacity var(--transition-normal);
                pointer-events: none;
                font-weight: 600;
                border: 1px solid var(--border-color);
                box-shadow: var(--shadow-light);
                z-index: 10;
            }
            
            .bar:hover .tooltip {
                opacity: 1;
            }
            
            .chart-labels {
                display: flex;
                justify-content: space-around;
                font-size: 0.8rem;
                margin-top: 10px;
                color: var(--text-secondary);
            }
            
            .links-grid {
                display: grid;
                gap: 12px;
            }
            
            .link-item {
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-medium);
                padding: 18px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all var(--transition-normal);
                text-decoration: none;
                color: inherit;
            }
            
            .link-item:hover {
                background: var(--bg-card);
                border-color: var(--color-accent-blue);
                transform: translateX(8px);
            }
            
            .link-icon {
                width: 50px;
                height: 50px;
                border-radius: var(--radius-medium);
                background: var(--gradient-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .link-content {
                flex: 1;
            }
            
            .link-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            
            .link-description {
                font-size: 0.85rem;
                color: var(--text-secondary);
                line-height: 1.4;
            }
            
            .link-action {
                color: var(--color-accent-blue);
                font-size: 1.2rem;
                opacity: 0.7;
                transition: var(--transition-normal);
            }
            
            .link-item:hover .link-action {
                opacity: 1;
                transform: translateX(4px);
            }
            
            @media (max-width: 480px) {
                .welcome-stats {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .promo-body {
                    flex-direction: column;
                }
                
                .bar {
                    width: 8%;
                }
                
                .link-item {
                    padding: 15px;
                }
                
                .link-icon {
                    width: 40px;
                    height: 40px;
                    font-size: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Promo code submission
        const promoBtn = document.getElementById('promo-btn');
        const promoInput = document.getElementById('promoInput');
        
        if (promoBtn) {
            promoBtn.addEventListener('click', () => {
                this.app.claimPromoCode();
            });
        }
        
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.app.claimPromoCode();
                }
            });
        }
    }

    /**
     * Render earnings chart
     */
    async renderEarningsChart() {
        const chartEl = document.getElementById('earnings-chart');
        const labelsEl = document.getElementById('earnings-chart-labels');
        
        if (!chartEl || !labelsEl) return;
        
        // Generate last 7 days
        const today = new Date();
        const dates = [];
        const earnings = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date.toISOString().slice(0, 10));
            earnings.push(Math.floor(Math.random() * 1000) + 100); // Mock data
        }
        
        // Clear previous content
        chartEl.innerHTML = '';
        labelsEl.innerHTML = '';
        
        // Find max for scaling
        const maxEarning = Math.max(...earnings, 100);
        
        // Create bars
        earnings.forEach((earning, index) => {
            const height = (earning / maxEarning) * 100;
            const dateLabel = new Date(dates[index]).toLocaleDateString('en-US', { weekday: 'short' });
            
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${height}%`;
            bar.innerHTML = `<span class="tooltip">${earning.toLocaleString()} GOLD</span>`;
            
            bar.addEventListener('mouseenter', () => {
                bar.style.background = 'var(--gradient-silver)';
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.background = 'var(--gradient-accent)';
            });
            
            chartEl.appendChild(bar);
            labelsEl.innerHTML += `<span>${dateLabel}</span>`;
        });
    }

    /**
     * Render quick links
     */
    renderQuickLinks() {
        const container = document.getElementById('quick-links-container');
        if (!container || !AppConfig.quickLinks) return;
        
        let linksHTML = '';
        
        AppConfig.quickLinks.forEach(link => {
            linksHTML += `
                <a href="${link.url}" target="_blank" class="link-item">
                    <div class="link-icon">
                        <img src="${link.icon}" alt="${link.name}" style="width: 30px; height: 30px;">
                    </div>
                    <div class="link-content">
                        <div class="link-title">${link.name}</div>
                        <div class="link-description">${link.description}</div>
                    </div>
                    <div class="link-action">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </a>
            `;
        });
        
        container.innerHTML = linksHTML;
    }

    /**
     * Update statistics on the page
     */
    updateStatistics() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        const stats = this.app.appStatistics;
        
        // Update welcome banner
        const welcomeStats = document.querySelectorAll('.welcome-stat');
        if (welcomeStats.length >= 2 && stats) {
            welcomeStats[0].querySelector('span').textContent = `${stats.totalUsers?.toLocaleString() || '0'} Users`;
            welcomeStats[1].querySelector('span').textContent = `${stats.tasksCompleted?.toLocaleString() || '0'} Tasks`;
        }
        
        // Update quick stats
        const statCards = document.querySelectorAll('.stat-card p');
        if (statCards.length >= 4) {
            statCards[0].textContent = `${user.dailyAdCount || 0} / ${AppConfig.dailyAdLimit || 20}`;
            statCards[1].textContent = user.lifetimeAdCount || 0;
            statCards[2].textContent = user.referrals || 0;
            statCards[3].textContent = user.totalEarned?.toLocaleString() || '0';
        }
    }
}
