import { Request, Response } from 'express';
import * as qrCodeService from '../modules/qrcode/qrcode.service';

/**
 * Generates a QR code from a provided payload
 * POST /api/qrcode/generate
 */
export const generateQRCode = async (req: Request, res: Response) => {
    try {
        const { payload, options } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Payload is required' });
        }

        const qrCodeDataUri = await qrCodeService.generateDataURI(payload, options);

        return res.json({
            success: true,
            qrCode: qrCodeDataUri,
            payload: payload
        });
    } catch (error) {
        console.error('Error in generateQRCode controller:', error);
        return res.status(500).json({ error: 'Failed to generate QR code' });
    }
};

/**
 * Generates a QR code for a specific product
 */
export const generateProductQRCode = async (req: Request, res: Response, product: any) => {
    try {
        const payload = {
            id: product._id || product.id,
            name: product.name,
            category: product.category,
            machineName: product.machineName,
            refIds: product.refIds,
            generatedAt: new Date().toISOString()
        };

        const qrCodeDataUri = await qrCodeService.generateDataURI(payload);

        return res.json({
            success: true,
            qrCode: qrCodeDataUri,
            product: {
                id: payload.id,
                name: payload.name
            }
        });
    } catch (error) {
        console.error('Error in generateProductQRCode:', error);
        return res.status(500).json({ error: 'Failed to generate product QR code' });
    }
};
