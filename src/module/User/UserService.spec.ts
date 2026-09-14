// import { jest } from '@jest/globals';
// import { ConflictException, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../lib/prisma/prisma.service.js';
// import { KycRepository } from '../Kyc/KycRepository.js';
// import { UserRepository } from './UserRepository.js';
// import { UserService } from './UserService.js';

// describe('UserService', () => {
//   const createdAt = new Date('2026-08-02T00:00:00.000Z');

//   let prisma: jest.Mocked<Pick<PrismaService, '$transaction'>>;
//   let userRepository: jest.Mocked<Pick<
//     UserRepository,
//     'findByEmail' | 'createUser' | 'createWallets' | 'findById'
//   >>;
//   let kycRepository: jest.Mocked<Pick<KycRepository, 'createPending'>>;
//   let service: UserService;

//   beforeEach(() => {
//     prisma = {
//       $transaction: jest.fn(async (callback) => callback({} as never)),
//     };

//     userRepository = {
//       findByEmail: jest.fn(),
//       createUser: jest.fn(),
//       createWallets: jest.fn(),
//       findById: jest.fn(),
//     };

//     kycRepository = {
//       createPending: jest.fn(),
//     };

//     service = new UserService(
//       prisma as never,
//       userRepository as never,
//       kycRepository as never,
//     );
//   });

//   it('registers a user and seeds wallet and KYC records atomically', async () => {
//     userRepository.findByEmail.mockResolvedValue(null);
//     userRepository.createUser.mockResolvedValue({
//       id: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
//       email: 'user@example.com',
//       name: 'User Example',
//       createdAt,
//       updatedAt: createdAt,
//     });
//     kycRepository.createPending.mockResolvedValue({
//       id: '1d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a222',
//       userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
//       status: 'PENDING',
//       submittedData: null,
//       reviewNote: null,
//       reviewedAt: null,
//       createdAt,
//       updatedAt: createdAt,
//     });
//     userRepository.createWallets.mockResolvedValue([
//       {
//         id: '2d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a333',
//         userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
//         currency: 'NGN',
//         balance: 0n,
//         createdAt,
//         updatedAt: createdAt,
//       },
//       {
//         id: '3d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a444',
//         userId: '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
//         currency: 'USD',
//         balance: 0n,
//         createdAt,
//         updatedAt: createdAt,
//       },
//     ]);

//     const result = await service.register({
//       email: 'user@example.com',
//       name: 'User Example',
//     });

//     expect(prisma.$transaction).toHaveBeenCalledTimes(1);
//     expect(userRepository.findByEmail).toHaveBeenCalledWith(
//       'user@example.com',
//       expect.anything(),
//     );
//     expect(userRepository.createWallets).toHaveBeenCalledWith(
//       expect.anything(),
//       '7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111',
//     );
//     expect(result.wallets).toEqual([
//       expect.objectContaining({ currency: 'NGN', balance: '0' }),
//       expect.objectContaining({ currency: 'USD', balance: '0' }),
//     ]);
//     expect(result.kyc?.status).toBe('PENDING');
//   });

//   it('rejects duplicate emails', async () => {
//     userRepository.findByEmail.mockResolvedValue({
//       id: 'existing',
//       email: 'user@example.com',
//       name: 'Existing',
//       createdAt,
//       updatedAt: createdAt,
//     });

//     await expect(
//       service.register({
//         email: 'user@example.com',
//         name: 'User Example',
//       }),
//     ).rejects.toBeInstanceOf(ConflictException);
//   });

//   it('fails when the user cannot be found', async () => {
//     userRepository.findById.mockResolvedValue(null);

//     await expect(service.getProfile('7d3a8e2e-4a8f-4a1a-9a3f-6c2f55f1a111')).rejects.toBeInstanceOf(
//       NotFoundException,
//     );
//   });
// });
