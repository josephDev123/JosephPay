import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from '../../shared/http/api-response.js';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe.js';
import {
  ResolveAccountRequestDto,
  ResolveAccountResponseDto,
} from './ledger-account.dto.js';
import {
  resolveAccountSchema,
  type ResolveAccountInput,
} from './ledger-account.validation.js';
import { LedgerAccountService } from './ledger-account.service.js';

@ApiTags('Ledger Accounts')
@ApiCookieAuth('cookieAuth')
@Controller('api/v1/ledger-accounts')
export class LedgerAccountController {
  constructor(private readonly ledgerAccountService: LedgerAccountService) {}

  @Post('resolve')
  @ApiOperation({
    summary: 'Resolve a customer wallet account number',
    description:
      'Validates an active customer wallet account number and returns the recipient name and currency. Internal account identifiers and balances are not exposed.',
  })
  @ApiBody({ type: ResolveAccountRequestDto })
  @ApiOkResponse({ type: ResolveAccountResponseDto })
  async resolve(
    @Body(new ZodValidationPipe(resolveAccountSchema))
    body: ResolveAccountInput,
  ) {
    const account = await this.ledgerAccountService.resolveAccountNumber(
      body.accountNumber,
    );

    return successResponse('Account resolved successfully', account);
  }
}
