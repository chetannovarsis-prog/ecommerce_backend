import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getBanners);
router.post('/', requireAdmin, createBanner);
router.put('/:id', requireAdmin, updateBanner);
router.delete('/:id', requireAdmin, deleteBanner);

export default router;
