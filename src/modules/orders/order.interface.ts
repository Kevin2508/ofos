import { Request } from "express";

export interface GetOrdersQuery {
  page?: string;
  limit?: string;
}

export interface AuthenticatedRequest extends Request<{}, {}, {}, GetOrdersQuery> {
  user?: {
    id: string | number;
  };
}