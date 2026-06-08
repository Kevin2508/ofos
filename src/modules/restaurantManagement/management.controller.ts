import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import {
  createRestaurantDto,
  pauseRestaurantDto,
  restaurantParamsDto,
  updateRestaurantDto,
  uploadDocumentDto,
} from './management.dto.ts';
import {
  deactivateRestaurantService,
  getMyRestaurantsService,
  pauseRestaurantService,
  registerRestaurantService,
  resumeRestaurantService,
  updateRestaurantService,
  uploadCoverService,
  uploadDocumentService,
  uploadLogoService,
} from './management.service.ts';

// POST /restaurants
<<<<<<< HEAD
export const registerRestaurant = catchAsync(
=======
const registerRestaurant = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (req: Request<{}, {}, createRestaurantDto>, res: Response) => {
    const ownerUserId = BigInt((req as any).user.id);
    const data = await registerRestaurantService(ownerUserId, req.body);

    res.status(201).json({ status: 'success', ...data });
  }
);

// GET /restaurants/mine
<<<<<<< HEAD
export const getMyRestaurants = catchAsync(async (req: Request, res: Response) => {
=======
const getMyRestaurants = catchAsync(async (req: Request, res: Response) => {
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  const ownerUserId = BigInt((req as any).user.id);
  const data = await getMyRestaurantsService(ownerUserId);

  res.status(200).json({ status: 'success', ...data });
});

// PATCH /restaurants/:id
<<<<<<< HEAD
export const updateRestaurant = catchAsync(
=======
const updateRestaurant = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (
    req: Request<restaurantParamsDto, {}, updateRestaurantDto>,
    res: Response
  ) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);
    const data = await updateRestaurantService(id, ownerUserId, req.body);

    res.status(200).json({ status: 'success', ...data });
  }
);

// POST /restaurants/:id/logo
<<<<<<< HEAD
export const uploadLogo = catchAsync(
=======
const uploadLogo = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (req: Request<restaurantParamsDto>, res: Response) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);

    const logoUrl: string | undefined = req.file?.path;
    if (!logoUrl) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'No file uploaded' });
    }

    const data = await uploadLogoService(id, ownerUserId, logoUrl);
    res.status(200).json({ status: 'success', ...data });
  }
);

// POST /restaurants/:id/cover
<<<<<<< HEAD
export const uploadCover = catchAsync(
=======
const uploadCover = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (req: Request<restaurantParamsDto>, res: Response) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);

    const coverImageUrl: string | undefined = req.file?.path;
    if (!coverImageUrl) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'No file uploaded' });
    }

    const data = await uploadCoverService(id, ownerUserId, coverImageUrl);
    res.status(200).json({ status: 'success', ...data });
  }
);

// POST /restaurants/:id/documents
<<<<<<< HEAD
export const uploadDocument = catchAsync(
=======
const uploadDocument = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (
    req: Request<restaurantParamsDto, {}, uploadDocumentDto>,
    res: Response
  ) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);

    const documentUrl: string | undefined = req.file?.path;
    if (!documentUrl) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'No file uploaded' });
    }

    const data = await uploadDocumentService(
      id,
      ownerUserId,
      req.body,
      documentUrl
    );
    res.status(201).json({ status: 'success', ...data });
  }
);

// PATCH /restaurants/:id/pause
<<<<<<< HEAD
export const pauseRestaurant = catchAsync(
=======
const pauseRestaurant = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (
    req: Request<restaurantParamsDto, {}, pauseRestaurantDto>,
    res: Response
  ) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);
    const data = await pauseRestaurantService(id, ownerUserId, req.body);

    res.status(200).json({ status: 'success', ...data });
  }
);

// PATCH /restaurants/:id/resume
<<<<<<< HEAD
export const resumeRestaurant = catchAsync(
=======
const resumeRestaurant = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (req: Request<restaurantParamsDto>, res: Response) => {
    const ownerUserId = BigInt((req as any).user.id);
    const id = BigInt(req.params.id);
    const data = await resumeRestaurantService(id, ownerUserId);

    res.status(200).json({ status: 'success', ...data });
  }
);

// DELETE /restaurants/:id  — admin only
<<<<<<< HEAD
export const deactivateRestaurant = catchAsync(
=======
const deactivateRestaurant = catchAsync(
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
  async (req: Request<restaurantParamsDto>, res: Response) => {
    const id = BigInt(req.params.id);
    const data = await deactivateRestaurantService(id);

    res.status(200).json({ status: 'success', ...data });
  }
);
<<<<<<< HEAD
=======

export {
  deactivateRestaurant,
  getMyRestaurants,
  pauseRestaurant,
  registerRestaurant,
  resumeRestaurant,
  updateRestaurant,
  uploadCover,
  uploadDocument,
  uploadLogo,
};
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
