const fs = require("fs-extra");
const path = require("path");

async function generateStorage(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/middleware"));
  await fs.ensureDir(path.join(projectDir, "uploads"));
  await fs.ensureDir(path.join(projectDir, "src/routes"));

  // Generate upload middleware TypeScript
  const uploadMiddleware = `import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = process.env.STORAGE_TYPE === 's3' 
  ? require('multer-s3')({
      s3: new (require('aws-sdk')).S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      }),
      bucket: process.env.AWS_BUCKET,
      key: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    })
  : multer.diskStorage({
      destination: './uploads/',
      filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    });

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

export default upload;`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/upload.ts"),
    uploadMiddleware,
  );

  // Generate upload routes TypeScript
  const uploadRoutes = `import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: (req.file as any).filename || (req.file as any).key,
      path: (req.file as any).path || (req.file as any).location,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

router.get('/files/:filename', (req: Request, res: Response) => {
  const path = require('path');
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath);
});

export default router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/upload.routes.ts"),
    uploadRoutes,
  );

  // Update routes index to include upload routes
  const routesPath = path.join(projectDir, "src/routes/index.ts");
  let routesContent = await fs.readFile(routesPath, "utf-8");

  routesContent =
    "import uploadRoutes from './upload.routes';\n" + routesContent;
  routesContent = routesContent.replace(
    "export default router",
    "router.use('/api', uploadRoutes);\n\nexport default router",
  );

  await fs.writeFile(routesPath, routesContent);
}

module.exports = { generateStorage };
