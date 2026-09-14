import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './AuthController.js';
import { AuthRepository } from './AuthRepository.js';
import { AuthService } from './AuthService.js';
import { PrismaModule } from '../../lib/prisma/prisma.module.js';
import { AuthGuard } from '../../shared/guards/auth.guard.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
