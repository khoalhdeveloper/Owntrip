import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';
const router = Router();

router.post('/register', UserController.register);

router.post('/login', UserController.login);
router.post('/login/google', UserController.loginwithgoogle);

// Proxy cho Google Auth Expo Go
router.get('/google-proxy', (req, res) => {
  const deepLink = req.query.state as string;
  if (deepLink) {
    const qs = new URLSearchParams(req.query as any).toString();
    const redirectUrl = deepLink.includes('?') ? `${deepLink}&${qs}` : `${deepLink}?${qs}`;
    res.redirect(redirectUrl);
  } else {
    res.send("Missing state parameter for deep linking");
  }
});

router.get('/', verifyToken, authorizeRole(['admin']), UserController.getAllUsers);

router.get('/me', verifyToken, UserController.getMe);

router.post('/', verifyToken, authorizeRole(['admin']), UserController.createUser);

router.delete('/:id', verifyToken, authorizeRole(['admin']), UserController.deleteUser);

router.put('/:id', verifyToken, authorizeRole(['admin']), UserController.adminUpdateUser);

router.get('/myProfile/:id', verifyToken, UserController.getProfile);

router.put('/updateProfile/:id', verifyToken, UserController.updateProfile);

router.put('/updatePassword/:id',verifyToken, UserController.updatePassword);

router.post('/verifyEmail', UserController.verifyEmail);

router.post('/resendOTP', UserController.resendOTP);

// Forgot Password
router.post('/forgot-password/send-otp', UserController.forgotPasswordSendOTP);
router.post('/forgot-password/reset', UserController.forgotPasswordReset);

router.post('/top-up', verifyToken, UserController.topUpBalance);

router.post('/pay-with-points', verifyToken, UserController.payWithPoints);

// VNPay
router.post('/vnpay/create-payment', verifyToken, UserController.vnpayCreatePayment);
router.get('/vnpay/return', UserController.vnpayReturn);
router.post('/test-topup', verifyToken, authorizeRole(['admin']), UserController.testTopUpBalance);

module.exports = router;
