import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../orders/order.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';

@Module({
  imports: [
    DatabaseModule,
    RestaurantModule,
    CartModule,
    OrderModule,
    ReviewsModule,
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
