import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class InitiateCheckoutDto {
  @ApiProperty({ example: '1', description: 'Selected delivery address ID' })
  @IsNotEmpty()
  addressId!: string | number;

  @ApiProperty({ example: 'DELIVERY', description: 'Delivery mode (DELIVERY, TAKEAWAY, ASAP, or SCHEDULED)' })
  @IsNotEmpty()
  @IsString()
  deliveryType!: string;

  @ApiPropertyOptional({ example: '2026-11-15T18:30:00.000Z', description: 'Scheduled delivery timestamp' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ example: '1', description: 'Selected payment method ID' })
  @IsOptional()
  paymentMethodId?: string | number;

  @ApiPropertyOptional({ example: '1', description: 'Applied coupon ID' })
  @IsOptional()
  couponId?: string | number;
}

export class EstimateDeliveryDto {
  @ApiProperty({ example: '1', description: 'Customer address ID for delivery estimation' })
  @IsNotEmpty()
  addressId!: string | number;
}
