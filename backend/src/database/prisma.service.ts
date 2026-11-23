import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const connectionString =
      configService.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL ||
      configService.get<string>('POSTGRES_DATABASE_URL') ||
      process.env.POSTGRES_DATABASE_URL;

    const isRemote =
      connectionString?.includes('sslmode=require') ||
      connectionString?.includes('supabase') ||
      connectionString?.includes('neon.tech') ||
      connectionString?.includes('pooler');

    const cleanConnectionString = isRemote
      ? connectionString?.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
      : connectionString;

    const pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
