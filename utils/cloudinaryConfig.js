// src/utils/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Ensure environment variables are loaded

cloudinary.config({
  cloud_name: "dulcnzla9",
  api_key: "853877452146736",
  api_secret: "NHETlDFxUcImkOPN0mO1Mj6l7NA",
});

module.exports = cloudinary;
