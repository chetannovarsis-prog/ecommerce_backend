import express from 'express';
import { 
  login, 
  verifyOtp, 
  toggle2FA, 
  customerSignup, 
  customerLogin, 
  customerForgotPassword, 
  googleLogin,
  getAllCustomers
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/toggle-2fa', toggle2FA);

// Customer Routes
router.post('/customer/signup', customerSignup);
router.post('/customer/login', customerLogin);
router.post('/customer/forgot-password', customerForgotPassword);
router.post('/customer/google-login', googleLogin);
router.get('/customers', getAllCustomers);

export default router;
