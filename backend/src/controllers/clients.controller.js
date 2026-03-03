const pool = require('../config/database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const list = async (req, res, next) => {
  try {
    const { status, search, agent_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, u.name AS agent_name
      FROM clients c LEFT JOIN users u ON c.assigned_agent_id = u.id WHERE 1=1
    `;
    const params = [];
    if (status)   { params.push(status);           query += ` AND c.status = $${params.length}`; }
    if (agent_id) { params.push(agent_id);         query += ` AND c.assigned_agent_id = $${params.length}`; }
    if (search)   { params.push(`%${search}%`);   query += ` AND (c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length} OR c.company ILIKE $${params.length})`; }

    const countQuery = query.replace('SELECT c.*, u.name AS agent_name', 'SELECT COUNT(*)');
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    params.push(parseInt(limit)); query += ` ORDER BY c.created_at DESC LIMIT $${params.length}`;
    params.push(offset);          query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.name AS agent_name FROM clients c
       LEFT JOIN users u ON c.assigned_agent_id = u.id WHERE c.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, email, phone, company, status, assigned_agent_id, notes } = req.body;
    if (!name || !phone)
      return res.status(400).json({ success: false, message: 'Nombre y teléfono son obligatorios' });
    const { rows } = await pool.query(
      `INSERT INTO clients (name, email, phone, company, status, assigned_agent_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, email || null, phone, company || null, status || 'new', assigned_agent_id || null, notes || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name, email, phone, company, status, assigned_agent_id, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE clients SET
         name = COALESCE($1, name), email = $2, phone = COALESCE($3, phone),
         company = $4, status = COALESCE($5, status),
         assigned_agent_id = $6, notes = $7
       WHERE id = $8 RETURNING *`,
      [name, email, phone, company, status, assigned_agent_id || null, notes, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (err) { next(err); }
};

const bulkImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Archivo Excel requerido' });

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const errors = [];
    const inserted = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header is row 1)
      const name  = String(row['nombre'] || row['Nombre'] || '').trim();
      const phone = String(row['telefono'] || row['Teléfono'] || row['telefono'] || '').trim();
      const email = String(row['email'] || row['Email'] || '').trim();
      const company = String(row['empresa'] || row['Empresa'] || '').trim();
      const status  = String(row['estado'] || row['Estado'] || 'new').trim().toLowerCase();

      if (!name || !phone) {
        errors.push({ row: rowNum, message: 'Nombre y teléfono son obligatorios', data: row });
        continue;
      }
      const validStatuses = ['new','contacted','interested','closed','lost'];
      const finalStatus = validStatuses.includes(status) ? status : 'new';

      try {
        const { rows: newRows } = await pool.query(
          `INSERT INTO clients (name, email, phone, company, status)
           VALUES ($1,$2,$3,$4,$5) RETURNING id, name`,
          [name, email || null, phone, company || null, finalStatus]
        );
        inserted.push(newRows[0]);
      } catch (dbErr) {
        errors.push({ row: rowNum, message: 'Error de base de datos: ' + dbErr.message, data: row });
      }
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Importación completada: ${inserted.length} insertados, ${errors.length} errores`,
      inserted: inserted.length,
      errors,
    });
  } catch (err) { next(err); }
};

const downloadTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();
  const data = [
    ['nombre', 'telefono', 'email', 'empresa', 'estado'],
    ['Empresa Ejemplo S.A.C.', '+51 1 234 5678', 'contacto@ejemplo.com', 'Ejemplo Corp', 'new'],
    ['Cliente Demo 2', '+51 999 888 777', 'demo2@email.com', 'Demo S.A.', 'interested'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla_clientes.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

module.exports = { list, getOne, create, update, remove, bulkImport, downloadTemplate };
