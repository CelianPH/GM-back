import { z } from 'zod';

export const addFriendSchema = z.object({
  friendCode: z.string().regex(/^GM-[A-Z0-9]{6}$/, 'Code ami invalide (format GM-XXXXXX)'),
});
