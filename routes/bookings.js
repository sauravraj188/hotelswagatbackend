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
/**
 * @desc   Confirm a booking (admin only)
 * @route  PUT /api/bookings/:id/confirm
 * @access Admin
 */
router.put(
  '/:id/confirm',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Only pending bookings can be confirmed
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Cannot confirm booking with status '${booking.status}'` });
    }
    booking.status = 'confirmed';
    await booking.save();
    res.json({ message: 'Booking confirmed', booking });
  })
);

/**
 * @desc   Cancel a booking (user or admin)
 * @route  PUT /api/bookings/:id/cancel
 * @access Protected (user can cancel own upcoming; admin can cancel any)
 */
router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Check permission: if not admin, only allow if booking.user equals req.user._id
    if (!req.user.isAdmin && booking.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    // Only allow cancelling if not already cancelled or completed/checked-in past?
    // For simplicity: disallow if already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    // If check-in date is in the past, disallow user cancellation (but admin can override)
    const now = new Date();
    if (!req.user.isAdmin) {
      const checkInDate = new Date(booking.checkIn);
      if (checkInDate < now) {
        return res.status(400).json({ message: 'Cannot cancel a past booking' });
      }
    }
    booking.status = 'cancelled';
    await booking.save();

    // Optionally: if this booking had an assignedRoom, free it:
    if (booking.assignedRoom) {
      // find the Room document by name and set its status back to 'available'
      const prevRoom = await Room.findOne({ name: booking.assignedRoom });
      if (prevRoom) {
        prevRoom.status = 'available';
        prevRoom.guest = null;
        prevRoom.checkOut = null;
        await prevRoom.save();
      }
    }

    res.json({ message: 'Booking cancelled', booking });
  })
);

/**
 * @desc   Assign a room to a booking and mark checked-in (admin only)
 * @route  PUT /api/bookings/:id/assign-room
 * @access Admin
 * @body   { assignedRoom: string }  // room.name
 */
router.put(
  '/:id/assign-room',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const { assignedRoom } = req.body;
    if (!assignedRoom) {
      return res.status(400).json({ message: 'assignedRoom is required' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Only allow if status is confirmed (or pending? here require confirmed)
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: `Booking must be 'confirmed' to assign a room (current status: ${booking.status})` });
    }
    // Check if room exists
    const roomDoc = await Room.findOne({ name: assignedRoom });
    if (!roomDoc) {
      return res.status(404).json({ message: `Room with name '${assignedRoom}' not found` });
    }
    // Check room availability: room.status should be 'available'
    if (roomDoc.status !== 'available') {
      return res.status(400).json({ message: `Room '${assignedRoom}' is not available (current status: ${roomDoc.status})` });
    }
    // Check no other booking already assigned this room overlapping dates:
    // For simplicity, check active assignments:
    const conflicting = await Booking.findOne({
      _id: { $ne: bookingId },
      assignedRoom: assignedRoom,
      status: { $in: ['confirmed', 'checked-in'] },
    });
    if (conflicting) {
      return res.status(400).json({ message: `Room '${assignedRoom}' is already assigned to another booking` });
    }
    // Assign
    booking.assignedRoom = assignedRoom;
    booking.status = 'checked-in';
    await booking.save();

    // Update Room document: mark occupied, set guest and checkOut date
    roomDoc.status = 'occupied';
    roomDoc.guest = booking.customerName;
    roomDoc.checkOut = new Date(booking.checkOut).toISOString().split('T')[0]; // store as string YYYY-MM-DD
    await roomDoc.save();

    res.json({ message: 'Room assigned and booking checked-in', booking, room: roomDoc });
  })
);

module.exports = router;
