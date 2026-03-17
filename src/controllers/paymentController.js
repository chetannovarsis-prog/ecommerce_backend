import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt, items, customerId, paymentMethod, shippingAddress } = req.body;
  
  console.log('--- CREATING ORDER ---');
  console.log('Body:', { amount, currency, receipt, customerId, paymentMethod });
  console.log('Items Count:', items?.length);

  try {
    let razorpayOrder = null;
    
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

    // Create a pending order in our database
    console.log('Creating database order...');
    const order = await prisma.order.create({
      data: {
        totalAmount: amount,
        status: paymentMethod === 'cod' ? 'COD_PENDING' : 'PENDING',
        customerId: customerId || null,
        razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
        paymentMethod: paymentMethod,
        shippingAddress: shippingAddress,
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
