import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/\d/, 'Au moins 1 chiffre')
    .regex(/[A-Z]/, 'Au moins 1 majuscule'),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const oauthGoogleSchema = z.object({
  idToken: z.string().min(10),
});

export const oauthAppleSchema = z.object({
  idToken: z.string().min(10),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
});
