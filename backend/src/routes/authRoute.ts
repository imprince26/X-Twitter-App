import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  deactivateAccount,
  checkUsername,
  checkEmail,
  verifyAuthToken
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/check-username/:username', checkUsername);
router.get('/check-email/:email', checkEmail);

// Protected routes (require authentication)
router.get('/me', authenticate, getMe);
router.post('/resend-verification', authenticate, resendVerification);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);
router.delete('/deactivate', authenticate, deactivateAccount);
router.get('/verify-token', authenticate, verifyAuthToken);

export default router;