const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const upload = require('../middleware/upload');

router.use(verifyToken, requireRole('student'));

router.get('/me', studentController.getProfile);
router.put('/me', studentController.updateProfile);
router.post('/resume', upload.single('resume'), studentController.uploadResume);
router.get('/applications', studentController.getMyApplications);

module.exports = router;
