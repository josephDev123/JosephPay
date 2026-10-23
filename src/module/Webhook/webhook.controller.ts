import { Controller, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../shared/decorators/auth.public.decorator.js';
import { WebhookResponseDto } from '../../docs/swagger.models.js';
import { WebhookService } from './webhook.service.js';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}
  @Public()
  @Post()
  @ApiOperation({
    summary: 'Receive and process payment provider webhooks',
    description:
      'Public endpoint. Paystack requests must include the x-paystack-signature header. The raw request body is verified before the event is persisted and processed. Duplicate events are accepted without reposting the ledger transaction.',
  })
  @ApiHeader({
    name: 'x-paystack-signature',
    required: true,
    description: 'HMAC-SHA512 signature generated from the raw request body.',
    example: '2c26b46b68ffc68ff99b453c1d30413413422c7b1e36b5f6a...',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['event', 'data'],
      properties: {
        event: { type: 'string', example: 'charge.success' },
        data: {
          type: 'object',
          properties: {
            reference: { type: 'string', example: 'DEP-ABC123' },
            amount: { type: 'integer', example: 2500000 },
            currency: { type: 'string', example: 'NGN' },
            status: { type: 'string', example: 'success' },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: WebhookResponseDto,
    description: 'Webhook accepted or recognized as a duplicate.',
  })
  receive(@Req() request: Request) {
    const rawBody =
      (request as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(request.body));
    return this.service.receive(rawBody, request.headers, request.body);
  }
}
