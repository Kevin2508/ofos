import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import {
  assignDeliveryService,
  getAllAssignmentsService,
  getAllDeliveryPartnersService,
  reassignDeliveryService,
  updateDeliveryPartnerStatusService,
} from './fleetManager.service.ts';
import { getDeliveryPartnerByIdService } from '../deliveryPartner/deliveryPartner.repository.ts';

const getAllDeliveryPartners = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;

    let isOnline: boolean | undefined = undefined;
    if (req.query.isOnline === 'true') isOnline = true;
    if (req.query.isOnline === 'false') isOnline = false;

    const result = await getAllDeliveryPartnersService({
      page,
      limit,
      status,
      isOnline,
    });

    res.status(200).json({
      success: true,
      message: 'Delivery partners fetched successfully',
      data: result,
    });
  }
);

const getDeliveryPartnerById = catchAsync(
  async (req: Request, res: Response) => {
    const partnerId = req.params.id;

    const partnerData = await getDeliveryPartnerByIdService(
      partnerId as string
    );

    if (!partnerData) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery partner profile fetched successfully',
      data: partnerData,
    });
  }
);

const updateDeliveryPartnerStatus = catchAsync(
  async (req: Request, res: Response) => {
    const partnerId = req.params.id;
    const { status } = req.body;

    const result = await updateDeliveryPartnerStatusService(
      partnerId as string,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Delivery partner status updated successfully',
      data: result,
    });
  }
);

const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  const result = await getAllAssignmentsService();

  res.status(200).json({
    success: true,
    message: 'Active assignments fetched successfully',
    data: result,
  });
});

const assignDelivery = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const { partnerUserId } = req.body;
  const assignedByUserId = (req as any).user.id;

  const result = await assignDeliveryService(
    orderId as string,
    partnerUserId,
    assignedByUserId
  );

  res.status(201).json({
    success: true,
    message: 'Order assigned successfully',
    data: result,
  });
});

const reassignDelivery = catchAsync(async (req: Request, res: Response) => {
  const assignmentId = req.params.id;
  const { partnerUserId } = req.body;
  const assignedByUserId = (req as any).user.id;

  const result = await reassignDeliveryService(
    assignmentId as string,
    partnerUserId,
    assignedByUserId
  );

  res.status(200).json({
    success: true,
    message: 'Order reassigned successfully',
    data: result,
  });
});

export {
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  reassignDelivery,
  assignDelivery,
  getAllAssignments,
  updateDeliveryPartnerStatus,
};
