import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { DeliveryPartnerService } from './delivery-partner.service';
import {
  GetEarningsQueryDto,
  GetPartnerAssignmentsQueryDto,
  ReportDeliveryIssueDto,
  UpdateDutyStatusDto,
  UpdateLocationDto,
} from './dto/delivery-partner.dto';

@ApiTags('Delivery Partner Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Delivery_partner', 'Admin')
@Controller('delivery-partner')
export class DeliveryPartnerController {
  constructor(private readonly deliveryPartnerService: DeliveryPartnerService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get delivery partner profile, ratings, vehicle details, and duty status' })
  async getProfile(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.deliveryPartnerService.getProfile(userId);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Toggle delivery partner online/offline duty availability' })
  async updateStatus(
    @CurrentUser() user: any,
    @Body() dto: UpdateDutyStatusDto,
  ) {
    const userId = BigInt(user.id);
    return this.deliveryPartnerService.updateStatus(userId, dto);
  }

  @Get('assignments/active')
  @ApiOperation({ summary: 'Get current active assigned/accepted delivery for rider' })
  async getActiveAssignment(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.deliveryPartnerService.getActiveAssignment(userId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get delivery partner assignment history with pagination and status filters' })
  async getAllAssignments(
    @CurrentUser() user: any,
    @Query() query: GetPartnerAssignmentsQueryDto,
  ) {
    const userId = BigInt(user.id);
    return this.deliveryPartnerService.getAllAssignments(userId, query);
  }

  @Post('assignments/:id/location')
  @ApiOperation({ summary: 'Broadcast rider GPS coordinates for active order tracking' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  async updateLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const userId = BigInt(user.id);
    const assignmentId = this.parseBigInt(id, 'Assignment ID');
    return this.deliveryPartnerService.updateLocation(userId, assignmentId, dto);
  }

  @Post('assignments/:id/report-issue')
  @ApiOperation({ summary: 'Report a delivery incident/escalation (breakdown, customer unreachable, etc.)' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  async reportDeliveryIssue(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReportDeliveryIssueDto,
  ) {
    const userId = BigInt(user.id);
    const assignmentId = this.parseBigInt(id, 'Assignment ID');
    return this.deliveryPartnerService.reportDeliveryIssue(userId, assignmentId, dto);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get delivery earnings summary and transaction logs' })
  async getEarnings(
    @CurrentUser() user: any,
    @Query() query: GetEarningsQueryDto,
  ) {
    const userId = BigInt(user.id);
    return this.deliveryPartnerService.getEarnings(userId, query);
  }
}
