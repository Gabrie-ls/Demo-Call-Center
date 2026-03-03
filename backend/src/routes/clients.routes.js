const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const c = require('../controllers/clients.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `import_${Date.now()}_${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls)$/))
      return cb(new Error('Solo archivos Excel (.xlsx, .xls)'));
    cb(null, true);
  },
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
});

router.use(authenticate);
router.get('/template', c.downloadTemplate);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', authorize('admin', 'supervisor'), c.remove);
router.post('/import/excel', authorize('admin', 'supervisor'), upload.single('file'), c.bulkImport);

module.exports = router;
