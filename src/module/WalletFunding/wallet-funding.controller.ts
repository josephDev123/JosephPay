import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { successResponse } from '../../shared/http/api-response.js';
import { WalletFundingService } from './wallet-funding.service.js';
import {
  WalletFundingRequestDto,
  TransactionResponseDto,
} from '../../docs/swagger.models.js';
import { createFundingSchema } from './schema/createFundingSchema.js';
import { type createFundingDTO } from './dto/createFundingDTO.js';

@ApiTags('Wallet Funding')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/wallet/fund')
export class WalletFundingController {
  constructor(private readonly service: WalletFundingService) {}
  @Post()
  @ApiOperation({ summary: 'Initialize a wallet funding payment' })
  @ApiBody({ type: WalletFundingRequestDto })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  async create(
    @Req() request: Request,
    @Body(new ZodValidationPipe(createFundingSchema))
    body: createFundingDTO,
  ) {
    const funding = await this.service.initiate({
      userId: request.user!.sub,
      ...body,
    });
    return successResponse('Wallet funding initialized successfully', {
      ...funding,
      amount: funding.amount.toString(),
    });
  }
}
