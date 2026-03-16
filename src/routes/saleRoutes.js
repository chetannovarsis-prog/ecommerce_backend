import express from 'express';
const router = express.Router();
import * as saleController from '../controllers/saleController.js';

router.get('/', saleController.getSales);
router.post('/store', saleController.registerStoreSale);

export default router;
