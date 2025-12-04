// wallet.js - TON Wallet Integration
class TONWallet {
    constructor() {
        this.tonconnect = null;
        this.wallet = UQCrXfE4_ktpwyZJzmGuCt6zXE5mErFV8VczSjEZvRuLy9_q;
        this.connected = false;
        this.init();
    }

    async init() {
        try {
            // Load TON Connect SDK
            if (typeof window !== 'undefined') {
                const { TonConnect } = await import('https://unpkg.com/@tonconnect/sdk@latest/lib/tonconnect-sdk.min.js');
                
                this.tonconnect = new TonConnect({
                    manifestUrl: 'https://your-domain.com/tonconnect-manifest.json'
                });
                
                // Check if already connected
                const wallets = await this.tonconnect.getWallets();
                if (wallets.length > 0) {
                    this.wallet = wallets[0];
                    this.connected = true;
                }
                
                console.log('✅ TON Wallet initialized');
            }
        } catch (error) {
            console.error('❌ TON Wallet initialization failed:', error);
        }
    }

    async connect() {
        try {
            if (!this.tonconnect) {
                throw new Error('TON Connect not initialized');
            }

            const walletConnectionSource = {
                universalLink: 'https://app.tonkeeper.com/ton-connect',
                bridgeUrl: 'https://bridge.tonapi.io/bridge'
            };

            const connection = await this.tonconnect.connect(walletConnectionSource);
            this.wallet = connection;
            this.connected = true;
            
            return {
                success: true,
                address: connection.account.address,
                wallet: connection.wallet.name
            };
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async disconnect() {
        try {
            await this.tonconnect.disconnect();
            this.wallet = null;
            this.connected = false;
            return { success: true };
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            return { success: false, error: error.message };
        }
    }

    async getBalance() {
        try {
            if (!this.connected || !this.wallet) {
                throw new Error('Wallet not connected');
            }

            // Use TON API to get balance
            const response = await fetch(`https://tonapi.io/v2/accounts/${this.wallet.account.address}`);
            const data = await response.json();
            
            const balance = data.balance ? (data.balance / 1000000000).toFixed(4) : '0.0000';
            
            return {
                success: true,
                balance: balance,
                address: this.wallet.account.address
            };
        } catch (error) {
            console.error('Error getting balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendTransaction(toAddress, amount, comment = '') {
        try {
            if (!this.connected || !this.wallet) {
                throw new Error('Wallet not connected');
            }

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
                messages: [
                    {
                        address: toAddress,
                        amount: (amount * 1000000000).toString(), // Convert to nanoTON
                        payload: comment
                    }
                ]
            };

            const result = await this.wallet.sendTransaction(transaction);
            
            return {
                success: true,
                transaction: result,
                hash: result.boc
            };
        } catch (error) {
            console.error('Error sending transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async depositToApp(amount) {
        try {
            // App's TON wallet address
            const appWalletAddress = 'YOUR_APP_TON_WALLET_ADDRESS';
            
            const result = await this.sendTransaction(
                appWalletAddress, 
                amount, 
                `Deposit from ${this.wallet.account.address}`
            );
            
            if (result.success) {
                // Record deposit in database
                await db.createTransaction({
                    userId: window.app?.currentUser?.id || 'unknown',
                    type: 'deposit',
                    currency: 'ton',
                    amount: amount,
                    description: `Deposited ${amount} TON`,
                    status: 'pending',
                    walletAddress: this.wallet.account.address,
                    txHash: result.hash
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error depositing to app:', error);
            return { success: false, error: error.message };
        }
    }

    async withdrawFromApp(amount, toAddress) {
        try {
            // This would be handled by your backend/admin panel
            // For now, just record the withdrawal request
            const withdrawal = await db.createWithdrawal({
                userId: window.app?.currentUser?.id,
                amount: amount,
                currency: 'ton',
                walletAddress: toAddress || this.wallet.account.address
            });
            
            return {
                success: true,
                message: 'Withdrawal request submitted',
                withdrawalId: withdrawal.$id
            };
        } catch (error) {
            console.error('Error withdrawing from app:', error);
            return { success: false, error: error.message };
        }
    }

    isConnected() {
        return this.connected && this.wallet !== null;
    }

    getAddress() {
        return this.connected ? this.wallet.account.address : null;
    }

    getWalletInfo() {
        if (!this.connected) return null;
        
        return {
            name: this.wallet.wallet.name,
            address: this.wallet.account.address,
            chain: this.wallet.account.chain
        };
    }
}

// Create global instance
const tonWallet = new TONWallet();

// Export for global use
if (typeof window !== 'undefined') {
    window.tonWallet = tonWallet;
}

console.log('🚀 TON Wallet module loaded');
