const express = require('express');
const { EVENT_RATE_LIMITER } = require('../../shared/infrastructure/rateLimiter');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

router.post('/session', sessionController.startSession);
router.post('/events', EVENT_RATE_LIMITER, sessionController.recordClientEvent);
router.get('/session/mine', sessionController.getOwnSession);
router.get('/session/command', sessionController.pollPendingCommand);

module.exports = router;
