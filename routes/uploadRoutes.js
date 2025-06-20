// src/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('../utils/cloudinaryConfig');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle image upload (no authentication required)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Upload the image file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products', // optional folder name
    });

    // Remove the local file after upload
    fs.unlinkSync(req.file.path);

    // Return the secure URL of the uploaded image
    res.status(200).json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

module.exports = router;
