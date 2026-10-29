import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ZodValidationPipe } from './shared/pipes/zod-validation.pipe.js';
import { setupSwagger } from './docs/swagger.js';
import { RmqEvents, RmqStatus, Transport } from '@nestjs/microservices';
import { ConsoleLogger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new ConsoleLogger({
      // json: true,
    }),
  });
  app.enableCors();
  app.use(cookieParser());

  setupSwagger(app);

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');

  // Start HTTP server
  await app.listen(port ?? 5000);
}
bootstrap();
