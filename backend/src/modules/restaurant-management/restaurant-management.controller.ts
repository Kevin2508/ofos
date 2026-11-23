import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import {
  AddBranchStaffDto,
  CreateBranchDto,
  CreateRestaurantDto,
  PauseRestaurantDto,
  ReplaceOperatingHoursDto,
  UpdateBranchDto,
  UpdateRestaurantDto,
  UpsertDeliveryZoneDto,
} from './dto/restaurant-management.dto';
import { RestaurantManagementService } from './restaurant-management.service';

@ApiTags('Restaurant Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Restaurant_owner', 'Admin')
@Controller('restaurant-management')
export class RestaurantManagementController {
  constructor(
    private readonly restaurantManagementService: RestaurantManagementService,
  ) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  // -------------------------------------------------------------
  // Restaurant Profile Endpoints
  // -------------------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Register a new restaurant and create its initial main branch' })
  @ApiResponse({ status: 201, description: 'Restaurant registered successfully' })
  async createRestaurant(
    @CurrentUser() user: any,
    @Body() dto: CreateRestaurantDto,
  ) {
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.createRestaurant(ownerUserId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get all restaurants owned by the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of owned restaurants with branches and zones' })
  async getMyRestaurants(@CurrentUser() user: any) {
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getMyRestaurants(ownerUserId);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard sales & operations metrics for the authenticated owner' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics and 7-day revenue trend' })
  async getDashboardStats(@CurrentUser() user: any) {
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getDashboardStats(ownerUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update restaurant details and bank account settings' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  async updateRestaurant(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRestaurantDto,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.updateRestaurant(
      restaurantId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause restaurant operations (SUSPENDED status)' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant paused successfully' })
  async pauseRestaurant(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: PauseRestaurantDto,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.pauseRestaurant(
      restaurantId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume restaurant operations (APPROVED status)' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant resumed successfully' })
  async resumeRestaurant(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.resumeRestaurant(
      restaurantId,
      ownerUserId,
      user.roles || [],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a restaurant and all its branches' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Restaurant deactivated successfully' })
  async deactivateRestaurant(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.deactivateRestaurant(
      restaurantId,
      ownerUserId,
      user.roles || [],
    );
  }

  // -------------------------------------------------------------
  // Branch Management Endpoints
  // -------------------------------------------------------------
  @Get(':id/branches')
  @ApiOperation({ summary: 'List all branches of a restaurant' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  async getBranches(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getBranches(
      restaurantId,
      ownerUserId,
      user.roles || [],
    );
  }

  @Post(':id/branches')
  @ApiOperation({ summary: 'Create a new branch for a restaurant' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async createBranch(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateBranchDto,
  ) {
    const restaurantId = this.parseBigInt(id, 'Restaurant ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.createBranch(
      restaurantId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  @Patch('branches/:branchId')
  @ApiOperation({ summary: 'Update branch configuration, coordinates, or fees' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  async updateBranch(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateBranchDto,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.updateBranch(
      bId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  @Patch('branches/:branchId/toggle-orders')
  @ApiOperation({ summary: 'Toggle branch accepting orders on/off' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Order acceptance status toggled' })
  async toggleOrders(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.toggleOrders(
      bId,
      ownerUserId,
      user.roles || [],
    );
  }

  // -------------------------------------------------------------
  // Branch Operating Hours
  // -------------------------------------------------------------
  @Get('branches/:branchId/hours')
  @ApiOperation({ summary: 'Get operating hours schedule for a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Operating hours schedule' })
  async getOperatingHours(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getOperatingHours(
      bId,
      ownerUserId,
      user.roles || [],
    );
  }

  @Put('branches/:branchId/hours')
  @ApiOperation({ summary: 'Replace full 7-day operating hours schedule for a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Operating hours replaced' })
  async replaceOperatingHours(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
    @Body() dto: ReplaceOperatingHoursDto,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.replaceOperatingHours(
      bId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  // -------------------------------------------------------------
  // Branch Delivery Zone
  // -------------------------------------------------------------
  @Get('branches/:branchId/delivery-zone')
  @ApiOperation({ summary: 'Get delivery zone radius and delivery times' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch delivery zone configuration' })
  async getDeliveryZone(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getDeliveryZone(
      bId,
      ownerUserId,
      user.roles || [],
    );
  }

  @Put('branches/:branchId/delivery-zone')
  @ApiOperation({ summary: 'Set or update branch delivery zone radius and times' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Delivery zone saved successfully' })
  async upsertDeliveryZone(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertDeliveryZoneDto,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.upsertDeliveryZone(
      bId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  // -------------------------------------------------------------
  // Branch Staff Operations
  // -------------------------------------------------------------
  @Get('branches/:branchId/staff')
  @ApiOperation({ summary: 'List all staff members assigned to a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch staff roster' })
  async getBranchStaff(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.getBranchStaff(
      bId,
      ownerUserId,
      user.roles || [],
    );
  }

  @Post('branches/:branchId/staff')
  @ApiOperation({ summary: 'Assign a staff member to a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiResponse({ status: 201, description: 'Staff member assigned successfully' })
  async addBranchStaff(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
    @Body() dto: AddBranchStaffDto,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.addBranchStaff(
      bId,
      ownerUserId,
      user.roles || [],
      dto,
    );
  }

  @Delete('branches/:branchId/staff/:staffId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a staff member from a branch' })
  @ApiParam({ name: 'branchId', description: 'Branch ID' })
  @ApiParam({ name: 'staffId', description: 'Staff record ID' })
  @ApiResponse({ status: 200, description: 'Staff member removed successfully' })
  async removeBranchStaff(
    @Param('branchId') branchId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: any,
  ) {
    const bId = this.parseBigInt(branchId, 'Branch ID');
    const sId = this.parseBigInt(staffId, 'Staff ID');
    const ownerUserId = BigInt(user.id);
    return this.restaurantManagementService.removeBranchStaff(
      bId,
      sId,
      ownerUserId,
      user.roles || [],
    );
  }
}
