import { Router } from 'express';
import * as qrcodeController from '../controller/qrcode.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/qrcode/generate
 * @desc Generate a QR code for a given payload
 * @access Private
 */
router.post('/generate', auth, qrcodeController.generateQRCode);

export default router;
