import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from '../../shared/http/api-response.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { UserService } from './UserService.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { createUserSchema } from './schema/createUserSchema.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import { verifyEmailSchema } from './schema/verifyEmailSchema.js';
import type { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { resendVerificationSchema } from './schema/resendVerificationSchema.js';
import {
  CreateUserRequestDto,
  UserProfileResponseDto,
  ResendVerificationRequestDto,
  VerificationEmailResponseDto,
  VerifyEmailRequestDto,
} from '../../docs/swagger.models.js';
import { Public } from '../../shared/decorators/auth.public.decorator.js';
import { type Request } from 'express';

@ApiTags('Users')
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: CreateUserRequestDto,
  })
  @ApiCreatedResponse({
    type: UserProfileResponseDto,
  })
  async register(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDto,
  ) {
    const user = await this.userService.register(body);

    return successResponse(
      'User registered successfully. Check your email for the OTP.',
      user,
    );
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify a newly registered user email address' })
  @ApiBody({
    type: VerifyEmailRequestDto,
  })
  @ApiOkResponse({
    type: UserProfileResponseDto,
  })
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailDto,
  ) {
    const user = await this.userService.verifyEmail(body);

    return successResponse('Email verified successfully', user);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend the email verification OTP' })
  @ApiBody({
    type: ResendVerificationRequestDto,
  })
  @ApiOkResponse({
    type: VerificationEmailResponseDto,
  })
  async resendVerification(
    @Body(new ZodValidationPipe(resendVerificationSchema))
    body: ResendVerificationDto,
  ) {
    const result = await this.userService.resendVerification(body);

    return successResponse('Verification email sent successfully', result);
  }

  @Get()
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Fetch the authenticated user profile' })
  @ApiOkResponse({
    type: UserProfileResponseDto,
  })
  async getProfile(@Req() req: Request) {
    const id = req.user?.sub;
    const user = await this.userService.getProfile(id);

    return successResponse('User profile fetched successfully', user);
  }
}
