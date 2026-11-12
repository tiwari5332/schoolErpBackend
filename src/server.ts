import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import path from 'path';

import { AppModule } from './app.module';
import { env } from './config/env.config';

let cachedApp: NestFastifyApplication | null = null;

export async function bootstrapServer(): Promise<NestFastifyApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const logger = new Logger('Bootstrap');

  const fastifyAdapter = new FastifyAdapter({
    logger: env.NODE_ENV === 'development',
    bodyLimit: 1048576, // 1 MB JSON limit
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // Global prefix /api/v1
  app.setGlobalPrefix('api/v1', {
    exclude: ['health/live', 'health/ready', 'docs', 'docs/json'],
  });

  // Security headers via Helmet
  await app.register(helmet as any, {
    contentSecurityPolicy: false,
  });

  // Strict CORS
  await app.register(cors as any, {
    origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Id',
      'X-Request-Id',
      'Idempotency-Key',
    ],
  });

  // Global Rate Limiting
  await app.register(rateLimit as any, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Multipart uploads (10 MB limit)
  await app.register(multipart as any, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // Serve OpenAPI at /docs in non-production
  if (env.NODE_ENV !== 'production') {
    const openApiPath = path.resolve(__dirname, 'contract/generated/openapi.json');
    if (fs.existsSync(openApiPath)) {
      const openApiDocument = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
      SwaggerModule.setup('docs', app as any, openApiDocument as any);
      logger.log(`📚 OpenAPI 3.1 Documentation available at /docs`);
    }
  }

  app.enableShutdownHooks();

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  cachedApp = app;
  return cachedApp;
}

// Vercel Serverless Function entry point
export default async function handler(req: any, res: any) {
  const app = await bootstrapServer();
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.server.emit('request', req, res);
}

