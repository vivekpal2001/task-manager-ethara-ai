const express = require('express');
const { getUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/', getUsers);

module.exports = router;
