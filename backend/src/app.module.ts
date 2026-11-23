import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { RestaurantManagementModule } from './modules/restaurant-management/restaurant-management.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrderModule } from './modules/orders/order.module';
import { DeliveryPartnerModule } from './modules/delivery-partner/delivery-partner.module';
import { FleetManagerModule } from './modules/fleet-manager/fleet-manager.module';
import { PaymentModule } from './modules/payment/payment.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../.env'),
        '.env',
      ],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    RestaurantModule,
    RestaurantManagementModule,
    CartModule,
    CouponModule,
    CustomerModule,
    CheckoutModule,
    OrderModule,
    DeliveryPartnerModule,
    FleetManagerModule,
    PaymentModule,
    FinanceModule,
    ReviewsModule,
    AdminModule,
    AIModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
