import express from 'express';
import {
  cancelShipment,
  createShipment,
  generateLabel,
  getAllShipments,
  getShipmentByOrder,
  schedulePickup,
  trackShipment,
} from '../controllers/shippingController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.post('/create', createShipment);
router.get('/track', trackShipment);
router.get('/track/:awb', trackShipment);
router.get('/label/:orderId', generateLabel);
router.post('/label', generateLabel);
router.post('/schedule-pickup', schedulePickup);
router.post('/cancel', cancelShipment);
router.get('/order/:orderId', getShipmentByOrder);
router.get('/all', requireAdmin, getAllShipments);

export default router;
