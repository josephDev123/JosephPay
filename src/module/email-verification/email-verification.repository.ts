import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../lib/prisma/generated/client.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';

type DatabaseClient = PrismaService | PrismaClient | Prisma.TransactionClient;

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class EmailVerificationRepository {
  findByUserId(
    database: DatabaseClient,
    userId: string,
  ): Promise<EmailVerificationRecord | null> {
    return database.$queryRaw<EmailVerificationRecord[]>`
      SELECT
        id,
        user_id AS "userId",
        otp_hash AS "otpHash",
        expires_at AS "expiresAt",
        attempts,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM email_verifications
      WHERE user_id = ${userId}
      LIMIT 1
    `.then((rows) => rows[0] ?? null);
  }

  findByUserIdForUpdate(
    database: DatabaseClient,
    userId: string,
  ): Promise<EmailVerificationRecord | null> {
    return database.$queryRaw<EmailVerificationRecord[]>`
      SELECT
        id,
        user_id AS "userId",
        otp_hash AS "otpHash",
        expires_at AS "expiresAt",
        attempts,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM email_verifications
      WHERE user_id = ${userId}
      LIMIT 1
      FOR UPDATE
    `.then((rows) => rows[0] ?? null);
  }

  async upsertPending(
    database: DatabaseClient,
    input: {
      userId: string;
      otpHash: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    await database.$executeRaw`
      INSERT INTO email_verifications (
        id,
        user_id,
        otp_hash,
        expires_at,
        attempts,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${input.userId},
        ${input.otpHash},
        ${input.expiresAt},
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        otp_hash = EXCLUDED.otp_hash,
        expires_at = EXCLUDED.expires_at,
        attempts = 0,
        updated_at = NOW()
    `;
  }

  async incrementAttempts(
    database: DatabaseClient,
    userId: string,
  ): Promise<void> {
    await database.$executeRaw`
      UPDATE email_verifications
      SET attempts = attempts + 1,
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }

  async deleteByUserId(
    database: DatabaseClient,
    userId: string,
  ): Promise<void> {
    await database.$executeRaw`
      DELETE FROM email_verifications
      WHERE user_id = ${userId}
    `;
  }
}
