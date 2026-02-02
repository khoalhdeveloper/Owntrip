import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyToken, authorizeRole } from '../middlewares/auth.middleware';
const router = Router();

router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.get('/myProfile/:id', verifyToken, UserController.getProfile);

router.put('/updateProfile/:id', verifyToken, UserController.updateProfile);

router.put('/updatePassword/:id',verifyToken, UserController.updatePassword);

router.post('/verifyEmail', UserController.verifyEmail);

router.post('/resendOTP', UserController.resendOTP);


module.exports = router;