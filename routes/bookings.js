const express = require('express');
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Room    = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      customerName,
      customerEmail,
      customerPhone,
      paymentScreenshot, // optional
    } = req.body;

    // 1) Validate presence of customer fields
    if (!customerName || !customerEmail || !customerPhone) {
      return res
        .status(400)
        .json({ message: 'Name, email, and phone are required' });
    }

    // 2) Validate dates & guests
    const inDate  = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (
      isNaN(inDate) ||
      isNaN(outDate) ||
      outDate <= inDate ||
      !Number.isInteger(guests) ||
      guests < 1
    ) {
      return res.status(400).json({ message: 'Invalid dates or guest count' });
    }

    // 3) Lookup room
    const room = await Room.findById(roomId).lean();
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 4) Compute price
    const nights     = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price;

    // 5) Determine userId if token present
    let userId = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        // reuse protect middleware to populate req.user
        await protect(req, res, () => {});
        userId = req.user?._id;
      } catch {
        userId = null;
      }
    }

    // 6) Build booking data
    const bookingData = {
      user:          userId,
      room:          roomId,
      customerName,
      customerEmail,
      customerPhone,
      checkIn:       inDate,
      checkOut:      outDate,
      guests,
      totalPrice,
    };
    if (paymentScreenshot) {
      bookingData.paymentScreenshot = paymentScreenshot;
      bookingData.paymentStatus = 'paid';
    }
    // else paymentStatus remains default 'pending'

    // 7) Create booking
    const booking = await Booking.create(bookingData);

    res.status(201).json(booking);
  })
);

// ... other routes unchanged ...

router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room')
      .lean();
    res.json(bookings);
  })
);

router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find()
      .populate('user', '-password')
      .populate('room');
    res.json(bookings);
  })
);

module.exports = router;
