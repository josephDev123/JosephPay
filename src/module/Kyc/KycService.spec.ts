import { jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { KycRepository } from './KycRepository.js';
import { KycService } from './KycService.js';

describe('KycService', () => {
  const createdAt = new Date('2026-08-02T00:00:00.000Z');

  let prisma: PrismaService;
  let kycRepository: jest.Mocked<Pick<
    KycRepository,
    'findByUserId' | 'upsertPending' | 'review'
  >>;
  let service: KycService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    } as never;

    kycRepository = {
      findByUserId: jest.fn(),
      upsertPending: jest.fn(),
      review: jest.fn(),
    };

    service = new KycService(prisma, kycRepository as never);
  });

  it('submits KYC data as pending', async () => {
    kycRepository.findByUserId.mockResolvedValue({
      id: '1d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a222',
      userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
      status: 'PENDING',
      submittedData: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    });
    kycRepository.upsertPending.mockResolvedValue({
      id: '1d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a222',
      userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
      status: 'PENDING',
      submittedData: { bvn: '12345678901' },
      reviewNote: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.submit('7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111', {
      bvn: '12345678901',
    });

    expect(result.status).toBe('PENDING');
    expect(kycRepository.upsertPending).toHaveBeenCalledWith(
      prisma,
      '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
      { bvn: '12345678901' },
    );
  });

  it('rejects submission after verification', async () => {
    kycRepository.findByUserId.mockResolvedValue({
      id: '1d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a222',
      userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
      status: 'VERIFIED',
      submittedData: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    });

    await expect(
      service.submit('7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111', {
        bvn: '12345678901',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found when no KYC exists', async () => {
    kycRepository.findByUserId.mockResolvedValue(null);

    await expect(
      service.getByUserId('7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
