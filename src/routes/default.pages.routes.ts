import { Router } from 'express';

const defaultPageRouter = Router();

defaultPageRouter.get('/pendingVerificationPage', (req, res) => {
  res.render('default/pendingVerification');
});

export { defaultPageRouter };
