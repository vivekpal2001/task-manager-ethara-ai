const express = require('express');
const { signup, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { signupSchema, loginSchema } = require('./auth.schema');

const router = express.Router();

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
