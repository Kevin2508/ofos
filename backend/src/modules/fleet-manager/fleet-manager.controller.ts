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
import {
  AssignDeliveryDto,
  GetRidersQueryDto,
  ReassignDeliveryDto,
  UpdateRiderStatusDto,
} from './dto/fleet-manager.dto';
import { FleetManagerService } from './fleet-manager.service';

@ApiTags('Fleet Manager Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Fleet_manager', 'Admin')
@Controller('fleet-manager')
export class FleetManagerController {
  constructor(private readonly fleetManagerService: FleetManagerService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Get('live-map')
  @ApiOperation({ summary: 'Real-time telemetry and live map of all online riders and unassigned orders' })
  async getLiveMap() {
    return this.fleetManagerService.getLiveMap();
  }

  @Get('riders')
  @ApiOperation({ summary: 'Browse and filter delivery partner fleet roster' })
  async getRiders(@Query() query: GetRidersQueryDto) {
    return this.fleetManagerService.getRiders(query);
  }

  @Patch('riders/:id/status')
  @ApiOperation({ summary: 'Update delivery partner verification or active status (ACTIVE, SUSPENDED, PENDING)' })
  @ApiParam({ name: 'id', description: 'Partner User ID' })
  async updateRiderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRiderStatusDto,
  ) {
    const partnerUserId = this.parseBigInt(id, 'Partner User ID');
    return this.fleetManagerService.updateRiderStatus(partnerUserId, dto);
  }

  @Post(':orderId/assign')
  @ApiOperation({ summary: 'Manually dispatch/assign an unassigned order to a specific delivery partner' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  async assignDelivery(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
    @Body() dto: AssignDeliveryDto,
  ) {
    const oId = this.parseBigInt(orderId, 'Order ID');
    const dispatcherUserId = BigInt(user.id);
    return this.fleetManagerService.assignDelivery(oId, dispatcherUserId, dto);
  }

  @Patch('assignments/:id/reassign')
  @ApiOperation({ summary: 'Reassign an in-progress or declined delivery assignment to another rider' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  async reassignDelivery(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReassignDeliveryDto,
  ) {
    const assignmentId = this.parseBigInt(id, 'Assignment ID');
    const dispatcherUserId = BigInt(user.id);
    return this.fleetManagerService.reassignDelivery(assignmentId, dispatcherUserId, dto);
  }
}
