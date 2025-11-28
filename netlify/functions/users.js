const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  // التحقق من الطريقة
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { telegramId } = event.queryStringParameters;
    
    if (!telegramId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Telegram ID required' }) 
      };
    }

    // استعلام آمن
    const result = await pool.query(
      'SELECT telegram_id, first_name, username, photo_url, balance, tub_balance, total_earned, referrals, daily_ads, lifetime_ads FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.rows[0] || null)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
