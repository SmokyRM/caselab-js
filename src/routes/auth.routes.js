import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authLoginRateLimiter } from '../middlewares/authLoginRateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validate({ body: registerSchema }),
  authController.register
);

authRouter.post(
  '/login',
  authLoginRateLimiter,
  validate({ body: loginSchema }),
  authController.login
);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.getCurrentUser);

export default authRouter;
