import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const normalizeAddressForSave = (shippingAddress = {}, customerName = '', customerEmail = '') => ({
  id: shippingAddress.id || `addr_${Date.now()}`,
  label: shippingAddress.label || 'Saved Address',
  firstName: shippingAddress.firstName || '',
  lastName: shippingAddress.lastName || '',
  email: shippingAddress.email || customerEmail || '',
  address: shippingAddress.address || '',
  apartment: shippingAddress.apartment || '',
  city: shippingAddress.city || '',
  state: shippingAddress.state || '',
  pinCode: shippingAddress.pinCode || '',
  phone: shippingAddress.phone || '',
  fullName:
    shippingAddress.fullName ||
    [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') ||
    customerName ||
    null
});

export const createRazorpayOrder = async (req, res) => {
  const {
    amount,
    currency = 'INR',
    receipt,
    items,
    customerId,
    customerEmail,
    customerName,
    paymentMethod,
    shippingAddress
  } = req.body;
  
  console.log('--- CREATING ORDER ---');
  console.log('Body:', { amount, currency, receipt, customerId, customerEmail, paymentMethod });
  console.log('Items Count:', items?.length);

  try {
    let razorpayOrder = null;
    let resolvedCustomerId = null;
    
    // Only create Razorpay order if it's not COD
    if (paymentMethod !== 'cod') {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt,
      };
      console.log('Creating Razorpay order with options:', options);
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay Order Created:', razorpayOrder.id);
    }

    // Resolve the customer from a trusted DB lookup instead of relying on cached frontend IDs.
    if (customerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true }
      });
      resolvedCustomerId = existingCustomer?.id || null;
    }

    if (!resolvedCustomerId && customerEmail) {
      const customerByEmail = await prisma.customer.findUnique({
        where: { email: customerEmail },
        select: { id: true }
      });
      resolvedCustomerId = customerByEmail?.id || null;
    }

    if (!resolvedCustomerId && customerEmail && customerId) {
      console.warn(`Ignoring stale customerId "${customerId}" for email "${customerEmail}"`);
    }

    // Create a pending order in our database
    console.log('Creating database order...');
    const order = await prisma.order.create({
      data: {
        totalAmount: amount,
        status: paymentMethod === 'cod' ? 'COD_PENDING' : 'PENDING',
        customerId: resolvedCustomerId,
        razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
        paymentMethod: paymentMethod,
        shippingAddress: {
          ...shippingAddress,
          email: shippingAddress?.email || customerEmail || null,
          fullName:
            shippingAddress?.fullName ||
            [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') ||
            customerName ||
            null
        },
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });
    console.log('Database Order Created:', order.id);

    // Save address to customer profile relational table
    if (resolvedCustomerId && shippingAddress) {
      try {
        const nextAddress = {
          name: [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') || customerName || 'Default',
          phone: shippingAddress.phone || '',
          addressLine1: shippingAddress.address || '',
          addressLine2: shippingAddress.apartment || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          pincode: String(shippingAddress.pinCode || ''),
        };

        // Check if this exact address already exists for this customer
        const existingAddress = await prisma.address.findFirst({
          where: {
            customerId: resolvedCustomerId,
            addressLine1: nextAddress.addressLine1,
            pincode: nextAddress.pincode,
          }
        });

        if (!existingAddress) {
          await prisma.address.create({
            data: {
              ...nextAddress,
              customerId: resolvedCustomerId
            }
          });
        }
      } catch (err) {
        console.error('Failed to save address to profile:', err.message);
        // Don't fail the whole order if address saving fails
      }
    }

    res.json({
      ...(razorpayOrder || {}),
      orderId: order.id,
      paymentMethod
    });
  } catch (error) {
    console.error('--- ORDER CREATION ERROR ---');
    console.error(error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      // Update order status to PAID
      const order = await prisma.order.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      });

      // Track the sale
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id }
      });

      await Promise.all(orderItems.map(item => 
        prisma.sale.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            source: 'Website'
          }
        })
      ));

      res.json({ message: "Payment verified successfully", order });
    } catch (error) {
      console.error('Error updating order after verification:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(400).json({ message: "Invalid signature sent!" });
  }
};
