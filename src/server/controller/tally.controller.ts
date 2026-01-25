import { Request, Response } from 'express';
import { WeightRecord } from '../models/WeightRecord';
import { TallyConfig } from '../models/TallyConfig';
import * as tallyService from '../modules/tally/tally.service';
import { mapWeightRecordToTally } from '../modules/tally/tally.mapper';

/**
 * Get current Tally Configuration
 */
export const getConfig = async (req: Request, res: Response) => {
    try {
        const config = await TallyConfig.findOne({ active: true });
        if (!config) {
            return res.status(404).json({ success: false, error: "Tally configuration not found" });
        }
        return res.json({ success: true, data: config });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update Tally Configuration
 */
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const configData = req.body;
        let config = await TallyConfig.findOne({ active: true });

        if (config) {
            Object.assign(config, configData, { updatedAt: new Date() });
            await config.save();
        } else {
            config = await TallyConfig.create(configData);
        }

        return res.json({ success: true, data: config });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Sync a specific weight record to Tally
 */
export const syncVoucher = async (req: Request, res: Response) => {
    try {
        const { recordId } = req.body;
        if (!recordId) return res.status(400).json({ success: false, error: "Record ID is required" });

        const record = await WeightRecord.findById(recordId).populate('productId');
        if (!record) return res.status(404).json({ success: false, error: "Weight record not found" });

        if (record.tallySyncStatus === 'synced') {
            return res.status(400).json({ success: false, error: "Voucher already synced to Tally" });
        }

        const config = await TallyConfig.findOne({ active: true });
        if (!config) return res.status(400).json({ success: false, error: "Tally is not configured" });

        // Map -> XML -> Send
        const tallyData = mapWeightRecordToTally(record);
        console.log("[Tally Debug] Mapped Data:", JSON.stringify(tallyData, null, 2));

        const xml = tallyService.generateVoucherXML(tallyData, config);
        console.log("[Tally Debug] Generated XML:", xml);

        const result = await tallyService.sendToTallyAgent(xml, config);

        // Update Record Status
        record.tallyLastSyncAttempt = new Date();
        if (result.success) {
            record.tallySyncStatus = 'synced';
            record.tallySyncError = undefined;
        } else {
            record.tallySyncStatus = 'failed';
            record.tallySyncError = result.message;
        }
        await record.save();

        return res.json({ success: result.success, message: result.message, data: result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Sync all pending records
 */
export const syncAllPending = async (req: Request, res: Response) => {
    try {
        const config = await TallyConfig.findOne({ active: true });
        if (!config) return res.status(400).json({ success: false, error: "Tally is not configured" });

        const pending = await WeightRecord.find({ tallySyncStatus: { $in: ['pending', 'failed'] } }).populate('productId');

        let successCount = 0;
        let failCount = 0;

        for (const record of pending) {
            const tallyData = mapWeightRecordToTally(record);
            const xml = tallyService.generateVoucherXML(tallyData, config);
            const result = await tallyService.sendToTallyAgent(xml, config);

            record.tallyLastSyncAttempt = new Date();
            if (result.success) {
                record.tallySyncStatus = 'synced';
                successCount++;
            } else {
                record.tallySyncStatus = 'failed';
                record.tallySyncError = result.message;
                failCount++;
            }
            await record.save();
        }

        return res.json({
            success: true,
            message: `Sync completed: ${successCount} successful, ${failCount} failed.`,
            stats: { successCount, failCount }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List synced/pending vouchers with filtering
 */
export const listVouchers = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const query: any = {};
        if (status) query.tallySyncStatus = status;

        const vouchers = await WeightRecord.find(query)
            .populate('productId')
            .sort({ recordedAt: -1 })
            .limit(100);

        return res.json({ success: true, data: vouchers });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Test Tally Agent connection
 */
export const testTallyConnection = async (req: Request, res: Response) => {
    try {
        const config = req.body;
        if (!config.tallyIp) {
            const dbConfig = await TallyConfig.findOne({ active: true });
            if (!dbConfig) return res.status(400).json({ success: false, error: "Configuration missing" });
            const reachable = await tallyService.testConnection(dbConfig);
            return res.json({ success: reachable });
        }

        const reachable = await tallyService.testConnection(config);
        return res.json({ success: reachable });
    } catch (error: any) {
        return res.json({ success: false, error: error.message });
    }
}

/**
 * Create a Stock Item in Tally
 */
export const createStockItem = async (req: Request, res: Response) => {
    try {
        const { itemName, unit = "kg" } = req.body;
        if (!itemName) return res.status(400).json({ success: false, error: "itemName is required" });

        const config = await TallyConfig.findOne({ active: true });
        if (!config) return res.status(400).json({ success: false, error: "Tally is not configured" });

        const result = await tallyService.createStockItemInTally(itemName, unit, config);
        return res.json({ success: result.success, message: result.message, data: result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Create a Godown in Tally
 */
export const createGodown = async (req: Request, res: Response) => {
    try {
        const { godownName } = req.body;
        if (!godownName) return res.status(400).json({ success: false, error: "godownName is required" });

        const config = await TallyConfig.findOne({ active: true });
        if (!config) return res.status(400).json({ success: false, error: "Tally is not configured" });

        const result = await tallyService.createGodownInTally(godownName, config);
        return res.json({ success: result.success, message: result.message, data: result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Create a Unit in Tally
 */
export const createUnit = async (req: Request, res: Response) => {
    try {
        const { symbol, formalName } = req.body;
        if (!symbol) return res.status(400).json({ success: false, error: "symbol is required" });

        const config = await TallyConfig.findOne({ active: true });
        if (!config) return res.status(400).json({ success: false, error: "Tally is not configured" });

        const result = await tallyService.createUnitInTally(symbol, formalName || symbol, config);
        return res.json({ success: result.success, message: result.message, data: result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
