import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).default("");
const list = (max = 12) => z.array(z.string().trim().max(400)).max(max).default([]);
export const competitorEvidenceSchema = z.object({
  domain: z.string().max(253), url: z.string().url().max(600),
  title: text(200), quote: text(500), reason: text(400),
});
export const businessProfileSchema = z.object({
  name: text(120), industry: text(80), summary: text(800), products: list(),
  audience: text(500), usp: text(400), locations: list(), country: z.string().max(80).nullable().default(null),
  dialect: text(80), socials: list(20), contacts: list(20), platform: z.string().max(80).nullable().default(null),
  competitors: list(5), competitorEvidence: z.array(competitorEvidenceSchema).max(5).default([]),
  suggestedTone: text(120),
  firstTasks: z.array(z.object({ employeeId: z.enum(["nour", "sonny", "dana", "eva", "sam", "adam"]), title: text(120), prompt: text(600) })).max(6).default([]),
  recommendedIntegrations: z.array(z.object({ provider: text(40), why: text(200), evidence: z.string().max(500).optional(), score: z.number().optional() })).max(10).default([]),
  pagesRead: z.array(z.string().url().max(600)).max(12).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("low"),
  analyzedAt: z.string().max(40).optional(), gaps: list(),
});

export const brandVoiceProfileSchema = z.object({
  summary: z.string().trim().min(5).max(800), personality: list(6),
  tone: z.object({ formality: z.number().min(0).max(10), energy: z.number().min(0).max(10), warmth: z.number().min(0).max(10), humor: z.number().min(0).max(10) }),
  dialect: text(120), addressing: text(300), vocabulary: z.object({ use: list(16), avoid: list(16) }),
  signaturePhrases: list(8), ctaStyle: text(500), emojiPolicy: text(400), formatting: list(), doList: list(), dontList: list(),
  perChannel: z.array(z.object({ channel: text(80), guidance: text(500) })).max(8).default([]),
  samples: z.array(z.object({ before: text(500), after: text(500) })).max(4).default([]),
});

/** A competitor must be selected from inspected pages, with a literal supporting quote. */
export function verifiedCompetitors(raw: unknown, pages: { domain: string; url: string; title: string; text: string }[]) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((value) => {
    const parsed = competitorEvidenceSchema.safeParse(value);
    if (!parsed.success) return [];
    const candidate = parsed.data;
    const page = pages.find((p) => p.domain === candidate.domain && p.url === candidate.url);
    const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
    if (!page || candidate.quote.length < 20 || !candidate.reason || !normalize(page.text).includes(normalize(candidate.quote))) return [];
    return [{ ...candidate, title: page.title }];
  }).filter((item, i, all) => all.findIndex((other) => other.domain === item.domain) === i).slice(0, 5);
}