const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter,
});

// Upload single image
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'FILE_001',
          message: 'No file uploaded',
        },
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'lost-found-app',
          transformation: [
            { width: 1080, height: 1080, crop: 'limit' },
            { quality: 'auto' },
          ],
          format: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);

    if (error.message.includes('File size')) {
      return res.status(400).json({
        error: {
          code: 'FILE_001',
          message: 'File too large. Maximum size is 5MB.',
        },
      });
    }

    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: {
          code: 'FILE_002',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload image',
      },
    });
  }
});

// Upload multiple images
router.post('/images', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: {
          code: 'FILE_001',
          message: 'No files uploaded',
        },
      });
    }

    const uploadPromises = req.files.map(file =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'lost-found-app',
            transformation: [
              { width: 1080, height: 1080, crop: 'limit' },
              { quality: 'auto' },
            ],
            format: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      })
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(result => ({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
      format: result.format,
    }));

    res.json({
      success: true,
      data: {
        images: uploadedImages,
        count: uploadedImages.length,
      },
    });
  } catch (error) {
    console.error('Multiple images upload error:', error);

    if (error.message.includes('File too large')) {
      return res.status(400).json({
        error: {
          code: 'FILE_001',
          message: 'One or more files are too large. Maximum size is 5MB per file.',
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload images',
      },
    });
  }
});

// Delete image from Cloudinary
router.delete('/image/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete image',
      },
    });
  }
});

module.exports = router;