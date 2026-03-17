import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  getBestSellers,
  getNewArrivals,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id', patchProduct);
router.delete('/:id', deleteProduct);

export default router;
