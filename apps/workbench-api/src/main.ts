import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
}
void bootstrap();
