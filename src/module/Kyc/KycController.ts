import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from '../../shared/http/api-response.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { KycService } from './KycService.js';
import type { ReviewKycDto } from './dto/review-kyc.dto.js';
import type { SubmitKycDto } from './dto/submit-kyc.dto.js';
import {
  reviewKycSchema,
  submitKycSchema,
} from './validation/kyc.validation.js';
import {
  KycResponseDto,
  ReviewKycRequestDto,
} from '../../docs/swagger.models.js';

@ApiTags('KYC')
@Controller('api/v1/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Submit KYC information for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User identifier',
    example: '7d4ef0d2-0b37-4b1d-a9fd-81d1d4ce9c4f',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        bvn: '12345678901',
        documentType: 'NIN',
      },
    },
  })
  @ApiCreatedResponse({
    type: KycResponseDto,
  })
  async submit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(submitKycSchema)) body: SubmitKycDto,
  ) {
    const kyc = await this.kycService.submit(userId, body);

    return successResponse('KYC submitted successfully', kyc);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Fetch a user KYC record' })
  @ApiParam({
    name: 'userId',
    description: 'User identifier',
    example: '7d4ef0d2-0b37-4b1d-a9fd-81d1d4ce9c4f',
  })
  @ApiOkResponse({
    type: KycResponseDto,
  })
  async get(@Param('userId', ParseUUIDPipe) userId: string) {
    const kyc = await this.kycService.getByUserId(userId);

    return successResponse('KYC record fetched successfully', kyc);
  }

  @Patch(':userId/review')
  @ApiOperation({ summary: 'Review a user KYC record' })
  @ApiParam({
    name: 'userId',
    description: 'User identifier',
    example: '7d4ef0d2-0b37-4b1d-a9fd-81d1d4ce9c4f',
  })
  @ApiBody({
    type: ReviewKycRequestDto,
  })
  @ApiOkResponse({
    type: KycResponseDto,
  })
  async review(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(reviewKycSchema)) body: ReviewKycDto,
  ) {
    const kyc = await this.kycService.review(userId, body);

    return successResponse('KYC review updated successfully', kyc);
  }
}
