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
import { CustomerService } from './customer.service';
import { CreateAddressDto } from './dto/customer-address.dto';

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Customer', 'Admin')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  private parseBigInt(val: string, fieldName: string): bigint {
    if (!/^\d+$/.test(val)) {
      throw new BadRequestException(`${fieldName} must be numeric`);
    }
    return BigInt(val);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get all saved addresses for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'List of customer addresses' })
  async getAddresses(@CurrentUser() user: any) {
    const userId = BigInt(user.id);
    return this.customerService.getAddresses(userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a new delivery address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async createAddress(
    @CurrentUser() user: any,
    @Body() dto: CreateAddressDto,
  ) {
    const userId = BigInt(user.id);
    return this.customerService.createAddress(userId, dto);
  }

  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'Set address as default delivery location' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  async setDefaultAddress(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = BigInt(user.id);
    const addressId = this.parseBigInt(id, 'Address ID');
    return this.customerService.setDefaultAddress(userId, addressId);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  async deleteAddress(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = BigInt(user.id);
    const addressId = this.parseBigInt(id, 'Address ID');
    return this.customerService.deleteAddress(userId, addressId);
  }
}
