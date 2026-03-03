// calls.routes.js
const express = require('express');
const r1 = express.Router();
const c1 = require('../controllers/calls.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

r1.use(authenticate);
r1.get('/', c1.list);
r1.get('/:id', c1.getOne);
r1.post('/', c1.create);
r1.put('/:id', c1.update);
r1.delete('/:id', authorize('admin', 'supervisor'), c1.remove);

module.exports = r1;
