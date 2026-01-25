import QRCode from 'qrcode';

/**
 * Generates a QR code as a Data URI (Base64 string)
 * This is useful for displaying the QR code directly in an <img> tag on the frontend
 * 
 * @param payload The data to encode in the QR code (can be string or object)
 * @param options Custom options for QR generation
 * @returns Promise<string> Base64 Data URI
 */
export const generateDataURI = async (
    payload: string | object,
    options: QRCode.QRCodeToDataURLOptions = {}
): Promise<string> => {
    try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

        const defaultOptions: QRCode.QRCodeToDataURLOptions = {
            errorCorrectionLevel: 'H', // High error correction for production use
            type: 'image/png',
            margin: 1,
            color: {
                dark: '#000000', // Black dots
                light: '#FFFFFF', // White background
            },
            width: 300, // Default width
            ...options,
        };

        return await QRCode.toDataURL(data, defaultOptions);
    } catch (error) {
        console.error('QR Code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Generates a QR code and saves it to a file
 * 
 * @param filePath Path where the file should be saved
 * @param payload The data to encode
 * @param options Custom options
 */
export const generateFile = async (
    filePath: string,
    payload: string | object,
    options: QRCode.QRCodeToFileOptions = {}
): Promise<void> => {
    try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

        const defaultOptions: QRCode.QRCodeToFileOptions = {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 1024, // Higher resolution for files
            ...options,
        };

        await QRCode.toFile(filePath, data, defaultOptions);
    } catch (error) {
        console.error('QR Code file generation failed:', error);
        throw new Error('Failed to save QR code to file');
    }
};

/**
 * Generates a QR code as a Buffer
 * Useful for sending as an attachment or processing further
 */
export const generateBuffer = async (
    payload: string | object,
    options: QRCode.QRCodeToBufferOptions = {}
): Promise<Buffer> => {
    try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

        const defaultOptions: QRCode.QRCodeToBufferOptions = {
            errorCorrectionLevel: 'H',
            margin: 1,
            ...options,
        };

        return await QRCode.toBuffer(data, defaultOptions);
    } catch (error) {
        console.error('QR Code buffer generation failed:', error);
        throw new Error('Failed to generate QR code buffer');
    }
};
