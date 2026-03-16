import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        product: {
          select: { name: true, thumbnailUrl: true, images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSales = sales.map(s => ({
      id: s.id,
      productName: s.product.name,
      thumbnail: s.product.thumbnailUrl || s.product.images[0],
      quantity: s.quantity,
      price: s.price,
      source: s.source,
      date: s.createdAt
    }));

    res.json(formattedSales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerStoreSale = async (req, res) => {
  const { productId, quantity, price } = req.body;

  try {
    // 1. Create Sale record
    const sale = await prisma.sale.create({
      data: {
        productId,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        source: 'Store'
      }
    });

    // 2. Update Product Stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: parseInt(quantity) }
      }
    });

    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
