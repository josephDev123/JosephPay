import { Module } from '@nestjs/common';
import { KycModule } from '../Kyc/kyc.module.js';
import { ProfileModule } from '../Profile/profile.module.js';
import { UserController } from './UserController.js';
import { UserRepository } from './UserRepository.js';
import { UserService } from './UserService.js';
import { WalletRepository } from '../Wallet/walletRepository.js';
import { EmailVerificationRepository } from '../email-verification/email-verification.repository.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import { MailModule } from '../../shared/mail/mail.module.js';

@Module({
  imports: [KycModule, ProfileModule, MailModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    WalletRepository,
    EmailVerificationRepository,
    EmailVerificationService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
