const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(verifyToken, requireRole('company'));

router.get('/me', companyController.getProfile);
router.put('/me', companyController.updateProfile);
router.get('/drives', companyController.getMyDrives);
router.get('/drives/:id/applicants', companyController.getDriveApplicants);
router.put('/applications/:id/status', companyController.updateApplicationStatus);
router.post('/drives/:id/rounds', companyController.addRound);
router.post('/applications/:id/round-result', companyController.recordRoundResult);

module.exports = router;
