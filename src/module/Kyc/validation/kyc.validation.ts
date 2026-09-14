import { z } from 'zod';

export const submitKycSchema = z.object({
  // value: z.string().trim(),
  documentType: z.enum([
    'NIN',
    'PASSPORT',
    'BVN',
    'DRIVERS_LICENSE',
    'VOTERS_CARD',
    'NATIONAL_ID_CARD',
  ]),
});
// .passthrough();

export const reviewKycSchema = z.object({
  status: z.enum(['VERIFIED', 'FAILED']),
  reviewNote: z.string().trim().min(2).max(500).optional(),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type ReviewKycInput = z.infer<typeof reviewKycSchema>;
