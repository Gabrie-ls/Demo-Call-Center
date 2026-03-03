const express = require('express');
const router = express.Router();
const { getMetrics } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/metrics', authenticate, getMetrics);
module.exports = router;
