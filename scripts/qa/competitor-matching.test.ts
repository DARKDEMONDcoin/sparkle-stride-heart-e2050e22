import { test, expect } from "bun:test";
import { competitorHostAllowed, groundedResearchBrief, rankMatchedCompetitors } from "../../src/lib/competitor-matching";
import { researchCompetitors } from "../../src/lib/competitor-research.server";

const brand = "We offer online appointment software for dental clinics. We serve dental clinics across Cairo and Giza.";
const page = { domain: "rival.example", url: "https://rival.example/", title: "Rival", text: "Our online appointment software serves dental clinics. Available for dental clinics in Cairo and Giza." };
const match = (rating = 3) => ({ domain: page.domain, url: page.url, quote: "Our online appointment software serves dental clinics.", reason: "نفس خدمة الحجز لعيادات الأسنان", offer: { rating, brandQuote: "We offer online appointment software for dental clinics.", candidateQuote: "Our online appointment software serves dental clinics." }, audience: { rating, brandQuote: "We serve dental clinics across Cairo and Giza.", candidateQuote: "Available for dental clinics in Cairo and Giza." }, substitution: "direct", market: "overlap", marketBrandQuote: "We serve dental clinics across Cairo and Giza.", marketCandidateQuote: "Available for dental clinics in Cairo and Giza." });

test("direct matches need literal offer and buyer evidence from both sites", () => {
  expect(rankMatchedCompetitors([match()], [page], brand, false)).toHaveLength(1);
  expect(rankMatchedCompetitors([{ ...match(), audience: { ...match().audience, brandQuote: "Invented customer audience statement" } }], [page], brand, false)).toEqual([]);
  expect(rankMatchedCompetitors([{ ...match(), offer: { ...match().offer, candidateQuote: "Invented service proposition text" } }], [page], brand, false)).toEqual([]);
});
test("reject broad-sector companies, suppliers, partial substitutes and mismatched markets", () => {
  for (const change of [{ substitution: "partial" }, { substitution: "unrelated" }, { market: "different" }, { offer: { ...match().offer, rating: 1 } }, { audience: { ...match().audience, rating: 1 } }]) expect(rankMatchedCompetitors([{ ...match(), ...change }], [page], brand, false)).toEqual([]);
});
test("local service coverage needs literal proof on both sides", () => {
  expect(rankMatchedCompetitors([match()], [page], brand, true)).toHaveLength(1);
  expect(rankMatchedCompetitors([{ ...match(), market: "unknown" }], [page], brand, true)).toEqual([]);
  expect(rankMatchedCompetitors([{ ...match(), marketCandidateQuote: "" }], [page], brand, true)).toEqual([]);
  expect(rankMatchedCompetitors([{ ...match(), market: "unknown" }], [page], brand, false)).toHaveLength(1);
});
test("ranking selects closer substitutes rather than discovery order and deduplicates", () => {
  const second = { ...page, domain: "second.example", url: "https://second.example/" };
  expect(rankMatchedCompetitors([{ ...match(2), domain: second.domain, url: second.url }, match(), match()], [second, page], brand, false).map((p) => p.domain)).toEqual([page.domain, second.domain]);
});
test("own aliases and directory/social sites cannot become final competitors", () => {
  for (const h of ["www.own.example", "app.own.example", "g2.com", "reviews.capterra.com", "facebook.com"]) expect(competitorHostAllowed(h, "own.example")).toBe(false);
  expect(competitorHostAllowed("own.example", "app.own.example")).toBe(false);
  expect(competitorHostAllowed("rival.example", "own.example")).toBe(true);
});
test("brief requires a literal primary-offer quote", () => {
  const raw = { quote: brand.slice(0, 55), offer: "dental booking", audience: "clinics", model: "software", market: "", scope: "unknown", queries: ["dental booking alternatives"] };
  expect(groundedResearchBrief(raw, brand)).not.toBeNull();
  expect(groundedResearchBrief({ ...raw, quote: "Invented products and business offering" }, brand)).toBeNull();
});
test("research searches again and inspects actual vendor pages", async () => {
  const searches: string[] = []; const reads: string[] = [];
  const result = await researchCompetitors({ url: "https://own.example/", brand: "Own", text: brand, category: "dental booking" }, {
    safeUrl: (url) => { try { return new URL(url); } catch { return null; } },
    search: async (query) => { searches.push(query); return [{ rank: 1, url: page.url, title: page.title, snippet: page.text }]; },
    read: async (url) => { reads.push(url); return { url, html: `<html><head><title>Rival</title></head><body>${page.text} ${page.text}</body></html>` }; },
    json: async (system) => system.startsWith("Build") ? JSON.stringify({ quote: brand.slice(0, 55), offer: "dental booking", audience: "dental clinics", model: "software", market: "Cairo", scope: "local", queries: ["dental booking Cairo companies"] }) : JSON.stringify({ assessments: [match()] }),
  });
  expect(searches.some((q) => q.includes("Cairo alternatives companies"))).toBe(true);
  expect(reads).toContain(page.url);
  expect(result.map((p) => p.domain)).toEqual([page.domain]);
});

test("brief service failure is preserved and stops research immediately", async () => {
  let searches = 0; let calls = 0;
  await expect(researchCompetitors({ url: "https://own.example/", brand: "Own", text: brand, category: "dental booking" }, {
    safeUrl: (url) => new URL(url),
    search: async () => { searches++; return []; },
    read: async (url) => ({ url, html: "" }),
    json: async () => { calls++; throw new Error("403: analysis configuration rejected"); },
  })).rejects.toThrow("403: analysis configuration rejected");
  expect(calls).toBe(1);
  expect(searches).toBe(0);
});

test("assessment failure stops before another analysis round and keeps its reason", async () => {
  let calls = 0;
  await expect(researchCompetitors({ url: "https://own.example/", brand: "Own", text: brand, category: "dental booking" }, {
    safeUrl: (url) => new URL(url),
    search: async () => [{ rank: 1, url: page.url, title: page.title, snippet: page.text }],
    read: async (url) => ({ url, html: `<html><body>${page.text} ${page.text}</body></html>` }),
    json: async () => {
      calls++;
      if (calls === 1) return JSON.stringify({ quote: brand.slice(0, 55), offer: "dental booking", audience: "clinics", model: "software", market: "", scope: "unknown", queries: [] });
      throw new Error("402: owner action required");
    },
  })).rejects.toThrow("402: owner action required");
  expect(calls).toBe(2);
});