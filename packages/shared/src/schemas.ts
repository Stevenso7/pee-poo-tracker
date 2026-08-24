import { z } from 'zod';
import {
  PEE_COLORS,
  PEE_FOAMS,
  PEE_VOLUMES,
  POO_COLORS,
  POO_CONSISTENCY_MIN,
  POO_CONSISTENCY_MAX,
} from './enums';

const peeColors = PEE_COLORS as [string, ...string[]];
const peeFoams = PEE_FOAMS as [string, ...string[]];
const peeVolumes = PEE_VOLUMES as [string, ...string[]];
const pooColors = POO_COLORS as [string, ...string[]];

export const CreateRecordSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PEE'),
    recordedAt: z.coerce.date(),
    peeColor: z.enum(peeColors).optional(),
    peeFoam: z.enum(peeFoams).optional(),
    peeVolume: z.enum(peeVolumes).optional(),
    notes: z.string().max(500).optional(),
    needsPhotoUpload: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('POO'),
    recordedAt: z.coerce.date(),
    pooColor: z.enum(pooColors).optional(),
    pooConsistency: z
      .number()
      .int()
      .min(POO_CONSISTENCY_MIN)
      .max(POO_CONSISTENCY_MAX)
      .optional(),
    notes: z.string().max(500).optional(),
    needsPhotoUpload: z.boolean().optional(),
  }),
]);

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

export const AnalysisReportSchema = z.object({
  summary: z.string(),
  observations: z
    .object({
      color: z.string().optional(),
      clarity: z.string().optional(),
      foam: z.string().optional(),
      consistency: z.string().optional(),
    })
    .passthrough(),
  possibleInterpretations: z.array(z.string()),
  lifestyleHints: z.array(z.string()),
  redFlags: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  disclaimer: z.string(),
});

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const UpdateSettingsSchema = z.object({
  language: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(3).optional(),
  photoRetentionDays: z.number().int().min(1).max(90).optional(),
});
