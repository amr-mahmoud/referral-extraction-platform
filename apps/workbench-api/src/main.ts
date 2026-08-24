import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './interface/http/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

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
  app.getHttpAdapter().get('/docs-json', (_req, res) => {
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

  const port = process.env.PORT ?? 8001;
  await app.listen(port);
  console.log(`--> Workbench API running on http://localhost:${port}`);
  console.log(`--> Scalar API Playground: http://localhost:${port}/reference`);
  console.log(`--> OpenAPI JSON Spec: http://localhost:${port}/docs-json`);
}
void bootstrap();
