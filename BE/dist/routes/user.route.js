"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', user_controller_1.UserController.register);
router.post('/login', user_controller_1.UserController.login);
router.post('/login/google', user_controller_1.UserController.loginwithgoogle);
// Proxy cho Google Auth Expo Go
router.get('/google-proxy', (req, res) => {
    const deepLink = req.query.state;
    if (deepLink) {
        const qs = new URLSearchParams(req.query).toString();
        const redirectUrl = deepLink.includes('?') ? `${deepLink}&${qs}` : `${deepLink}?${qs}`;
        res.redirect(redirectUrl);
    }
    else {
        res.send("Missing state parameter for deep linking");
    }
});
router.get('/', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.UserController.getAllUsers);
router.get('/me', auth_middleware_1.verifyToken, user_controller_1.UserController.getMe);
router.post('/', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.UserController.createUser);
router.delete('/:id', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.UserController.deleteUser);
router.put('/:id', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.UserController.adminUpdateUser);
router.get('/myProfile/:id', auth_middleware_1.verifyToken, user_controller_1.UserController.getProfile);
router.put('/updateProfile/:id', auth_middleware_1.verifyToken, user_controller_1.UserController.updateProfile);
router.put('/updatePassword/:id', auth_middleware_1.verifyToken, user_controller_1.UserController.updatePassword);
router.post('/verifyEmail', user_controller_1.UserController.verifyEmail);
router.post('/resendOTP', user_controller_1.UserController.resendOTP);
// Forgot Password
router.post('/forgot-password/send-otp', user_controller_1.UserController.forgotPasswordSendOTP);
router.post('/forgot-password/reset', user_controller_1.UserController.forgotPasswordReset);
router.post('/top-up', auth_middleware_1.verifyToken, user_controller_1.UserController.topUpBalance);
router.post('/pay-with-points', auth_middleware_1.verifyToken, user_controller_1.UserController.payWithPoints);
// VNPay
router.post('/vnpay/create-payment', auth_middleware_1.verifyToken, user_controller_1.UserController.vnpayCreatePayment);
router.get('/vnpay/return', user_controller_1.UserController.vnpayReturn);
router.post('/test-topup', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRole)(['admin']), user_controller_1.UserController.testTopUpBalance);
module.exports = router;
