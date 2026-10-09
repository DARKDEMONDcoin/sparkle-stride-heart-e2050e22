import { z } from "zod";
import { verifiedCompetitors } from "./brand-profile-schema";

export type CompetitorPage = { domain: string; url: string; title: string; text: string };
const literal = (source: string, quote: string) => quote.trim().length >= 20 && source.replace(/\s+/g, " ").includes(quote.replace(/\s+/g, " ").trim());
const overlap = z.object({ rating: z.number().int().min(0).max(3), brandQuote: z.string().max(500), candidateQuote: z.string().max(500) });
const assessment = z.object({
  domain: z.string(), url: z.string(), quote: z.string().max(500), reason: z.string().max(400),
  offer: overlap, audience: overlap,
  substitution: z.enum(["direct", "partial", "unrelated"]),
  market: z.enum(["overlap", "different", "unknown"]),
  marketBrandQuote: z.string().max(500).default(""), marketCandidateQuote: z.string().max(500).default(""),
});

/** Scores are internal relevance judgments, never fabricated business metrics. */
export function rankMatchedCompetitors(raw: unknown, pages: CompetitorPage[], brandText: string, local: boolean) {
  if (!Array.isArray(raw)) return [];
  const matches = raw.flatMap((row) => {
    const parsed = assessment.safeParse(row);
    if (!parsed.success) return [];
    const c = parsed.data;
    const page = pages.find((p) => p.domain === c.domain && p.url === c.url);
    if (!page || c.substitution !== "direct" || c.market === "different" || c.offer.rating < 2 || c.audience.rating < 2) return [];
    for (const axis of [c.offer, c.audience]) {
      if (!literal(brandText, axis.brandQuote) || !literal(page.text, axis.candidateQuote)) return [];
    }
    if (local && (c.market !== "overlap" || !literal(brandText, c.marketBrandQuote) || !literal(page.text, c.marketCandidateQuote))) return [];
    const verified = verifiedCompetitors([c], [page])[0];
    if (!verified) return [];
    return [{ ...verified, score: c.offer.rating * 4 + c.audience.rating * 3 + (c.market === "overlap" ? 2 : 0) }];
  });
  return matches.sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain))
    .filter((c, i, all) => all.findIndex((p) => p.domain === c.domain) === i).slice(0, 5)
    .map(({ score: _score, ...evidence }) => evidence);
}

export function competitorHostAllowed(host: string, ownHost: string) {
  const normalized = host.toLowerCase().replace(/^www\./, "");
  const own = ownHost.toLowerCase().replace(/^www\./, "");
  return normalized !== own && !normalized.endsWith(`.${own}`) && !own.endsWith(`.${normalized}`)
    && !/(^|\.)(wikipedia\.org|facebook\.com|instagram\.com|youtube\.com|linkedin\.com|reddit\.com|google\.com|x\.com|tiktok\.com|g2\.com|capterra\.com|trustpilot\.com|alternativeto\.net)$/.test(normalized);
}

export function groundedResearchBrief(raw: unknown, source: string) {
  const parsed = z.object({
    quote: z.string().max(500), offer: z.string().trim().min(3).max(160),
    audience: z.string().trim().max(140), market: z.string().trim().max(100),
    scope: z.enum(["local", "global", "unknown"]),
    model: z.string().trim().max(100), queries: z.array(z.string().trim().min(4).max(220)).max(6),
  }).safeParse(raw);
  return parsed.success && literal(source, parsed.data.quote) ? parsed.data : null;
}