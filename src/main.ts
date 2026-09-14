import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ZodValidationPipe } from './shared/pipes/zod-validation.pipe.js';
import { setupSwagger } from './docs/swagger.js';
import { RmqEvents, RmqStatus, Transport } from '@nestjs/microservices';
import { ConsoleLogger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      // json: true,
    }),
  });
  app.enableCors();
  app.use(cookieParser());

  // Connect RabbitMQ
  const server = app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: 'wallet_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start RabbitMQ listener
  // await app.startAllMicroservices();

  // server.status.subscribe((status: unknown) => {
  //   console.log('server status:', status);
  // });

  // server.on<RmqEvents>('error', (err: any) => {
  //   console.error(err);
  // });

  setupSwagger(app);

  // Start HTTP server
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
