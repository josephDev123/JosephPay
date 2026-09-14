import { z } from 'zod';
import { Currency } from 'src/lib/prisma/generated/enums.js';

export const CreateWalletSchema = z.object({
  userId: z.uuid(),
  //   currency: z.enum(Currency),
});

export type CreateWalletDto = z.infer<typeof CreateWalletSchema>;
