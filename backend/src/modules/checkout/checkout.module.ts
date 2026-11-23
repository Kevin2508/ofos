import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrderModule } from '../orders/order.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [DatabaseModule, OrderModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
