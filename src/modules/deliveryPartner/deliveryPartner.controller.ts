import { catchAsync } from '../../middlewares/catch.async.ts';
import { Request, Response } from 'express';
import {
  getProfileService,
  updateProfileService,
  updateStatusService,
} from './deliveryPartner.service.ts';

const getProfile = catchAsync(async (req: Request, res: Response) => {
  let data;
  if (req.user?.id) {
    data = await getProfileService(req.user?.id);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    user: data?.user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  let data;

  if (req.user?.id) {
    data = await updateProfileService(req.user?.id, req.body);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    user: data?.user,
  });
});

// Route: deliveryPartnerRouter.patch('/update/status', validate(updateStatusSchema), updateStatus);

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  let data;

  if (req.user?.id) {
    data = await updateStatusService(req.user.id, req.body.isOnline);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    data: {
      isOnline: data?.isOnline,
    },
  });
});

export { getProfile, updateProfile, updateStatus };
