import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating for food quality (1 to 5)', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  foodRating!: number;

  @ApiProperty({ description: 'Rating for delivery speed & handling (1 to 5)', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryRating!: number;

  @ApiProperty({ description: 'Rating for packaging & hygiene (1 to 5)', example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  packagingRating!: number;

  @ApiPropertyOptional({ description: 'Detailed feedback comments', example: 'Pizza was warm and delicious!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewText?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs of the delivered food',
    type: [String],
    example: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  images?: string[];
}

export class ReplyReviewDto {
  @ApiProperty({
    description: 'Restaurant response to the customer review',
    example: 'Thank you for your warm words! We look forward to serving you again.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  replyText!: string;
}

export class GetRestaurantReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by overall star rating (1 to 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Sort criteria',
    enum: ['recent', 'highest', 'lowest'],
    default: 'recent',
  })
  @IsOptional()
  @IsIn(['recent', 'highest', 'lowest'])
  sort?: 'recent' | 'highest' | 'lowest' = 'recent';
}
