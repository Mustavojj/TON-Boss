
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

class ExchangePage {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('exchange-page');
        this.swapRate = AppConfig.exchangeRate || 10000;
        this.exchangeFee = AppConfig.exchangeFee || 0.01;
    }

    /**
     * Render exchange page
     */
    render() {
        this.element.innerHTML = `
            <div class="exchange-content">
                <!-- Exchange Header -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <h2>Exchange Center</h2>
                </div>

                <!-- Exchange Card -->
                <div class="exchange-card glass-card">
                    <!-- From Section -->
                    <div class="swap-from">
                        <div class="swap-label">
                            <span>From</span>
                            <span class="available">Available: <span id="available-tub-balance">0</span> GOLD</span>
                        </div>
                        <div class="swap-input-group">
                            <div class="coin-display">
                                <div class="coin-icon">
                                    <i class="fas fa-gem" style="color: gold;"></i>
                                </div>
                                <span>GOLD</span>
                            </div>
                            <input type="number" 
                                   class="swap-input" 
                                   id="tub-amount" 
                                   placeholder="0" 
                                   value="0" 
                                   min="0" 
                                   step="1">
                        </div>
                    </div>

                    <!-- Swap Arrow -->
                    <div class="swap-arrow">
                        <div class="swap-arrow-line"></div>
                        <button class="swap-arrow-refresh" id="refresh-rate">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>

                    <!-- To Section -->
                    <div class="swap-to">
                        <div class="swap-label">
                            <span>To</span>
                            <span class="available">Available: <span id="available-ton-balance">0.000</span> TON</span>
                        </div>
                        <div class="swap-input-group">
                            <div class="coin-display">
                                <div class="coin-icon">
                                    <i class="fas fa-coins" style="color: #0098ea;"></i>
                                </div>
                                <span>TON</span>
                            </div>
                            <input type="number" 
                                   class="swap-input" 
                                   id="ton-amount" 
                                   placeholder="0" 
                                   value="0" 
                                   readonly>
                        </div>
                    </div>

                    <!-- Exchange Rate -->
                    <div class="swap-rate">
                        <span id="exchange-rate">Rate: 1 TON = ${this.swapRate.toLocaleString()} GOLD</span>
                        <div class="swap-fee">Fee: ${(this.exchangeFee * 100)}%</div>
                    </div>

                    <!-- Action Button -->
                    <button class="btn btn-large btn-full" id="convert-btn">
                        <i class="fas fa-exchange-alt"></i>
                        Exchange Now
                    </button>
                </div>

                <!-- Exchange Info -->
                <div class="exchange-info glass-card">
                    <div class="info-header">
                        <i class="fas fa-info-circle"></i>
                        <h3>Exchange Information</h3>
                    </div>
                    <div class="info-content">
                        <div class="info-item">
                            <span>Minimum Exchange:</span>
                            <strong>100 GOLD</strong>
                        </div>
                        <div class="info-item">
                            <span>Exchange Fee:</span>
                            <strong>${(this.exchangeFee * 100)}%</strong>
                        </div>
                        <div class="info-item">
                            <span>Processing Time:</span>
                            <strong>Instant</strong>
                        </div>
                        <div class="info-item">
                            <span>Network:</span>
                            <strong>TON Blockchain</strong>
                        </div>
                    </div>
                </div>

                <!-- Recent Exchanges -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <h2>Recent Exchanges</h2>
                </div>
                <div id="recent-exchanges" class="exchanges-list"></div>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        this.updateBalances();
        this.loadRecentExchanges();
    }

    /**
     * Add exchange page styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .exchange-content {
                padding-bottom: 80px;
            }
            
            .exchange-card {
                position: relative;
                overflow: hidden;
            }
            
            .exchange-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--gradient-accent);
            }
            
            .swap-from, .swap-to {
                margin-bottom: 25px;
            }
            
            .swap-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-size: 0.9rem;
            }
            
            .swap-label span:first-child {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .available {
                color: var(--text-secondary);
                font-size: 0.85rem;
            }
            
            .swap-input-group {
                display: flex;
                gap: 12px;
                align-items: stretch;
                width: 100%;
            }
            
            .coin-display {
                flex: 0 0 100px;
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-medium);
                padding: 14px 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-size: 1rem;
                color: var(--text-primary);
                transition: var(--transition-normal);
            }
            
            .coin-display:hover {
                border-color: var(--color-accent-blue);
            }
            
            .coin-icon {
                width: 28px;
                height: 28px;
                border-radius: var(--radius-circle);
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
            }
            
            .swap-input {
                flex: 1;
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-medium);
                padding: 14px 16px;
                font-size: 1.2rem;
                font-weight: 700;
                text-align: right;
                transition: all var(--transition-normal);
                color: var(--text-primary);
                outline: none;
                font-family: monospace;
            }
            
            .swap-input:focus {
                border-color: var(--color-accent-blue);
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            
            .swap-arrow {
                display: flex;
                justify-content: center;
                margin: 20px 0;
                position: relative;
            }
            
            .swap-arrow-line {
                position: absolute;
                top: 50%;
                left: 20%;
                right: 20%;
                height: 1px;
                background: var(--border-color);
                z-index: 1;
            }
            
            .swap-arrow-refresh {
                background: var(--gradient-accent);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: var(--radius-circle);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.3rem;
                cursor: pointer;
                transition: all var(--transition-normal);
                box-shadow: var(--shadow-medium);
                z-index: 2;
                border: 4px solid var(--bg-card);
            }
            
            .swap-arrow-refresh:hover {
                transform: rotate(180deg) scale(1.1);
            }
            
            .swap-rate {
                text-align: center;
                margin: 25px 0;
                padding: 16px;
                background: rgba(52, 152, 219, 0.1);
                border-radius: var(--radius-medium);
                color: var(--color-accent-blue);
                font-size: 0.95rem;
                font-weight: 600;
                border: 1px solid rgba(52, 152, 219, 0.2);
            }
            
            .swap-fee {
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            
            .exchange-info {
                margin-top: 20px;
            }
            
            .info-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 15px;
            }
            
            .info-header i {
                color: var(--color-accent-blue);
                font-size: 1.2rem;
            }
            
            .info-header h3 {
                font-size: 1.1rem;
                color: var(--text-primary);
            }
            
            .info-content {
                display: grid;
                gap: 12px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid var(--border-light);
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-item span {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .info-item strong {
                color: var(--text-primary);
                font-size: 0.95rem;
            }
            
            .exchanges-list {
                margin-top: 15px;
            }
            
            .exchange-item {
                background: var(--bg-surface);
                border-radius: var(--radius-medium);
                padding: 16px;
                margin-bottom: 10px;
                border: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: var(--transition-normal);
            }
            
            .exchange-item:hover {
                background: var(--bg-card);
                border-color: var(--color-accent-blue);
                transform: translateX(4px);
            }
            
            .exchange-info {
                flex: 1;
            }
            
            .exchange-amount {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            
            .exchange-details {
                display: flex;
                gap: 15px;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .exchange-status {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                color: white;
                text-transform: uppercase;
                background: #2ecc71;
            }
            
            .exchange-status.pending {
                background: #f39c12;
            }
            
            @media (max-width: 480px) {
                .coin-display {
                    flex: 0 0 80px;
                    padding: 12px 8px;
                    font-size: 0.9rem;
                }
                
                .swap-input {
                    font-size: 1.1rem;
                    padding: 12px 14px;
                }
                
                .swap-arrow-refresh {
                    width: 45px;
                    height: 45px;
                    font-size: 1.1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // TUB amount input
        const tubInput = document.getElementById('tub-amount');
        if (tubInput) {
            tubInput.addEventListener('input', (e) => {
                this.calculateTON(e.target.value);
            });
        }
        
        // Refresh rate button
        const refreshBtn = document.getElementById('refresh-rate');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshExchangeRate();
            });
        }
        
        // Convert button
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                this.executeConversion();
            });
        }
    }

    /**
     * Update available balances
     */
    updateBalances() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        
        const availableTub = document.getElementById('available-tub-balance');
        const availableTon = document.getElementById('available-ton-balance');
        
        if (availableTub) {
            availableTub.textContent = user.tub?.toLocaleString() || '0';
        }
        
        if (availableTon) {
            availableTon.textContent = user.balance?.toFixed(3) || '0.000';
        }
    }

    /**
     * Calculate TON amount based on GOLD input
     */
    calculateTON(tubAmount) {
        const tub = parseInt(tubAmount) || 0;
        
        if (tub <= 0) {
            document.getElementById('ton-amount').value = '0';
            this.updateConvertButton();
            return;
        }
        
        // Calculate with fee
        const amountAfterFee = tub * (1 - this.exchangeFee);
        const tonAmount = amountAfterFee / this.swapRate;
        
        document.getElementById('ton-amount').value = tonAmount.toFixed(6);
        this.updateConvertButton();
    }

    /**
     * Update convert button state
     */
    updateConvertButton() {
        if (!this.app.userState) return;
        
        const tubAmount = parseInt(document.getElementById('tub-amount').value) || 0;
        const userTub = this.app.userState.tub || 0;
        const convertBtn = document.getElementById('convert-btn');
        
        if (!convertBtn) return;
        
        if (tubAmount <= 0 || tubAmount < 100 || tubAmount > userTub) {
            convertBtn.disabled = true;
            convertBtn.style.opacity = '0.6';
        } else {
            convertBtn.disabled = false;
            convertBtn.style.opacity = '1';
        }
    }

    /**
     * Refresh exchange rate
     */
    refreshExchangeRate() {
        // In a real app, this would fetch from an API
        const rateElement = document.getElementById('exchange-rate');
        if (rateElement) {
            rateElement.innerHTML = `Rate: 1 TON = ${this.swapRate.toLocaleString()} GOLD`;
        }
        
        // Recalculate TON amount
        const tubAmount = document.getElementById('tub-amount').value;
        if (tubAmount) {
            this.calculateTON(tubAmount);
        }
        
        this.app.showNotification('Rate Refreshed', 'Exchange rate has been updated', 'info');
    }

    /**
     * Execute conversion
     */
    async executeConversion() {
        try {
            // Security check
            if (!window.security?.isRequestAllowed?.()) {
                this.app.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            if (!this.app.userState) {
                this.app.showNotification('Error', 'User data not loaded', 'error');
                return;
            }
            
            const tubAmount = parseInt(document.getElementById('tub-amount').value) || 0;
            const tonAmount = parseFloat(document.getElementById('ton-amount').value) || 0;
            const user = this.app.userState;
            
            // Validation
            if (tubAmount <= 0) {
                this.app.showNotification('Error', 'Please enter a valid GOLD amount', 'error');
                return;
            }
            
            if (tubAmount < 100) {
                this.app.showNotification('Error', 'Minimum exchange: 100 GOLD', 'error');
                return;
            }
            
            if (tubAmount > user.tub) {
                this.app.showNotification('Error', 'Insufficient GOLD balance', 'error');
                return;
            }
            
            // Update button state
            const convertBtn = document.getElementById('convert-btn');
            const originalText = convertBtn.innerHTML;
            convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            convertBtn.disabled = true;
            
            // Calculate fees
            const feeAmount = tubAmount * this.exchangeFee;
            const netTub = tubAmount - feeAmount;
            const calculatedTon = netTub / this.swapRate;
            
            // Update user data
            const updates = {
                tub: user.tub - tubAmount,
                balance: (user.balance || 0) + calculatedTon
            };
            
            await this.app.updateUserData(updates, 'exchange');
            
            // Record transaction
            await window.db.createTransaction({
                userId: user.id,
                type: 'swap',
                amount: calculatedTon,
                description: `Exchanged ${tubAmount.toLocaleString()} GOLD to ${calculatedTon.toFixed(6)} TON`,
                fee: feeAmount
            });
            
            // Show success message
            this.app.showNotification(
                'Exchange Successful!',
                `Converted ${tubAmount.toLocaleString()} GOLD to ${calculatedTon.toFixed(6)} TON`,
                'success'
            );
            
            // Reset form
            document.getElementById('tub-amount').value = '0';
            document.getElementById('ton-amount').value = '0';
            
            // Update UI
            this.updateBalances();
            this.app.header.updateBalances();
            this.loadRecentExchanges();
            
            // Reset button
            convertBtn.innerHTML = originalText;
            convertBtn.disabled = false;
            
        } catch (error) {
            console.error('Exchange error:', error);
            this.app.showNotification('Exchange Failed', error.message || 'Please try again', 'error');
            
            // Reset button
            const convertBtn = document.getElementById('convert-btn');
            if (convertBtn) {
                convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Exchange Now';
                convertBtn.disabled = false;
            }
        }
    }

    /**
     * Load recent exchanges
     */
    async loadRecentExchanges() {
        const container = document.getElementById('recent-exchanges');
        if (!container) return;
        
        try {
            const transactions = await window.db.getUserTransactions(this.app.userState.id);
            const exchanges = transactions.filter(tx => tx.type === 'swap').slice(0, 5);
            
            if (exchanges.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exchange-alt"></i>
                        <h3>No Exchanges Yet</h3>
                        <p>Your exchange history will appear here</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            exchanges.forEach(tx => {
                const date = new Date(tx.createdAt).toLocaleDateString();
                const amountMatch = tx.description?.match(/(\d[\d,]*)\s+GOLD\s+to\s+([\d.]+)\s+TON/);
                
                if (amountMatch) {
                    const goldAmount = amountMatch[1];
                    const tonAmount = amountMatch[2];
                    
                    html += `
                        <div class="exchange-item">
                            <div class="exchange-info">
                                <div class="exchange-amount">${goldAmount} GOLD → ${tonAmount} TON</div>
                                <div class="exchange-details">
                                    <span>${date}</span>
                                    <span>Fee: ${tx.fee || 0} GOLD</span>
                                </div>
                            </div>
                            <div class="exchange-status">Completed</div>
                        </div>
                    `;
                }
            });
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading exchanges:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Exchanges</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}
