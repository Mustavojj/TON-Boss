/**
 * Header Component for TON BOSS App
 */
class Header {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('app-header');
    }

    /**
     * Render header
     */
    render() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        
        this.element.innerHTML = `
            <div class="app-header-inner">
                <div class="user-info">
                    <div class="user-avatar" id="user-avatar">
                        ${user.photoUrl ? 
                            `<img src="${user.photoUrl}" alt="${user.firstName}">` : 
                            `<div class="avatar-placeholder">${user.firstName.charAt(0)}</div>`
                        }
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.firstName} ${user.lastName || ''}</div>
                        <div class="user-telegram-id" id="copy-telegram-id">
                            <span>ID: ${user.id}</span>
                            <i class="fas fa-copy"></i>
                        </div>
                    </div>
                </div>
                
                <div class="balance-display">
                    <div class="balance-card">
                        <div class="balance-icon">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="balance-info">
                            <span class="balance-label">GOLD</span>
                            <span class="balance-amount" id="header-tub-balance">${user.tub?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                    
                    <div class="balance-card">
                        <div class="balance-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="balance-info">
                            <span class="balance-label">TON</span>
                            <span class="balance-amount" id="header-ton-balance">${user.balance?.toFixed(3) || '0.000'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="header-actions">
                    <button class="header-action-btn" id="refresh-balances" title="Refresh">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="header-action-btn" id="security-status" title="Security Status">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.addStyles();
    }

    /**
     * Add header styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .app-header {
                background: var(--gradient-primary);
                border-bottom: 1px solid var(--border-color);
                padding: 15px 20px;
                position: sticky;
                top: 0;
                z-index: 100;
                backdrop-filter: blur(20px);
                box-shadow: var(--shadow-light);
            }
            
            .app-header-inner {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }
            
            .user-avatar {
                width: 50px;
                height: 50px;
                border-radius: var(--radius-circle);
                overflow: hidden;
                flex-shrink: 0;
                border: 2px solid var(--color-accent-blue);
                background: var(--bg-surface);
            }
            
            .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--gradient-accent);
                color: white;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .user-details {
                flex: 1;
                min-width: 0;
            }
            
            .user-name {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .user-telegram-id {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition-fast);
                padding: 4px 8px;
                border-radius: var(--radius-small);
                background: rgba(255, 255, 255, 0.05);
                max-width: fit-content;
            }
            
            .user-telegram-id:hover {
                color: var(--color-accent-blue);
                background: rgba(52, 152, 219, 0.1);
            }
            
            .user-telegram-id i {
                font-size: 0.7rem;
            }
            
            .balance-display {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .balance-card {
                background: rgba(26, 26, 46, 0.8);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-medium);
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 100px;
                transition: var(--transition-normal);
            }
            
            .balance-card:hover {
                border-color: var(--color-accent-blue);
                transform: translateY(-2px);
            }
            
            .balance-icon {
                width: 30px;
                height: 30px;
                border-radius: var(--radius-circle);
                background: var(--gradient-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.9rem;
            }
            
            .balance-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .balance-label {
                font-size: 0.7rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .balance-amount {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
                font-family: monospace;
            }
            
            .header-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .header-action-btn {
                width: 40px;
                height: 40px;
                border-radius: var(--radius-circle);
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: var(--transition-normal);
                font-size: 0.9rem;
            }
            
            .header-action-btn:hover {
                background: rgba(52, 152, 219, 0.1);
                color: var(--color-accent-blue);
                border-color: var(--color-accent-blue);
                transform: rotate(15deg);
            }
            
            @media (max-width: 480px) {
                .app-header {
                    padding: 12px 16px;
                }
                
                .balance-card {
                    min-width: 80px;
                    padding: 8px 10px;
                }
                
                .balance-amount {
                    font-size: 0.9rem;
                }
                
                .user-name {
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
        // Copy Telegram ID
        const copyIdBtn = document.getElementById('copy-telegram-id');
        if (copyIdBtn) {
            copyIdBtn.addEventListener('click', () => {
                this.copyTelegramId();
            });
        }
        
        // Refresh balances
        const refreshBtn = document.getElementById('refresh-balances');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.app.refreshUserData();
            });
        }
        
        // Security status
        const securityBtn = document.getElementById('security-status');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => {
                this.showSecurityStatus();
            });
        }
    }

    /**
     * Copy Telegram ID to clipboard
     */
    copyTelegramId() {
        const telegramId = this.app.userState.id;
        navigator.clipboard.writeText(telegramId).then(() => {
            this.app.showNotification('Copied!', 'Telegram ID copied to clipboard', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const tempInput = document.createElement('input');
            tempInput.value = telegramId;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            this.app.showNotification('Copied!', 'Telegram ID copied to clipboard', 'success');
        });
    }

    /**
     * Show security status popup
     */
    showSecurityStatus() {
        const securityStatus = window.security?.getSecurityStatus?.();
        
        let securityHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-shield-alt"></i>
                        Security Status
                    </h3>
                    <button class="modal-close" id="close-security-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
        `;
        
        if (securityStatus) {
            securityHTML += `
                <div class="security-status-grid">
                    <div class="security-check ${securityStatus.botVerified ? 'passed' : 'failed'}">
                        <i class="fas fa-${securityStatus.botVerified ? 'check-circle' : 'times-circle'}"></i>
                        <span>Bot Verification</span>
                    </div>
                    <div class="security-check ${securityStatus.userValidated ? 'passed' : 'failed'}">
                        <i class="fas fa-${securityStatus.userValidated ? 'check-circle' : 'times-circle'}"></i>
                        <span>User Validation</span>
                    </div>
                    <div class="security-check ${securityStatus.rateLimitPassed ? 'passed' : 'failed'}">
                        <i class="fas fa-${securityStatus.rateLimitPassed ? 'check-circle' : 'times-circle'}"></i>
                        <span>Rate Limiting</span>
                    </div>
                    <div class="security-check ${securityStatus.ipCheckPassed ? 'passed' : 'failed'}">
                        <i class="fas fa-${securityStatus.ipCheckPassed ? 'check-circle' : 'times-circle'}"></i>
                        <span>IP Protection</span>
                    </div>
                </div>
                
                <div class="security-stats">
                    <div class="security-stat">
                        <span>Requests (1min):</span>
                        <strong>${securityStatus.totalRequests || 0}</strong>
                    </div>
                    <div class="security-stat">
                        <span>Blocked IPs:</span>
                        <strong>${securityStatus.blockedIPs || 0}</strong>
                    </div>
                </div>
                
                <div class="security-note">
                    <i class="fas fa-info-circle"></i>
                    <p>All security measures are active to protect your account and data.</p>
                </div>
            `;
        } else {
            securityHTML += `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Security Module Not Loaded</h3>
                    <p>Security features are currently unavailable.</p>
                </div>
            `;
        }
        
        securityHTML += `
                </div>
            </div>
            
            <style>
                .security-status-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin: 20px 0;
                }
                
                .security-check {
                    padding: 15px;
                    border-radius: var(--radius-medium);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-align: center;
                }
                
                .security-check.passed {
                    background: rgba(46, 204, 113, 0.1);
                    border: 1px solid rgba(46, 204, 113, 0.3);
                    color: #2ecc71;
                }
                
                .security-check.failed {
                    background: rgba(231, 76, 60, 0.1);
                    border: 1px solid rgba(231, 76, 60, 0.3);
                    color: #e74c3c;
                }
                
                .security-check i {
                    font-size: 1.5rem;
                }
                
                .security-check span {
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                
                .security-stats {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px;
                    background: var(--bg-surface);
                    border-radius: var(--radius-medium);
                    margin: 20px 0;
                }
                
                .security-stat {
                    text-align: center;
                }
                
                .security-stat span {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }
                
                .security-stat strong {
                    font-size: 1.2rem;
                    color: var(--text-primary);
                }
                
                .security-note {
                    padding: 15px;
                    background: rgba(52, 152, 219, 0.1);
                    border-radius: var(--radius-medium);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }
                
                .security-note i {
                    color: var(--color-accent-blue);
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                
                .security-note p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
            </style>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'security-modal';
        modal.innerHTML = securityHTML;
        
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 10);
        
        // Close button
        const closeBtn = modal.querySelector('#close-security-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Update balances in header
     */
    updateBalances() {
        if (!this.app.userState) return;
        
        const user = this.app.userState;
        
        const tubBalance = document.getElementById('header-tub-balance');
        const tonBalance = document.getElementById('header-ton-balance');
        
        if (tubBalance) {
            tubBalance.textContent = user.tub?.toLocaleString() || '0';
        }
        
        if (tonBalance) {
            tonBalance.textContent = user.balance?.toFixed(3) || '0.000';
        }
    }
}
