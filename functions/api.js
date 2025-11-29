const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, data } = JSON.parse(event.body);
    
    switch (action) {
      case 'get_user':
        const userResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [data.userId]
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ user: userResult.rows[0] })
        };

      case 'create_user':
        const createResult = await pool.query(
          `INSERT INTO users (id, first_name, last_name, username, photo_url, balance, tub, referrals, total_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            data.id, data.firstName, data.lastName, data.username,
            data.photoUrl, data.balance || 0, data.tub || 0,
            data.referrals || 0, data.totalEarned || 0
          ]
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ user: createResult.rows[0] })
        };

      default:
        return { statusCode: 400, body: 'Invalid action' };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
