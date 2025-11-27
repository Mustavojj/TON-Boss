
const APP_CONFIG = {
    taskPricePer1k: 1,
    minMembers: 500,
    maxMembers: 10000,
    adValue: 10,
    dailyAdLimit: 50,
    conversionRate: 10000,
    minWithdraw: 0.1,
    appName: 'TON BOSS',
    version: '2.0.0'
};

class NeonAPI {
    static async request(endpoint, options = {}) {
        try {
            const baseURL = window.location.origin;
            const response = await fetch(`${baseURL}/.netlify/functions/${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
  
    static async getUser(telegramId) {
        return await this.request(`users?telegramId=${telegramId}`);
    }

    static async createUser(userData) {
        return await this.request('create-user', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async updateUser(telegramId, updates) {
        return await this.request('update-user', {
            method: 'POST',
            body: JSON.stringify({ telegramId, updates })
        });
    }
}


window.APP_CONFIG = APP_CONFIG;
window.NeonAPI = NeonAPI;

console.log('✅ Neon Config loaded successfully');
