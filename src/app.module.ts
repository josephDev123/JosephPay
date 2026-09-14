import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './module/Auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './lib/prisma/prisma.module.js';
import { Envalidate } from './config/validate-env.js';
import { KycModule } from './module/Kyc/kyc.module.js';
import { ProfileModule } from './module/Profile/profile.module.js';
import { UserModule } from './module/User/user.module.js';
import { WalletModule } from './module/Wallet/wallet.module.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionHandler } from './shared/exception/HttpExceptionHandler.js';
import { AuthGuard } from './shared/guards/auth.guard.js';
import { getAppConfig } from './shared/lib/app-config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getAppConfig],
      // envFilePath: '.env',
      validate: Envalidate,
    }),

    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),

    PrismaModule,
    KycModule,
    ProfileModule,
    UserModule,
    AuthModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionHandler,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
