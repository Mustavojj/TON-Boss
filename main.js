import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(__Middleware));


app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'TON BOSS API is working',
        timestamp: new Date().toISOString()
    });
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 API Test: http://localhost:${PORT}/api/test`);
});
