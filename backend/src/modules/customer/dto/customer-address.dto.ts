import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressLabel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ enum: AddressLabel, example: AddressLabel.HOME, description: 'Address category label' })
  @IsNotEmpty()
  @IsEnum(AddressLabel)
  label!: AddressLabel;

  @ApiProperty({ example: 'Kevin Smith', description: 'Recipient contact name' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  contactName!: string;

  @ApiProperty({ example: '9876543210', description: '10-digit contact phone number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact phone must be exactly 10 digits' })
  contactPhone!: string;

  @ApiProperty({ example: 'Flat 402, Sunshine Apartments', description: 'Primary address line 1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'MG Road, Sector 14', description: 'Address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Near City Park Metro Station', description: 'Nearby landmark' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @ApiProperty({ example: 'Bengaluru', description: 'City name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Karnataka', description: 'State or province' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '560001', description: 'Postal/Zip code' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @ApiPropertyOptional({ example: 'India', description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string = 'India';

  @ApiProperty({ example: 12.9716, description: 'GPS Latitude (-90 to 90)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @ApiProperty({ example: 77.5946, description: 'GPS Longitude (-180 to 180)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;

  @ApiPropertyOptional({ example: true, description: 'Set as default delivery address' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
