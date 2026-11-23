import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || res;
        error = (res as any).error || error;
      }
    } else if (exception instanceof Error) {
      // In production, do not leak raw unexpected error messages to the client
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(`[Unhandled Exception] ${request.method} ${request.url}: ${exception.message}`, exception.stack);
        message = 'An unexpected internal error occurred. Please contact OFOS support.';
      } else {
        this.logger.error(`[Unhandled Exception] ${request.method} ${request.url}: ${exception.message}`, exception.stack);
        message = exception.message;
      }
    } else {
      this.logger.error(`[Unknown Exception] ${request.method} ${request.url}:`, exception);
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
