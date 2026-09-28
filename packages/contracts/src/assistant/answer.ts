import { z } from "zod";

const short = z.string().trim().min(1).max(160);

const barValue = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;
  const parsed = Number(value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().finite().nonnegative());

export const answerBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().trim().min(1).max(900) }),
  z.object({
    type: z.literal("stats"),
    items: z
      .array(z.object({ label: short, value: short, hint: z.string().trim().max(160).optional() }))
      .min(1)
      .max(4),
  }),
  z.object({
    type: z.literal("compare"),
    columns: z.array(short).min(1).max(4),
    rows: z
      .array(z.object({ label: short, values: z.array(z.string().trim().max(160)).min(1).max(4) }))
      .min(1)
      .max(10),
  }),
  z.object({ type: z.literal("steps"), items: z.array(z.string().trim().min(1).max(240)).min(1).max(6) }),
  z.object({ type: z.literal("tip"), text: z.string().trim().min(1).max(400) }),
  z.object({
    type: z.literal("table"),
    columns: z.array(short).min(2).max(5),
    rows: z.array(z.array(z.string().trim().max(160)).min(1).max(5)).min(1).max(8),
  }),
  z.object({
    type: z.literal("chart"),
    title: z.string().trim().max(120).optional(),
    unit: z.string().trim().max(24).optional(),
    items: z.array(z.object({ label: short, value: barValue })).min(2).max(8),
  }),
]);

export const assistantAnswer = z.object({ blocks: z.array(answerBlock).min(1).max(5) });

export type AnswerBlock = z.infer<typeof answerBlock>;

export const askInput = z.object({
  question: z.string().trim().min(1, "Écris ta question.").max(500, "Ta question est trop longue."),
  context: z.string().max(20000),
});
