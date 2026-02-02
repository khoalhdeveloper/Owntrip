import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();


router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.get('/myProfile/:id', UserController.getProfile);

module.exports = router;