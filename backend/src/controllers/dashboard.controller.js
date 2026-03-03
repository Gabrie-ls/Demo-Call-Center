const pool = require('../config/database');

const getMetrics = async (req, res, next) => {
  try {
    const agentFilter = req.user.role === 'agent'
      ? `AND agent_id = '${req.user.id}'`
      : req.user.role === 'supervisor'
        ? `AND agent_id IN (SELECT id FROM users WHERE supervisor_id = '${req.user.id}')`
        : '';

    // Today's calls
    const { rows: todayCalls } = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status='finished') AS finished,
             COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
             COUNT(*) FILTER (WHERE status='pending') AS pending,
             COUNT(*) FILTER (WHERE result='sale') AS sales,
             ROUND(AVG(duration_seconds)) AS avg_duration
      FROM calls
      WHERE DATE(created_at) = CURRENT_DATE ${agentFilter}
    `);

    // Conversion rate
    const todayData = todayCalls[0];
    const convRate = todayData.finished > 0
      ? Math.round((todayData.sales / todayData.finished) * 100)
      : 0;

    // Active clients
    const { rows: clientStats } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='new') AS new_clients,
        COUNT(*) FILTER (WHERE status='interested') AS interested,
        COUNT(*) FILTER (WHERE status='closed') AS closed,
        COUNT(*) AS total
      FROM clients
    `);

    // Calls by agent (top 10)
    const { rows: byAgent } = await pool.query(`
      SELECT u.name AS agent_name, u.id AS agent_id,
             COUNT(*) AS total_calls,
             COUNT(*) FILTER (WHERE ca.result='sale') AS sales,
             COUNT(*) FILTER (WHERE ca.status='finished') AS finished
      FROM calls ca
      JOIN users u ON ca.agent_id = u.id
      WHERE DATE(ca.created_at) = CURRENT_DATE ${agentFilter.replace('agent_id', 'ca.agent_id')}
      GROUP BY u.id, u.name
      ORDER BY total_calls DESC
      LIMIT 10
    `);

    // Last 7 days trend
    const { rows: trend } = await pool.query(`
      SELECT DATE(created_at) AS day,
             COUNT(*) AS calls,
             COUNT(*) FILTER (WHERE result='sale') AS sales
      FROM calls
      WHERE created_at >= NOW() - INTERVAL '7 days' ${agentFilter}
      GROUP BY DATE(created_at)
      ORDER BY day
    `);

    // Results distribution
    const { rows: results } = await pool.query(`
      SELECT result, COUNT(*) AS count
      FROM calls
      WHERE DATE(created_at) = CURRENT_DATE AND result IS NOT NULL ${agentFilter}
      GROUP BY result
    `);

    res.json({
      success: true,
      data: {
        today: {
          ...todayData,
          conversion_rate: convRate,
        },
        clients: clientStats[0],
        byAgent,
        trend,
        results,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getMetrics };
