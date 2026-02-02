import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();


router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.get('/myProfile/:id', UserController.getProfile);

router.put('/updateProfile/:id', UserController.updateProfile);

router.put('/updatePassword/:id', UserController.updatePassword);

module.exports = router;