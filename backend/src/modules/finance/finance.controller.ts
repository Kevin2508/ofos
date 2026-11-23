import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateRefundDto,
  FinanceQueryDto,
  UpdatePayoutStatusDto,
  UpdateRefundStatusDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Finance_manager', 'Admin')
@ApiBearerAuth('JWT-auth')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overall platform financial stats (GMV, revenue, refunds, payouts)' })
  @ApiResponse({ status: 200, description: 'Financial overview statistics' })
  async getOverview() {
    return this.financeService.getOverview();
  }

  // Refunds
  @Get('refunds')
  @ApiOperation({ summary: 'Get paginated list of all customer refund requests' })
  @ApiResponse({ status: 200, description: 'Paginated refunds list' })
  async getRefunds(@Query() query: FinanceQueryDto) {
    return this.financeService.getRefunds(query);
  }

  @Post('refunds')
  @ApiOperation({ summary: 'Manually initiate a refund for an eligible cancelled order' })
  @ApiResponse({ status: 201, description: 'Refund initiated' })
  async createRefund(@Body() dto: CreateRefundDto) {
    return this.financeService.createRefund(dto);
  }

  @Patch('refunds/:id/status')
  @ApiOperation({ summary: 'Approve, process, or reject a refund request' })
  @ApiResponse({ status: 200, description: 'Refund status updated' })
  async updateRefundStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.financeService.updateRefundStatus(id, dto);
  }

  // Restaurant Payouts
  @Get('payouts/restaurants')
  @ApiOperation({ summary: 'Get paginated list of restaurant settlement payouts' })
  @ApiResponse({ status: 200, description: 'Restaurant payouts list' })
  async getRestaurantPayouts(@Query() query: FinanceQueryDto) {
    return this.financeService.getRestaurantPayouts(query);
  }

  @Patch('payouts/restaurants/:id/status')
  @ApiOperation({ summary: 'Update restaurant payout status' })
  @ApiResponse({ status: 200, description: 'Restaurant payout status updated' })
  async updateRestaurantPayoutStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.financeService.updateRestaurantPayoutStatus(id, dto);
  }

  @Post('payouts/restaurants/process-weekly')
  @ApiOperation({ summary: 'Calculate and generate settlement payouts for all delivered orders' })
  @ApiResponse({ status: 200, description: 'Weekly restaurant payouts processed' })
  async processWeeklyRestaurantPayouts() {
    return this.financeService.processWeeklyRestaurantPayouts();
  }

  // Delivery Partner Payouts
  @Get('payouts/partners')
  @ApiOperation({ summary: 'Get paginated list of delivery partner disbursements' })
  @ApiResponse({ status: 200, description: 'Partner payouts list' })
  async getPartnerPayouts(@Query() query: FinanceQueryDto) {
    return this.financeService.getPartnerPayouts(query);
  }

  @Patch('payouts/partners/:id/status')
  @ApiOperation({ summary: 'Update delivery partner payout status' })
  @ApiResponse({ status: 200, description: 'Partner payout status updated' })
  async updatePartnerPayoutStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.financeService.updatePartnerPayoutStatus(id, dto);
  }

  @Post('payouts/partners/process-weekly')
  @ApiOperation({ summary: 'Aggregate pending rider earnings and disburse weekly payouts' })
  @ApiResponse({ status: 200, description: 'Weekly partner payouts processed' })
  async processWeeklyPartnerPayouts() {
    return this.financeService.processWeeklyPartnerPayouts();
  }
}
