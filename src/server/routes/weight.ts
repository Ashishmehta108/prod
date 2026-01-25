import { Router } from 'express';
import * as weightController from '../controller/weight.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/weight/ports
 */
router.get('/ports', auth, weightController.listPorts);

/**
 * @route POST /api/weight/read
 */
router.post('/read', auth, weightController.readWeight);

/**
 * @route POST /api/weight/records
 * @desc Create a weight record and print label
 */
router.post('/records', auth, weightController.createRecord);

/**
 * @route POST /api/weight/records/:id/reprint
 * @desc Reprint an existing label
 */
router.post('/records/:id/reprint', auth, weightController.reprintRecord);

/**
 * @route GET /api/weight/records
 */
router.get('/records', auth, weightController.listRecords);

export default router;
