const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

// Route for consumer behavior prediction
router.post('/', predictController.predict);

module.exports = router;
