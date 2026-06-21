import { Request, Response } from 'express';
import { RestaurantParams } from './restaurant.interface.ts';
import * as restaurantService from './restaurant.service.ts';

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantService.getRestaurants(req.query);

    return res.status(200).json({
      success: true,
      message: 'Restaurants fetched successfully',
      data: restaurants,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGlobalMenuItems = async (req: Request, res: Response) => {
  try {
    const items = await restaurantService.getGlobalMenuItems(req.query);
    return res.status(200).json({
      success: true,
      message: 'Menu items fetched successfully',
      data: items,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export async function getRestaurantDetails(
  req: Request<RestaurantParams>,
  res: Response
) {
  try {
    const { id } = req.params;

    const restaurant = await restaurantService.getRestaurantDetails(id);

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getRestaurantMenu(
  req: Request<RestaurantParams>,
  res: Response
) {
  try {
    const { id } = req.params;

    const menu = await restaurantService.getRestaurantMenu(id);

    return res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getBranchDetails(
  req: Request<RestaurantParams>,
  res: Response
) {
  try {
    const { id } = req.params;
    const branch = await restaurantService.getBranchDetails(id);

    return res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getBranchMenu(
  req: Request<RestaurantParams>,
  res: Response
) {
  try {
    const { id } = req.params;
    const menu = await restaurantService.getBranchMenu(id);

    return res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const getFeaturedRestaurants = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await restaurantService.getFeaturedRestaurants(
      userId as string | undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
