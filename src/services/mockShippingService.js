/**
 * ─────────────────────────────────────────────────────────────────
 *  MOCK SHIPPING SERVICE  (Development / Testing)
 *  Simulates Shiprocket-like responses without real API calls.
 * ─────────────────────────────────────────────────────────────────
 */

import { logger } from '../utils/logger.js';

// ── Helpers ────────────────────────────────────────────────────────
const randomId   = (prefix = '', len = 8) =>
  `${prefix}${Math.random().toString(36).substring(2, 2 + len).toUpperCase()}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Static tracking timeline ───────────────────────────────────────
const TRACKING_STAGES = [
  { status: 'SHIPMENT_CREATED',   label: 'Shipment Created',       description: 'Your order has been picked up by the courier.' },
  { status: 'IN_TRANSIT',         label: 'In Transit',             description: 'Shipment is on its way to the destination city.' },
  { status: 'OUT_FOR_DELIVERY',   label: 'Out for Delivery',       description: 'Our courier is on the way to deliver your package.' },
  { status: 'DELIVERED',          label: 'Delivered',              description: 'Package has been successfully delivered.' },
];

/**
 * Deterministically pick a tracking stage based on time since creation.
 * SHIPMENT_CREATED: 0-1 min
 * IN_TRANSIT: 1-3 mins
 * OUT_FOR_DELIVERY: 3-5 mins
 * DELIVERED: > 5 mins
 */
const getStageForAwb = (awb, createdAt) => {
  if (!createdAt) return TRACKING_STAGES[0];
  
  const diffMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
  
  if (diffMinutes > 5) return TRACKING_STAGES[3]; // DELIVERED
  if (diffMinutes > 3) return TRACKING_STAGES[2]; // OUT_FOR_DELIVERY
  if (diffMinutes > 1) return TRACKING_STAGES[1]; // IN_TRANSIT
  return TRACKING_STAGES[0]; // SHIPMENT_CREATED
};

// ── Provider methods ───────────────────────────────────────────────

/**
 * createShipment
 * @param {Object} orderData  - { orderId, address, items, courier? }
 * @returns {Object}          - { awb, shipment_id, label_url, courier, status }
 */
export const createShipment = async (orderData) => {
  logger.info(`[MockShipping] Creating shipment for order: ${orderData.orderId}`);

  // Simulate slight network latency
  await sleep(120);

  const awb         = randomId('MOCK', 10);
  const shipment_id = randomId('SHP', 10);
  const courier     = orderData.courier || 'MockCourier Express';
  const label_url   = `https://mock-shipping.local/labels/${awb}.pdf`;

  logger.info(`[MockShipping] Shipment created → AWB: ${awb}, ID: ${shipment_id}`);

  return {
    awb,
    shipment_id,
    courier,
    status: 'SHIPMENT_CREATED',
    label_url,
    estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 days
  };
};

/**
 * trackShipment
 * @param {string} awb
 * @returns {Object} tracking info with history array
 */
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ... (helpers)

/**
 * trackShipment
 * @param {string} awb
 * @returns {Object} tracking info with history array
 */
export const trackShipment = async (awb) => {
  logger.info(`[MockShipping] Tracking AWB: ${awb}`);

  await sleep(80);

  // Fetch the shipment from DB to find out when it was created
  const shipment = await prisma.shipment.findUnique({ where: { awb } });
  const createdAt = shipment ? shipment.createdAt : null;

  const currentStage = getStageForAwb(awb, createdAt);
  const currentIndex = TRACKING_STAGES.findIndex((s) => s.status === currentStage.status);

  // Build history up to (and including) current stage
  const history = TRACKING_STAGES.slice(0, currentIndex + 1).map((stage, idx) => ({
    status:      stage.status,
    label:       stage.label,
    description: stage.description,
    timestamp:   new Date(Date.now() - (currentIndex - idx) * 12 * 60 * 60 * 1000).toISOString(),
    location:    idx === 0 ? 'Origin Warehouse' : idx === currentIndex ? 'Destination Hub' : 'In Transit',
  }));

  return {
    awb,
    current_status: currentStage.status,
    current_label:  currentStage.label,
    courier:        'MockCourier Express',
    history,
    estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * cancelShipment
 * @param {string} shipment_id
 * @returns {Object} cancellation confirmation
 */
export const cancelShipment = async (shipment_id) => {
  logger.info(`[MockShipping] Cancelling shipment: ${shipment_id}`);

  await sleep(100);

  if (!shipment_id) {
    throw new Error('shipment_id is required for cancellation');
  }

  return {
    shipment_id,
    status:    'CANCELLED',
    message:   'Shipment has been successfully cancelled.',
    cancelled_at: new Date().toISOString(),
  };
};
