import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createReview = async (req, res) => {
  try {
    const { rating, comment, userName, userEmail, productId } = req.body;
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        userName,
        userEmail,
        productId
      }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
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
