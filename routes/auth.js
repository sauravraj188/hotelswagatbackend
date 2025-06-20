const express = require('express');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use' });
  const user = await User.create({ name, email, password });
  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    token: generateToken(user._id)
  });
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await user.matchPassword(password)) {
    return res.json({
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      token: generateToken(user._id)
    });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

module.exports = router;