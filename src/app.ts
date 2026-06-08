import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { authRouter } from './modules/auth/auth.routes.ts';
import { errorMiddleware } from './middlewares/error.middleware.ts';
import { authPageRouter } from './routes/auth.pages.routes.ts';
import { deliveryPartnerRouter } from './modules/deliveryPartner/deliveryPartner.routes.ts';
import { defaultPageRouter } from './routes/default.pages.routes.ts';
import { restaurantRouter } from './modules/restaurantManagement/management.routes.ts';

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
app.use('/delivery-partner', deliveryPartnerRouter);
app.use(restaurantRouter);

app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);

app.use(errorMiddleware);

// app.use((req, res) => {
//   res.render('default/notFound');
// });

export { app };
