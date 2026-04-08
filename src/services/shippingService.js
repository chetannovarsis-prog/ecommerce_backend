import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

const NON_CANCELLABLE_STATUSES = ['PICKED', 'SHIPPED', 'DELIVERED'];

const getProvider = async () => {
  const hasShiprocketCredentials =
    Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) ||
    Boolean(process.env.SHIPROCKET_TOKEN);

  if (hasShiprocketCredentials) {
    logger.info('[ShippingService] Using Shiprocket provider');
    return import('./shiprocketService.js');
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.warn('[ShippingService] Shiprocket credentials missing, falling back to mock provider');
    return import('./mockShippingService.js');
  }

  const error = new Error(
    'Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.'
  );
  error.statusCode = 500;
  throw error;
};

const getStringValue = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const buildAddressFromOrder = (order, requestAddress = {}) => {
  const savedAddress = order?.shippingAddress || {};

  return {
    name: getStringValue(
      requestAddress.name,
      requestAddress.fullName,
      savedAddress.fullName,
      `${savedAddress.firstName || ''} ${savedAddress.lastName || ''}`.trim(),
      order?.customer?.name
    ),
    email: getStringValue(requestAddress.email, savedAddress.email, order?.customer?.email),
    phone: getStringValue(requestAddress.phone, savedAddress.phone),
    line1: getStringValue(requestAddress.line1, requestAddress.address, savedAddress.address, savedAddress.addressLine1),
    line2: getStringValue(requestAddress.line2, requestAddress.apartment, savedAddress.apartment, savedAddress.addressLine2),
    city: getStringValue(requestAddress.city, savedAddress.city),
    state: getStringValue(requestAddress.state, savedAddress.state),
    pincode: getStringValue(
      requestAddress.pincode,
      requestAddress.pinCode,
      savedAddress.pinCode,
      savedAddress.pincode
    ),
    country: getStringValue(requestAddress.country, savedAddress.country) || 'India',
  };
};

const buildItemsFromOrder = (order, requestItems) => {
  if (Array.isArray(requestItems) && requestItems.length) {
    return requestItems;
  }

  return (order?.items || []).map((item) => ({
    productId: item.productId,
    name: item.product?.name,
    sku: item.product?.slug || item.productId,
    quantity: item.quantity,
    price: item.price,
  }));
};

const getOrderForShipping = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    const error = new Error(`Order ${orderId} was not found`);
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const buildOrderPayload = async (input) => {
  const orderId = String(input?.orderId || '').trim();
  if (!orderId) {
    const error = new Error('orderId is required');
    error.statusCode = 400;
    throw error;
  }

  const order = await getOrderForShipping(orderId);

  return {
    orderId,
    paymentMethod: getStringValue(input.paymentMethod, order.paymentMethod) || 'prepaid',
    totalAmount: Number(input.totalAmount ?? order.totalAmount ?? 0),
    weight: Number(input.weight || 0.5),
    dimensions: {
      length: Number(input.length ?? input.dimensions?.length ?? 10),
      breadth: Number(input.breadth ?? input.dimensions?.breadth ?? 10),
      height: Number(input.height ?? input.dimensions?.height ?? 10),
    },
    address: buildAddressFromOrder(order, input.address),
    items: buildItemsFromOrder(order, input.items),
  };
};

const normalizeShipmentRecord = (shipment) => ({
  id: shipment.id,
  order_id: shipment.orderId,
  shipment_id: shipment.shipmentId,
  awb: shipment.awb,
  courier: shipment.courier,
  status: shipment.status,
  labelUrl: shipment.labelUrl || null,
  created_at: shipment.createdAt,
});

export const createShipment = async (input) => {
  const payload = await buildOrderPayload(input);
  const existing = await prisma.shipment.findUnique({
    where: { orderId: payload.orderId },
  });

  if (existing) {
    return {
      created: false,
      shipment: normalizeShipmentRecord(existing),
    };
  }

  const provider = await getProvider();
  const result = await provider.createShipment(payload);

  const shipment = await prisma.shipment.create({
    data: {
      orderId: payload.orderId,
      shipmentId: String(result.shipment_id),
      awb: String(result.awb),
      courier: result.courier || 'Shiprocket',
      status: result.status || 'AWB_ASSIGNED',
      labelUrl: result.label_url || null,
    },
  });

  return {
    created: true,
    shipment: normalizeShipmentRecord(shipment),
    provider_response: {
      shipment_id: result.shipment_id,
      order_id: result.order_id,
      courier: result.courier,
      awb: result.awb,
      status: result.status,
      label_url: result.label_url || null,
    },
  };
};

export const trackShipment = async ({ awb, orderId }) => {
  let resolvedAwb = getStringValue(awb);

  if (!resolvedAwb && orderId) {
    const shipment = await prisma.shipment.findUnique({
      where: { orderId: String(orderId) },
    });

    if (!shipment?.awb) {
      const error = new Error(`No shipment found for order ${orderId}`);
      error.statusCode = 404;
      throw error;
    }

    resolvedAwb = shipment.awb;
  }

  if (!resolvedAwb) {
    const error = new Error('awb or orderId is required');
    error.statusCode = 400;
    throw error;
  }

  const provider = await getProvider();
  const tracking = await provider.trackShipment(resolvedAwb);

  await prisma.shipment.updateMany({
    where: { awb: resolvedAwb },
    data: { status: tracking.current_status || tracking.status || 'UNKNOWN' },
  });

  return tracking;
};

export const cancelShipment = async (shipmentId) => {
  if (!shipmentId) {
    const error = new Error('shipmentId is required');
    error.statusCode = 400;
    throw error;
  }

  const existingShipment = await prisma.shipment.findUnique({
    where: { shipmentId: String(shipmentId) },
  });

  if (
    existingShipment?.status &&
    NON_CANCELLABLE_STATUSES.some((status) =>
      existingShipment.status.toUpperCase().includes(status)
    )
  ) {
    const error = new Error(`Shipment cannot be cancelled once it is ${existingShipment.status}`);
    error.statusCode = 400;
    throw error;
  }

  const provider = await getProvider();
  const result = await provider.cancelShipment(shipmentId);

  await prisma.shipment.updateMany({
    where: { shipmentId: String(shipmentId) },
    data: { status: 'CANCELLED' },
  });

  return result;
};

export const generateLabel = async ({ shipmentId, orderId }) => {
  let shipment = null;

  if (shipmentId) {
    shipment = await prisma.shipment.findUnique({
      where: { shipmentId: String(shipmentId) },
    });
  } else if (orderId) {
    shipment = await prisma.shipment.findUnique({
      where: { orderId: String(orderId) },
    });
  }

  if (!shipment) {
    const error = new Error('Shipment not found');
    error.statusCode = 404;
    throw error;
  }

  if (shipment.labelUrl) {
    return {
      shipment: normalizeShipmentRecord(shipment),
      label_url: shipment.labelUrl,
    };
  }

  const provider = await getProvider();
  const result = await provider.generateLabel(shipment.shipmentId);

  const updatedShipment = await prisma.shipment.update({
    where: { shipmentId: shipment.shipmentId },
    data: { labelUrl: result.label_url || shipment.labelUrl },
  });

  return {
    shipment: normalizeShipmentRecord(updatedShipment),
    label_url: result.label_url,
  };
};

export const schedulePickup = async ({ shipmentId, orderId }) => {
  let shipment = null;

  if (shipmentId) {
    shipment = await prisma.shipment.findUnique({
      where: { shipmentId: String(shipmentId) },
    });
  } else if (orderId) {
    shipment = await prisma.shipment.findUnique({
      where: { orderId: String(orderId) },
    });
  }

  if (!shipment) {
    const error = new Error('Shipment not found');
    error.statusCode = 404;
    throw error;
  }

  const provider = await getProvider();
  const result = await provider.schedulePickup(shipment.shipmentId);

  const updatedShipment = await prisma.shipment.update({
    where: { shipmentId: shipment.shipmentId },
    data: { status: result.status || 'PICKUP_SCHEDULED' },
  });

  return {
    shipment: normalizeShipmentRecord(updatedShipment),
    pickup_id: result.pickup_id || null,
    status: result.status || 'PICKUP_SCHEDULED',
  };
};

export const getShipmentByOrder = async (orderId) => {
  const shipment = await prisma.shipment.findUnique({
    where: { orderId: String(orderId) },
  });

  if (!shipment) {
    return null;
  }

  if (shipment.labelUrl) {
    return normalizeShipmentRecord(shipment);
  }

  try {
    const provider = await getProvider();
    const label = await provider.generateLabel(shipment.shipmentId);
    const updatedShipment = await prisma.shipment.update({
      where: { shipmentId: shipment.shipmentId },
      data: { labelUrl: label.label_url || shipment.labelUrl },
    });

    return normalizeShipmentRecord(updatedShipment);
  } catch (error) {
    logger.warn(
      `[ShippingService] Unable to hydrate label for shipment ${shipment.shipmentId}: ${error.message}`
    );
    return normalizeShipmentRecord(shipment);
  }
};

export const getAllShipments = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    shipments: shipments.map(normalizeShipmentRecord),
    total,
    page,
    limit,
  };
};
