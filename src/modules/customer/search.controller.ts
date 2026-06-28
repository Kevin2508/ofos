import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import { getPersonalizedFeed } from './customer.feed.service.ts';
import { searchRestaurantsAndDishes, getSearchSuggestions } from './customer.search.service.ts';

export const getFeed = catchAsync(async (req: Request, res: Response) => {
  const customerId = (req.user as any)?.id || 0;
  const feed = await getPersonalizedFeed(Number(customerId));
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  res.status(200).json({ status: 'success', data: serialize(feed) });
});

export const search = catchAsync(async (req: Request, res: Response) => {
  const { query = '', cuisine, rating, sort, lat, lon } = req.query;
  const filters = { cuisine, rating };
  
  const userLat = lat ? Number(lat) : undefined;
  const userLon = lon ? Number(lon) : undefined;

  const results = await searchRestaurantsAndDishes(query as string, filters, sort, userLat, userLon);
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  res.status(200).json({ status: 'success', data: serialize(results) });
});

export const searchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  const customerId = (req.user as any)?.id ? BigInt((req.user as any).id) : undefined;

  const suggestions = await getSearchSuggestions(query as string, customerId);
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  res.status(200).json({ status: 'success', data: serialize(suggestions) });
});
