import { Router } from 'express';

const userPageRouter = Router();

userPageRouter.get('/', (req, res) => {
    res.render('user/dashboard');
});

userPageRouter.get('/restaurant/:id', (req, res, next) => {
  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("application/json") || !acceptHeader.includes("text/html")) {
    return next();
  }
  res.render('user/restaurant');
});

export { userPageRouter };
