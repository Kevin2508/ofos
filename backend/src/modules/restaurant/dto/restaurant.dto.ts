import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetRestaurantsQueryDto {
  @ApiPropertyOptional({ example: 'pizza', description: 'Search term for name or cuisine' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Italian', description: 'Filter by cuisine tag' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ example: 'Mumbai', description: 'Filter by branch city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 4, description: 'Minimum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minRating?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SearchQueryDto {
  @ApiPropertyOptional({ example: 'burger' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 'Fast Food' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating?: number;

  @ApiPropertyOptional({ example: 'rating', enum: ['relevance', 'rating', 'newest'] })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class GetGlobalMenuItemsDto {
  @ApiPropertyOptional({ example: 'pizza', description: 'Search term for dish name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'VEG', description: 'Filter by food type (e.g. VEG, NON_VEG, VEGAN)' })
  @IsOptional()
  @IsString()
  foodType?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
