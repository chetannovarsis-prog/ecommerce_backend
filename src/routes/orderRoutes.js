import express from 'express';
import { getOrders, updateOrderStatus, getOrderById, getCustomerOrders } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/customer/:customerId', getCustomerOrders);
router.put('/:id', updateOrderStatus);

export default router;
