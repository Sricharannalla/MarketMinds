const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const historyController = require('../controllers/historyController');

router.use(auth);

// Get paginated decision history
router.get('/decisions', historyController.getDecisionHistory);

// Get analytics data for charts
router.get('/analytics', historyController.getChangeAnalytics);

// Get detailed analysis of a specific change
router.get('/change/:changeId', historyController.getChangeDetails);

module.exports = router;
