import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();


router.post('/register', UserController.register);


router.get('/:id', UserController.getProfile);

router.post('/login', UserController.login);

module.exports = router;