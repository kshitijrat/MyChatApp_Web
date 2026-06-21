import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer - memory mein rakho file temporarily
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'), false);
    }
  }
});

// Buffer ko base64 mein convert karo
const bufferToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

// Upload permanent photo
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { senderId } = req.body;

    // Base64 mein convert karo
    const base64Image = bufferToBase64(req.file.buffer, req.file.mimetype);

    // Cloudinary pe upload karo
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `chat-app/images/${senderId}`,
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      type: 'permanent'
    });

  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload view once photo
router.post('/view-once', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { senderId } = req.body;

    const base64Image = bufferToBase64(req.file.buffer, req.file.mimetype);

    // Alag folder mein rakho view once
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `chat-app/view-once/${senderId}`,
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      type: 'view_once'
    });

  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete image from cloudinary (view once ke baad)
router.delete('/image', async (req, res) => {
  try {
    const { publicId } = req.body;

    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;