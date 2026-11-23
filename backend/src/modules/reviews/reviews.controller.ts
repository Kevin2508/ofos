import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateReviewDto,
  GetRestaurantReviewsQueryDto,
  ReplyReviewDto,
} from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get public reviews, rating statistics, and owner replies for a restaurant' })
  @ApiResponse({ status: 200, description: 'Public restaurant reviews' })
  async getRestaurantReviews(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query() query: GetRestaurantReviewsQueryDto,
  ) {
    return this.reviewsService.getRestaurantReviews(restaurantId, query);
  }

  @Post('orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Customer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit rating, commentary, and optional images for a delivered order' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async submitReview(
    @CurrentUser('id') customerId: string,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.submitReview(BigInt(customerId), orderId, dto);
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Restaurant_owner')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reviews across restaurants owned by the logged-in owner' })
  @ApiResponse({ status: 200, description: 'Owner restaurant reviews' })
  async getOwnerReviews(@CurrentUser('id') ownerUserId: string) {
    return this.reviewsService.getOwnerReviews(BigInt(ownerUserId));
  }

  @Post(':reviewId/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Restaurant_owner')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reply to a customer review for an owned restaurant' })
  @ApiResponse({ status: 201, description: 'Review reply created' })
  async replyToReview(
    @CurrentUser('id') ownerUserId: string,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(BigInt(ownerUserId), reviewId, dto);
  }
}
