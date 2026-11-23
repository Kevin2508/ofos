import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { CouponService } from './coupon.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Get()
  @ApiOperation({ summary: 'List applicable coupons by user role' })
  @ApiResponse({ status: 200, description: 'List of coupons' })
  async getCoupons(@CurrentUser() user: any) {
    const userId = user?.id ? BigInt(user.id) : undefined;
    return this.couponService.findAll(user?.roles || [], userId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon code against branch and cart requirements' })
  async validateCoupon(
    @CurrentUser() user: any,
    @Body() dto: ValidateCouponDto,
  ) {
    const userId = BigInt(user.id);
    return this.couponService.validateCoupon(userId, dto);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Restaurant_owner')
  @ApiOperation({ summary: 'Create new promo coupon (Admin or Restaurant Owner)' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async createCoupon(
    @CurrentUser() user: any,
    @Body() dto: CreateCouponDto,
  ) {
    return this.couponService.createCoupon(user, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a coupon (Admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  async deleteCoupon(@Param('id') id: string) {
    const couponId = this.parseBigInt(id, 'Coupon ID');
    return this.couponService.deleteCoupon(couponId);
  }
}
