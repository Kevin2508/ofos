(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';


import { modifierRouter } from './modules/modifierGroupsAndOptions/modifier.routes.ts';

import { authRouter } from './modules/auth/auth.routes.ts';
import { errorMiddleware } from './middlewares/error.middleware.ts';
import { authPageRouter } from './routes/auth.pages.routes.ts';


import { restaurantRouter } from './modules/restaurantManagement/management.routes.ts';
import { customerRouter } from './modules/customer/customer.routes.ts';

import { restaurantStaffRouter } from './modules/restaurantStaff/restaurantStaff.routes.ts';
import { menuCategoryRouter } from './modules/menuCategory/menuCategory.routes.ts';


import { deliveryPartnerRouter } from './modules/deliveryPartner/deliveryPartner.routes.ts';

<<<<<<< HEAD

import { menuItemRouter } from './modules/menuItem/menuItem.routes.ts';
import { defaultPageRouter } from './routes/default.pages.routes.ts';
=======
>>>>>>> 7eeaa2a (fixed cart)
import { branchRouter } from './modules/restaurantBranches/branch.routes.ts';
<<<<<<< HEAD
import { fleetManagerRouter } from './modules/fleetManager/fleetManager.routes.ts';
import restaurantRoter from './modules/restuarant/restaurant.routes.ts';
import { adminRouter } from './modules/admin/admin.routes.ts';
=======
import cartRouter from './modules/cart/cart.routes.ts';
>>>>>>> 4308db9 (created cart)

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
<<<<<<< HEAD
app.use(defaultPageRouter);
=======
app.use(restaurantRouter);
app.use('/cart',cartRouter)

>>>>>>> 7eeaa2a (fixed cart)
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/customer', customerRouter);
app.use('/modifier', modifierRouter);
app.use('/delivery-partner', deliveryPartnerRouter);

app.use('/restaurant', restaurantStaffRouter);
app.use(menuCategoryRouter);
app.use(menuItemRouter);
app.use('/restaurant-management', restaurantRouter);
app.use('/restaurants', restaurantRoter);
app.use('/fleet-manager', fleetManagerRouter);

app.use('/restaurants/:restaurantId/branches', branchRouter);
app.use('/restaurants', restaurantRouter);
app.use(customerRouter);
app.use('/customer', customerRouter);
app.use('/restaurant', restaurantStaffRouter);
app.use(menuCategoryRouter);

app.use(defaultPageRouter);
app.use('/delivery-partner', deliveryPartnerRouter);
app.use(branchRouter);
app.use('/restaurants/:restaurantId/branches',branchRouter);
app.use(restaurantRouter);

app.use('/restaurants', restaurantRouter);


// app.use(errorMiddleware);

// app.use((req, res) => {
//   res.render('default/notFound');
// });

export { app };
