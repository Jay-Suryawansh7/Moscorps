const fs = require("fs-extra");
const path = require("path");

async function generateStorage(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/middleware"));
  await fs.ensureDir(path.join(projectDir, "uploads"));
  await fs.ensureDir(path.join(projectDir, "src/routes"));

  // Generate upload middleware
  const uploadMiddleware = `const multer = require('multer');
const path = require('path');

const storage = process.env.STORAGE_TYPE === 's3' 
  ? require('multer-s3')({
      s3: new (require('aws-sdk')).S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      }),
      bucket: process.env.AWS_BUCKET,
      key: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    })
  : multer.diskStorage({
      destination: './uploads/',
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

module.exports = upload;`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/upload.js"),
    uploadMiddleware,
  );

  // Generate upload routes
  const uploadRoutes = `const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename || req.file.key,
      path: req.file.path || req.file.location,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

router.get('/files/:filename', (req, res) => {
  const path = require('path');
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/upload.routes.js"),
    uploadRoutes,
  );

  // Update routes index to include upload routes
  const routesPath = path.join(projectDir, "src/routes/index.js");
  let routesContent = await fs.readFile(routesPath, "utf-8");

  routesContent =
    "const uploadRoutes = require('./upload.routes');\n" + routesContent;
  routesContent = routesContent.replace(
    "module.exports",
    "router.use('/api', uploadRoutes);\n\nmodule.exports",
  );

  await fs.writeFile(routesPath, routesContent);
}

module.exports = { generateStorage };
