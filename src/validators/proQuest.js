import { z } from 'zod';

export const PRO_QUEST_STATUSES = ['active', 'draft', 'done'];

const isoDate = z.coerce.date().optional().nullable();

export const createProQuestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    startsAt: isoDate,
    endsAt: isoDate,
    rewardPoints: z.coerce.number().int().min(0).max(10000).default(0),
    rewardVideoId: z.coerce.number().int().positive().optional().nullable(),
    goalCount: z.coerce.number().int().min(1).max(100000).default(1),
    status: z.enum(PRO_QUEST_STATUSES).default('draft'),
  })
  .strict();

export const updateProQuestSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    startsAt: isoDate,
    endsAt: isoDate,
    rewardPoints: z.coerce.number().int().min(0).max(10000).optional(),
    rewardVideoId: z.coerce.number().int().positive().optional().nullable(),
    goalCount: z.coerce.number().int().min(1).max(100000).optional(),
    doneCount: z.coerce.number().int().min(0).max(100000).optional(),
    status: z.enum(PRO_QUEST_STATUSES).optional(),
  })
  .strict();

export const listQuerySchema = z.object({
  status: z.enum(PRO_QUEST_STATUSES).optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
