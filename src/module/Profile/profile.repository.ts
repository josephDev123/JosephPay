import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
} from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import type { ProfileRecord } from './mappers/profile.mapper.js';

type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

@Injectable()
export class ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEmpty(database: DatabaseClient, userId: string) {
    return (database as DatabaseClient & {
      profile: {
        create: (args: { data: { userId: string } }) => Promise<ProfileRecord>;
      };
    }).profile.create({
      data: {
        userId,
      },
    });
  }

  async getProfile(userId: string, database: DatabaseClient = this.prismaService) {
    const user = await database.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      } as never,
    }) as { profile: ProfileRecord | null } | null;

    return user?.profile ?? null;
  }
}
