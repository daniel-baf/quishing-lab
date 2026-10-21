const express = require('express');
const { requireAdminToken } = require('../middleware/requireAdminToken');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(requireAdminToken);
router.get('/stats', adminController.getDashboardStats);
router.post('/reveal', adminController.revealToParticipants);
router.post('/reset', adminController.resetDemo);

module.exports = router;
