import express from 'express';
import { validateAddress, saveAddress } from '../controllers/addressController.js';
// Note: You may want to add authentication middleware later for saveAddress
// import { protect } from '../middleware/auth.js'; 

const router = express.Router();

router.post('/validate', validateAddress);
// router.post('/', protect, saveAddress);

export default router;
