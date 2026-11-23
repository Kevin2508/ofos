import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentProvider } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class PlaceOrderDto {
  @ApiProperty({
    example: 'COD',
    enum: PaymentProvider,
    description: 'Payment provider: COD, RAZORPAY, STRIPE',
  })
  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  paymentProvider!: PaymentProvider;

  @ApiPropertyOptional({
    example: 'Please leave at the door and ring the bell',
    description: 'Special delivery instructions for the order',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class RejectOrderDto {
  @ApiProperty({
    example: 'Kitchen overloaded with current orders',
    description: 'Reason for rejecting order',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Rejection reason must be at least 3 characters' })
  reason!: string;
}

export class CancelOrderDto {
  @ApiProperty({
    example: 'Ordered by mistake',
    description: 'Reason for cancelling order',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Cancellation reason must be at least 3 characters' })
  reason!: string;
}

export class VerifyDeliveryOtpDto {
  @ApiProperty({
    example: '123456',
    description: '4-6 digit delivery verification OTP',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'Delivery OTP must be 4 to 6 numeric digits' })
  otp!: string;
}

export class GetCustomerOrdersQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class GetOrdersQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter by order status',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: '1',
    description: 'Filter by restaurant branch ID (numeric)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'branchId must be numeric' })
  branchId?: string;
}

export class DeclineAssignmentDto {
  @ApiPropertyOptional({
    example: 'Vehicle breakdown',
    description: 'Reason for declining the delivery assignment',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
