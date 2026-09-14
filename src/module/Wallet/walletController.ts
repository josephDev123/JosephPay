import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from './walletService.js';
import {
  CreateWalletSchema,
  type CreateWalletDto,
} from './validation/create-wallet.validation.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { successResponse } from '../../shared/http/api-response.js';
import {
  CreateWalletRequestDto,
  WalletListResponseDto,
} from '../../docs/swagger.models.js';

@ApiTags('Wallet')
@Controller('api/v1/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateWalletSchema))
  @ApiOperation({ summary: 'Create wallets for a user' })
  @ApiBody({
    type: CreateWalletRequestDto,
  })
  @ApiCreatedResponse({
    type: WalletListResponseDto,
  })
  async createWallet(@Body() body: CreateWalletDto) {
    const wallet = await this.walletService.createWallet(body);

    return successResponse('Wallet created successfully', wallet);
  }
}
