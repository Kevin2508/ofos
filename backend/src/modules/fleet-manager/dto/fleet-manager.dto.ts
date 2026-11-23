import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryPartnerStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AssignDeliveryDto {
  @ApiProperty({ example: '3', description: 'User ID of the delivery partner to assign' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'partnerUserId must be numeric' })
  partnerUserId!: string;
}

export class ReassignDeliveryDto {
  @ApiProperty({ example: '4', description: 'User ID of the new delivery partner' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'newPartnerUserId must be numeric' })
  newPartnerUserId!: string;

  @ApiPropertyOptional({ example: 'Previous rider had flat tire' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateRiderStatusDto {
  @ApiProperty({ enum: DeliveryPartnerStatus, example: DeliveryPartnerStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(DeliveryPartnerStatus)
  status!: DeliveryPartnerStatus;
}

export class GetRidersQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true || value === '1' || value === 1 ? true : value === 'false' || value === false || value === '0' || value === 0 ? false : undefined))
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ enum: DeliveryPartnerStatus })
  @IsOptional()
  @IsEnum(DeliveryPartnerStatus)
  status?: DeliveryPartnerStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
