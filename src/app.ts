(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorMiddleware } from './middlewares/error.middleware.ts';
import { adminRouter } from './modules/admin/admin.routes.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import cartRouter from './modules/cart/cart.routes.ts';
import checkoutRouter from './modules/checkout/checkout.routes.ts';
import couponRouter from './modules/coupon/coupons.routes.ts';
import { customerRouter } from './modules/customer/customer.routes.ts';
import { deliveryPartnerRouter } from './modules/deliveryPartner/deliveryPartner.routes.ts';
import { financeRouter } from './modules/finance/finance.routes.ts';
import { fleetManagerRouter } from './modules/fleetManager/fleetManager.routes.ts';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes.ts';
import { menuCategoryRouter } from './modules/menuCategory/menuCategory.routes.ts';
import { menuItemRouter } from './modules/menuItem/menuItem.routes.ts';
import { modifierRouter } from './modules/modifierGroupsAndOptions/modifier.routes.ts';
import orderRoutes from './modules/orders/order.routes.ts';
import { paymentRouter } from './modules/payment/payment.routes.ts';
import { refundRouter } from './modules/refund/refund.routes.ts';
import { branchRouter } from './modules/restaurantBranches/branch.routes.ts';
import { restaurantManagementRouter } from './modules/restaurantManagement/management.routes.ts';
import { restaurantStaffRouter } from './modules/restaurantStaff/restaurantStaff.routes.ts';
import { restaurantRouter } from './modules/restuarant/restaurant.routes.ts';
import reviewsRouter from './modules/reviews/reviews.routes.ts';
import { adminPageRouter } from './routes/admin.pages.routes.ts';
import { authPageRouter } from './routes/auth.pages.routes.ts';
import { customerPageRouter } from './routes/customer.pages.routes.ts';
import { defaultPageRouter } from './routes/default.pages.routes.ts';
import { deliveryPartnerPageRouter } from './routes/deliveryPartner.pages.routes.ts';
import { financePageRouter } from './routes/finance.pages.routes.ts';
import { fleetManagerPageRouter } from './routes/fleetManager.pages.routes.ts';
import { restaurantOwnerPageRouter } from './routes/restaurantOwner.pages.routes.ts';
import { restaurantStaffPageRouter } from './routes/restaurantStaff.pages.routes.ts';
import { userPageRouter } from './routes/user.pages.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser('secret'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API working",
  });
});

app.post("/users", (req, res) => {
  res.json({
    success: true,
    data: req.body,
  });
});

app.use('/auth', authRouter);
app.use('/menu-category', menuCategoryRouter);
app.use('/menu-item', menuItemRouter);
app.use('/admin', adminRouter);
app.use('/finance', financeRouter);
app.use('/customer', customerRouter);
app.use('/modifier', modifierRouter);
app.use('/cart', cartRouter);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewsRouter);
app.use('/refund', refundRouter);
app.use('/coupons', couponRouter);
app.use('/delivery-partner', deliveryPartnerRouter);
app.use('/checkout', checkoutRouter);
app.use('/restaurant', restaurantRouter);
app.use('/restaurant-staff', restaurantStaffRouter);
app.use('/restaurant-management', restaurantManagementRouter);
app.use('/restaurant-management/:restaurantId/branches', branchRouter);
app.use('/fleet-manager', fleetManagerRouter);
app.use('/payments', paymentRouter)
app.use('/loyalty', loyaltyRouter)

// Routes
app.use(authPageRouter);
app.use(defaultPageRouter);
app.use(userPageRouter);
app.use("/c", customerPageRouter);
app.use("/d", deliveryPartnerPageRouter);
app.use("/a", adminPageRouter);
app.use("/ro", restaurantOwnerPageRouter);
app.use("/rs", restaurantStaffPageRouter);
app.use("/fl", fleetManagerPageRouter);
app.use("/fi", financePageRouter);

app.use(errorMiddleware);

app.use((req, res) => {
  res.render('default/notFound');
});

export { app };