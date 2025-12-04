
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

class WalletModals {
    constructor(app) {
        this.app = app;
        this.depositAmounts = [0.05, 0.1, 0.5, 1, 5, 10];
        this.selectedDepositAmount = null;
        this.depositAddress = null;
    }

    /**
     * Show deposit modal
     */
    showDepositModal() {
        // Check if wallet is connected
        if (!this.app.walletPage?.userWallet) {
            this.app.showNotification('Connect Wallet', 'Please connect your TON wallet first', 'warning');
            this.showConnectWalletModal();
            return;
        }
        
        const modal = document.getElementById('deposit-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-arrow-down"></i>
                        Deposit TON
                    </h3>
                    <button class="modal-close" id="close-deposit-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Amount Selection -->
                    <div class="form-group">
                        <label class="form-label">Select Amount (TON)</label>
                        <div class="deposit-amounts" id="deposit-amounts">
                            ${this.depositAmounts.map(amount => `
                                <div class="amount-option" data-amount="${amount}">
                                    <div class="amount-value">${amount}</div>
                                    <div class="amount-label">TON</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Custom Amount -->
                    <div class="form-group">
                        <label class="form-label">Or Enter Custom Amount</label>
                        <input type="number" 
                               id="custom-deposit-amount" 
                               class="form-input" 
                               placeholder="Enter amount in TON"
                               min="${AppConfig.minDeposit}"
                               step="0.01">
                    </div>
                    
                    <!-- Deposit Info -->
                    <div class="deposit-info glass-card">
                        <div class="info-item">
                            <span>Minimum Deposit:</span>
                            <strong>${AppConfig.minDeposit} TON</strong>
                        </div>
                        <div class="info-item">
                            <span>Deposit Bonus:</span>
                            <strong>${(AppConfig.depositBonus * 100)}%</strong>
                        </div>
                        <div class="info-item">
                            <span>Processing Time:</span>
                            <strong>1-3 Confirmations</strong>
                        </div>
                    </div>
                    
                    <!-- QR Code and Address -->
                    <div id="deposit-details" style="display: none;">
                        <div class="deposit-qr-container">
                            <div class="deposit-qr" id="deposit-qr">
                                <!-- QR code will be generated here -->
                            </div>
                            <div class="qr-instructions">
                                <p><i class="fas fa-qrcode"></i> Scan QR code with your TON wallet</p>
                                <p><i class="fas fa-copy"></i> Or copy address below</p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Deposit Address</label>
                            <div class="deposit-address" id="deposit-address-display">
                                Generating address...
                            </div>
                            <button class="btn btn-secondary btn-full" id="copy-deposit-address">
                                <i class="fas fa-copy"></i>
                                Copy Address
                            </button>
                        </div>
                        
                        <div class="deposit-note">
                            <i class="fas fa-info-circle"></i>
                            <p>Send only TON to this address. Deposits will be credited after 1-3 network confirmations.</p>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="modal-actions">
                        <button class="btn btn-large btn-full" id="generate-deposit-btn">
                            <i class="fas fa-qrcode"></i>
                            Generate Deposit Address
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .deposit-amounts {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .amount-option {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-medium);
                    padding: 15px 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all var(--transition-normal);
                }
                
                .amount-option:hover {
                    background: var(--bg-card);
                    border-color: var(--color-accent-blue);
                }
                
                .amount-option.selected {
                    background: rgba(52, 152, 219, 0.1);
                    border-color: var(--color-accent-blue);
                    color: var(--color-accent-blue);
                }
                
                .amount-value {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                
                .amount-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                
                .deposit-info {
                    margin: 20px 0;
                    padding: 15px;
                }
                
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-light);
                }
                
                .info-item:last-child {
                    border-bottom: none;
                }
                
                .deposit-qr-container {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .deposit-qr {
                    width: 200px;
                    height: 200px;
                    background: white;
                    border-radius: var(--radius-medium);
                    padding: 15px;
                    margin: 0 auto 15px;
                    border: 1px solid var(--border-color);
                }
                
                .qr-instructions {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .qr-instructions p {
                    margin: 8px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .deposit-address {
                    font-family: monospace;
                    background: var(--bg-surface);
                    padding: 15px;
                    border-radius: var(--radius-medium);
                    font-size: 0.9rem;
                    text-align: center;
                    margin: 15px 0;
                    word-break: break-all;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                
                .deposit-note {
                    padding: 15px;
                    background: rgba(52, 152, 219, 0.1);
                    border-radius: var(--radius-medium);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    margin: 20px 0;
                }
                
                .deposit-note i {
                    color: var(--color-accent-blue);
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                
                .deposit-note p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
                
                .modal-actions {
                    margin-top: 20px;
                }
            </style>
        `;
        
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupDepositModalEvents();
    }

    /**
     * Setup deposit modal events
     */
    setupDepositModalEvents() {
        const modal = document.getElementById('deposit-modal');
        
        // Close button
        const closeBtn = modal.querySelector('#close-deposit-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Amount selection
        const amountOptions = modal.querySelectorAll('.amount-option');
        amountOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                amountOptions.forEach(opt => opt.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.selectedDepositAmount = parseFloat(e.currentTarget.dataset.amount);
                
                // Update custom amount input
                const customInput = modal.querySelector('#custom-deposit-amount');
                if (customInput) {
                    customInput.value = this.selectedDepositAmount;
                }
            });
        });
        
        // Custom amount input
        const customInput = modal.querySelector('#custom-deposit-amount');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= AppConfig.minDeposit) {
                    this.selectedDepositAmount = value;
                    
                    // Update selected amount option
                    amountOptions.forEach(opt => {
                        opt.classList.remove('selected');
                        if (parseFloat(opt.dataset.amount) === value) {
                            opt.classList.add('selected');
                        }
                    });
                }
            });
        }
        
        // Generate deposit button
        const generateBtn = modal.querySelector('#generate-deposit-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateDepositAddress();
            });
        }
        
        // Copy address button
        const copyBtn = modal.querySelector('#copy-deposit-address');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyDepositAddress();
            });
        }
    }

    /**
     * Generate deposit address
     */
    async generateDepositAddress() {
        try {
            // Security check
            if (!window.security?.isRequestAllowed?.()) {
                this.app.showNotification('Warning', 'Please wait before making another request', 'warning');
                return;
            }
            
            if (!this.selectedDepositAmount || this.selectedDepositAmount < AppConfig.minDeposit) {
                this.app.showNotification('Error', `Minimum deposit is ${AppConfig.minDeposit} TON`, 'error');
                return;
            }
            
            const modal = document.getElementById('deposit-modal');
            const generateBtn = modal.querySelector('#generate-deposit-btn');
            const originalText = generateBtn.innerHTML;
            
            // Show loading
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;
            
            // In a real app, this would generate a unique deposit address via API
            // For now, we'll simulate it
            setTimeout(() => {
                try {
                    // Generate mock deposit address
                    this.depositAddress = 'EQ' + Math.random().toString(36).substring(2, 15).toUpperCase() + 
                                        Math.random().toString(36).substring(2, 15).toUpperCase();
                    
                    // Show deposit details
                    const depositDetails = modal.querySelector('#deposit-details');
                    const addressDisplay = modal.querySelector('#deposit-address-display');
                    
                    if (depositDetails && addressDisplay) {
                        depositDetails.style.display = 'block';
                        addressDisplay.textContent = this.depositAddress;
                        
                        // Generate QR code (mock)
                        const qrContainer = modal.querySelector('#deposit-qr');
                        qrContainer.innerHTML = `
                            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.9rem;">
                                <div style="text-align: center;">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">QR</div>
                                    <div>Scan with TON wallet</div>
                                </div>
                            </div>
                        `;
                        
                        // Record deposit in database
                        this.recordDeposit();
                        
                        // Scroll to details
                        depositDetails.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // Reset button
                    generateBtn.innerHTML = '<i class="fas fa-sync"></i> Generate New Address';
                    generateBtn.disabled = false;
                    
                } catch (error) {
                    console.error('Error generating deposit:', error);
                    this.app.showNotification('Error', 'Failed to generate deposit address', 'error');
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;
                }
            }, 1500);
            
        } catch (error) {
            console.error('Deposit generation error:', error);
            this.app.showNotification('Error', 'Failed to generate deposit address', 'error');
        }
    }

    /**
     * Record deposit in database
     */
    async recordDeposit() {
        try {
            if (!this.app.userState || !this.selectedDepositAmount || !this.depositAddress) return;
            
            // Generate transaction hash
            const txHash = '0x' + Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
            
            // Record deposit
            await window.db.recordDeposit({
                userId: this.app.userState.id,
                amount: this.selectedDepositAmount,
                address: this.depositAddress,
                transactionHash: txHash,
                status: 'pending',
                bonus: this.selectedDepositAmount * AppConfig.depositBonus
            });
            
            // Show success message
            this.app.showNotification(
                'Deposit Created!',
                `Send ${this.selectedDepositAmount} TON to the address above`,
                'success'
            );
            
        } catch (error) {
            console.error('Error recording deposit:', error);
        }
    }

    /**
     * Copy deposit address
     */
    copyDepositAddress() {
        if (!this.depositAddress) return;
        
        navigator.clipboard.writeText(this.depositAddress).then(() => {
            this.app.showNotification('Copied!', 'Deposit address copied to clipboard', 'success');
        }).catch(() => {
            // Fallback
            const tempInput = document.createElement('input');
            tempInput.value = this.depositAddress;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            this.app.showNotification('Copied!', 'Deposit address copied to clipboard', 'success');
        });
    }

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        const modal = document.getElementById('withdraw-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-arrow-up"></i>
                        Withdraw TON
                    </h3>
                    <button class="modal-close" id="close-withdraw-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Wallet Info -->
                    ${this.app.walletPage?.userWallet ? `
                        <div class="withdraw-wallet-info">
                            <div class="info-item">
                                <span>Connected Wallet:</span>
                                <strong>${this.app.walletPage.userWallet.provider || 'TON Wallet'}</strong>
                            </div>
                            <div class="info-item">
                                <span>Address:</span>
                                <code class="wallet-address">${this.app.walletPage.formatAddress(this.app.walletPage.userWallet.address)}</code>
                            </div>
                        </div>
                    ` : `
                        <div class="connect-prompt">
                            <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
                            <p>Please connect your TON wallet first to enable withdrawals.</p>
                            <button class="btn btn-secondary" id="connect-from-withdraw">
                                <i class="fas fa-plug"></i>
                                Connect Wallet
                            </button>
                        </div>
                    `}
                    
                    <!-- Amount Input -->
                    <div class="form-group">
                        <label class="form-label">Amount to Withdraw (TON)</label>
                        <input type="number" 
                               id="withdraw-amount" 
                               class="form-input" 
                               placeholder="Enter amount"
                               min="${AppConfig.minWithdrawal}"
                               step="0.01">
                        <div class="input-hint">
                            Available: <span id="available-withdraw-balance">${this.app.userState?.balance?.toFixed(3) || '0.000'}</span> TON
                        </div>
                    </div>
                    
                    <!-- Quick Amounts -->
                    <div class="quick-amounts">
                        <button class="quick-amount-btn" data-percent="25">25%</button>
                        <button class="quick-amount-btn" data-percent="50">50%</button>
                        <button class="quick-amount-btn" data-percent="75">75%</button>
                        <button class="quick-amount-btn" data-percent="100">MAX</button>
                    </div>
                    
                    <!-- Withdraw Info -->
                    <div class="withdraw-info glass-card">
                        <div class="info-item">
                            <span>Minimum Withdrawal:</span>
                            <strong>${AppConfig.minWithdrawal} TON</strong>
                        </div>
                        <div class="info-item">
                            <span>Withdrawal Fee:</span>
                            <strong>${(AppConfig.withdrawalFee * 100)}%</strong>
                        </div>
                        <div class="info-item">
                            <span>Processing Time:</span>
                            <strong>1-24 hours</strong>
                        </div>
                        ${AppConfig.minWithdrawalReferrals > 0 ? `
                            <div class="info-item">
                                <span>Minimum Referrals:</span>
                                <strong>${AppConfig.minWithdrawalReferrals}</strong>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Terms -->
                    <div class="withdraw-terms">
                        <label class="checkbox-label">
                            <input type="checkbox" id="withdraw-terms">
                            <span>I understand that withdrawals are processed manually and may take up to 24 hours</span>
                        </label>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="modal-actions">
                        <button class="btn btn-large btn-full" id="submit-withdraw-btn" disabled>
                            <i class="fas fa-paper-plane"></i>
                            Submit Withdrawal Request
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .withdraw-wallet-info {
                    background: var(--bg-surface);
                    border-radius: var(--radius-medium);
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color);
                }
                
                .connect-prompt {
                    text-align: center;
                    padding: 20px;
                    background: rgba(241, 196, 15, 0.1);
                    border-radius: var(--radius-medium);
                    border: 1px solid rgba(241, 196, 15, 0.3);
                    margin-bottom: 20px;
                }
                
                .connect-prompt i {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
                
                .connect-prompt p {
                    color: var(--text-secondary);
                    margin-bottom: 15px;
                    font-size: 0.9rem;
                }
                
                .input-hint {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-top: 6px;
                }
                
                .quick-amounts {
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .quick-amount-btn {
                    flex: 1;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-medium);
                    padding: 10px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: var(--transition-normal);
                    font-size: 0.9rem;
                }
                
                .quick-amount-btn:hover {
                    background: var(--bg-card);
                    border-color: var(--color-accent-blue);
                    color: var(--text-primary);
                }
                
                .withdraw-info {
                    margin: 20px 0;
                    padding: 15px;
                }
                
                .withdraw-terms {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: var(--radius-medium);
                }
                
                .checkbox-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                
                .checkbox-label input {
                    margin-top: 3px;
                    flex-shrink: 0;
                }
            </style>
        `;
        
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupWithdrawModalEvents();
    }

    /**
     * Setup withdraw modal events
     */
    setupWithdrawModalEvents() {
        const modal = document.getElementById('withdraw-modal');
        
        // Close button
        const closeBtn = modal.querySelector('#close-withdraw-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Connect from withdraw button
        const connectBtn = modal.querySelector('#connect-from-withdraw');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                this.showConnectWalletModal();
            });
        }
        
        // Quick amount buttons
        const quickBtns = modal.querySelectorAll('.quick-amount-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const percent = parseFloat(e.currentTarget.dataset.percent);
                const available = this.app.userState?.balance || 0;
                let amount = available * (percent / 100);
                
                if (percent === 100) {
                    // Calculate MAX amount considering fee
                    const fee = amount * AppConfig.withdrawalFee;
                    amount = available - fee;
                }
                
                const amountInput = modal.querySelector('#withdraw-amount');
                if (amountInput) {
                    amountInput.value = amount.toFixed(3);
                    this.validateWithdrawForm();
                }
            });
        });
        
        // Amount input
        const amountInput = modal.querySelector('#withdraw-amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.validateWithdrawForm();
            });
        }
        
        // Terms checkbox
        const termsCheckbox = modal.querySelector('#withdraw-terms');
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', () => {
                this.validateWithdrawForm();
            });
        }
        
        // Submit button
        const submitBtn = modal.querySelector('#submit-withdraw-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitWithdrawal();
            });
        }
    }

    /**
     * Validate withdraw form
     */
    validateWithdrawForm() {
        const modal = document.getElementById('withdraw-modal');
        if (!modal) return;
        
        const amountInput = modal.querySelector('#withdraw-amount');
        const termsCheckbox = modal.querySelector('#withdraw-terms');
        const submitBtn = modal.querySelector('#submit-withdraw-btn');
        
        if (!amountInput || !termsCheckbox || !submitBtn) return;
        
        const amount = parseFloat(amountInput.value);
        const available = this.app.userState?.balance || 0;
        const isValid = !isNaN(amount) && 
                       amount >= AppConfig.minWithdrawal && 
                       amount <= available && 
                       termsCheckbox.checked;
        
        submitBtn.disabled = !isValid;
        submitBtn.style.opacity = isValid ? '1' : '0.6';
    }

    /**
     * Submit withdrawal request
     */
    async submitWithdrawal() {
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
            
            const modal = document.getElementById('withdraw-modal');
            const amountInput = modal.querySelector('#withdraw-amount');
            const submitBtn = modal.querySelector('#submit-withdraw-btn');
            
            if (!amountInput || !submitBtn) return;
            
            const amount = parseFloat(amountInput.value);
            const user = this.app.userState;
            const wallet = this.app.walletPage?.userWallet;
            
            // Validation
            if (amount < AppConfig.minWithdrawal) {
                this.app.showNotification('Error', `Minimum withdrawal is ${AppConfig.minWithdrawal} TON`, 'error');
                return;
            }
            
            if (amount > user.balance) {
                this.app.showNotification('Error', 'Insufficient TON balance', 'error');
                return;
            }
            
            if (AppConfig.minWithdrawalReferrals > 0 && user.referrals < AppConfig.minWithdrawalReferrals) {
                this.app.showNotification(
                    'Error',
                    `You need at least ${AppConfig.minWithdrawalReferrals} referrals to withdraw`,
                    'error'
                );
                return;
            }
            
            if (!wallet) {
                this.app.showNotification('Error', 'Please connect your TON wallet first', 'error');
                return;
            }
            
            // Calculate fee and net amount
            const fee = amount * AppConfig.withdrawalFee;
            const netAmount = amount - fee;
            
            // Show loading
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            // Update user balance
            const updates = {
                balance: user.balance - amount
            };
            
            await this.app.updateUserData(updates, 'withdrawal');
            
            // Create withdrawal request
            await window.db.createWithdrawalRequest({
                userId: user.id,
                userName: `${user.firstName} ${user.lastName || ''}`,
                amount: amount,
                netAmount: netAmount,
                fee: fee,
                walletAddress: wallet.address,
                walletProvider: wallet.provider,
                status: 'pending'
            });
            
            // Record transaction
            await window.db.createTransaction({
                userId: user.id,
                type: 'withdrawal',
                amount: -amount,
                description: `Withdrawal request: ${amount} TON to ${this.app.walletPage.formatAddress(wallet.address)}`,
                status: 'pending',
                fee: fee
            });
            
            // Close modal
            modal.style.display = 'none';
            
            // Show success message
            this.app.showNotification(
                'Withdrawal Submitted!',
                `Request for ${amount.toFixed(3)} TON has been submitted. Processing time: 1-24 hours.`,
                'success'
            );
            
            // Update UI
            this.app.header.updateBalances();
            this.app.walletPage.updateWalletBalances();
            this.app.walletPage.loadTransactionHistory();
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            this.app.showNotification('Withdrawal Failed', error.message || 'Please try again', 'error');
            
            // Reset button
            const submitBtn = document.querySelector('#submit-withdraw-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Withdrawal Request';
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Show connect wallet modal
     */
    showConnectWalletModal() {
        const modal = document.getElementById('connect-wallet-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-plug"></i>
                        Connect TON Wallet
                    </h3>
                    <button class="modal-close" id="close-connect-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Wallet Providers -->
                    <div class="wallet-providers">
                        ${AppConfig.walletProviders.map(provider => `
                            <div class="wallet-provider" data-provider="${provider.id}">
                                <div class="provider-icon">
                                    <i class="${provider.icon}"></i>
                                </div>
                                <div class="provider-name">${provider.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Manual Connection -->
                    <div class="manual-connection glass-card">
                        <div class="section-header">
                            <i class="fas fa-keyboard"></i>
                            <h4>Manual Connection</h4>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Wallet Address</label>
                            <input type="text" 
                                   id="manual-wallet-address" 
                                   class="form-input" 
                                   placeholder="Enter your TON wallet address">
                            <div class="input-hint">
                                Format: EQ... (48 characters) or 0:... (66 characters)
                            </div>
                        </div>
                    </div>
                    
                    <!-- Connection Info -->
                    <div class="connection-info">
                        <div class="info-item">
                            <i class="fas fa-shield-alt" style="color: #2ecc71;"></i>
                            <span>Your wallet information is securely encrypted</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-sync" style="color: #3498db;"></i>
                            <span>Automatic deposit detection enabled</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-bolt" style="color: #f39c12;"></i>
                            <span>Faster withdrawal processing</span>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="modal-actions">
                        <button class="btn btn-large btn-full" id="connect-manual-btn">
                            <i class="fas fa-link"></i>
                            Connect Manually
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .wallet-providers {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin: 20px 0;
                }
                
                .wallet-provider {
                    background: var(--bg-surface);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius-large);
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
                
                .wallet-provider:hover {
                    background: var(--bg-card);
                    border-color: var(--color-accent-blue);
                    transform: translateY(-2px);
                }
                
                .wallet-provider.selected {
                    background: rgba(52, 152, 219, 0.1);
                    border-color: var(--color-accent-blue);
                }
                
                .provider-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: var(--radius-circle);
                    background: linear-gradient(135deg, #0098ea 0%, #0066b2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    color: white;
                }
                
                .provider-name {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 0.95rem;
                }
                
                .manual-connection {
                    margin: 25px 0;
                    padding: 20px;
                }
                
                .manual-connection .section-header {
                    margin: 0 0 15px 0;
                }
                
                .manual-connection .section-header h4 {
                    font-size: 1rem;
                    color: var(--text-primary);
                }
                
                .connection-info {
                    margin: 20px 0;
                }
                
                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                
                @media (max-width: 480px) {
                    .wallet-providers {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `;
        
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupConnectModalEvents();
    }

    /**
     * Setup connect modal events
     */
    setupConnectModalEvents() {
        const modal = document.getElementById('connect-wallet-modal');
        
        // Close button
        const closeBtn = modal.querySelector('#close-connect-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Wallet provider selection
        const providers = modal.querySelectorAll('.wallet-provider');
        providers.forEach(provider => {
            provider.addEventListener('click', async (e) => {
                const providerId = e.currentTarget.dataset.provider;
                const providerInfo = AppConfig.walletProviders.find(p => p.id === providerId);
                
                if (providerInfo) {
                    await this.connectWithProvider(providerInfo);
                }
            });
        });
        
        // Manual connection button
        const manualBtn = modal.querySelector('#connect-manual-btn');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                this.connectManually();
            });
        }
    }

    /**
     * Connect with provider
     */
    async connectWithProvider(provider) {
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
            
            // In a real app, this would use the provider's SDK to connect
            // For now, we'll simulate connection
            
            this.app.showNotification('Connecting', `Connecting to ${provider.name}...`, 'info');
            
            // Simulate connection delay
            setTimeout(async () => {
                try {
                    // Generate mock wallet address
                    const mockAddress = 'EQ' + Math.random().toString(36).substring(2, 15).toUpperCase() + 
                                      Math.random().toString(36).substring(2, 15).toUpperCase();
                    
                    // Save wallet to database
                    await window.db.saveUserWallet(this.app.userState.id, {
                        address: mockAddress,
                        provider: provider.name,
                        providerId: provider.id,
                        connectedVia: 'provider'
                    });
                    
                    // Close modal
                    document.getElementById('connect-wallet-modal').style.display = 'none';
                    
                    // Update wallet page
                    await this.app.walletPage.loadWalletData();
                    await this.app.walletPage.render();
                    
                    this.app.showNotification(
                        'Connected!',
                        `Successfully connected ${provider.name} wallet`,
                        'success'
                    );
                    
                } catch (error) {
                    console.error('Connection error:', error);
                    this.app.showNotification('Error', 'Failed to connect wallet', 'error');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Provider connection error:', error);
            this.app.showNotification('Error', 'Failed to connect wallet', 'error');
        }
    }

    /**
     * Connect manually
     */
    async connectManually() {
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
            
            const modal = document.getElementById('connect-wallet-modal');
            const addressInput = modal.querySelector('#manual-wallet-address');
            
            if (!addressInput) return;
            
            const address = addressInput.value.trim();
            
            // Validate TON address
            if (!window.security?.validateTONAddress?.(address)) {
                this.app.showNotification('Error', 'Invalid TON wallet address format', 'error');
                return;
            }
            
            // Save wallet to database
            await window.db.saveUserWallet(this.app.userState.id, {
                address: address,
                provider: 'Manual',
                providerId: 'manual',
                connectedVia: 'manual'
            });
            
            // Close modal
            modal.style.display = 'none';
            
            // Update wallet page
            await this.app.walletPage.loadWalletData();
            await this.app.walletPage.render();
            
            this.app.showNotification('Connected!', 'Wallet connected successfully', 'success');
            
        } catch (error) {
            console.error('Manual connection error:', error);
            this.app.showNotification('Error', 'Failed to connect wallet', 'error');
        }
    }
}
