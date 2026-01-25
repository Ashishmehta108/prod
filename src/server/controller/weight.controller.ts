import { Request, Response } from 'express';
import * as weightService from '../modules/weight/weight.service';

/**
 * List all available serial ports
 */
export const listPorts = async (req: Request, res: Response) => {
    try {
        const ports = await weightService.listPorts();
        return res.json({ success: true, data: ports });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get weight from a specific port
 */
export const readWeight = async (req: Request, res: Response) => {
    try {
        const { path, baudRate, timeout } = req.body;
        if (!path) return res.status(400).json({ success: false, error: 'Port path is required' });

        const rawData = await weightService.getWeight(
            path,
            baudRate ? parseInt(baudRate) : 9600,
            timeout ? parseInt(timeout) : 5000
        );
        console.log(rawData)
        const parsed = weightService.parseWeight(rawData);

        return res.json({ success: true, data: { raw: rawData, parsed } });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Save weight record and print label
 */
export const createRecord = async (req: any, res: Response) => {
    try {
        const { productId, grossWeight, tareWeight, weightSource, printerName } = req.body;
        const userId = req.user?.id; // from auth middleware

        if (!productId || grossWeight === undefined || tareWeight === undefined) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const result = await weightService.saveAndPrint({
            productId,
            grossWeight,
            tareWeight,
            weightSource,
            recordedBy: userId,
            printerName
        });

        return res.status(201).json({ success: true, ...result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Reprint a weight record
 */
export const reprintRecord = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { printerName } = req.body;

        if (!printerName) return res.status(400).json({ success: false, error: "Printer name is required" });

        const record = await weightService.reprint(id, printerName);
        return res.json({ success: true, data: record });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List weight records with pagination
 */
export const listRecords = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { WeightRecord } = require('../models/WeightRecord');

        const records = await WeightRecord.find()
            .populate('productId', 'name category')
            .populate('recordedBy', 'username')
            .sort({ recordedAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await WeightRecord.countDocuments();

        return res.json({
            success: true,
            data: records,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
