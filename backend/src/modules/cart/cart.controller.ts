import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CartService } from './cart.service';
import { AddToCartDto, ApplyCouponDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Customer', 'Admin')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Get()
  @ApiOperation({ summary: 'Get active cart, items, live totals, and minimum order progress' })
  @ApiResponse({ status: 200, description: 'Active cart details' })
  async getCart(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item with modifiers to cart' })
  @ApiResponse({ status: 201, description: 'Item added and cart totals updated' })
  async addToCart(@CurrentUser() user: any, @Body() dto: AddToCartDto) {
    const userId = BigInt(user.id);
    return this.cartService.addToCart(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity or special instructions' })
  @ApiParam({ name: 'id', description: 'Cart Item ID' })
  async updateCartItem(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = BigInt(user.id);
    const itemId = this.parseBigInt(id, 'Cart Item ID');
    return this.cartService.updateCartItem(userId, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from active cart' })
  @ApiParam({ name: 'id', description: 'Cart Item ID' })
  async removeCartItem(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = BigInt(user.id);
    const itemId = this.parseBigInt(id, 'Cart Item ID');
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear active cart and mark it abandoned' })
  async clearCart(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.cartService.clearCart(userId);
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply promo coupon to active cart' })
  async applyCoupon(@CurrentUser() user: any, @Body() dto: ApplyCouponDto) {
    const userId = BigInt(user.id);
    return this.cartService.applyCoupon(userId, dto.code);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove applied coupon from active cart' })
  async removeCoupon(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.cartService.removeCoupon(userId);
  }

  @Get('price-breakdown')
  @ApiOperation({ summary: 'Get current price breakdown of active cart' })
  async getPriceBreakdown(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.cartService.getPriceBreakdown(userId);
  }
}
