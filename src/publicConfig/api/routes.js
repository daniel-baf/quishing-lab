const express = require('express');
const publicConfigController = require('../controllers/publicConfigController');

const router = express.Router();

router.get('/config', publicConfigController.getPublicConfig);

module.exports = router;
