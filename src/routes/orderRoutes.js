import express from 'express';
import { getOrders, updateOrderStatus, getOrderById, getCustomerOrders } from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', requireAdmin, getOrders);
router.get('/customer/:customerId', getCustomerOrders);
router.get('/:id', getOrderById);
router.put('/:id', requireAdmin, updateOrderStatus);

export default router;
