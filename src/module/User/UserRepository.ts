import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Kyc,
  PrismaClient,
  Wallet,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { type SupportedCurrency } from '../../shared/constants/currencies.js';
import { WalletRepository } from '../Wallet/walletRepository.js';
import type { ProfileRecord } from '../Profile/mappers/profile.mapper.js';
import type { UserRecord } from './mappers/user.mapper.js';

type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  passwordHash: string;
};

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletRepository: WalletRepository,
  ) {}

  findByEmail(email: string, database: DatabaseClient = this.prisma) {
    return database.user.findUnique({
      where: {
        email,
      },
    });
  }

  findById(database: DatabaseClient, id: string) {
    return database.user.findUnique({
      where: {
        id,
      },
      include: {
        wallets: true,
        kyc: true,
        profile: true,
      } as never,
    }) as unknown as Promise<
      | (UserRecord & {
          wallets: Wallet[];
          kyc: Kyc | null;
          profile: ProfileRecord | null;
        })
      | null
    >;
  }

  createUser(database: DatabaseClient, data: CreateUserInput) {
    return database.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        passwordHash: data.passwordHash,
      } as never,
    }) as unknown as Promise<UserRecord>;
  }

  createWallets(database: DatabaseClient, userId: string) {
    return this.walletRepository.createWallets(userId, database);
  }

  findWalletsByUserId(database: DatabaseClient, userId: string) {
    return this.walletRepository.findWalletsByUserId(userId);
  }

  markEmailVerified(
    database: DatabaseClient,
    userId: string,
    emailVerifiedAt: Date,
  ) {
    return database.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerifiedAt,
      } as never,
    }) as unknown as Promise<UserRecord>;
  }

  upsertWalletBalance(
    userId: string,
    currency: SupportedCurrency,
    balance: bigint,
  ) {
    return this.walletRepository.upsertWalletBalance(userId, currency, balance);
  }
}
