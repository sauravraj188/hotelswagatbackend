// const mongoose = require('mongoose');

// const roomSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   type: { type: String, required: true },
//   price: { type: Number, required: true },
//   image: String,
//   rating: Number,
//   reviews: Number,
//   capacity: Number,
//   amenities: [String],
//   description: String,
// }, { timestamps: true });

// module.exports = mongoose.model('Room', roomSchema);


const mongoose = require('mongoose');

const defaultPolicies = {
  checkIn: '2:00 PM',
  checkOut: '12:00 PM',
  cancellation: 'Free cancellation up to 24 hours before check-in',
  smoking: 'Non-smoking room',
  pets: 'Pets not allowed',
};

const policySchema = new mongoose.Schema({
  checkIn:    { type: String, default: defaultPolicies.checkIn },
  checkOut:   { type: String, default: defaultPolicies.checkOut },
  cancellation:{ type: String, default: defaultPolicies.cancellation },
  smoking:    { type: String, default: defaultPolicies.smoking },
  pets:       { type: String, default: defaultPolicies.pets },
}, { _id: false });

// In the Room schema:
const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  type:        { type: String, required: true },
  price:       { type: Number, required: true },
  image:       { type: String },
  images:      [{ type: String }],
  rating:      { type: Number, default: 0 },
  reviews:     { type: Number, default: 0 },
  capacity:    { type: Number },
  size:        { type: String },
  beds:        { type: String },
  amenities:   [{ type: String }],
  features:    [{ type: String }],
  description: { type: String },
  policies:    { type: policySchema, default: defaultPolicies },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
