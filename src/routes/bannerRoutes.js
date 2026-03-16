import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', getBanners);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
