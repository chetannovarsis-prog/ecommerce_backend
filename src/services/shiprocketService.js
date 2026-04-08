import axios from 'axios';
import { logger } from '../utils/logger.js';

const DEFAULT_BASE_URL = 'https://apiv2.shiprocket.in';
const API_PREFIX = '/v1/external';
const REQUEST_TIMEOUT_MS = 20_000;
const TOKEN_EXPIRY_SAFETY_MS = 5 * 60 * 1000;

let tokenCache = {
  token: null,
  expiresAt: 0,
};

const getBaseUrl = () => (process.env.SHIPROCKET_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

const getApiBaseUrl = () => `${getBaseUrl()}${API_PREFIX}`;

const buildShiprocketError = (error, fallbackMessage) => {
  if (error?.response) {
    const { status, data } = error.response;
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0] ||
      fallbackMessage;

    const normalizedError = new Error(message);
    normalizedError.statusCode = status || 502;
    normalizedError.details = data;
    return normalizedError;
  }

  if (error?.request) {
    const normalizedError = new Error(fallbackMessage || 'No response received from Shiprocket');
    normalizedError.statusCode = 502;
    return normalizedError;
  }

  return error;
};

const decodeJwtExpiry = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));

    return typeof decoded?.exp === 'number' ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const setTokenCache = (token) => {
  const expiresAt = decodeJwtExpiry(token);
  tokenCache = {
    token,
    expiresAt,
  };
  return token;
};

const isTokenValid = () =>
  Boolean(
    tokenCache.token &&
      tokenCache.expiresAt &&
      Date.now() < tokenCache.expiresAt - TOKEN_EXPIRY_SAFETY_MS
  );

const hydrateTokenFromEnv = () => {
  if (tokenCache.token) {
    return;
  }

  const existingToken = process.env.SHIPROCKET_TOKEN;
  if (!existingToken) {
    return;
  }

  const expiresAt = decodeJwtExpiry(existingToken);
  if (expiresAt && Date.now() < expiresAt - TOKEN_EXPIRY_SAFETY_MS) {
    setTokenCache(existingToken);
    logger.info('[ShiprocketService] Reusing existing Shiprocket token from environment');
  }
};

const login = async () => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    const error = new Error(
      'Missing Shiprocket credentials. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.'
    );
    error.statusCode = 500;
    throw error;
  }

  try {
    logger.info('[ShiprocketService] Generating a new Shiprocket token');
    const { data } = await axios.post(
      `${getApiBaseUrl()}/auth/login`,
      { email, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    if (!data?.token) {
      throw new Error('Shiprocket auth response did not include a token');
    }

    return setTokenCache(data.token);
  } catch (error) {
    throw buildShiprocketError(error, 'Unable to authenticate with Shiprocket');
  }
};

export const getToken = async () => {
  hydrateTokenFromEnv();

  if (isTokenValid()) {
    return tokenCache.token;
  }

  return login();
};

const request = async (config, { retryOnUnauthorized = true } = {}) => {
  try {
    const token = await getToken();

    return await axios({
      baseURL: getApiBaseUrl(),
      timeout: REQUEST_TIMEOUT_MS,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
    });
  } catch (error) {
    if (retryOnUnauthorized && error?.response?.status === 401) {
      logger.warn('[ShiprocketService] Token rejected by Shiprocket, refreshing token');
      tokenCache = { token: null, expiresAt: 0 };

      return request(config, { retryOnUnauthorized: false });
    }

    throw buildShiprocketError(error, 'Shiprocket request failed');
  }
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const normalizeAddress = (address = {}) => ({
  name: address.name || address.fullName || [address.firstName, address.lastName].filter(Boolean).join(' '),
  email: address.email || '',
  phone: normalizePhone(address.phone),
  line1: address.line1 || address.address || address.addressLine1 || '',
  line2: address.line2 || address.apartment || address.addressLine2 || '',
  city: address.city || '',
  state: address.state || '',
  pincode: String(address.pincode || address.pinCode || '').trim(),
  country:
    String(address.country || '').toUpperCase() === 'IN'
      ? 'India'
      : address.country || 'India',
});

const normalizeOrderItem = (item, index) => ({
  name: item.name || `Item ${index + 1}`,
  sku: item.sku || item.productId || `item-${index + 1}`,
  units: toPositiveNumber(item.quantity, 1),
  selling_price: Number(item.price || 0).toFixed(2),
});

const createOrderPayload = (orderData) => {
  const address = normalizeAddress(orderData.address);
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  if (!address.name || !address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
    const error = new Error(
      'Order shipping address is incomplete. name, address, city, state, pincode, and phone are required.'
    );
    error.statusCode = 400;
    throw error;
  }

  if (!items.length) {
    const error = new Error('At least one order item is required to create a shipment');
    error.statusCode = 400;
    throw error;
  }

  const dimensions = {
    length: toPositiveNumber(orderData.length ?? orderData.dimensions?.length, 10),
    breadth: toPositiveNumber(orderData.breadth ?? orderData.dimensions?.breadth, 10),
    height: toPositiveNumber(orderData.height ?? orderData.dimensions?.height, 10),
  };

  return {
    order_id: String(orderData.orderId),
    order_date: new Date().toISOString().slice(0, 10),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    billing_customer_name: address.name,
    billing_last_name: '',
    billing_address: address.line1,
    billing_address_2: address.line2,
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state,
    billing_country: address.country,
    billing_email: address.email || process.env.SHIPROCKET_FALLBACK_EMAIL || 'support@example.com',
    billing_phone: address.phone,
    shipping_is_billing: true,
    order_items: items.map(normalizeOrderItem),
    payment_method: String(orderData.paymentMethod || '').toLowerCase() === 'cod' ? 'COD' : 'Prepaid',
    sub_total: Number(orderData.totalAmount || 0).toFixed(2),
    length: dimensions.length,
    breadth: dimensions.breadth,
    height: dimensions.height,
    weight: toPositiveNumber(orderData.weight, 0.5),
  };
};

const pickCourierOption = (options = []) => {
  if (!Array.isArray(options) || !options.length) {
    return null;
  }

  return [...options].sort((left, right) => {
    const rateDiff = Number(left.rate || left.freight_charge || 0) - Number(right.rate || right.freight_charge || 0);
    if (rateDiff !== 0) return rateDiff;

    return Number(left.etd_hours || 0) - Number(right.etd_hours || 0);
  })[0];
};

const getLabelUrlFromResponse = (response, shipmentId) =>
  response?.label_url ||
  response?.response?.label_url ||
  response?.data?.label_url ||
  response?.pdf_url ||
  response?.response?.data?.label_url ||
  `${getApiBaseUrl()}/courier/generate/label?shipment_id[]=${encodeURIComponent(shipmentId)}`;

const getCourierForShipment = async ({ shipmentId, orderData }) => {
  const pickupPostcode = String(process.env.SHIPROCKET_PICKUP_POSTCODE || '').trim();
  const deliveryPostcode = String(orderData?.address?.pincode || orderData?.address?.pinCode || '').trim();

  if (!pickupPostcode || !deliveryPostcode) {
    return null;
  }

  const serviceabilityParams = {
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: String(orderData.paymentMethod || '').toLowerCase() === 'cod' ? 1 : 0,
    weight: toPositiveNumber(orderData.weight, 0.5),
    length: toPositiveNumber(orderData.length ?? orderData.dimensions?.length, 10),
    breadth: toPositiveNumber(orderData.breadth ?? orderData.dimensions?.breadth, 10),
    height: toPositiveNumber(orderData.height ?? orderData.dimensions?.height, 10),
    declared_value: Math.round(toPositiveNumber(orderData.totalAmount, 1)),
  };

  try {
    const { data } = await request({
      method: 'get',
      url: '/courier/serviceability/',
      params: serviceabilityParams,
    });

    const selectedCourier = pickCourierOption(data?.data?.available_courier_companies);
    if (!selectedCourier?.courier_company_id) {
      return null;
    }

    return {
      shipment_id: shipmentId,
      courier_id: selectedCourier.courier_company_id,
      courier_name: selectedCourier.courier_name,
    };
  } catch (error) {
    logger.warn('[ShiprocketService] Unable to preselect courier via serviceability', error.message);
    return null;
  }
};

export const createShipment = async (orderData) => {
  const payload = createOrderPayload(orderData);

  logger.info(`[ShiprocketService] Creating Shiprocket order for ${payload.order_id}`);
  const { data: createOrderResponse } = await request({
    method: 'post',
    url: '/orders/create/adhoc',
    data: payload,
  });

  const shipmentId = createOrderResponse?.shipment_id;
  const shiprocketOrderId = createOrderResponse?.order_id;

  if (!shipmentId) {
    const error = new Error(
      createOrderResponse?.message ||
        createOrderResponse?.error ||
        'Shiprocket did not return a shipment_id for the created order'
    );
    error.statusCode = 502;
    error.details = createOrderResponse;
    throw error;
  }

  const courierRequest = (await getCourierForShipment({ shipmentId, orderData })) || {
    shipment_id: shipmentId,
  };

  logger.info(
    `[ShiprocketService] Assigning AWB for shipment ${shipmentId}${courierRequest.courier_id ? ` using courier ${courierRequest.courier_id}` : ''}`
  );

  const { data: awbResponse } = await request({
    method: 'post',
    url: '/courier/assign/awb',
    data: courierRequest,
  });

  const awbData = awbResponse?.response?.data || awbResponse?.data || {};
  const awb = awbData.awb_code || awbData.awb || null;

  if (!awb) {
    const error = new Error('Shiprocket did not return an AWB after courier assignment');
    error.statusCode = 502;
    error.details = awbResponse;
    throw error;
  }

  let labelUrl = null;
  try {
    const labelResult = await generateLabel(shipmentId);
    labelUrl = labelResult.label_url;
  } catch (error) {
    logger.warn(`[ShiprocketService] Label generation skipped for shipment ${shipmentId}: ${error.message}`);
  }

  return {
    awb,
    shipment_id: String(shipmentId),
    order_id: shiprocketOrderId ? String(shiprocketOrderId) : null,
    courier: awbData.courier_name || courierRequest.courier_name || 'Shiprocket',
    status: 'AWB_ASSIGNED',
    label_url: labelUrl,
  };
};

export const trackShipment = async (awb) => {
  logger.info(`[ShiprocketService] Tracking shipment for AWB ${awb}`);

  const { data } = await request({
    method: 'get',
    url: `/courier/track/awb/${encodeURIComponent(awb)}`,
    params: { awb },
  });

  const trackingData = data?.tracking_data || {};
  const latestEvent = trackingData?.shipment_track?.[0] || {};

  return {
    awb,
    status: latestEvent.current_status || trackingData?.track_status || 'UNKNOWN',
    current_status: latestEvent.current_status || trackingData?.track_status || 'UNKNOWN',
    courier: latestEvent.courier_name || trackingData?.shipment_track?.[0]?.courier_name || null,
    delivered_date: latestEvent.delivered_date || null,
    estimated_delivery_date: latestEvent.estimated_delivery_date || null,
    shipment_status: trackingData?.shipment_status || null,
    shipment_track: trackingData?.shipment_track || [],
    shipment_track_activities: trackingData?.shipment_track_activities || [],
    raw: trackingData,
  };
};

export const cancelShipment = async (shipmentId) => {
  logger.info(`[ShiprocketService] Cancelling shipment ${shipmentId}`);

  await request({
    method: 'post',
    url: '/orders/cancel',
    data: { ids: [Number(shipmentId)] },
  });

  return {
    shipment_id: String(shipmentId),
    status: 'CANCELLED',
  };
};

export const generateLabel = async (shipmentId) => {
  logger.info(`[ShiprocketService] Generating label for shipment ${shipmentId}`);

  const { data } = await request({
    method: 'post',
    url: '/courier/generate/label',
    data: { shipment_id: [Number(shipmentId)] },
  });

  return {
    shipment_id: String(shipmentId),
    label_url: getLabelUrlFromResponse(data, shipmentId),
    raw: data,
  };
};

export const schedulePickup = async (shipmentId) => {
  logger.info(`[ShiprocketService] Scheduling pickup for shipment ${shipmentId}`);

  const { data } = await request({
    method: 'post',
    url: '/courier/generate/pickup',
    data: { shipment_id: [Number(shipmentId)] },
  });

  return {
    shipment_id: String(shipmentId),
    pickup_id:
      data?.pickup_id ||
      data?.response?.pickup_id ||
      data?.data?.pickup_id ||
      null,
    status: 'PICKUP_SCHEDULED',
    raw: data,
  };
};
