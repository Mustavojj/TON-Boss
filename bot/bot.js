require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('../shared/database');
const express = require('express');

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });
const db = new Database();
const webAppUrl = `https://yourdomain.com/webapp/index.html`;

// أمر /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // إنشاء أو جلب المستخدم
    let user = await db.getUser(userId);
    if (!user) {
        user = await db.createUser({
            id: userId,
            firstName: msg.from.first_name,
            username: msg.from.username
        });
    }
    
    // إرسال رابط الويب أب
    bot.sendMessage(chatId, 'Welcome to TonUP!', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: 'Open TonUP App',
                    web_app: { url: webAppUrl + `?user=${userId}` }
                }
            ]]
        }
    });
});

// تشغيل خادم API
const app = express();
app.use(express.json());

// API للويب أب
app.get('/api/user/:id', async (req, res) => {
    const user = await db.getUser(req.params.id);
    res.json(user);
});

app.post('/api/task', async (req, res) => {
    const task = await db.createTask(req.body);
    res.json(task);
});

app.listen(3000, () => {
    console.log('Bot API running on port 3000');
});
