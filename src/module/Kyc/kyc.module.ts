import { Module } from '@nestjs/common';
import { KycController } from './KycController.js';
import { KycRepository } from './KycRepository.js';
import { KycService } from './KycService.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { DojahAdapter } from './adapters/dojah.adapter.js';
import { KYC_PROVIDER } from './constants/kyc.token.js';

@Module({
  controllers: [KycController],
  providers: [
    KycService,
    KycRepository,
    DojahAdapter,
    {
      provide: KYC_PROVIDER,
      useExisting: DojahAdapter,
    },
    PrismaService,
  ],
  exports: [KycService, KycRepository],
  imports: [],
})
export class KycModule {}
