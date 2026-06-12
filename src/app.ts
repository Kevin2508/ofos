(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { modifierRouter } from './modules/modifierGroupsAndOptions/modifier.routes.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { authPageRouter } from './routes/auth.pages.routes.ts';
import { restaurantRouter } from './modules/restaurantManagement/management.routes.ts';
import { customerRouter } from './modules/customer/customer.routes.ts';
import { restaurantStaffRouter } from './modules/restaurantStaff/restaurantStaff.routes.ts';
import { menuCategoryRouter } from './modules/menuCategory/menuCategory.routes.ts';
import { deliveryPartnerRouter } from './modules/deliveryPartner/deliveryPartner.routes.ts';
import { menuItemRouter } from './modules/menuItem/menuItem.routes.ts';
import { defaultPageRouter } from './routes/default.pages.routes.ts';
import { branchRouter } from './modules/restaurantBranches/branch.routes.ts';
import { fleetManagerRouter } from './modules/fleetManager/fleetManager.routes.ts';
import orderRoutes from './modules/orders/order.routes.ts';
import { refundRouter } from './modules/refund/refund.routes.ts';
import { adminRouter } from './modules/admin/admin.routes.ts';
import checkoutRouter from './modules/checkout/checkout.routes.ts';
import { customerPageRouter } from './routes/customer.pages.routes.ts';
import { adminPageRouter } from './routes/admin.pages.routes.ts';
import restrouter from './modules/restuarant/restaurant.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser('secret'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use(authPageRouter);
app.use(defaultPageRouter);

app.use(adminPageRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);

app.use(customerPageRouter);
app.use('/restaurants', restaurantRouter);
app.use('/customer', customerRouter);
app.use('/restaurants/:restaurantId/branches', branchRouter);
app.use('/modifier', modifierRouter);

app.use('/orders', orderRoutes);
app.use('/refund', refundRouter);

app.use('/delivery-partner', deliveryPartnerRouter);
app.use('/checkout', checkoutRouter);

app.use('/restaurant', restrouter);
app.use('/restaurant-staff', restaurantStaffRouter);
app.use(menuCategoryRouter);
app.use(menuItemRouter);
app.use('/restaurant-management', restaurantRouter);

app.use('/fleet-manager', fleetManagerRouter);

app.use(menuCategoryRouter);
app.use(menuItemRouter);

app.use(branchRouter);

// app.use(errorMiddleware);

// app.use((req, res) => {
//   res.render('default/notFound');
// });

export { app };