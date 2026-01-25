import express from 'express';
import { uploadSingleImage, uploadMultipleImages } from '../middleware/upload';
import { auth } from '../middleware/auth';

const router = express.Router();

// Upload a single image
router.post('/single', auth, uploadSingleImage, (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        // Return the file path or URL
        const filePath = `/upload/images/${req.file.filename}`;

        console.log('[Upload Route] Single file uploaded:', {
            filename: req.file.filename,
            size: req.file.size,
            path: filePath
        });

        res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            },
            path: filePath
        });
    } catch (err: any) {
        console.error('[Upload Route] Error in single upload:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload multiple images
router.post('/multiple', auth, uploadMultipleImages, (req: any, res) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Please upload files' });
        }

        const files = req.files as Express.Multer.File[];
        const paths = files.map(file => `/upload/images/${file.filename}`);

        console.log('[Upload Route] Multiple files uploaded:', {
            count: files.length,
            filenames: files.map(f => f.filename)
        });

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            })),
            paths: paths
        });
    } catch (err: any) {
        console.error('[Upload Route] Error in multiple upload:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;