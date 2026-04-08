import * as shippingService from '../services/shippingService.js';
import { logger } from '../utils/logger.js';

const getStatusCode = (error, fallback = 500) => error?.statusCode || fallback;

export const createShipment = async (req, res) => {
  try {
    const result = await shippingService.createShipment(req.body);

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created ? 'Shipment created successfully' : 'Shipment already exists for this order',
      ...result,
    });
  } catch (error) {
    logger.error('[ShippingController] createShipment error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to create shipment',
      details: error.details || null,
    });
  }
};

export const trackShipment = async (req, res) => {
  try {
    const result = await shippingService.trackShipment({
      awb: req.params.awb || req.query.awb,
      orderId: req.query.orderId,
    });

    return res.status(200).json({
      success: true,
      tracking: result,
    });
  } catch (error) {
    logger.error('[ShippingController] trackShipment error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to track shipment',
      details: error.details || null,
    });
  }
};

export const cancelShipment = async (req, res) => {
  try {
    const result = await shippingService.cancelShipment(req.body?.shipmentId);

    return res.status(200).json({
      success: true,
      message: 'Shipment cancelled successfully',
      result,
    });
  } catch (error) {
    logger.error('[ShippingController] cancelShipment error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to cancel shipment',
      details: error.details || null,
    });
  }
};

export const generateLabel = async (req, res) => {
  try {
    const result = await shippingService.generateLabel({
      shipmentId: req.body?.shipmentId || req.query.shipmentId,
      orderId: req.body?.orderId || req.query.orderId || req.params.orderId,
    });

    return res.status(200).json({
      success: true,
      message: 'Shipment label generated successfully',
      ...result,
    });
  } catch (error) {
    logger.error('[ShippingController] generateLabel error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to generate shipment label',
      details: error.details || null,
    });
  }
};

export const schedulePickup = async (req, res) => {
  try {
    const result = await shippingService.schedulePickup({
      shipmentId: req.body?.shipmentId,
      orderId: req.body?.orderId || req.params.orderId,
    });

    return res.status(200).json({
      success: true,
      message: 'Pickup scheduled successfully',
      ...result,
    });
  } catch (error) {
    logger.error('[ShippingController] schedulePickup error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to schedule pickup',
      details: error.details || null,
    });
  }
};

export const getShipmentByOrder = async (req, res) => {
  try {
    const shipment = await shippingService.getShipmentByOrder(req.params.orderId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'No shipment found for this order',
      });
    }

    return res.status(200).json({
      success: true,
      shipment,
    });
  } catch (error) {
    logger.error('[ShippingController] getShipmentByOrder error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to fetch shipment',
    });
  }
};

export const getAllShipments = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await shippingService.getAllShipments({
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('[ShippingController] getAllShipments error:', error.message);
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || 'Failed to fetch shipments',
    });
  }
};
