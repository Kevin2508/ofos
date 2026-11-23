import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { PayoutStatus, RefundStatus } from '@prisma/client';

export class UpdateRefundStatusDto {
  @ApiProperty({
    description: 'New status for the refund',
    enum: RefundStatus,
    example: RefundStatus.COMPLETED,
  })
  @IsEnum(RefundStatus)
  status!: RefundStatus;
}

export class UpdatePayoutStatusDto {
  @ApiProperty({
    description: 'New status for the payout',
    enum: PayoutStatus,
    example: PayoutStatus.PAID,
  })
  @IsEnum(PayoutStatus)
  status!: PayoutStatus;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Order ID to initiate refund for', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({ description: 'Reason for the refund', example: 'Customer cancelled prior to preparation' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class FinanceQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}
