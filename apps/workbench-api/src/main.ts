import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Response } from 'express';
import { AppModule } from './app.module';
import { ApplicationService } from './application/application.service';
import { AllExceptionFilter } from './infrastructure/filters/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Plena Referral Extraction Workbench API')
    .setDescription(
      'WorkBench API service owning client auth, referral review, extraction schemas, and SSE live status updates.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve raw OpenAPI JSON document for client codegen (openapi-typescript)
  app.getHttpAdapter().get('/docs-json', (_req, res: Response) => {
    res.json(document);
  });

  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
    }),
  );

  // Dev-only cache warm-up: a `docker compose up` (or a bare `db-reset`) starts
  // Redis empty, so the very first dashboard load would otherwise be an N-clinic
  // cold-cache miss. Pre-loading every referral removes that from the demo path.
  // Gated to non-production because at real scale this is exactly the full
  // table scan the cache-aside pattern exists to avoid — production starts
  // cold and lets normal traffic (or `refreshReferralCache`) warm it
  // incrementally instead.
  if (process.env.NODE_ENV !== 'production') {
    const logger = new Logger('CacheWarmup');
    try {
      const applicationService = app.get(ApplicationService);
      const warmedCount = await applicationService.warmAllReferralCaches();
      logger.log(`Warmed Redis cache with ${warmedCount} referral(s)`);
    } catch (error) {
      logger.warn(
        `Cache warm-up failed (continuing to boot): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const port = process.env.PORT ?? 8001;
  await app.listen(port);
  console.log(`--> Workbench API running on http://localhost:${port}`);
  console.log(`--> Scalar API Playground: http://localhost:${port}/reference`);
  console.log(`--> OpenAPI JSON Spec: http://localhost:${port}/docs-json`);
}
void bootstrap();
