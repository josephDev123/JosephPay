import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { TransferService } from './transfer.service.js';
import { serializeTransaction } from '../Transaction/transaction.service.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { successResponse } from '../../shared/http/api-response.js';
import { TransferRequestDto, TransferResponseDto } from '../../docs/swagger.models.js';

const transferSchema = z.object({
  recipientAccountNumber: z.string().regex(/^\d{10}$/),
  currency: z.enum(['NGN', 'USD']),
  amount: z.string().regex(/^\d+$/).transform((value) => BigInt(value)),
  description: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
});

type TransferInput = z.infer<typeof transferSchema>;

@ApiTags('Internal Transfers')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/transfers/internal')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({
    summary: 'Transfer funds to another customer wallet',
    description:
      'Transfers funds to the recipient account number for the requested currency. The recipient account number must belong to an active customer wallet.',
  })
  @ApiBody({
    type: TransferRequestDto,
  })
  @ApiCreatedResponse({ type: TransferResponseDto })
  async transfer(
    @Req() request: Request,
    @Body(new ZodValidationPipe(transferSchema)) body: TransferInput,
  ) {
    const transaction = await this.transferService.transfer({
      fromUserId: request.user!.sub,
      ...body,
    });
    return successResponse(
      'Transfer completed successfully',
      serializeTransaction(transaction),
    );
  }
}
