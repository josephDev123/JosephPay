import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import { successResponse } from '../../shared/http/api-response.js';
import { Public } from '../../shared/decorators/auth.public.decorator.js';
import { CollectionService } from './collection.service.js';
import {
  CollectionRequestDto,
  CollectionResponseDto,
} from '../../docs/swagger.models.js';

const createSchema = z.object({
  amount: z.string().regex(/^\d+$/).transform(BigInt),
  currency: z.enum(['NGN', 'USD']),
  customerEmail: z.email(),
  customerName: z.string().trim().max(120).optional(),
  provider: z.enum(['PAYSTACK', 'STRIPE', 'FLUTTERWAVE']).default('PAYSTACK'),
  idempotencyKey: z.string().trim().min(8).max(128),
});

@ApiTags('Collections')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/collections')
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  @Post()
  @ApiOperation({ summary: 'Initialize a provider-backed customer collection' })
  @ApiBody({ type: CollectionRequestDto })
  @ApiCreatedResponse({ type: CollectionResponseDto })
  async create(
    @Req() request: Request,
    @Body(new ZodValidationPipe(createSchema))
    body: z.infer<typeof createSchema>,
  ) {
    const collection = await this.service.create({
      merchantUserId: request.user!.sub,
      ...body,
    });
    return successResponse('Collection initialized successfully', {
      ...collection,
      amount: collection.amount.toString(),
    });
  }

  @Public()
  @Post('webhooks/paystack')
  @ApiTags('Webhooks')
  @ApiOperation({ summary: 'Receive and process Paystack payment webhooks' })
  @ApiHeader({
    name: 'x-paystack-signature',
    required: true,
    description: 'HMAC SHA-512 signature of the raw request body.',
  })
  @ApiCreatedResponse({ description: 'Webhook accepted for processing.' })
  async paystackWebhook(@Req() request: Request) {
    const rawBody =
      (request as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(request.body));
    const signature = String(request.headers['x-paystack-signature'] ?? '');
    return this.service.processPaystackWebhook(
      rawBody,
      signature,
      request.body,
    );
  }
}
