const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Allowed file types for document uploads
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif'
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Generate unique filename
const generateFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomBytes}${ext}`;
};

// Configure storage based on environment
const getStorage = () => {
  const storageMode = process.env.FILE_STORAGE_MODE || 'local';

  if (storageMode === 's3') {
    // For S3 storage, use memory storage and upload to S3 in controller
    return multer.memoryStorage();
  }

  // Local/cPanel storage
  const uploadDir = process.env.CPANEL_UPLOAD_DIR || path.join(__dirname, '../uploads');

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  });
};

// File filter function
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'), false);
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file extension.'), false);
  }

  cb(null, true);
};

// Create multer instance for document uploads
const documentUpload = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum number of files per request
  }
});

// Create multer instance for profile image uploads
const profileImageUpload = multer({
  storage: getStorage(),
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profile images
    files: 1
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        }
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded at once'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }

  next();
};

// Middleware to validate uploaded files
const validateFiles = (req, res, next) => {
  if (!req.files && !req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILES',
        message: 'No files were uploaded'
      }
    });
  }
  next();
};

module.exports = {
  documentUpload,
  profileImageUpload,
  handleUploadError,
  validateFiles,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
