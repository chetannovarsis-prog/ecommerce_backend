import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getSettings);
router.post('/', requireAdmin, updateSettings);

export default router;
