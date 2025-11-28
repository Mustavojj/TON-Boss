const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const userData = JSON.parse(event.body);
    
    // التحقق من البيانات
    if (!userData.telegram_id || !userData.first_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const result = await pool.query(
      `INSERT INTO users (
        telegram_id, first_name, last_name, username, photo_url,
        balance, tub_balance, total_earned, referrals, referral_earnings,
        daily_ads, lifetime_ads
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING telegram_id, first_name, username, photo_url, balance, tub_balance, total_earned, referrals, daily_ads, lifetime_ads`,
      [
        userData.telegram_id, userData.first_name, userData.last_name || '',
        userData.username || '', userData.photo_url || '',
        userData.balance || 0.5, userData.tub_balance || 1000,
        userData.total_earned || 0, userData.referrals || 0,
        userData.referral_earnings || 0, userData.daily_ads || 0,
        userData.lifetime_ads || 0
      ]
    );

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create user' })
    };
  }
};
