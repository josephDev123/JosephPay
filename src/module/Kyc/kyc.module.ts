import { Module } from '@nestjs/common';
import { KycController } from './KycController.js';
import { KycRepository } from './KycRepository.js';
import { KycService } from './KycService.js';

@Module({
  controllers: [KycController],
  providers: [KycService, KycRepository],
  exports: [KycService, KycRepository],
})
export class KycModule {}
