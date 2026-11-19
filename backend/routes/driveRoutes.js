const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.get('/', driveController.getAllDrives);

router.get('/eligible', verifyToken, requireRole('student'), driveController.getEligibleDrives);

router.get('/:id', driveController.getDriveById);

router.post('/', verifyToken, requireRole('company'), driveController.createDrive);
router.put('/:id', verifyToken, requireRole('company'), driveController.updateDrive);
router.delete('/:id', verifyToken, requireRole('company'), driveController.deleteDrive);

router.post('/:id/apply', verifyToken, requireRole('student'), driveController.applyDrive);

module.exports = router;
