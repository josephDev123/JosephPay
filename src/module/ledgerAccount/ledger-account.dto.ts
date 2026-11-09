import { ApiProperty } from '@nestjs/swagger';

export class ResolveAccountRequestDto {
  @ApiProperty({
    example: '1000000001',
    description: '10-digit customer wallet account number.',
    pattern: '^\\d{10}$',
  })
  accountNumber!: string;
}

export class ResolvedAccountDto {
  @ApiProperty({ example: '1000000001' })
  accountNumber!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'NGN', enum: ['NGN', 'USD'] })
  currency!: 'NGN' | 'USD';
}

export class ResolveAccountResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 'Account resolved successfully' })
  message!: string;

  @ApiProperty({ type: () => ResolvedAccountDto })
  data!: ResolvedAccountDto;
}
