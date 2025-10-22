import { z } from 'zod';

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date'
});

export const planSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  groupLabel: z.string().max(80).optional().nullable(),
  hostName: z.string().min(1),
  cutOffUtc: isoDate,
  optionsSlots: z.array(isoDate).min(1),
  optionsVenues: z.array(z.string().min(1)).min(1),
  currency: z.string().default('GBP')
});

export const responseSchema = z.object({
  planId: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  choiceSlots: z.array(isoDate).min(1),
  choiceVenue: z.string().min(1).optional().nullable(),
  attendance: z.enum(['in', 'maybe', 'out']).default('in'),
  pledgeAmount: z
    .number()
    .min(0)
    .max(99999)
    .optional()
    .or(z.string().transform((value) => (value ? Number(value) : undefined)).optional()),
  notes: z.string().max(500).optional().nullable(),
  ipHash: z.string().optional().nullable()
});

export const decisionSchema = z.object({
  planId: z.string().uuid(),
  slot: isoDate,
  venue: z.string().min(1),
  perPersonEstimate: z
    .number()
    .min(0)
    .max(99999)
    .optional()
    .or(z.string().transform((value) => (value ? Number(value) : undefined)).optional()),
  mapUrl: z.string().url().optional().nullable(),
  hostToken: z.string().min(10)
});

export type PlanInput = z.infer<typeof planSchema>;
export type ResponseInput = z.infer<typeof responseSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
