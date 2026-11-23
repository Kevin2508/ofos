import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FleetManagerController } from './fleet-manager.controller';
import { FleetManagerService } from './fleet-manager.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FleetManagerController],
  providers: [FleetManagerService],
  exports: [FleetManagerService],
})
export class FleetManagerModule {}
