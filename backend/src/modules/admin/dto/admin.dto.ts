import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  RestaurantStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRoleStatus,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by user status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by role name (e.g., Customer, Restaurant_owner)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateUserRoleStatusDto {
  @ApiProperty({ description: 'Role ID to update', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;

  @ApiProperty({ description: 'New status for the assigned role', enum: UserRoleStatus })
  @IsEnum(UserRoleStatus)
  status!: UserRoleStatus;
}

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'New account status', enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Reason for suspension or status change', example: 'Policy violation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateRestaurantStatusDto {
  @ApiProperty({
    description: 'New onboarding / operating status',
    enum: RestaurantStatus,
    example: RestaurantStatus.APPROVED,
  })
  @IsEnum(RestaurantStatus)
  status!: RestaurantStatus;

  @ApiPropertyOptional({ description: 'Reason for rejection or suspension', example: 'Missing valid FSSAI license' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateDocumentStatusDto {
  @ApiProperty({
    description: 'Document verification outcome',
    enum: VerificationStatus,
    example: VerificationStatus.APPROVED,
  })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiPropertyOptional({ description: 'Rejection reason if rejected', example: 'Illegible photocopy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Alternative reason field alias', example: 'Illegible photocopy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class GetAuditLogsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g., User, Restaurant)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by action (e.g., UPDATE_STATUS, APPROVE)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by actor user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actorUserId?: number;
}

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Configuration key', example: 'PLATFORM_COMMISSION_PERCENTAGE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  configKey!: string;

  @ApiProperty({ description: 'Configuration value', example: '10.0' })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ description: 'Configuration key to update', example: 'PLATFORM_COMMISSION_PERCENTAGE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  configKey!: string;

  @ApiProperty({ description: 'New configuration value', example: '12.0' })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class TicketRespondDto {
  @ApiProperty({ description: 'Staff response message to the customer/partner' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class TicketResolveDto {
  @ApiPropertyOptional({ description: 'Resolution remarks or notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class CreateTicketDto {
  @ApiProperty({ description: 'Order ID associated with the dispute or issue', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({ enum: TicketCategory, example: TicketCategory.MISSING_ITEM })
  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.MEDIUM;

  @ApiProperty({ example: 'Item missing from order' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ example: 'The garlic bread was not in the package.' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
