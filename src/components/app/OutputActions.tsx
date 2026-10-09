/** إجراءات المخرج المتخصصة؛ لا تظهر إلا عندما يثبت الطلب والناتج نوع المخرج. */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Eye, Globe, LineChart, ListChecks, Palette, Send, Sparkles, Users } from "lucide-react";

import { ConnectNow } from "@/components/app/ConnectNow";
import { SendToProject } from "@/components/app/workspace/SendToProject";
import { PlatformPreviewDialog } from "@/components/app/PlatformPreview";
import { requestedPublishTargets } from "@/lib/platforms";
import { appLabel } from "@/components/site/AppIcon";
import { cn } from "@/lib/utils";
import { DESIGN_DRAFT_KEY } from "@/lib/design-draft";
import { Button } from "@/components/ui/button";

type QuickLink = { to: string; label: string; icon: typeof CalendarDays };
export type OutputKind = "design" | "post" | "email" | "event" | "article" | "seo" | "report" | "plan" | "leads" | "web" | "general";

export function firstImageUrl(body: string): string | null {
  const markdown = body.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
  if (markdown?.[1]) return markdown[1];
  return body.match(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?/i)?.[0] ?? null;
}

/** يجمع الطلب وبنية الناتج والتخصص حتى لا تتحول أي إجابة عادية إلى مخرج قابل للتنفيذ. */
export function detectOutputKind(employeeId: string, body: string, imageUrl: string | null, request = ""): OutputKind {
  const asked = request.toLowerCase();
  const combined = `${request}\n${body}`.toLowerCase();
  if (employeeId === "dana" && imageUrl) return "design";
  if (employeeId === "dana" && /(صم[مّ]|تصميم|هوية بصرية|شعار|بانر|بوستر|صورة)/.test(asked) && body.length > 160) return "design";
  if (employeeId === "eva" && (/(^|\n)\s*(الموضوع|subject)\s*[:：]/i.test(body) || /(اكتب|جهز|صياغة|رد).{0,20}(بريد|إيميل|رسالة)/.test(asked))) return "email";
  if (employeeId === "eva" && /(اجتماع|موعد|حجز|تقويم|meeting)/.test(asked) && /(الساعة|\d{1,2}:\d{2}|صباح|مساء|بتوقيت|موعد)/.test(combined)) return "event";
  if (employeeId === "nour" && /(مقال|دليل|صفحة هبوط|blog|article)/.test(asked) && body.length > 500) return "article";
  if (employeeId === "nour" && /(كلمات مفتاحية|سيو|seo|ترتيب|search console|backlink|تدقيق تقني)/.test(combined)) return "seo";
  if (employeeId === "sam" && /(عملاء محتملين|\bleads?\b|صفقة|عرض سعر|pipeline|قائمة (شركات|عملاء)|تواصل بارد)/i.test(combined)) return "leads";
  if (/(خطة محتوى|تقويم المحتوى|جدول نشر|خطة تنفيذ)/.test(asked) && /(الأسبوع|اليوم|المرحلة|الهدف|المؤشر)/.test(body)) return "plan";
  if (employeeId === "adam" && (/(^|\n)\|.+\|/.test(body) || /(ga4|زيارات|معدل التحويل|تقرير|الإنفاق|roas|cpc|ميزانية)/i.test(combined))) return "report";
  if (employeeId === "sonny" && /(منشور|بوست|كابشن|ريلز|ستوري|انستجرام|فيسبوك|لينكد.?إن|تيك توك)/.test(asked) && body.length > 120) return "post";
  if (/https?:\/\//.test(body) && /(افتح|تصفح|تابع|نفذ على الموقع)/.test(asked)) return "web";
  return "general";
}

function linksFor(kind: OutputKind): QuickLink[] {
  switch (kind) {
    case "design": return [];
    case "post": return [{ to: "/app/calendar", label: "جدوله", icon: CalendarDays }];
    case "email": return [{ to: "/app/inbox-watch", label: "راجع البريد والإرسال", icon: Send }];
    case "event": return [{ to: "/app/tasks", label: "المهام والمواعيد", icon: CalendarDays }];
    case "article": return [{ to: "/app/reports", label: "أداء المحتوى", icon: LineChart }];
    case "seo": return [{ to: "/app/rankings", label: "تتبّع الكلمات", icon: LineChart }, { to: "/app/reports", label: "تقرير السيو", icon: LineChart }];
    case "leads": return [{ to: "/app/proposals", label: "العروض", icon: Sparkles }, { to: "/app/approvals", label: "اعتمد التواصل", icon: ListChecks }];
    case "plan": return [{ to: "/app/calendar", label: "انقلها للتقويم", icon: CalendarDays }, { to: "/app/team-tasks", label: "وزّعها على الفريق", icon: Users }];
    case "report": return [{ to: "/app/reports", label: "افتح التقرير", icon: LineChart }];
    case "web": return [{ to: "/app/browser", label: "تابع في المتصفح", icon: Globe }];
    default: return [];
  }
}

export function OutputActions({ employeeId, employeeName, body, request, workspaceId, missingProvider, onEditDesign, className }: {
  employeeId: string; employeeName: string; body: string; request: string; workspaceId: string | undefined;
  missingProvider?: string | null; onEditDesign?: (path: string) => void; className?: string;
}) {
  const imageUrl = firstImageUrl(body);
  const kind = detectOutputKind(employeeId, body, imageUrl, request);
  const links = linksFor(kind);
  const [platformOpen, setPlatformOpen] = useState(false);
  const targetPlatform = (() => { try { return requestedPublishTargets(request)[0] ?? "instagram"; } catch { return "instagram"; } })();
  const supportsProject = ["plan", "report", "leads", "seo", "article"].includes(kind);
  if (kind === "general" && !missingProvider) return null;

  return <div className={cn("output-actions mt-3 flex flex-wrap items-center gap-1.5", className)}>
    {links.map((link) => <Link key={`${link.to}-${link.label}`} to={link.to} className="output-action-chip inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[0.72rem] font-bold transition-colors hover:bg-secondary"><link.icon className="size-3.5 shrink-0" />{link.label}</Link>)}
    {kind === "design" ? <Button type="button" variant="outline" size="sm" onClick={() => {
      try {
        sessionStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify({ body, request, imageUrl, employeeId, savedAt: Date.now() }));
      } catch { /* يظل المحرر قابلاً للفتح حتى لو منع المتصفح التخزين. */ }
      onEditDesign?.("/app/design-editor?seed=chat");
    }} className="output-action-chip rounded-full"><Palette className="size-3.5 shrink-0" />عدّل التصميم</Button> : null}
    {kind === "post" || kind === "design" ? <><Button type="button" variant="outline" size="sm" onClick={() => setPlatformOpen(true)} className="output-action-chip rounded-full border-primary/30 bg-primary/8 text-primary hover:bg-primary/15"><Eye className="size-3.5" /> شوفه على المنصة</Button><PlatformPreviewDialog open={platformOpen} onOpenChange={setPlatformOpen} post={{ provider: targetPlatform, body: body.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim(), image_url: imageUrl }} /></> : null}
    {supportsProject ? <SendToProject employeeId={employeeId} employeeName={employeeName} body={body} /> : null}
    {missingProvider ? <span className="inline-flex items-center gap-2 rounded-full border border-sky/30 bg-sky/10 px-2 py-1"><span className="text-[0.7rem] font-bold text-ink-soft">{appLabel(missingProvider)} غير مربوط</span><ConnectNow workspaceId={workspaceId} provider={missingProvider} size="sm" label="اربطه للتنفيذ الآلي" /></span> : null}
  </div>;
}