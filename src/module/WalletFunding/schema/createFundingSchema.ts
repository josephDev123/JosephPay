import z from 'zod';

export const createFundingSchema = z.object({
  amount: z.string().regex(/^\d+$/).transform(BigInt),
  currency: z.enum(['NGN', 'USD']),
  customerEmail: z.email(),
  customerName: z.string().trim().max(120).optional(),
  provider: z.enum(['PAYSTACK', 'STRIPE', 'FLUTTERWAVE']).default('PAYSTACK'),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export type ICreateFundingSchemaType = z.infer<typeof createFundingSchema>;
