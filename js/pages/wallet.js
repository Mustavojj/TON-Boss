/**
 * Wallet Page Component for TON BOSS App
 */
class WalletPage {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('wallet-page');
        this.transactions = [];
        this.userWallet = null;
    }

    /**
     * Render wallet page
     */
    async render() {
        await this.loadWalletData();
        
        this.element.innerHTML = `
            <div class="wallet-content">
                <!-- Wallet Balance Cards -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <h2>Your Wallet</h2>
                </div>
                
                <div class="wallet-grid">
                    <div class="wallet-card primary">
                        <div class="wallet-icon">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="wallet-balance" id="wallet-gold-balance">0</div>
                        <div class="wallet-label">GOLD Balance</div>
                    </div>
                    
                    <div class="wallet-card secondary">
                        <div class="wallet-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="wallet-balance" id="wallet-ton-balance">0.000</div>
                        <div class="wallet-label">TON Balance</div>
                    </div>
                </div>

                <!-- Wallet Actions -->
                <div class="wallet-actions">
                    <button class="wallet-action-btn deposit" id="deposit-btn">
                        <i class="fas fa-arrow-down"></i>
                        <span>Deposit</span>
                    </button>
                    
                    <button class="wallet-action-btn withdraw" id="withdraw-btn">
                        <i class="fas fa-arrow-up"></i>
                        <span>Withdraw</span>
                    </button>
                </div>

                <!-- Connected Wallet Info -->
                ${this.userWallet ? this.renderConnectedWallet() : this.renderConnectWallet()}

                <!-- Transaction History -->
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <h2>Transaction History</h2>
                </div>
                
                <div id="transaction-history" class="transaction-list"></div>
            </div>
        `;
        
        this.addStyles();
        this.setupEventListeners();
        this.updateWalletBalances();
        this.loadTransactionHistory();
    }

    /**
     * Render connected wallet section
     */
    renderConnectedWallet() {
        if (!this.userWallet) return '';
        
        return `
            <div class="connected-wallet-info glass-card">
                <div class="wallet-info-header">
                    <div class="wallet-info-title">
                        <i class="fas fa-link"></i>
                        Connected Wallet
                    </div>
                    <div class="wallet-status connected">
                        <i class="fas fa-check-circle"></i>
                        Connected
                    </div>
                </div>
                
                <div class="wallet-details">
                    <div class="wallet-detail-item">
                        <span class="wallet-detail-label">Address:</span>
                        <span class="wallet-detail-value">${this.formatAddress(this.userWallet.address)}</span>
                    </div>
                    <div class="wallet-detail-item">
                        <span class="wallet-detail-label">Provider:</span>
                        <span class="wallet-detail-value">${this.userWallet.provider || 'Unknown'}</span>
                    </div>
                    <div class="wallet-detail-item">
                        <span class="wallet-detail-label">Connected Since:</span>
                        <span class="wallet-detail-value">${new Date(this.userWallet.connectedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="wallet-detail-item">
                        <span class="wallet-detail-label">Verified:</span>
                        <span class="wallet-detail-value">
                            ${this.userWallet.verified ? 
                                '<i class="fas fa-check-circle" style="color: #2ecc71;"></i> Yes' : 
                                '<i class="fas fa-times-circle" style="color: #e74c3c;"></i> No'}
                        </span>
                    </div>
                </div>
                
                <div class="wallet-actions" style="margin-top: 20px;">
                    <button class="btn btn-secondary" id="disconnect-wallet-btn">
                        <i class="fas fa-unlink"></i>
                        Disconnect
                    </button>
                    <button class="btn" id="verify-wallet-btn" ${this.userWallet.verified ? 'disabled' : ''}>
                        <i class="fas fa-shield-alt"></i>
                        Verify
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render connect wallet section
     */
    renderConnectWallet() {
        return `
            <div class="connect-wallet-section glass-card">
                <div class="connect-wallet-icon">
                    <i class="fas fa-link"></i>
                </div>
                <h3>Connect Your TON Wallet</h3>
                <p>Connect your TON wallet to enable deposits and automatic withdrawal verification.</p>
                
                <button class="btn btn-large btn-full" id="connect-wallet-btn">
                    <i class="fas fa-plug"></i>
                    Connect Wallet
                </button>
                
                <div class="wallet-benefits">
                    <div class="benefit">
                        <i class="fas fa-bolt" style="color: #f39c12;"></i>
                        <span>Instant deposits</span>
                    </div>
                    <div class="benefit">
                        <i class="fas fa-shield-alt" style="color: #2ecc71;"></i>
                        <span>Secure withdrawals</span>
                    </div>
                    <div class="benefit">
                        <i class="fas fa-sync" style="color: #3498db;"></i>
                        <span>Auto verification</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Add wallet page styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .wallet-content {
                padding-bottom: 80px;
            }
            
            .wallet-benefits {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--border-color);
            }
            
            .benefit {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                color: var(--text-secondary);
                text-align: center;
            }
            
            .benefit i {
                font-size: 1.2rem;
                margin-bottom: 4px;
            }
            
            .transaction-list {
                margin-top: 15px;
            }
            
            .transaction-filter {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .filter-btn {
                background: var(--bg-surface);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                padding: 8px 16px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition-normal);
                font-size: 0.85rem;
            }
            
            .filter-btn:hover {
                background: var(--bg-card);
                color: var(--text-primary);
            }
            
            .filter-btn.active {
                background: var(--gradient-accent);
                color: white;
                border-color: var(--color-accent-blue);
            }
            
            .transaction-item {
                background: var(--bg-surface);
                border-radius: var(--radius-medium);
                padding: 18px;
                margin-bottom: 12px;
                border: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all var(--transition-normal);
            }
            
            .transaction-item:hover {
                background: var(--bg-card);
                border-color: var(--color-accent-blue);
                transform: translateX(4px);
            }
            
            .transaction-info {
                flex: 1;
            }
            
            .transaction-amount {
                font-size: 1.1rem;
                font-weight: 700;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .transaction-amount.positive {
                color: #2ecc71;
            }
            
            .transaction-amount.negative {
                color: #e74c3c;
            }
            
            .transaction-details {
                display: flex;
                gap: 15px;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .transaction-status {
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                color: white;
                text-transform: capitalize;
            }
            
            .transaction-status.completed {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            }
            
            .transaction-status.pending {
                background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            }
            
            .transaction-status.failed {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            }
            
            .no-transactions {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-secondary);
            }
            
            .no-transactions i {
                font-size: 3rem;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .no-transactions h3 {
                font-size: 1.2rem;
                margin-bottom: 10px;
                color: var(--text-primary);
            }
            
            .no-transactions p {
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            @media (max-width: 480px) {
                .wallet-actions {
                    grid-template-columns: 1fr;
                }
                
                .wallet-benefits {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .transaction-details {
                    flex-direction: column;
                    gap: 4px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Deposit button
        const depositBtn = document.getElementById('deposit-btn');
        if (depositBtn) {
            depositBtn.addEventListener('click', () => {
                this.app.showDepositModal();
            });
        }
        
        // Withdraw button
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                this.app.showWithdrawModal();
            });
        }
        
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.app.showConnectWalletModal();
            });
        }
        
        // Disconnect wallet button
        const disconnectBtn = document.getElementById('disconnect-wallet-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.disconnectWallet();
            });
        }
        
        // Verify wallet button
        const verifyBtn = document.getElementById('verify-wallet-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifyWallet();
            });
        }
    }

    /**
     * Load wallet data
     */
    async loadWalletData() {
        try {
            if (!this.app.userState) return;
            
            // Load user's connected wallet
            this.userWallet = await window.db.getUserWallet(this.app.userState.id);
            
            // Load transactions
            this.transactions = await window.db.getUserTransactions(this.app.userState.id);
            
        } catch (error) {
            console.error('Error loading wallet data:', error);
            this.userWallet = null;
            this.transactions = [];
        }
    }

    /**
     * Update wallet balances
     */
    updateWalletBalances() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        
        const goldBalance = document.getElementById('wallet-gold-balance');
        const tonBalance = document.getElementById('wallet-ton-balance');
        
        if (goldBalance) {
            goldBalance.textContent = user.tub?.toLocaleString() || '0';
        }
        
        if (tonBalance) {
            tonBalance.textContent = user.balance?.toFixed(3) || '0.000';
        }
    }

    /**
     * Load transaction history
     */
    async loadTransactionHistory() {
        const container = document.getElementById('transaction-history');
        if (!container) return;
        
        try {
            if (this.transactions.length === 0) {
                container.innerHTML = `
                    <div class="no-transactions">
                        <i class="fas fa-history"></i>
                        <h3>No Transactions Yet</h3>
                        <p>Your transaction history will appear here</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            this.transactions.forEach(tx => {
                const isPositive = tx.amount >= 0;
                const amountClass = isPositive ? 'positive' : 'negative';
                const sign = isPositive ? '+' : '';
                const amount = Math.abs(tx.amount);
                const currency = tx.type.includes('swap') || tx.type.includes('withdrawal') || tx.type.includes('deposit') ? 'TON' : 'GOLD';
                const date = new Date(tx.createdAt).toLocaleDateString();
                
                html += `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-amount ${amountClass}">
                                <i class="fas fa-${isPositive ? 'arrow-down' : 'arrow-up'}"></i>
                                ${sign}${amount} ${currency}
                            </div>
                            <div class="transaction-details">
                                <span>${tx.description}</span>
                                <span>${date}</span>
                            </div>
                        </div>
                        <div class="transaction-status ${tx.status || 'completed'}">
                            ${tx.status || 'completed'}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            container.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Transactions</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Format wallet address for display
     */
    formatAddress(address) {
        if (!address) return 'Not connected';
        if (address.length <= 12) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    }

    /**
     * Disconnect wallet
     */
    async disconnectWallet() {
        if (!confirm('Are you sure you want to disconnect your wallet?')) return;
        
        try {
            if (!this.app.userState) return;
            
            // Remove wallet from database
            await window.db.database.ref(`userWallets/${this.app.userState.id}`).remove();
            
            // Update local state
            this.userWallet = null;
            
            // Re-render wallet page
            await this.render();
            
            this.app.showNotification('Disconnected', 'Wallet disconnected successfully', 'success');
            
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            this.app.showNotification('Error', 'Failed to disconnect wallet', 'error');
        }
    }

    /**
     * Verify wallet
     */
    async verifyWallet() {
        try {
            if (!this.userWallet || !this.app.userState) return;
            
            // In a real app, this would verify the wallet by checking a small transaction
            // For now, we'll simulate verification
            
            this.app.showNotification('Verifying', 'Please wait while we verify your wallet...', 'info');
            
            setTimeout(async () => {
                try {
                    // Update wallet as verified
                    await window.db.saveUserWallet(this.app.userState.id, {
                        ...this.userWallet,
                        verified: true,
                        verifiedAt: Date.now()
                    });
                    
                    // Update local state
                    this.userWallet.verified = true;
                    
                    // Re-render wallet page
                    await this.render();
                    
                    this.app.showNotification('Verified!', 'Your wallet has been verified successfully', 'success');
                    
                } catch (error) {
                    console.error('Verification error:', error);
                    this.app.showNotification('Error', 'Failed to verify wallet', 'error');
                }
            }, 3000);
            
        } catch (error) {
            console.error('Verification error:', error);
            this.app.showNotification('Error', 'Failed to verify wallet', 'error');
        }
    }

    /**
     * Refresh wallet data
     */
    async refresh() {
        await this.loadWalletData();
        this.updateWalletBalances();
        await this.loadTransactionHistory();
    }
}
