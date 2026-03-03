const express = require('express');
const router = express.Router();
const c = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin', 'supervisor'));
router.get('/calls/excel',         c.exportCallsExcel);
router.get('/calls/pdf',           c.exportCallsPDF);
router.get('/productivity/excel',  c.exportProductivityExcel);
router.get('/productivity/pdf',    c.exportProductivityPDF);

module.exports = router;
