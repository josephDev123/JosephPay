import { Controller, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../shared/decorators/auth.public.decorator.js';
import { WebhookService } from './webhook.service.js';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}
  @Public()
  @Post()
  @ApiOperation({ summary: 'Receive and process payment provider webhooks' })
  @ApiCreatedResponse({ description: 'Webhook accepted or recognized as a duplicate.' })
  receive(@Req() request: Request) {
    const rawBody =
      (request as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(request.body));
    return this.service.receive(rawBody, request.headers, request.body);
  }
}
