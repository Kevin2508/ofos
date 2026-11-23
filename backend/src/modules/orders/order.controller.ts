import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CancelOrderDto,
  DeclineAssignmentDto,
  GetCustomerOrdersQueryDto,
  GetOrdersQueryDto,
  RejectOrderDto,
  VerifyDeliveryOtpDto,
} from './dto/orders.dto';
import { OrderService } from './order.service';

@ApiTags('Orders & Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  // 1. Customer: List orders
  @Get()
  @Roles('Customer', 'Admin')
  @ApiOperation({ summary: 'Get customer order history with pagination' })
  async getCustomerOrders(
    @CurrentUser() user: any,
    @Query() query: GetCustomerOrdersQueryDto,
  ) {
    const userId = BigInt(user.id);
    return this.orderService.getCustomerOrders(userId, query.page || 1, query.limit || 10);
  }

  // 2. Kitchen / Owner: List branch orders
  @Get('branch')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Get orders for restaurants/branches owned or staffed by user' })
  async getBranchOrders(
    @CurrentUser() user: any,
    @Query() query: GetOrdersQueryDto,
  ) {
    const userId = BigInt(user.id);
    return this.orderService.getBranchOrders(userId, user.roles || [], query);
  }

  // 3. Delivery Partner: Accept assignment
  @Patch('assignments/:id/accept')
  @Roles('Delivery_partner', 'Admin')
  @ApiOperation({ summary: 'Delivery partner accepts an assigned delivery' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  async acceptAssignment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const assignmentId = this.parseBigInt(id, 'Assignment ID');
    const userId = BigInt(user.id);
    return this.orderService.acceptAssignment(assignmentId, userId);
  }

  // 4. Delivery Partner: Decline assignment
  @Patch('assignments/:id/decline')
  @Roles('Delivery_partner', 'Admin')
  @ApiOperation({ summary: 'Delivery partner declines an assigned delivery' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  async declineAssignment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: DeclineAssignmentDto,
  ) {
    const assignmentId = this.parseBigInt(id, 'Assignment ID');
    const userId = BigInt(user.id);
    return this.orderService.declineAssignment(assignmentId, userId, dto.reason);
  }

  // 5. Order Tracking
  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get live tracking details for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderTracking(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.getOrderTracking(orderId, userId, user.roles || []);
  }

  // 6. Order Details
  @Get(':id')
  @ApiOperation({ summary: 'Get full details of a specific order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderDetails(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.getOrderDetails(orderId, userId, user.roles || []);
  }

  // 7. Cancel Order
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (Customer if PLACED, or Admin anytime)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CancelOrderDto,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.cancelOrder(orderId, userId, user.roles || [], dto.reason);
  }

  // 8. Kitchen: Accept order
  @Patch(':id/accept')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Kitchen staff / owner accepts order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async acceptOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.acceptOrder(orderId, userId, user.roles || []);
  }

  // 9. Kitchen: Reject order
  @Patch(':id/reject')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Kitchen staff / owner rejects order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async rejectOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectOrderDto,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.rejectOrder(orderId, userId, user.roles || [], dto.reason);
  }

  // 10. Kitchen: Mark preparing
  @Patch(':id/preparing')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Kitchen marks order as preparing' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async markPreparing(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.markPreparing(orderId, userId, user.roles || []);
  }

  // 11. Kitchen: Mark ready for pickup
  @Patch(':id/ready')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Kitchen marks order ready for pickup and triggers auto-assignment' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async markReady(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.markReady(orderId, userId, user.roles || []);
  }

  // 12. Kitchen: Handover order
  @Patch(':id/handover')
  @Roles('Restaurant_owner', 'Restaurant_staff', 'Admin')
  @ApiOperation({ summary: 'Kitchen hands over order to delivery partner' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async handoverOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.handoverOrder(orderId, userId, user.roles || []);
  }

  // 13. Delivery Partner: Mark out for delivery
  @Patch(':id/out-for-delivery')
  @Roles('Delivery_partner', 'Admin')
  @ApiOperation({ summary: 'Delivery partner marks order out for delivery' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async markOutForDelivery(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.markOutForDelivery(orderId, userId);
  }

  // 14. Delivery Partner: Deliver with OTP verification
  @Patch(':id/deliver')
  @Roles('Delivery_partner', 'Admin')
  @ApiOperation({ summary: 'Delivery partner verifies OTP and completes delivery' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async verifyAndDeliver(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: VerifyDeliveryOtpDto,
  ) {
    const orderId = this.parseBigInt(id, 'Order ID');
    const userId = BigInt(user.id);
    return this.orderService.verifyAndDeliver(orderId, userId, dto.otp);
  }
}
