import { team } from "@/data/team";

/** Browser-only helpers for the /welcome answers. localStorage survives a new tab/session; sessionStorage is kept as a legacy fallback. */
export const WELCOME_DRAFT_KEY = "sahl-welcome-draft";
export const WELCOME_USER_KEY = "sahl-welcome-profile-user";

export type StarterAction = { employee: string; text: string };
export type WelcomeDraftData = {
  purpose?: string;
  website?: string;
  industry?: string;
  step?: number;
  plan?: { insight?: string; actions: StarterAction[]; firstMove?: string } | null;
};

function store(): Storage[] {
  const out: Storage[] = [];
  try { out.push(window.localStorage); } catch { /* unavailable */ }
  try { out.push(window.sessionStorage); } catch { /* unavailable */ }
  return out;
}

export function readWelcomeDraft(): WelcomeDraftData | null {
  for (const s of store()) {
    try {
      const raw = s.getItem(WELCOME_DRAFT_KEY);
      if (raw) return JSON.parse(raw) as WelcomeDraftData;
    } catch { /* ignore */ }
  }
  return null;
}

export function writeWelcomeDraft(draft: WelcomeDraftData) {
  const raw = JSON.stringify(draft);
  for (const s of store()) { try { s.setItem(WELCOME_DRAFT_KEY, raw); } catch { /* ignore */ } }
}

export function hasWelcomeAnswers(d: WelcomeDraftData | null) {
  return Boolean(d && ((typeof d.website === "string" && d.website.trim()) || (typeof d.industry === "string" && d.industry.trim() && d.industry !== "أخرى")));
}

export function bindWelcomeUser(userId: string) {
  for (const s of store()) { try { s.setItem(WELCOME_USER_KEY, userId); } catch { /* ignore */ } }
}

export function boundWelcomeUser(): string | null {
  for (const s of store()) { try { const v = s.getItem(WELCOME_USER_KEY); if (v) return v; } catch { /* ignore */ } }
  return null;
}

export function clearWelcomeBinding() {
  for (const s of store()) { try { s.removeItem(WELCOME_USER_KEY); } catch { /* ignore */ } }
}

const strip = (v: string) => v.replace(/[\u064B-\u0652]/g, "").trim();
/** Map an Arabic employee name from the recommendation to its permanent id. */
export function employeeIdFromName(name: string): string | null {
  const n = strip(name);
  return team.find((m) => strip(m.name) === n || n.includes(strip(m.name)))?.id ?? null;
}
