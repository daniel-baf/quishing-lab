const express = require('express');
const { LIVE_RATE_LIMITER } = require('../../shared/infrastructure/rateLimiter');
const liveController = require('../controllers/liveController');

const router = express.Router();

router.get('/live', liveController.subscribeToLiveStream);
router.post('/mirror', LIVE_RATE_LIMITER, liveController.reportMirrorState);
router.post('/screen', LIVE_RATE_LIMITER, liveController.reportScreenFrame);

module.exports = router;
