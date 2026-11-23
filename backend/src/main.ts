import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import compression = require('compression');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Production HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permissive for OpenAPI Swagger UI and embedded previews
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Response Compression (gzip / deflate)
  app.use(compression());

  // Dynamic CORS Configuration
  const rawOrigins = process.env.ALLOWED_ORIGINS || '';
  const configuredOrigins = rawOrigins
    ? rawOrigins.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:80'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        configuredOrigins.includes(origin) ||
        configuredOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.railway.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true); // Allow demo cross-origin access gracefully
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown hooks for Docker / Kubernetes containers
  app.enableShutdownHooks();

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('OFOS REST API')
    .setDescription(
      'Enterprise REST API documentation for the OFOS Multi-Tenant Online Food Ordering & Delivery Platform',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Platform liveness, database status, and readiness probes')
    .addTag('Authentication', 'JWT cookie & Bearer token lifecycle, multi-tenant RBAC')
    .addTag('Restaurants', 'Restaurant discovery, public menus, and operating hours')
    .addTag('Restaurant Management', 'Merchant portal, branch operations, zones, and kitchen staff')
    .addTag('Cart', 'Multi-item single-tenant cart and dynamic coupon validation')
    .addTag('Checkout', '15-minute reservation sessions and address binding')
    .addTag('Orders & Delivery', 'Atomic 7-table placement, encrypted OTP, and kitchen/driver state machine')
    .addTag('Delivery Partner', 'Rider telemetry, duty toggle, GPS ingestion, and earnings')
    .addTag('Fleet Manager', 'Live telemetry radar, dispatcher queue, and manual assignments')
    .addTag('Payments', 'Cryptographic HMAC SHA256 gateway verification and COD capture')
    .addTag('Finance', 'Weekly 10% commission reconciliation, refund ledgers, and payouts')
    .addTag('Reviews', 'Tri-criteria star ratings, rider average score, and merchant replies')
    .addTag('Admin', 'Platform governance, KYC verification, configs, support tickets, and audit trails')
    .addTag('AI Assistant', 'Gemini conversational food agent with schema-compliant tool execution')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'OFOS API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = Number(process.env.BACKEND_PORT || 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 OFOS Production API is running on http://0.0.0.0:${port}`);
  console.log(`📚 OFOS OpenAPI Docs available at http://localhost:${port}/docs`);
}

bootstrap();
