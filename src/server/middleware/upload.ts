import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Determine environment and resources path
const isProduction = process.env.NODE_ENV === "production";
const RESOURCES_PATH = process.env.RESOURCES_PATH || process.cwd();

// Use correct path based on environment
const appName = "factory-inventory-desktop";
const uploadDir = true
    ? path.join(process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library/Preferences') : path.join(process.env.HOME || '', '.local/share')), appName, 'upload', 'images')
    : path.resolve(process.cwd(), 'upload', 'images');

console.log('[Upload Middleware] Environment:', isProduction ? 'production' : 'development');
console.log('[Upload Middleware] Upload directory:', uploadDir);

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    console.log('[Upload Middleware] Creating upload directory...');
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('[Upload Middleware] Upload directory created successfully');
    } catch (error) {
        console.error('[Upload Middleware] Failed to create upload directory:', error);
    }
} else {
    console.log('[Upload Middleware] Upload directory exists');
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('[Multer] Receiving file for destination:', file.originalname);

        // Double-check directory exists before saving
        if (!fs.existsSync(uploadDir)) {
            console.log('[Multer] Directory missing, recreating...');
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const finalName = `${file.fieldname}-${uniqueSuffix}${ext}`;
        console.log('[Multer] Generated filename:', finalName);
        cb(null, finalName);
    }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('[Multer] Filtering file:', file.mimetype, file.originalname);
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        console.error('[Multer] File filter rejected file:', file.originalname);
        cb(new Error('Error: Images only! (jpeg, jpg, png, gif, webp)'));
    }
};

// Initialize multer
export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

// Middleware for single image upload
export const uploadSingleImage = (req: any, res: any, next: any) => {
    const uploader = upload.single('image');
    uploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[Upload Middleware] Multer Error:', err);
            return res.status(400).json({ error: `Multer Error: ${err.message}` });
        } else if (err) {
            console.error('[Upload Middleware] Upload Error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[Upload Middleware] File uploaded successfully:', req.file?.filename);
        next();
    });
};

// Middleware for multiple images upload
export const uploadMultipleImages = (req: any, res: any, next: any) => {
    const uploader = upload.array('images', 10);
    uploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[Upload Middleware] Multer Error:', err);
            return res.status(400).json({ error: `Multer Error: ${err.message}` });
        } else if (err) {
            console.error('[Upload Middleware] Upload Error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[Upload Middleware] Files uploaded successfully:', req.files?.length || 0);
        next();
    });
};

// Export the upload directory path for use in other modules
export { uploadDir };