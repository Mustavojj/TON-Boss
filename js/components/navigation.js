/**
 * Navigation Component for TON BOSS App
 */
class Navigation {
    constructor(app) {
        this.app = app;
        this.element = document.querySelector('.bottom-nav');
        this.currentPage = 'home-page';
    }

    /**
     * Render navigation
     */
    render() {
        this.element.innerHTML = `
            <button class="nav-btn active" data-page="home-page">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </button>
            <button class="nav-btn" data-page="tasks-page">
                <i class="fas fa-coins"></i>
                <span>Earn</span>
            </button>
            <button class="nav-btn" data-page="exchange-page">
                <i class="fas fa-exchange-alt"></i>
                <span>Exchange</span>
            </button>
            <button class="nav-btn" data-page="referrals-page">
                <i class="fas fa-users"></i>
                <span>Referrals</span>
            </button>
            <button class="nav-btn" data-page="wallet-page">
                <i class="fas fa-wallet"></i>
                <span>Wallet</span>
            </button>
        `;
        
        this.addStyles();
        this.setupEventListeners();
    }

    /**
     * Add navigation styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                max-width: 500px;
                margin: 0 auto;
                background: rgba(26, 26, 46, 0.95);
                backdrop-filter: blur(20px);
                border-top: 1px solid var(--border-color);
                display: flex;
                justify-content: space-around;
                padding: 12px 0;
                z-index: 1000;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
            }
            
            .nav-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: var(--radius-medium);
                transition: all var(--transition-normal);
                flex: 1;
                min-width: 0;
                position: relative;
                overflow: hidden;
            }
            
            .nav-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--gradient-accent);
                transform: translateY(-100%);
                transition: var(--transition-normal);
            }
            
            .nav-btn i {
                font-size: 1.3rem;
                transition: var(--transition-normal);
            }
            
            .nav-btn span {
                font-size: 0.75rem;
                font-weight: 500;
                transition: var(--transition-normal);
            }
            
            .nav-btn.active {
                color: var(--color-accent-blue);
            }
            
            .nav-btn.active::before {
                transform: translateY(0);
            }
            
            .nav-btn.active i {
                transform: translateY(-2px);
                filter: drop-shadow(0 2px 4px rgba(52, 152, 219, 0.3));
            }
            
            .nav-btn:hover:not(.active) {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.05);
            }
            
            .nav-btn:active {
                transform: scale(0.95);
            }
            
            /* Notification badge */
            .nav-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                font-size: 0.6rem;
                font-weight: 700;
                width: 18px;
                height: 18px;
                border-radius: var(--radius-circle);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @media (max-width: 480px) {
                .bottom-nav {
                    padding: 10px 0;
                }
                
                .nav-btn {
                    padding: 6px 8px;
                    gap: 4px;
                }
                
                .nav-btn i {
                    font-size: 1.1rem;
                }
                
                .nav-btn span {
                    font-size: 0.7rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const navButtons = this.element.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const pageId = e.currentTarget.dataset.page;
                this.navigateTo(pageId);
            });
        });
    }

    /**
     * Navigate to a page
     */
    navigateTo(pageId) {
        // Update active button
        const navButtons = this.element.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === pageId) {
                btn.classList.add('active');
            }
        });
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
            
            // Trigger page-specific rendering
            this.app.renderPage(pageId);
        }
        
        this.currentPage = pageId;
        
        // Add navigation animation
        targetPage.style.animation = 'none';
        setTimeout(() => {
            targetPage.style.animation = 'fadeIn 0.4s ease-out';
        }, 10);
    }

    /**
     * Add notification badge to a nav item
     */
    addNotificationBadge(pageId, count = 1) {
        const button = this.element.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (!button) return;
        
        // Remove existing badge
        const existingBadge = button.querySelector('.nav-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (count > 0) {
            const badge = document.createElement('div');
            badge.className = 'nav-badge';
            badge.textContent = count > 9 ? '9+' : count;
            button.appendChild(badge);
        }
    }

    /**
     * Remove notification badge from a nav item
     */
    removeNotificationBadge(pageId) {
        const button = this.element.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (!button) return;
        
        const existingBadge = button.querySelector('.nav-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        return this.currentPage;
    }
}
