import { z } from 'zod';

export const resolveAccountSchema = z.object({
  accountNumber: z.string().trim().regex(/^\d{10}$/),
});

export type ResolveAccountInput = z.infer<typeof resolveAccountSchema>;
