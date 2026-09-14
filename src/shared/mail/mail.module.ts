import { Module } from '@nestjs/common';
import { ResendModule } from 'nestjs-resend';
import { ResendMailService } from './resend-mail.service.js';

@Module({
  imports: [
    ResendModule.forRootAsync({
      useFactory: async () => ({
        apiKey: process.env.RESEND_API_KEY as string,
      }),
    }),
  ],
  providers: [ResendMailService],
  exports: [ResendMailService],
})
export class MailModule {}
