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
  getMe,
  checkPhone,
  checkEmail,
  selectRole
} from './auth.controller.ts';
import { upload } from '../../middlewares/upload.middleware.ts';
import {
  forgotPasswordSchema,
  loginSchema,
  registerAdminSchema,
  registerDeliveryPartnerSchema,
  registerFleetManagerSchema,
  registerRestaurantOwnerSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  checkPhoneSchema,
  checkEmailSchema,
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

authRouter.post('/check-phone', validate(checkPhoneSchema), checkPhone);
authRouter.post('/check-email', validate(checkEmailSchema), checkEmail);

authRouter.get('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getMe);

authRouter.post('/refresh', refresh);

// Role Selection
authRouter.post('/select-role', authenticate, selectRole);

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
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  validate(registerRestaurantOwnerSchema),
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
  upload.single('governmentId'),
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
