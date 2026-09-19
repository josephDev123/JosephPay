import { Module } from '@nestjs/common';
import { KycController } from './KycController.js';
import { KycRepository } from './KycRepository.js';
import { KycService } from './KycService.js';
import { PrismaService } from 'src/lib/prisma/prisma.service.js';
import { KycProvider } from './adapters/kycs-provider-interface.js';
import { DojahAdapter } from './adapters/dojah.adapter.js';
import { KYC_PROVIDER } from './constants/kyc.token.js';

@Module({
  controllers: [KycController],
  providers: [
    KycService,
    KycRepository,
    {
      provide: KYC_PROVIDER,
      useClass: DojahAdapter,
    },
  ],
  exports: [KycService, KycRepository],
  imports: [PrismaService],
})
export class KycModule {}
