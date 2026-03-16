import express from 'express';
import { getCategories, createCategory, getCategoryById, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);

export default router;
