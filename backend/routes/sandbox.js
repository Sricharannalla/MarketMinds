const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sandboxController = require('../controllers/sandboxController');

router.use(auth);

router.post('/stage', sandboxController.stageChange);
router.post('/preview', sandboxController.previewStaged);
router.post('/commit', sandboxController.commitStaged);
router.post('/discard', sandboxController.rollbackStaged);

module.exports = router;