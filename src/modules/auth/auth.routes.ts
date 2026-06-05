import { Router } from 'express';
import { validate } from '../../middlewares/validation.middleware.ts';
import { register } from './auth.controller.ts';
import { registerSchema } from './auth.validation.ts';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);

// authRouter.post('/login', validate(loginSchema), login);

// authRouter.post(
//   '/forgot-password',
//   validate(forgotPasswordSchema),
//   forgotPassword
// );

// authRouter.post(
//   '/reset-password/:resetToken',
//   validate(resetPasswordSchema),
//   resetPassword
// );

// authRouter.post('/send-otp', validate(sendOtpSchema), sendOtp);

// authRouter.post('/verify-otp', validate(verigyOtpSchema), verigyOtp);

// authRouter.get('/logout', authenticate, logout);

export { authRouter };
