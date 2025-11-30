const { Pool } = require('pg');

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rate limiting storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per window

// Helper function for rate limiting
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const userData = rateLimitStore.get(ip) || { count: 0, timestamp: now };
  
  if (userData.timestamp < windowStart) {
    userData.count = 0;
    userData.timestamp = now;
  }
  
  userData.count++;
  rateLimitStore.set(ip, userData);
  
  return userData.count <= MAX_REQUESTS;
}

// Helper function to handle errors
function handleError(error, message = 'Internal server error') {
  console.error('Database error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: message })
  };
}

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Rate limiting
  const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many requests' })
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;

    console.log(`Processing: ${method} ${path}`);

    // User endpoints
    if (path === '/users' && method === 'GET') {
      const telegramId = event.queryStringParameters?.telegramId;
      if (!telegramId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Telegram ID is required' })
        };
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [telegramId]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (path === '/users' && method === 'POST') {
      const userData = JSON.parse(event.body);
      
      const result = await pool.query(
        `INSERT INTO users (id, first_name, last_name, username, photo_url, balance, tub, referrals, referral_earnings, total_earned, daily_ad_count, lifetime_ad_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          userData.id,
          userData.firstName || '',
          userData.lastName || '',
          userData.username || '',
          userData.photoUrl || '',
          userData.balance || 0,
          userData.tub || 1000,
          userData.referrals || 0,
          userData.referralEarnings || 0,
          userData.totalEarned || 0,
          userData.dailyAdCount || 0,
          userData.lifetimeAdCount || 0,
          new Date(),
          new Date()
        ]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (path === '/users/update' && method === 'POST') {
      const { telegramId, updates } = JSON.parse(event.body);
      
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = Object.values(updates);
      values.unshift(telegramId);

      const query = `UPDATE users SET ${setClause}, updated_at = $${values.length + 1} WHERE id = $1 RETURNING *`;
      
      const result = await pool.query(query, [...values, new Date()]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // Task endpoints
    if (path === '/tasks' && method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC',
        ['active']
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    if (path === '/tasks/user' && method === 'GET') {
      const userId = event.queryStringParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User ID is required' })
        };
      }

      const result = await pool.query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    if (path === '/tasks' && method === 'POST') {
      const taskData = JSON.parse(event.body);
      
      const result = await pool.query(
        `INSERT INTO tasks (user_id, name, link, type, check_subscription, target_completions, cost, reward, completions, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          taskData.userId,
          taskData.name,
          taskData.link,
          taskData.type,
          taskData.checkSubscription || false,
          taskData.targetCompletions,
          taskData.cost,
          taskData.reward || 10,
          taskData.completions || 0,
          'active',
          new Date()
        ]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (path === '/tasks/complete' && method === 'POST') {
      const { taskId } = JSON.parse(event.body);
      
      const result = await pool.query(
        'UPDATE tasks SET completions = completions + 1 WHERE id = $1 RETURNING *',
        [taskId]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (path === '/tasks' && method === 'DELETE') {
      const taskId = event.queryStringParameters?.taskId;
      if (!taskId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Task ID is required' })
        };
      }

      await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Task deleted successfully' })
      };
    }

    // Statistics endpoint
    if (path === '/statistics' && method === 'GET') {
      const usersCount = await pool.query('SELECT COUNT(*) FROM users');
      const tasksCompleted = await pool.query('SELECT SUM(completions) FROM tasks');
      const tasksCreated = await pool.query('SELECT COUNT(*) FROM tasks');
      const totalEarned = await pool.query('SELECT SUM(total_earned) FROM users');

      const statistics = {
        totalUsers: parseInt(usersCount.rows[0].count),
        tasksCompleted: parseInt(tasksCompleted.rows[0].sum || 0),
        tasksCreated: parseInt(tasksCreated.rows[0].count),
        totalEarned: parseFloat(totalEarned.rows[0].sum || 0)
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(statistics)
      };
    }

    // Transactions endpoints
    if (path === '/transactions' && method === 'POST') {
      const transactionData = JSON.parse(event.body);
      
      const result = await pool.query(
        `INSERT INTO transactions (user_id, type, amount, description, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          transactionData.userId,
          transactionData.type,
          transactionData.amount,
          transactionData.description,
          transactionData.status || 'completed',
          new Date()
        ]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (path === '/transactions/user' && method === 'GET') {
      const userId = event.queryStringParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User ID is required' })
        };
      }

      const result = await pool.query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    return handleError(error);
  }
};
