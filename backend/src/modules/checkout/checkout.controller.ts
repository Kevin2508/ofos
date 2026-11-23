import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlaceOrderDto } from '../orders/dto/orders.dto';
import { OrderService } from '../orders/order.service';
import { CheckoutService } from './checkout.service';
import { EstimateDeliveryDto, InitiateCheckoutDto } from './dto/checkout.dto';

@ApiTags('Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Customer', 'Admin')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly orderService: OrderService,
  ) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a 15-minute checkout session from active cart' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async initiateCheckout(
    @CurrentUser() user: any,
    @Body() dto: InitiateCheckoutDto,
  ) {
    const userId = BigInt(user.id);
    return this.checkoutService.initiateCheckout(userId, dto);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get active checkout session details' })
  @ApiParam({ name: 'sessionId', description: 'Checkout Session ID' })
  async getCheckoutSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    const userId = BigInt(user.id);
    const sId = this.parseBigInt(sessionId, 'Session ID');
    return this.checkoutService.getCheckoutSession(userId, sId);
  }

  @Post(':sessionId/estimate-delivery')
  @ApiOperation({ summary: 'Calculate estimated distance and delivery time using Haversine formula' })
  @ApiParam({ name: 'sessionId', description: 'Checkout Session ID' })
  async estimateDelivery(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Body() dto: EstimateDeliveryDto,
  ) {
    const userId = BigInt(user.id);
    const sId = this.parseBigInt(sessionId, 'Session ID');
    return this.checkoutService.estimateDelivery(userId, sId, dto);
  }

  @Post(':sessionId/place-order')
  @ApiOperation({ summary: 'Place order from active checkout session' })
  @ApiParam({ name: 'sessionId', description: 'Checkout Session ID' })
  async placeOrder(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Body() dto: PlaceOrderDto,
  ) {
    const userId = BigInt(user.id);
    const sId = this.parseBigInt(sessionId, 'Session ID');
    const order = await this.orderService.placeOrder(userId, sId, dto);
    return {
      orderId: order.id.toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      otp: order.otp,
      message: 'Order placed successfully',
    };
  }
}
