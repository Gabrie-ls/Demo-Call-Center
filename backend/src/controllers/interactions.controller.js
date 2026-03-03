const pool = require('../config/database');

const listByClient = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.name AS user_name
       FROM interactions i JOIN users u ON i.user_id = u.id
       WHERE i.client_id = $1 ORDER BY i.created_at DESC`,
      [req.params.client_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { client_id, type, description, call_id } = req.body;
    if (!client_id || !type || !description)
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    const { rows } = await pool.query(
      `INSERT INTO interactions (client_id, user_id, call_id, type, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [client_id, req.user.id, call_id || null, type, description]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { listByClient, create };
