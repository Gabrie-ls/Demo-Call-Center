const pool = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// ── Helpers ───────────────────────────────────────────────────
const getCallsData = async (date_from, date_to, agent_id) => {
  let q = `
    SELECT ca.id, ca.status, ca.result, ca.duration_seconds, ca.notes, ca.created_at,
           cl.name AS client_name, cl.phone, u.name AS agent_name
    FROM calls ca
    JOIN clients cl ON ca.client_id = cl.id
    JOIN users u ON ca.agent_id = u.id
    WHERE 1=1
  `;
  const p = [];
  if (date_from) { p.push(date_from);              q += ` AND DATE(ca.created_at) >= $${p.length}`; }
  if (date_to)   { p.push(date_to);                q += ` AND DATE(ca.created_at) <= $${p.length}`; }
  if (agent_id)  { p.push(agent_id);               q += ` AND ca.agent_id = $${p.length}`; }
  q += ' ORDER BY ca.created_at DESC';
  const { rows } = await pool.query(q, p);
  return rows;
};

const getAgentProductivity = async (date_from, date_to) => {
  const { rows } = await pool.query(`
    SELECT u.name AS agent, u.email,
           COUNT(ca.id) AS total_calls,
           COUNT(*) FILTER (WHERE ca.status='finished') AS finished,
           COUNT(*) FILTER (WHERE ca.result='sale') AS sales,
           COUNT(*) FILTER (WHERE ca.result='no_answer') AS no_answer,
           ROUND(AVG(ca.duration_seconds)) AS avg_duration,
           CASE WHEN COUNT(*) FILTER (WHERE ca.status='finished') > 0
                THEN ROUND(COUNT(*) FILTER (WHERE ca.result='sale')::numeric
                     / COUNT(*) FILTER (WHERE ca.status='finished') * 100, 1)
                ELSE 0 END AS conversion_rate
    FROM users u
    LEFT JOIN calls ca ON u.id = ca.agent_id
      AND ($1::date IS NULL OR DATE(ca.created_at) >= $1)
      AND ($2::date IS NULL OR DATE(ca.created_at) <= $2)
    WHERE u.role = 'agent'
    GROUP BY u.id, u.name, u.email
    ORDER BY total_calls DESC
  `, [date_from || null, date_to || null]);
  return rows;
};

// ── Excel Reports ─────────────────────────────────────────────
const exportCallsExcel = async (req, res, next) => {
  try {
    const { date_from, date_to, agent_id } = req.query;
    const data = await getCallsData(date_from, date_to, agent_id);

    const wb = XLSX.utils.book_new();
    const rows = [['ID Llamada', 'Cliente', 'Teléfono', 'Agente', 'Estado', 'Resultado', 'Duración (seg)', 'Notas', 'Fecha']];
    data.forEach(r => rows.push([
      r.id, r.client_name, r.phone, r.agent_name,
      r.status, r.result || '-', r.duration_seconds,
      r.notes || '', new Date(r.created_at).toLocaleString('es-PE')
    ]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Llamadas');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_llamadas.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { next(err); }
};

const exportProductivityExcel = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await getAgentProductivity(date_from, date_to);
    const wb = XLSX.utils.book_new();
    const rows = [['Agente', 'Email', 'Total Llamadas', 'Finalizadas', 'Ventas', 'Sin Respuesta', 'Duración Promedio (s)', 'Tasa Conversión (%)']];
    data.forEach(r => rows.push([r.agent, r.email, r.total_calls, r.finished, r.sales, r.no_answer, r.avg_duration, r.conversion_rate]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Productividad');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="productividad_agentes.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { next(err); }
};

// ── PDF Reports ───────────────────────────────────────────────
const drawPDFHeader = (doc, title, subtitle) => {
  doc.rect(0, 0, doc.page.width, 80).fill('#0f172a');
  doc.fillColor('#38bdf8').fontSize(22).font('Helvetica-Bold').text('CallCenter Pro', 40, 20);
  doc.fillColor('white').fontSize(14).font('Helvetica').text(title, 40, 48);
  doc.fillColor('#94a3b8').fontSize(10).text(subtitle, 40, 65);
  doc.fillColor('#1e293b').rect(0, 80, doc.page.width, 4).fill('#38bdf8');
  doc.moveDown(4);
};

const exportCallsPDF = async (req, res, next) => {
  try {
    const { date_from, date_to, agent_id } = req.query;
    const data = await getCallsData(date_from, date_to, agent_id);
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_llamadas.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    drawPDFHeader(doc, 'Reporte de Llamadas', `Generado: ${new Date().toLocaleString('es-PE')}  |  Total: ${data.length} llamadas`);
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
    const cols = [40, 160, 270, 370, 460, 540, 630];
    const headers = ['Cliente', 'Agente', 'Estado', 'Resultado', 'Duración', 'Fecha'];
    headers.forEach((h, i) => doc.text(h, cols[i], doc.y, { width: 100 }));
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(790, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(8).fillColor('#334155');
    data.slice(0, 80).forEach((r, idx) => {
      if (idx % 2 === 0) doc.rect(35, doc.y - 2, 755, 16).fill('#f8fafc').fillColor('#334155');
      const y = doc.y;
      doc.text(r.client_name?.substring(0, 18) || '', cols[0], y, { width: 115 });
      doc.text(r.agent_name?.substring(0, 16) || '', cols[1], y, { width: 100 });
      doc.text(r.status, cols[2], y, { width: 85 });
      doc.text(r.result || '-', cols[3], y, { width: 85 });
      doc.text(r.duration_seconds + 's', cols[4], y, { width: 75 });
      doc.text(new Date(r.created_at).toLocaleDateString('es-PE'), cols[5], y, { width: 100 });
      doc.moveDown(0.8);
    });
    doc.end();
  } catch (err) { next(err); }
};

const exportProductivityPDF = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await getAgentProductivity(date_from, date_to);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename="productividad_agentes.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    drawPDFHeader(doc, 'Reporte de Productividad por Agente', `Generado: ${new Date().toLocaleString('es-PE')}`);
    data.forEach((r, idx) => {
      if (doc.y > 700) { doc.addPage(); doc.moveDown(2); }
      doc.rect(40, doc.y, 515, 70).fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
      const y = doc.y + 8;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(r.agent, 55, y);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(r.email, 55, y + 16);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text(`Total: ${r.total_calls}`, 55, y + 32);
      doc.text(`Ventas: ${r.sales}`, 160, y + 32);
      doc.text(`Conversión: ${r.conversion_rate}%`, 260, y + 32);
      doc.text(`Dur. Prom: ${r.avg_duration}s`, 390, y + 32);
      doc.rect(40 + (r.conversion_rate / 100) * 515, doc.y + 70 - 5, 5, 5).fill('#38bdf8');
      doc.moveDown(3.5);
    });
    doc.end();
  } catch (err) { next(err); }
};

module.exports = {
  exportCallsExcel, exportProductivityExcel,
  exportCallsPDF, exportProductivityPDF,
};
