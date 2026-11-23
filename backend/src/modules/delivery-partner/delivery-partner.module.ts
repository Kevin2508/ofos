import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DeliveryPartnerController } from './delivery-partner.controller';
import { DeliveryPartnerService } from './delivery-partner.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryPartnerController],
  providers: [DeliveryPartnerService],
  exports: [DeliveryPartnerService],
})
export class DeliveryPartnerModule {}
