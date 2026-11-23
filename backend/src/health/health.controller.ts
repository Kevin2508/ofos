import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'API and database health check' })
  @ApiResponse({
    status: 200,
    description: 'System health status',
    schema: {
      example: {
        product: 'OFOS',
        status: 'ok',
        database: 'connected',
        timestamp: '2026-11-12T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database disconnected or degraded',
  })
  async checkHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        product: 'OFOS',
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new HttpException(
        {
          product: 'OFOS',
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          error: err.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
