import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createReview = async (req, res) => {
  try {
    let { rating, comment, userName, name, userEmail, email, productId } = req.body;
    
    // Support aliases
    const finalUserName = userName || name || 'Anonymous';
    const finalUserEmail = userEmail || email || 'anonymous@example.com';

    // Resolve productId if it's a handle
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isUuid) {
      const product = await prisma.product.findUnique({ where: { handle: productId } });
      if (product) productId = product.id;
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        userName: finalUserName,
        userEmail: finalUserEmail,
        productId
      }
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    let { productId } = req.params;
    
    // Resolve productId if it's a handle
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isUuid) {
      const product = await prisma.product.findUnique({ where: { handle: productId } });
      if (product) productId = product.id;
      else return res.json([]); // If handle not found, return empty reviews
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id }
    });
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
