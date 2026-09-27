import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { serializeTransaction, TransactionService } from './transaction.service.js';
import { successResponse } from '../../shared/http/api-response.js';
import {
  TransactionListResponseDto,
  TransactionResponseDto,
} from '../../docs/swagger.models.js';

@ApiTags('Transactions')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user transactions' })
  @ApiOkResponse({ type: TransactionListResponseDto })
  async list(@Req() request: Request) {
    const transactions = await this.transactionService.listForUser(request.user!.sub);
    return successResponse('Transactions fetched successfully', transactions);
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Fetch one authenticated user transaction' })
  @ApiParam({ name: 'transactionId', format: 'uuid', example: 'a1b2c3d4-e5f6-4789-9012-345678901234' })
  @ApiOkResponse({ type: TransactionResponseDto })
  async get(@Req() request: Request, @Param('transactionId') transactionId: string) {
    const transaction = await this.transactionService.findForUser(
      request.user!.sub,
      transactionId,
    );
    return successResponse(
      'Transaction fetched successfully',
      transaction ? serializeTransaction(transaction) : transaction,
    );
  }
}
