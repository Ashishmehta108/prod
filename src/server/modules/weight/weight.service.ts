import { SerialPort } from 'serialport';
// Note: ReadlineParser not used - TI-10 Smart uses raw data accumulation
import { WeightRecord } from '../../models/WeightRecord';
import { Product } from '../../models/Product';
import * as printService from './print.service';


/**
 * List all available serial ports on the system
 */
export const listPorts = async () => {
    try {
        const ports = await SerialPort.list();
        console.log('Detected Ports:', ports);

        // Fallback: If no ports detected (common in some Windows environments/permissions),
        // provide common ports to allow manual selection. The user can still try to connect.
        if (ports.length === 0) {
            console.warn("No ports detected. Providing fallback options.");
            return [
                { path: 'COM3', manufacturer: 'Fallback - Try if valid' },
                { path: 'COM4', manufacturer: 'Fallback - Try if valid' },
                { path: 'COM1', manufacturer: 'System Port' }
            ];
        }
        return ports;
    } catch (error) {
        console.error('Error listing serial ports:', error);
        // Don't crash, return fallbacks
        return [{ path: 'COM3', manufacturer: 'Error Fallback' }];
    }
};

/**
 * Reads a single weight value from a specific port
 * 
 * TI-10 Smart Scale Protocol:
 * - Baud: 9600, Parity: None, Data: 8, Stop: 1
 * - Operates in continuous output mode OR responds to Print button
 * - Data format: [indicator][7-char weight][delimiter]
 *   e.g., " 0012.50=" or "L001.250="
 */
export const getWeight = async (path: string, baudRate: number = 9600, timeout: number = 100000): Promise<string> => {
    console.log(`[WEIGHT] getWeight called: path=${path}, baudRate=${baudRate}, timeout=${timeout}ms`);
    console.log('[WEIGHT] TI-10 Smart Mode: Listening for continuous data or Print button output...');

    return new Promise((resolve, reject) => {
        let hasResolved = false;
        let dataBuffer = '';

        const port = new SerialPort({
            path,
            baudRate,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            autoOpen: false,
        });

        // const cleanup = () => {
        //     console.log('[WEIGHT] Cleanup called');
        //     try {
        //         if (port.isOpen) port.close();
        //     } catch (e) { /* ignore */ }
        // };

        // const timer = setTimeout(() => {
        //     console.log('[WEIGHT] Timeout reached!');
        //     if (!hasResolved) {
        //         hasResolved = true;
        //         cleanup();
        //         reject(new Error(`Timeout: No weight data received on ${path}. Please press the 'Print' or 'ON/PRINT' button on the TI-10 scale.`));
        //     }
        // }, timeout);

        /**
         * Parse TI-10 weight data from raw string
         * Formats: "  12.50 kg", "0012.50=", " L001.250", etc.
         */
        const parseWeightData = (raw: string): string | null => {
            // Remove control characters but keep spaces for format detection
            const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();

            if (!cleaned || cleaned.length < 2) return null;

            // Try to extract weight value using various patterns
            // Pattern 1: Number with possible unit (e.g., "12.50 kg", "0012.50=")
            const patterns = [
                /([+-]?\d+\.?\d*)\s*(kg|g|lb|oz)?/i,           // Standard: "12.50 kg"
                /[LK ]?(\d{3,7}\.?\d*)/,                        // TI-10: "L001.250" or " 0012.50"
                /(\d+\.?\d+)/,                                  // Fallback: any decimal number
            ];

            for (const pattern of patterns) {
                const match = cleaned.match(pattern);
                if (match && match[1]) {
                    const numValue = parseFloat(match[1]);
                    // Sanity check: weight should be reasonable (0.001 to 10000)
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 99999) {
                        const unit = match[2] || 'kg';
                        console.log(`[WEIGHT] Extracted: ${numValue} ${unit} from "${cleaned}"`);
                        return `${numValue} ${unit}`;
                    }
                }
            }

            return null;
        };

        port.open((err) => {
            if (err) {
                console.log('[WEIGHT] Port open FAILED:', err.message);
                // clearTimeout(timer);
                if (!hasResolved) {
                    hasResolved = true;
                    reject(new Error(`Failed to open port ${path}: ${err.message}`));
                }
                return;
            }
            console.log('[WEIGHT] Port opened successfully. Waiting for TI-10 data...');
            console.log('[WEIGHT] Press the PRINT button on the scale to send weight data.');
        });

        // Listen for raw data - TI-10 may not use standard line endings
        port.on('data', (rawData: Buffer) => {
            const hexStr = rawData.toString('hex');
            const asciiStr = rawData.toString();
            console.log('[WEIGHT] RAW data received:', hexStr, '| ASCII:', JSON.stringify(asciiStr));

            // Accumulate data in buffer
            dataBuffer += asciiStr;

            // Check for common delimiters: CR, LF, =, or enough characters
            const hasDelimiter = dataBuffer.includes('\r') ||
                dataBuffer.includes('\n') ||
                dataBuffer.includes('=') ||
                dataBuffer.length >= 15;

            if (hasDelimiter && !hasResolved) {
                console.log('[WEIGHT] Buffer content:', JSON.stringify(dataBuffer));

                const weightStr = parseWeightData(dataBuffer);
                if (weightStr) {
                    hasResolved = true;
                    // clearTimeout(timer);
                    // cleanup();
                    console.log('[WEIGHT] SUCCESS - Parsed weight:', weightStr);
                    resolve(weightStr);
                } else {
                    // Clear buffer and keep listening if we couldn't parse
                    console.log('[WEIGHT] Could not parse weight, continuing to listen...');
                    dataBuffer = '';
                }
            }
        });

        port.on('error', (err) => {
            console.log('[WEIGHT] Port error:', err.message);
            if (!hasResolved) {
                hasResolved = true;
                // clearTimeout(timer);
                // cleanup();
                reject(new Error(`SerialPort error: ${err.message}`));
            }
        });

        port.on('close', () => {
            console.log('[WEIGHT] Port closed');
        });
    });
};

/**
 * Parse weight string to numeric value
 */
export const parseWeight = (weightStr: string): { value: number; unit: string } => {
    const matches = weightStr.match(/([+-]?\s*\d+\.?\d*)\s*([a-zA-Z]+)?/);
    if (!matches) {
        return { value: 0, unit: 'kg' };
    }
    const value = parseFloat(matches[1].replace(/\s/g, '')) || 0;
    const unit = (matches[2] || 'kg').toLowerCase() === 'g' ? 'g' : 'kg';
    return { value, unit };
};

/**
 * Save weight record and trigger print
 */
export const saveAndPrint = async (payload: {
    productId: string;
    grossWeight: number;
    tareWeight: number;
    weightSource?: "scale" | "manual";
    recordedBy: string;
    printerName?: string;
}) => {
    const { productId, grossWeight, tareWeight, weightSource, recordedBy, printerName } = payload;

    // Validation
    if (grossWeight <= 0) throw new Error("Gross weight must be greater than 0");
    if (tareWeight < 0) throw new Error("Tare weight cannot be negative");
    if (grossWeight < tareWeight) throw new Error("Gross weight must be greater than or equal to Tare weight");

    const netWeight = grossWeight - tareWeight;
    const rollNo = `R${Date.now().toString().slice(-8)}`;

    // Save to DB
    const record = await WeightRecord.create({
        productId,
        grossWeight,
        tareWeight,
        netWeight,
        weightSource: weightSource || "scale",
        rollNo,
        recordedBy,
    });

    // Fetch product name for label
    const product = await Product.findById(productId);
    const productName = product?.name || "Unknown Product";

    // Generate TSPL
    if (printerName) {
        const tspl = printService.generateTSPL({
            productName,
            grossWeight,
            tareWeight,
            netWeight,
            unit: "kg",
            rollNo,
            date: new Date().toLocaleString(),
        });

        try {
            await printService.sendToPrinter(tspl, printerName);
        } catch (err) {
            console.error("Print failed but record was saved:", err);
            // We don't throw here to let the user know the record is saved
            return { record, printError: "Record saved but printer failed. Check connection." };
        }
    }

    // Tally Auto-Sync Integration
    // try {
    //     const { TallyConfig } = require('../../models/TallyConfig');
    //     const tallyService = require('../tally/tally.service');
    //     const { mapWeightRecordToTally } = require('../tally/tally.mapper');

    //     const tallyConfig = await TallyConfig.findOne({ active: true, autoSync: true });
    //     if (tallyConfig) {
    //         // Need a populated record for mapping
    //         const populatedRecord = await WeightRecord.findById(record._id).populate('productId');
    //         if (populatedRecord) {
    //             const tallyData = mapWeightRecordToTally(populatedRecord);
    //             const xml = tallyService.generateVoucherXML(tallyData, tallyConfig);
    //             const syncResult = await tallyService.sendToTallyAgent(xml, tallyConfig);

    //             populatedRecord.tallyLastSyncAttempt = new Date();
    //             if (syncResult.success) {
    //                 populatedRecord.tallySyncStatus = 'synced';
    //             } else {
    //                 populatedRecord.tallySyncStatus = 'failed';
    //                 populatedRecord.tallySyncError = syncResult.message;
    //             }
    //             await populatedRecord.save();
    //         }
    //     }
    // } catch (tallyErr) {
    //     console.error("Auto-sync failed:", tallyErr);
    // }

    return { record };
};


/**
 * Reprint existing record
 */
export const reprint = async (recordId: string, printerName: string) => {
    const record = await WeightRecord.findById(recordId).populate("productId");
    if (!record) throw new Error("Record not found");

    const product: any = record.productId;

    const tspl = printService.generateTSPL({
        productName: product.name,
        grossWeight: record.grossWeight,
        tareWeight: record.tareWeight,
        netWeight: record.netWeight,
        unit: record.weightUnit,
        rollNo: record.rollNo || "N/A",
        date: record.recordedAt.toLocaleString(),
    });

    await printService.sendToPrinter(tspl, printerName);
    return record;
};
