import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @Roles('Customer')
  @ApiOperation({ summary: 'Initiate online or cash-on-delivery payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  async initiatePayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentService.initiatePayment(BigInt(userId), dto);
  }

  @Post('verify')
  @Roles('Customer')
  @ApiOperation({ summary: 'Verify payment gateway signature and transition order payment status' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  async verifyPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyPayment(BigInt(userId), dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get payment details, events, and refund status for an order' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  async getPaymentDetails(
    @CurrentUser() user: { id: string; roles?: string[] },
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getPaymentDetails(
      BigInt(user.id),
      user.roles || [],
      orderId,
    );
  }
}
