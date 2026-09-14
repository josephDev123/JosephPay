import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { errorResponse } from '../http/api-response.js';
import { EMAIL_VERIFICATION_OTP_TTL_MINUTES } from '../lib/otp.js';
import { ResendService } from 'nestjs-resend';

type SendVerificationEmailInput = {
  email: string;
  firstName: string;
  otp: string;
};

@Injectable()
export class ResendMailService {
  constructor(private readonly resendService: ResendService) {}
  private readonly logger = new Logger(ResendMailService.name);
  private readonly fromEmail = process.env.RESEND_FROM_EMAIL as string;

  async sendEmailVerificationOtp(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    console.log('Sending email verification OTP to', input.email);
    console.log('first name:', input.firstName);
    console.log('OTP:', input.otp);
    const response = await this.resendService.send({
      from: this.fromEmail,
      to: input.email,
      subject: 'Verify your email address',
      text: buildVerificationText({
        firstName: input.firstName,
        otp: input.otp,
      }),
      // html: buildVerificationHtml({
      //   firstName: input.firstName,
      //   otp: input.otp,
      // }),
    });

    const { data, error } = response;
    console.log('error', error);
    console.log('data', data);

    if (error) {
      this.logger.error('Failed to send email verification OTP', error);
      throw new InternalServerErrorException(
        errorResponse(
          'Unable to send verification email',
          'RESEND_SEND_FAILED',
          ['The verification email could not be delivered'],
        ),
      );
    }

    this.logger.log(
      `Verification email queued successfully for ${input.email}${
        data ? ` with message id ${data.id}` : ''
      }`,
    );
  }
}

function buildVerificationText(input: {
  firstName: string;
  otp: string;
}): string {
  return [
    `Hello ${input.firstName},`,
    '',
    `Use this OTP to verify your email address: ${input.otp}`,
    `This code expires in ${EMAIL_VERIFICATION_OTP_TTL_MINUTES} minutes.`,
    '',
    'If you did not create this account, you can ignore this message.',
  ].join('\n');
}

function buildVerificationHtml(input: {
  firstName: string;
  otp: string;
}): string {
  const safeName = escapeHtml(input.firstName);

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p>Hello ${safeName},</p>
      <p>Use this OTP to verify your email address:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.18em;">${input.otp}</p>
      <p>This code expires in ${EMAIL_VERIFICATION_OTP_TTL_MINUTES} minutes.</p>
      <p>If you did not create this account, you can ignore this message.</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
