import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { StaffDesignation } from '@prisma/client';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Tasty Bites', description: 'Restaurant brand name' })
  @IsNotEmpty()
  @IsString()
  businessName!: string;

  @ApiProperty({ example: 'Tasty Bites Foods Pvt Ltd', description: 'Registered legal business name' })
  @IsNotEmpty()
  @IsString()
  legalBusinessName!: string;

  @ApiProperty({ example: '9876543210', description: '10-digit primary contact phone' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Phone number must be exactly 10 digits' })
  primaryPhone!: string;

  @ApiProperty({ example: 'owner@tastybites.com', description: 'Primary business email' })
  @IsNotEmpty()
  @IsEmail()
  primaryEmail!: string;

  @ApiPropertyOptional({ example: 'Authentic Italian cuisine and woodfired pizza', description: 'Short restaurant bio' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Italian, Pizza, Pasta', description: 'Comma-separated cuisine tags' })
  @IsOptional()
  @IsString()
  cuisineTags?: string;
}

export class UpdateRestaurantDto {
  @ApiPropertyOptional({ example: 'Tasty Bites Updated' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Tasty Bites LLP' })
  @IsOptional()
  @IsString()
  legalBusinessName?: string;

  @ApiPropertyOptional({ example: 'Fresh artisanal pizzas baked daily' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Phone number must be exactly 10 digits' })
  primaryPhone?: string;

  @ApiPropertyOptional({ example: 'contact@tastybites.com' })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'Italian, Bakery, Pizza' })
  @IsOptional()
  @IsString()
  cuisineTags?: string;

  @ApiPropertyOptional({ example: 'Tasty Bites Bank Account' })
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional({ example: '12345678901234' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  @IsOptional()
  @IsString()
  bankIfscCode?: string;
}

export class PauseRestaurantDto {
  @ApiPropertyOptional({
    example: '2026-11-20T10:00:00.000Z',
    description: 'Optional ISO timestamp when restaurant should auto-resume',
  })
  @IsOptional()
  @IsString()
  resumeAt?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'Indiranagar Branch' })
  @IsNotEmpty()
  @IsString()
  branchName!: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5' })
  @IsNotEmpty()
  @IsString()
  gstin!: string;

  @ApiProperty({ example: '11223344556677' })
  @IsNotEmpty()
  @IsString()
  fssaiLicenseNumber!: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  contactPhone!: string;

  @ApiProperty({ example: '100 Feet Road, 12th Main' })
  @IsNotEmpty()
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Suite 201' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsNotEmpty()
  @IsString()
  state!: string;

  @ApiProperty({ example: '560038' })
  @IsNotEmpty()
  @IsString()
  postalCode!: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string = 'India';

  @ApiProperty({ example: 12.9716 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 77.5946 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 150, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 40, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee?: number;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Indiranagar Central Branch' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ example: '11223344556677' })
  @IsOptional()
  @IsString()
  fssaiLicenseNumber?: string;

  @ApiPropertyOptional({ example: '9876543211' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: '102 100 Feet Road' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: '2nd Floor' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '560038' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 12.9716 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAcceptingOrders?: boolean;

  @ApiPropertyOptional({ example: '2026-11-20T12:00:00.000Z' })
  @IsOptional()
  @IsString()
  autoResumeAt?: string;
}

export class OperatingHourItemDto {
  @ApiProperty({ example: 1, description: 'Day of week: 0 (Sun) to 6 (Sat)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiPropertyOptional({ example: '09:00:00', description: 'Opening time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'openingTime must be in HH:mm or HH:mm:ss format',
  })
  openingTime?: string;

  @ApiPropertyOptional({ example: '22:00:00', description: 'Closing time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'closingTime must be in HH:mm or HH:mm:ss format',
  })
  closingTime?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class ReplaceOperatingHoursDto {
  @ApiProperty({ type: [OperatingHourItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHourItemDto)
  hours!: OperatingHourItemDto[];
}

export class UpsertDeliveryZoneDto {
  @ApiProperty({ example: 8.5, description: 'Delivery radius in kilometers (max 100)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm!: number;

  @ApiProperty({ example: 25, description: 'Minimum delivery time in minutes' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumDeliveryTimeMinutes!: number;

  @ApiProperty({ example: 45, description: 'Maximum delivery time in minutes' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maximumDeliveryTimeMinutes!: number;
}

export class AddBranchStaffDto {
  @ApiProperty({ example: '10', description: 'User ID to add as staff' })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ enum: StaffDesignation, example: StaffDesignation.MANAGER })
  @IsNotEmpty()
  @IsEnum(StaffDesignation)
  designation!: StaffDesignation;
}
