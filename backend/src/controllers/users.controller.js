const bcrypt = require('bcrypt');
const pool = require('../config/database');

const list = async (req, res, next) => {
  try {
    const { role, status, supervisor_id } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.created_at,
             s.name AS supervisor_name, s.id AS supervisor_id
      FROM users u
      LEFT JOIN users s ON u.supervisor_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (role)          { params.push(role);          query += ` AND u.role = $${params.length}`; }
    if (status)        { params.push(status);        query += ` AND u.status = $${params.length}`; }
    if (supervisor_id) { params.push(supervisor_id); query += ` AND u.supervisor_id = $${params.length}`; }
    query += ' ORDER BY u.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.created_at,
              s.name AS supervisor_name, s.id AS supervisor_id
       FROM users u LEFT JOIN users s ON u.supervisor_id = s.id
       WHERE u.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, supervisor_id } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });

    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, supervisor_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, status, phone, created_at`,
      [name, email.toLowerCase(), hash, role, phone || null, supervisor_id || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email ya registrado' });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, email, role, phone, supervisor_id, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         role = COALESCE($3, role),
         phone = COALESCE($4, phone),
         supervisor_id = $5,
         status = COALESCE($6, status)
       WHERE id = $7
       RETURNING id, name, email, role, status, phone`,
      [name, email, role, phone, supervisor_id || null, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END
       WHERE id = $1 RETURNING id, name, status`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (err) { next(err); }
};

const getAgents = async (req, res, next) => {
  try {
    const supervisorFilter = req.user.role === 'supervisor'
      ? `AND supervisor_id = '${req.user.id}'` : '';
    const { rows } = await pool.query(
      `SELECT id, name, email, status, phone FROM users WHERE role='agent' ${supervisorFilter} ORDER BY name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, toggleStatus, remove, getAgents };
