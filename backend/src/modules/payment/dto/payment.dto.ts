import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentProvider } from '@prisma/client';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'ID of the order to initiate payment for', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({
    description: 'Payment provider / method',
    enum: PaymentProvider,
    example: PaymentProvider.RAZORPAY,
  })
  @IsEnum(PaymentProvider)
  paymentProvider!: PaymentProvider;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Order ID associated with the payment', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({ description: 'Provider Order ID received during initiation', example: 'ORD_1700000000_1' })
  @IsString()
  @IsNotEmpty()
  providerOrderId!: string;

  @ApiPropertyOptional({ description: 'Gateway payment ID (e.g., pay_xxxxx)', example: 'PAY_1700000000_1' })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @ApiProperty({ description: 'Payment outcome status', enum: ['SUCCESS', 'FAILED'], example: 'SUCCESS' })
  @IsString()
  @IsNotEmpty()
  status!: 'SUCCESS' | 'FAILED';

  @ApiPropertyOptional({ description: 'Cryptographic signature from payment gateway' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Failure reason description if payment failed' })
  @IsOptional()
  @IsString()
  failureReason?: string;
}
