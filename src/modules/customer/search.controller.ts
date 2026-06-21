import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import { getPersonalizedFeed } from './customer.feed.service.ts';
import { searchRestaurantsAndDishes } from './customer.search.service.ts';

export const getFeed = catchAsync(async (req: Request, res: Response) => {
  const customerId = (req.user as any)?.id || 0;
  const feed = await getPersonalizedFeed(Number(customerId));
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  res.status(200).json({ status: 'success', data: serialize(feed) });
});

export const search = catchAsync(async (req: Request, res: Response) => {
  const { query = '', cuisine, rating, sort } = req.query;
  const filters = { cuisine, rating };
  const results = await searchRestaurantsAndDishes(query as string, filters, sort);
  const serialize = (v: any) => JSON.parse(JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val)));
  res.status(200).json({ status: 'success', data: serialize(results) });
});
