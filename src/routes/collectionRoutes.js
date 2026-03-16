import express from 'express';
import { getCollections, createCollection, updateCollection, deleteCollection, getCollectionById, reorderCollections } from '../controllers/collectionController.js';

const router = express.Router();

router.get('/', getCollections);
router.post('/', createCollection);
router.post('/reorder', reorderCollections);
router.get('/:id', getCollectionById);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);


export default router;
