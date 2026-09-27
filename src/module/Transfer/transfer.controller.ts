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
  destinationUserId: z.uuid(),
  currency: z.enum(['NGN', 'USD']),
  amount: z.string().regex(/^\d+$/).transform((value) => BigInt(value)),
  idempotencyKey: z.string().trim().min(8).max(128),
});

type TransferInput = z.infer<typeof transferSchema>;

@ApiTags('Transfers')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: 'Transfer funds to another user wallet' })
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
      toUserId: body.destinationUserId,
      ...body,
    });
    return successResponse(
      'Transfer completed successfully',
      serializeTransaction(transaction),
    );
  }
}
