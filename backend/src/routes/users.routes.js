const express = require('express');
const router = express.Router();
const c = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/agents', c.getAgents);
router.get('/',          authorize('admin', 'supervisor'), c.list);
router.get('/:id',       authorize('admin', 'supervisor'), c.getOne);
router.post('/',         authorize('admin'), c.create);
router.put('/:id',       authorize('admin'), c.update);
router.patch('/:id/toggle-status', authorize('admin'), c.toggleStatus);
router.delete('/:id',    authorize('admin'), c.remove);

module.exports = router;
