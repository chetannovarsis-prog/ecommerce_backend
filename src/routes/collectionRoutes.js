import express from 'express';
import { getCollections, createCollection, getCollectionById, deleteCollection, updateCollection } from '../controllers/collectionController.js';

const router = express.Router();

router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
