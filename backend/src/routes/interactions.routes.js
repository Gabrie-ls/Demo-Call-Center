const express = require('express');
const router = express.Router();
const { listByClient, create } = require('../controllers/interactions.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/client/:client_id', listByClient);
router.post('/', create);

module.exports = router;
