import { UserRoleStatus, UserStatus } from '../../generated/prisma/enums.ts';

interface GetAllUsersParams {
  search?: string;
  role?: string;
  status?: UserStatus;
  limit?: number;
  page?: number;
}

interface UpdateUserRoleStatusPayload {
  userId: string;
  roleName: string;
  status: UserRoleStatus;
}

interface UpdateUserStatusPayload {
  userId: string;
  status: UserStatus;
  reason: string;
}

export { GetAllUsersParams, UpdateUserRoleStatusPayload, UpdateUserStatusPayload };
