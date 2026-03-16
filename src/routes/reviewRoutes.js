import express from 'express';
import { createReview, getReviewsByProduct, getAllReviews, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', createReview);
router.get('/', getAllReviews);
router.get('/product/:productId', getReviewsByProduct);
router.delete('/:id', deleteReview);

export default router;
