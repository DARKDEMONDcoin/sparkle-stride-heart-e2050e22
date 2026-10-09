import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BrandVoiceResult } from "@/lib/brand-voice.server";
import { BRAND_EMPLOYEE_IDS, sanitizeBrandKnowledge } from "@/lib/brand-context.server";

const input = z
  .object({
    workspaceId: z.string().uuid(),
    url: z.string().trim().max(300).optional(),
    samples: z.string().trim().max(20_000).optional(),
    save: z.boolean().default(true),
  })
  .refine((v) => (v.url && v.url.length > 3) || (v.samples && v.samples.length > 80), {
    message: "أدخل رابط موقعك أو الصق عينات نصية كافية (٨٠ حرفًا على الأقل).",
  });

/**
 * استخراج صوت العلامة من موقع أو عينات نصية، وحفظه كقاعدة نبرة إلزامية
 * في عقل العلامة حتى يلتزم بها كل الموظفين فورًا.
 */
export const extractBrandVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }): Promise<BrandVoiceResult & { savedId: string | null }> => {
    const supabase = context.supabase;
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id, name, industry")
      .eq("id", data.workspaceId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!workspace) throw new Error("استخراج صوت العلامة متاح لمالك مساحة العمل فقط.");

    const { collectSiteText, analyzeStyle, synthesizeVoice, voiceRuleText } =
      await import("./brand-voice.server");

    let text = sanitizeBrandKnowledge(data.samples ?? "", 20_000);
    let urls: string[] = [];
    let headings: string[] = [];
    let taglines: string[] = [];

    if (data.url) {
      const { publicWebsiteUrl } = await import("./welcome-preview.server");
      if (!publicWebsiteUrl(data.url)) throw new Error("أدخل رابط موقع عام صالح.");
      const site = await collectSiteText(data.url);
      urls = site.urls;
      headings = site.headings;
      taglines = site.taglines;
      text = [site.text, headings.join("\n"), taglines.join("\n"), text]
        .filter(Boolean)
        .join("\n\n");
    }

    // آخر شبكة أمان: نستعين بما هو مخزون في عقل العلامة (ملف العلامة، الملاحظات، المستندات)
    if (!data.samples && text.trim().split(/\s+/).filter(Boolean).length < 40) {
      const { data: items } = await supabase
        .from("brain_items")
        .select("title, body")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(12);
      const fromBrain = (items ?? [])
        .filter((item) => item.title !== "دليل صوت العلامة")
        .map((i) => [i.title, i.body].filter(Boolean).join("\n"))
        .join("\n\n")
        .slice(0, 16_000);
      text = [text, fromBrain].filter(Boolean).join("\n\n");
    }

    if (text.trim().length < 80 || text.trim().split(/\s+/).filter(Boolean).length < 12) {
      throw new Error(
        "لم نجد نصًا كافيًا لموقعك (قد يعتمد على جافاسكريبت بالكامل) ولا في عقل العلامة — الصق ٣ منشورات أو فقرات من موقعك في خيار «من نصوص ألصقها».",
      );
    }

    text = sanitizeBrandKnowledge(text, 30_000);
    const stats = analyzeStyle(text, taglines);
    const profile = await synthesizeVoice(
      { name: workspace.name, industry: workspace.industry },
      stats,
      text,
      headings,
    );
    const rule = voiceRuleText(profile, stats);

    let savedId: string | null = null;
    if (data.save) {
      const payload = {
          workspace_id: workspace.id,
          kind: "note",
          title: "دليل صوت العلامة",
          meta: `دليل أسلوبي · استُخرج ${urls.length ? `من ${urls.length} صفحات` : "من عينات نصية"} · ${stats.sampleWords} كلمة · ثقة اللهجة ${Math.round(stats.dialectConfidence * 100)}٪ · ${new Date().toLocaleDateString("ar-EG")}`,
          body: [rule, urls.length ? `مصادر الدليل: ${urls.join("، ")}` : "مصدر الدليل: النصوص التي قدمها المالك."].join("\n"),
          used_by: [...BRAND_EMPLOYEE_IDS],
      };
      const { data: existing, error: existingError } = await supabase
        .from("brain_items")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("title", "دليل صوت العلامة")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existing) {
        const { error: updateError } = await supabase
          .from("brain_items")
          .update(payload)
          .eq("id", existing.id)
          .eq("workspace_id", workspace.id);
        if (updateError) throw new Error(updateError.message);
        savedId = existing.id;
      } else {
        const { data: row, error: insertError } = await supabase
          .from("brain_items")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        savedId = row.id;
      }
    }

    return { sourceUrls: urls, stats, profile, rule, savedId };
  });
