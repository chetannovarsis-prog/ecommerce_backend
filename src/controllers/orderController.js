import prisma from '../utils/prisma.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, thumbnailUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatting if needed for the admin view
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer: order.customer,
      createdAt: order.createdAt,
      total: order.totalAmount, // Map totalAmount to total for the frontend
      status: order.status,
      items: order.items,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
