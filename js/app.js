// js/app.js - إصدار مبسط للتجربة
console.log('✅ app.js loaded successfully!');

class TonBossApp {
    constructor() {
        console.log('🚀 App constructor called');
        this.init();
    }

    init() {
        console.log('🎯 App init started');
        
        // عرض واجهة تجريبية أولاً
        this.showTestInterface();
        
        // ثم تحميل Telegram
        this.loadTelegram();
    }

    showTestInterface() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="background: #1E293B; min-height: 100vh; padding: 20px;">
                <header style="background: #334155; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                    <h1 style="color: #6366F1; margin: 0;">🎯 TON BOSS</h1>
                    <p style="color: #94A3B8; margin: 5px 0 0 0;">Test Interface Loaded</p>
                </header>
                
                <div style="background: #334155; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
                    <h3 style="color: #F1F5F9;">💰 Your Balance</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <div style="background: #6366F1; padding: 15px; border-radius: 12px; text-align: center; flex: 1;">
                            <div style="font-size: 1.2rem; font-weight: bold;">0.500</div>
                            <div style="font-size: 0.8rem;">TON</div>
                        </div>
                        <div style="background: #10B981; padding: 15px; border-radius: 12px; text-align: center; flex: 1;">
                            <div style="font-size: 1.2rem; font-weight: bold;">1000</div>
                            <div style="font-size: 0.8rem;">GOLD</div>
                        </div>
                    </div>
                </div>

                <button onclick="app.watchAd()" style="width: 100%; padding: 15px; background: #6366F1; color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: bold;">
                    🎥 Watch Ad & Earn 10 GOLD
                </button>

                <div style="margin-top: 20px; color: #94A3B8; text-align: center;">
                    <p>JavaScript is working! 🎉</p>
                </div>
            </div>
        `;
    }

    loadTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('✅ Telegram WebApp found');
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
        } else {
            console.log('⚠️ Telegram WebApp not found - running in browser');
        }
    }

    watchAd() {
        alert('🎉 Ad feature would work here!');
    }
}

// تهيئة التطبيق
console.log('🎯 Starting app initialization...');
window.app = new TonBossApp();
console.log('✅ App initialized successfully');
