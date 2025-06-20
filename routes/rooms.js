// const express = require('express');
// const Room = require('../models/Room');
// const { protect, adminOnly } = require('../middleware/auth');
// const router = express.Router();

// // @route   GET /api/rooms
// // @desc    Get all rooms
// // @access  Public
// router.get('/', async (req, res) => {
//   const rooms = await Room.find();
//   res.json(rooms);
// });

// // @route   GET /api/rooms/:id
// // @desc    Get room by ID
// // @access  Public
// router.get('/:id', async (req, res) => {
//   const room = await Room.findById(req.params.id);
//   if (!room) return res.status(404).json({ message: 'Room not found' });
//   res.json(room);
// });

// // @route   POST /api/rooms
// // @desc    Create new room
// // @access  Admin
// router.post('/', protect, adminOnly, async (req, res) => {
//   const room = await Room.create(req.body);
//   res.status(201).json(room);
// });

// module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Room = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rooms = await Room.find().lean();
    res.json(rooms);
  })
);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get one room by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const room = await Room.findById(id).lean();
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  })
);

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Admin
 */
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    // Minimal validation
    const { name, type, price } = req.body;
    if (!name || !type || price == null) {
      return res.status(400).json({ message: 'Name, type, and price are required' });
    }
    const room = await Room.create(req.body);
    res.status(201).json(room);
  })
);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update an existing room
 * @access  Admin
 */
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const updated = await Room.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(updated);
  })
);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete a room
 * @access  Admin
 */
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const deleted = await Room.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted' });
  })
);

module.exports = router;
