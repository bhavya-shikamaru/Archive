const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(verifyToken, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/companies', adminController.getCompanies);
router.put('/companies/:id/approve', adminController.approveCompany);
router.get('/students', adminController.getAllStudents);
router.get('/drives', adminController.getAllDrives);
router.get('/export-placed', adminController.exportPlacedToExcel);

module.exports = router;
