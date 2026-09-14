import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  // name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  middleName: z.string().min(1).max(50),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
