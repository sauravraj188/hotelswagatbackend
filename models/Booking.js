// // models/Booking.js
// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//   user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
//   room:          { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
//   customerName:  { type: String, required: true },
//   customerEmail: { type: String, required: true },
//   customerPhone: { type: String, required: true },
//   checkIn:       { type: Date, required: true },
//   checkOut:      { type: Date, required: true },
//   guests:        { type: Number, required: true },
//   totalPrice:    { type: Number, required: true },
//   paymentStatus: { type: String, enum: ['pending','paid'], default: 'pending' },
// }, { timestamps: true });

// module.exports = mongoose.model('Booking', bookingSchema);
// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  room:               { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  customerName:       { type: String, required: true },
  customerEmail:      { type: String, required: true },
  customerPhone:      { type: String, required: true },
  checkIn:            { type: Date, required: true },
  checkOut:           { type: Date, required: true },
  guests:             { type: Number, required: true },
  totalPrice:         { type: Number, required: true },
  paymentScreenshot:  { type: String }, // optional URL to screenshot/image
  paymentStatus:      { type: String, enum: ['pending', 'paid'], default: 'pending' },
  assignedRoom:       {type: String, required: false },
  status: { type: String, enum: ['pending', 'confirmed','cancelled','checked-in','checked-in'], default: 'pending'}
  
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
