import { z } from 'zod';

export const verifyEmailSchema = z.object({
  email: z.email(),
  otp: z.string().trim().regex(/^\d{6}$/),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

