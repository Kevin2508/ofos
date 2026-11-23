import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import {
  CreateSystemConfigDto,
  CreateTicketDto,
  GetAuditLogsQueryDto,
  GetUsersQueryDto,
  TicketRespondDto,
  TicketResolveDto,
  UpdateDocumentStatusDto,
  UpdateRestaurantStatusDto,
  UpdateSystemConfigDto,
  UpdateUserRoleStatusDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // High-Level KPIs
  @Get('kpis')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get high-level platform health & operations KPIs' })
  @ApiResponse({ status: 200, description: 'Platform KPIs' })
  async getKpis() {
    return this.adminService.getKpis();
  }

  @Get('overview')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get admin overview KPIs (alias for /kpis)' })
  @ApiResponse({ status: 200, description: 'Platform KPIs' })
  async getOverview() {
    return this.adminService.getKpis();
  }

  // Users
  @Get('users')
  @Roles('Admin')
  @ApiOperation({ summary: 'List and filter platform users with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get(['users/:id', 'user/:id'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Get complete user profile with roles and addresses' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch(['users/:id/role-status', 'user/:id/role-status'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Assign, reject, or suspend a specific user role' })
  @ApiResponse({ status: 200, description: 'Role status updated' })
  async updateUserRoleStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateUserRoleStatusDto,
  ) {
    return this.adminService.updateUserRoleStatus(BigInt(adminUserId), targetUserId, dto);
  }

  @Patch(['users/:id/account-status', 'user/:id/account-status'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Update user account status (ACTIVE, SUSPENDED, LOCKED)' })
  @ApiResponse({ status: 200, description: 'User account status updated' })
  async updateUserStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(BigInt(adminUserId), targetUserId, dto);
  }

  // Restaurant Verification
  @Get('restaurants/pending')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get all restaurants awaiting admin verification' })
  @ApiResponse({ status: 200, description: 'Pending restaurants list' })
  async getPendingRestaurants() {
    return this.adminService.getPendingRestaurants();
  }

  @Get('restaurants')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get all platform restaurants' })
  @ApiResponse({ status: 200, description: 'All restaurants list' })
  async getAllRestaurants() {
    return this.adminService.getAllRestaurants();
  }

  @Patch('restaurants/:id/status')
  @Roles('Admin')
  @ApiOperation({ summary: 'Approve, reject, or suspend a restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant status updated' })
  async updateRestaurantStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) restaurantId: number,
    @Body() dto: UpdateRestaurantStatusDto,
  ) {
    return this.adminService.updateRestaurantStatus(BigInt(adminUserId), restaurantId, dto);
  }

  @Patch('restaurants/:id/documents/:docId/status')
  @Roles('Admin')
  @ApiOperation({ summary: 'Verify or reject statutory restaurant onboarding documents' })
  @ApiResponse({ status: 200, description: 'Document verification updated' })
  async updateRestaurantDocumentStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) restaurantId: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.adminService.updateRestaurantDocumentStatus(
      BigInt(adminUserId),
      restaurantId,
      docId,
      dto,
    );
  }

  // System Configurations
  @Get(['config', 'configs'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Get all dynamic system configurations' })
  @ApiResponse({ status: 200, description: 'System configurations' })
  async getSystemConfigs() {
    return this.adminService.getSystemConfigs();
  }

  @Post(['config', 'configs'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new system configuration key-value pair' })
  @ApiResponse({ status: 201, description: 'Configuration created' })
  async createSystemConfig(
    @CurrentUser('id') adminUserId: string,
    @Body() dto: CreateSystemConfigDto,
  ) {
    return this.adminService.createSystemConfig(BigInt(adminUserId), dto);
  }

  @Patch(['config/update', 'configs/update'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Update an existing system configuration value' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateSystemConfig(
    @CurrentUser('id') adminUserId: string,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    return this.adminService.updateSystemConfig(BigInt(adminUserId), dto);
  }

  @Delete(['config/:key', 'configs/:key'])
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a system configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted' })
  async deleteSystemConfig(
    @CurrentUser('id') adminUserId: string,
    @Param('key') key: string,
  ) {
    return this.adminService.deleteSystemConfig(key, BigInt(adminUserId));
  }

  // Audit Logs
  @Get('audit-logs')
  @Roles('Admin')
  @ApiOperation({ summary: 'View immutable system audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(@Query() query: GetAuditLogsQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  // Support Tickets
  @Get('tickets')
  @Roles('Admin')
  @ApiOperation({ summary: 'List all customer and delivery support tickets' })
  @ApiResponse({ status: 200, description: 'Support tickets' })
  async getSupportTickets() {
    return this.adminService.getSupportTickets();
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket for an order' })
  @ApiResponse({ status: 201, description: 'Support ticket created' })
  async createSupportTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.adminService.createSupportTicket(BigInt(userId), dto);
  }

  @Patch('tickets/:id/respond')
  @Roles('Admin')
  @ApiOperation({ summary: 'Add an administrative response message to a ticket' })
  @ApiResponse({ status: 200, description: 'Response added' })
  async respondToSupportTicket(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() dto: TicketRespondDto,
  ) {
    return this.adminService.respondToSupportTicket(BigInt(adminUserId), ticketId, dto);
  }

  @Patch('tickets/:id/resolve')
  @Roles('Admin')
  @ApiOperation({ summary: 'Mark a support ticket as resolved' })
  @ApiResponse({ status: 200, description: 'Ticket resolved' })
  async resolveSupportTicket(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() dto: TicketResolveDto,
  ) {
    return this.adminService.resolveSupportTicket(BigInt(adminUserId), ticketId, dto);
  }
}
