const pool = require('../config/database');

const list = async (req, res, next) => {
  try {
    const { agent_id, client_id, status, result, date_from, date_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ca.*, cl.name AS client_name, cl.phone AS client_phone,
             u.name AS agent_name
      FROM calls ca
      JOIN clients cl ON ca.client_id = cl.id
      JOIN users u ON ca.agent_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Restrict agents to their own calls
    if (req.user.role === 'agent') {
      params.push(req.user.id); query += ` AND ca.agent_id = $${params.length}`;
    } else if (req.user.role === 'supervisor') {
      query += ` AND ca.agent_id IN (SELECT id FROM users WHERE supervisor_id = '${req.user.id}')`;
    }

    if (agent_id)  { params.push(agent_id);           query += ` AND ca.agent_id = $${params.length}`; }
    if (client_id) { params.push(client_id);           query += ` AND ca.client_id = $${params.length}`; }
    if (status)    { params.push(status);              query += ` AND ca.status = $${params.length}`; }
    if (result)    { params.push(result);              query += ` AND ca.result = $${params.length}`; }
    if (date_from) { params.push(date_from);           query += ` AND ca.created_at >= $${params.length}`; }
    if (date_to)   { params.push(date_to + ' 23:59:59'); query += ` AND ca.created_at <= $${params.length}`; }

    const countQ = query.replace(/SELECT ca\.\*.*?FROM calls ca/, 'SELECT COUNT(*) FROM calls ca');
    const { rows: cnt } = await pool.query(countQ, params);
    const total = parseInt(cnt[0].count);

    params.push(parseInt(limit)); query += ` ORDER BY ca.created_at DESC LIMIT $${params.length}`;
    params.push(offset);          query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ca.*, cl.name AS client_name, u.name AS agent_name
       FROM calls ca JOIN clients cl ON ca.client_id = cl.id
       JOIN users u ON ca.agent_id = u.id WHERE ca.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Llamada no encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { client_id, agent_id, notes, scheduled_at } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'client_id requerido' });
    const assignedAgent = req.user.role === 'agent' ? req.user.id : (agent_id || req.user.id);
    const { rows } = await pool.query(
      `INSERT INTO calls (client_id, agent_id, notes, scheduled_at)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [client_id, assignedAgent, notes || null, scheduled_at || null]
    );
    // Auto-create interaction
    await pool.query(
      `INSERT INTO interactions (client_id, user_id, call_id, type, description)
       VALUES ($1,$2,$3,'call','Llamada creada')`,
      [client_id, assignedAgent, rows[0].id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { status, result, notes, duration_seconds } = req.body;
    let started_at = null, finished_at = null;
    if (status === 'in_progress') started_at = new Date();
    if (status === 'finished') finished_at = new Date();

    const { rows } = await pool.query(
      `UPDATE calls SET
         status = COALESCE($1, status),
         result = COALESCE($2, result),
         notes  = COALESCE($3, notes),
         duration_seconds = COALESCE($4, duration_seconds),
         started_at  = COALESCE($5, started_at),
         finished_at = COALESCE($6, finished_at)
       WHERE id = $7 RETURNING *`,
      [status, result, notes, duration_seconds, started_at, finished_at, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Llamada no encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM calls WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Llamada eliminada' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
