import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER20', description: 'Unique coupon promo code' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ enum: CouponType, example: CouponType.PERCENTAGE, description: 'Discount type' })
  @IsNotEmpty()
  @IsEnum(CouponType)
  couponType!: CouponType;

  @ApiProperty({ example: 20, description: 'Discount value (percentage or flat amount)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ example: 200, description: 'Minimum order amount to qualify for discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum discount ceiling' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maximumDiscountAmount?: number;

  @ApiPropertyOptional({ example: 500, description: 'Total global usages allowed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Allowed usages per customer' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  perUserLimit?: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Start date of validity' })
  @IsNotEmpty()
  @IsDateString()
  validFrom!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', description: 'End date of validity' })
  @IsNotEmpty()
  @IsDateString()
  validUntil!: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the coupon is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: ['1', '2'], description: 'Restricted restaurant IDs (optional)' })
  @IsOptional()
  @IsArray()
  restaurantIds?: (string | number)[];
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'WELCOME50', description: 'Coupon promo code' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: '1', description: 'Branch ID to check applicability' })
  @IsOptional()
  restaurantBranchId?: string | number;

  @ApiPropertyOptional({ example: 350.5, description: 'Current cart subtotal value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cartValue?: number;
}
