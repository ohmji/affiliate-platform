import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'go/:code', method: RequestMethod.GET }]
  });

  const corsOrigins = config.get<string[]>('http.cors.origins', { infer: true }) ?? [];
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  app.enableShutdownHooks();

  const port = config.get<number>('http.port') ?? 3000;
  const host = config.get<string>('http.host') ?? '0.0.0.0';

  await app.listen(port, host);
  logger.log(`API listening on http://${host}:${port}`);
}

void bootstrap();
