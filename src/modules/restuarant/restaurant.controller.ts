import { Request, Response } from 'express';
import * as restaurantService from './restaurant.service.ts';
import { RestaurantListDto } from './restaurant.dto.ts';
import { RestaurantParams } from './restaurant.interface.ts';
import { User } from '../../types/express.d.ts';

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

export async function getRestaurantDetails(req: Request<RestaurantParams>, res: Response) {
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
  req: Request<RestaurantParams>, res: Response
) {
  try {
    const { id } = req.params;

    const menu =
      await restaurantService.getRestaurantMenu(
        id
      );

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

export const getFeaturedRestaurants = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    const result =
      await restaurantService.getFeaturedRestaurants(
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
}