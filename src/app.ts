(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorMiddleware } from './middlewares/error.middleware.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { customerRouter } from './modules/customer/customer.routes.ts';
import { authPageRouter } from './routes/auth.pages.routes.ts';

import { menuCategoryRouter } from './modules/menuCategory/menuCategory.routes.ts';
import { restaurantStaffRouter } from './modules/restaurantStaff/restaurantStaff.routes.ts';

import { deliveryPartnerRouter } from './modules/deliveryPartner/deliveryPartner.routes.ts';
import { restaurantRouter } from './modules/restaurantManagement/management.routes.ts';
import { defaultPageRouter } from './routes/default.pages.routes.ts';

import { fleetManagerRouter } from './modules/fleetManager/fleetManager.routes.ts';
import { branchRouter } from './modules/restaurantBranches/branch.routes.ts';
import restaurantRoter from './modules/restuarant/restaurant.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser('secret'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use(authPageRouter);
app.use(defaultPageRouter);
app.use('/auth', authRouter);
app.use('/customer', customerRouter);
app.use('/restaurant', restaurantStaffRouter);
app.use(menuCategoryRouter);
app.use('/delivery-partner', deliveryPartnerRouter);
app.use('/restaurant-management', restaurantRouter);
app.use('/restaurants', restaurantRoter);
app.use('/restaurants/:restaurantId/branches', branchRouter);
app.use('/fleet-manager', fleetManagerRouter);

app.use(errorMiddleware);

// app.use((req, res) => {
//   res.render('default/notFound');
// });

export { app };
