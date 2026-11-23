import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RestaurantManagementController } from './restaurant-management.controller';
import { RestaurantManagementService } from './restaurant-management.service';

@Module({
  imports: [AuthModule],
  controllers: [RestaurantManagementController],
  providers: [RestaurantManagementService],
  exports: [RestaurantManagementService],
})
export class RestaurantManagementModule {}
