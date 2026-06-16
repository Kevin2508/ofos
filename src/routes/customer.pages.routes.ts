import { Router } from 'express';

const customerPageRouter = Router();

customerPageRouter.get('/', (req, res) => {
  res.render('customer/dashboard');
});

// customerPageRouter.get('/forgotPasswordPage', (req, res) => {
//   res.render('customer/forgot-password');
// });

// customerPageRouter.get('/resetPasswordPage', (req, res) => {
//   res.render('customer/reset-password');
// });

// customerPageRouter.get('/registerPage', (req, res) => {
//   res.render('customer/register/customer');
// });

// customerPageRouter.get('/registerPage/admin', (req, res) => {
//   res.render('customer/register/admin');
// });

// customerPageRouter.get("/", (req, res) => {
//   res.render("customer/home");
// });

customerPageRouter.get("/restaurant/:id", (req, res, next) => {
  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("application/json") || !acceptHeader.includes("text/html")) {
    return next();
  }
  res.render("customer/restaurant");
});

customerPageRouter.get("/cart", (req, res) => {
  res.render("customer/cart");
});

customerPageRouter.get("/checkout", (req, res) => {
  res.render("customer/checkout");
});

customerPageRouter.get("/tracking/:id", (req, res) => {
  res.render("customer/order-tracking");
});

export { customerPageRouter };
