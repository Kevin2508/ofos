import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { OtpPurpose, VehicleType } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'customer@ofos.com', description: 'Email address or phone number' })
  @IsNotEmpty()
  @IsString()
  userIdentifier!: string;

  @ApiProperty({ example: 'password123', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  rememberMe?: boolean;
}

export class RegisterCustomerDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@ofos.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'REF12345' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class RegisterRestaurantOwnerDto {
  @ApiProperty({ example: 'Chef' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Mario' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'mario@pizzeria.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+919876543211' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Mario Trattoria' })
  @IsNotEmpty()
  @IsString()
  businessName!: string;

  @ApiPropertyOptional({ example: 'Mario Foods Pvt Ltd' })
  @IsOptional()
  @IsString()
  legalBusinessName?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional({ example: 'info@mario.com' })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;
}

export class RegisterDeliveryPartnerDto {
  @ApiProperty({ example: 'Alex' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Rider' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'alex.rider@ofos.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+919876543212' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE })
  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: 'MH-12-AB-1234' })
  @IsNotEmpty()
  @IsString()
  vehicleRegistrationNumber!: string;
}

export class RegisterStaffDto {
  @ApiProperty({ example: 'Sam' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Cook' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'sam@kitchen.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+919876543213' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterRoleDto {
  @ApiProperty({ example: 'Admin' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'User' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'admin@ofos.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+919876543214' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class SendOtpDto {
  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'customer@ofos.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.LOGIN })
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'customer@ofos.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  otp!: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.LOGIN })
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}

export class CheckPhoneDto {
  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty()
  @IsString()
  phone!: string;
}

export class CheckEmailDto {
  @ApiProperty({ example: 'customer@ofos.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@ofos.com', description: 'Email or phone number' })
  @IsNotEmpty()
  @IsString()
  userIdentifier!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'P@ssword456', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  userIdentifier?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Johnny' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Appleseed' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

export class SelectRoleDto {
  @ApiProperty({ example: 'Restaurant_owner' })
  @IsNotEmpty()
  @IsString()
  role!: string;
}
