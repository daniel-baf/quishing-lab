const express = require('express');
const lootController = require('../controllers/lootController');

const router = express.Router();

router.get('/loot', lootController.lootRateLimiter, lootController.collectLoot);

module.exports = router;
