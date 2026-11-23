import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CartItemModifierInputDto {
  @ApiProperty({ example: '1', description: 'Modifier Option ID' })
  @IsNotEmpty()
  modifierOptionId!: string | number;
}

export class AddToCartDto {
  @ApiProperty({ example: '1', description: 'Menu Item ID' })
  @IsNotEmpty()
  menuItemId!: string | number;

  @ApiProperty({ example: '1', description: 'Restaurant Branch ID' })
  @IsNotEmpty()
  restaurantBranchId!: string | number;

  @ApiProperty({ example: 1, description: 'Quantity (minimum 1)' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Make it extra spicy', description: 'Special preparation instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialInstructions?: string;

  @ApiPropertyOptional({ type: [CartItemModifierInputDto], description: 'Selected modifier options' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemModifierInputDto)
  modifiers?: CartItemModifierInputDto[];
}

export class UpdateCartItemDto {
  @ApiPropertyOptional({ example: 2, description: 'New quantity. If 0 or less, item is removed' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 'No onions please', description: 'Special preparation instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialInstructions?: string;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'WELCOME50', description: 'Coupon promo code' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  code!: string;
}
