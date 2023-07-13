const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/', homeController.home);
router.get('/test', homeController.test);

module.exports = router;