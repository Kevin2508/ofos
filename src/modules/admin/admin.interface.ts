import { UserRoleStatus, UserStatus } from '../../generated/prisma/enums.ts';

interface GetAllUsersParams {
  search?: string;
  role?: string;
  status?: UserStatus;
}

interface UpdateUserRoleStatusPayload {
  userId: string;
  roleName: string;
  status: UserRoleStatus;
}

export { GetAllUsersParams, UpdateUserRoleStatusPayload };
