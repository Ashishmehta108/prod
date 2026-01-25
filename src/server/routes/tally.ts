import { Router } from 'express';
import * as tallyController from '../controller/tally.controller';
import { auth, adminOnly } from '../middleware/auth';

const router = Router();

// Configuration (Admin Only)
router.get('/config', auth, adminOnly, tallyController.getConfig);
router.post('/config', auth, adminOnly, tallyController.updateConfig);
router.post('/test-connection', auth, adminOnly, tallyController.testTallyConnection);

// Voucher Sync (Admin Only)
router.get('/vouchers', auth, adminOnly, tallyController.listVouchers);
router.post('/sync-voucher', auth, adminOnly, tallyController.syncVoucher);
// router.post('/sync-test', auth, adminOnly, tallyController.generateTestVoucher); // New test route
router.post('/sync-all', auth, adminOnly, tallyController.syncAllPending);

// Master Creation (Admin Only)
router.post('/create-stock-item', auth, adminOnly, tallyController.createStockItem);
router.post('/create-godown', auth, adminOnly, tallyController.createGodown);
router.post('/create-unit', auth, adminOnly, tallyController.createUnit);

export default router;
