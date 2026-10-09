import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { BusinessProfile } from "@/lib/business-profile.server";
import { BRAND_EMPLOYEE_IDS } from "@/lib/brand-context.server";
import { businessProfileSchema } from "./brand-profile-schema";

/**
 * تحليل موقع المستخدم وحفظ «ملف العلامة» في مساحة العمل وعقل العلامة،
 * فيقرأه الموظفون الستة تلقائياً في كل محادثة وقدرة.
 */
export const profileMyWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        url: z.string().trim().min(4).max(300),
        /** حفظ النتيجة مباشرة (الإعداد الأولي) أو إعادتها للمراجعة فقط. */
        save: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ profile: BusinessProfile; saved: boolean }> => {
    const { data: owned } = await context.supabase.from("workspaces").select("id").eq("id", data.workspaceId).eq("owner_id", context.userId).maybeSingle();
    if (!owned) throw new Error("تحليل وحفظ ملف العلامة متاح لمالك مساحة العمل فقط.");
    const { publicWebsiteUrl } = await import("./welcome-preview.server");
    const safeUrl = publicWebsiteUrl(data.url);
    if (!safeUrl) throw new Error("أدخل رابط موقع عام صالح يبدأ بـ https.");
    const { profileWebsite } = await import("./business-profile.server");
    const profile = await profileWebsite(safeUrl.toString());
    if (!data.save) return { profile, saved: false };
    await saveProfile(context.supabase, data.workspaceId, safeUrl.toString(), profile);
    return { profile, saved: true };
  });

/** حفظ ملف معدَّل يدوياً من المستخدم (تصحيح ما فهمناه). */
export const saveBusinessProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        url: z.string().trim().max(300).default(""),
        profile: businessProfileSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: owned } = await context.supabase.from("workspaces").select("id").eq("id", data.workspaceId).eq("owner_id", context.userId).maybeSingle();
    if (!owned) throw new Error("حفظ ملف العلامة متاح لمالك مساحة العمل فقط.");
    const { publicWebsiteUrl } = await import("./welcome-preview.server");
    const url = data.url ? publicWebsiteUrl(data.url)?.toString() : "";
    if (data.url && !url) throw new Error("أدخل رابط موقع عام صالح.");
    await saveProfile(
      context.supabase,
      data.workspaceId,
      url ?? "",
      data.profile,
    );
    return { ok: true as const };
  });

type Client = SupabaseClient<Database>;

async function saveProfile(
  supabase: Client,
  workspaceId: string,
  url: string,
  profile: BusinessProfile,
) {
  const website = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null;
  const patch: Record<string, unknown> = {
    profile,
    ...(website ? { website } : {}),
    ...(profile.country ? { country: profile.country } : {}),
    ...(profile.name ? { name: profile.name, initials: profile.name.slice(0, 2) } : {}),
    ...(profile.industry && profile.industry !== "عام" ? { industry: profile.industry } : {}),
  };
  const { error } = await supabase
    .from("workspaces")
    .update(patch as never)
    .eq("id", workspaceId).select("id").single();
  if (error) throw new Error(error.message);

  // نسخة مقروءة في عقل العلامة (يستفيد منها الاسترجاع الدلالي) — نستبدل القديمة.
  const body = [
    profile.summary,
    profile.products.length ? `المنتجات/الخدمات: ${profile.products.join("، ")}` : "",
    profile.audience ? `الجمهور: ${profile.audience}` : "",
    profile.usp ? `ما يميزنا: ${profile.usp}` : "",
    profile.locations.length ? `المدن/الفروع: ${profile.locations.join("، ")}` : "",
    profile.competitors.length ? `منافسون: ${profile.competitors.join("، ")}` : "",
    ...(profile.competitorEvidence ?? []).map((c) => `منافس موثق: ${c.domain} — ${c.reason}\nالمصدر: ${c.url}\nاقتباس: ${c.quote}`),
    profile.gaps?.length ? `معلومات غير مؤكدة: ${profile.gaps.join("؛ ")}` : "",
    `صفحات المصدر: ${profile.pagesRead.join("، ")}`,
    profile.platform ? `منصة الموقع: ${profile.platform}` : "",
    profile.dialect ? `لهجة الموقع: ${profile.dialect}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const { data: existing, error: existingError } = await supabase
    .from("brain_items")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("title", "ملف العلامة")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  const payload = {
    workspace_id: workspaceId,
    kind: "note",
    title: "ملف العلامة",
    meta: `مستخرج تلقائياً من ${website ?? "الموقع"} · ${profile.pagesRead.length} صفحات`,
    body,
    used_by: [...BRAND_EMPLOYEE_IDS],
  };
  const result = existing
    ? await supabase.from("brain_items").update(payload).eq("id", existing.id).eq("workspace_id", workspaceId)
    : await supabase.from("brain_items").insert(payload);
  if (result.error) throw new Error(result.error.message);
}
