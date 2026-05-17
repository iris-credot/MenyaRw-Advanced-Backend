const multer = require('multer');
const path = require('path');
const { BadRequest } = require('../Error/index');

// Use memory or disk storage depending on env
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);
  if (extValid && mimeValid) return cb(null, true);
  cb(new BadRequest('Only image files (jpeg, jpg, png, webp) are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;