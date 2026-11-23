import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDutyStatusDto {
  @ApiProperty({ example: true, description: 'Online availability toggle for assignments' })
  @IsNotEmpty()
  @IsBoolean()
  isOnline!: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 19.076, description: 'GPS Latitude (-90 to 90)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @ApiProperty({ example: 72.8777, description: 'GPS Longitude (-180 to 180)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;
}

export class ReportDeliveryIssueDto {
  @ApiProperty({ example: 'VEHICLE_BREAKDOWN', description: 'Issue category or reason' })
  @IsNotEmpty()
  @IsString()
  issueReason!: string;

  @ApiPropertyOptional({ example: 'Flat tire near landmark, unable to deliver within window' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetPartnerAssignmentsQueryDto {
  @ApiPropertyOptional({ enum: AssignmentStatus, description: 'Filter assignments by status' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

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
  @Max(50)
  limit?: number = 10;
}

export class GetEarningsQueryDto {
  @ApiPropertyOptional({ enum: ['today', 'weekly', 'all'], default: 'today' })
  @IsOptional()
  @IsString()
  period?: 'today' | 'weekly' | 'all' = 'today';
}
