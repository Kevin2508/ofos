import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  registerAdmin,
  registerDeliveryPartner,
  registerFinanceManager,
  registerFleetManager,
  registerRestaurantOwner,
  registerRestaurantStaff,
  resetPassword,
  sendOtp,
  verigyOtp,
} from './auth.controller.ts';
import {
  forgotPasswordSchema,
  loginSchema,
  registerAdminSchema,
  registerDeliveryPartnerSchema,
  registerFleetManagerSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from './auth.validation.ts';

const authRouter = Router();

authRouter.post('/login', validate(loginSchema), login);
// authRouter.post('/google', loginGoogle);

authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  forgotPassword
);
authRouter.post(
  '/reset-password/:resetToken',
  validate(resetPasswordSchema),
  resetPassword
);

authRouter.post('/send-otp', validate(sendOtpSchema), sendOtp);
authRouter.post('/verify-otp', validate(verifyOtpSchema), verigyOtp);

authRouter.get('/logout', authenticate, logout);

authRouter.post('/refresh', refresh);

// Customer
authRouter.post('/register', validate(registerSchema), register);

// Platform Admin
authRouter.post(
  '/register/admin',
  validate(registerAdminSchema),
  registerAdmin
);

// Restaurant Owner
authRouter.post(
  '/register/restaurant-owner',
  validate(registerSchema),
  registerRestaurantOwner
);

// Restaurant Staff
authRouter.post(
  '/register/restaurant-staff',
  validate(registerSchema),
  registerRestaurantStaff
);

// Delivery Partner
authRouter.post(
  '/register/delivery-partner',
  validate(registerDeliveryPartnerSchema),
  registerDeliveryPartner
);

// // Fleet Manager
authRouter.post(
  '/register/fleet-manager',
  validate(registerFleetManagerSchema),
  registerFleetManager
);

// Finance Manager
authRouter.post(
  '/register/finance-manager',
  validate(registerSchema),
  registerFinanceManager
);

export { authRouter };
