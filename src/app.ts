import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { authRouter } from './modules/auth/auth.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { authPageRouter } from './routes/auth.pages.routes.ts';
import { restaurantStaffRouter } from './modules/restaurantStaff/restaurantStaff.routes.ts';
import { menuCategoryRouter } from './modules/menuCategory/menuCategory.routes.ts';


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
app.use('/auth', authRouter);
app.use('/restaurant', restaurantStaffRouter);
app.use(menuCategoryRouter);

app.use(errorMiddleware);

// app.use((req, res) => {
//   res.render('default/notFound');
// });

export { app };
