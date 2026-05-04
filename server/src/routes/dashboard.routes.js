const express = require('express');
const { getDashboard } = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/dashboard — overview for current user
router.get('/', getDashboard);

module.exports = router;
