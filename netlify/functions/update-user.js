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
    const { telegramId, updates } = JSON.parse(event.body);
    
    if (!telegramId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Telegram ID required' })
      };
    }

    // الحقول المسموح بتحديثها فقط
    const allowedFields = ['tub_balance', 'balance', 'total_earned', 'daily_ads', 'lifetime_ads', 'referrals'];
    const safeUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    });

    const setClause = Object.keys(safeUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [telegramId, ...Object.values(safeUpdates)];
    
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() 
       WHERE telegram_id = $1 
       RETURNING telegram_id, first_name, username, photo_url, balance, tub_balance, total_earned, referrals, daily_ads, lifetime_ads`,
      values
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
    console.error('Update user error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update user' })
    };
  }
};
