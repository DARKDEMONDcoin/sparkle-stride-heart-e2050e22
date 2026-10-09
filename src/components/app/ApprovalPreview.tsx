/** معاينة واقعية للمخرج قبل اعتماده: منشور كما سيظهر على المنصة، تصميم بحجمه، أو مستند مهمة. */
import { Heart, MessageCircle, Repeat2, Send, Bookmark, ThumbsUp, Share2, FileText } from "lucide-react";

import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { Portrait } from "@/components/site/Portrait";
import { getMember } from "@/data/team";
import { extractPostMedia, sanitizePostBody } from "@/lib/post-format";

export type ApprovalCategory = "post" | "design" | "task";

const SOCIAL = new Set(["instagram", "facebook", "linkedin", "x", "twitter", "tiktok", "threads", "youtube"]);

export function categoryOf(task: { kind: string; channel: string; employee_id: string }): ApprovalCategory {
  const k = task.kind ?? "";
  if (/تصميم|صورة|بانر|لوحة|design|image|banner/i.test(k) && !/منشور/.test(k)) return "design";
  if (/منشور|بوست|post|كاروسيل|ريل|تغريدة/i.test(k) || SOCIAL.has(task.channel)) return "post";
  if (task.employee_id === "dana") return "design";
  return "task";
}

export const CATEGORY_LABEL: Record<ApprovalCategory, string> = {
  post: "منشورات",
  design: "تصميمات",
  task: "مهام",
};

export function ApprovalPreview({
  task,
  brandName,
}: {
  task: { title: string; kind: string; channel: string; employee_id: string; output: string | null; detail: string | null; scheduled: string | null };
  brandName: string;
}) {
  const category = categoryOf(task);
  const raw = task.output ?? task.detail ?? "";
  const { images } = extractPostMedia(raw);
  const text = sanitizePostBody(raw) || task.detail || "";
  const member = getMember(task.employee_id);
  const initial = brandName.trim().charAt(0) || "س";

  if (category === "design") {
    return (
      <div className="space-y-4">
        <div className="grid place-items-center rounded-2xl border border-border bg-secondary/40 p-4">
          {images.length ? (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {images.map((img) => (
                <img key={img.url} src={img.url} alt={img.alt || task.title} className="w-full rounded-xl shadow-lg" />
              ))}
            </div>
          ) : (
            <div className="grid aspect-square w-full max-w-sm place-items-center rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              لم تُرفق صورة نهائية بعد — هذا وصف التصميم من {member?.name ?? "الموظف"}.
            </div>
          )}
        </div>
        <p className="whitespace-pre-wrap rounded-2xl bg-secondary/50 p-4 text-sm leading-relaxed text-ink-soft">{text}</p>
      </div>
    );
  }

  if (category === "post") {
    const ch = task.channel;
    const isLinkedIn = ch === "linkedin";
    const isX = ch === "x" || ch === "twitter";
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground font-black text-background">{initial}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{brandName}</p>
            <p className="text-xs text-muted-foreground">
              {isLinkedIn ? "صفحة شركة · الآن" : isX ? "@" + brandName.replace(/\s+/g, "") : task.scheduled ?? "مسودة"}
            </p>
          </div>
          <AppIcon name={ch} className="size-5 shrink-0" />
        </header>
        {(isLinkedIn || isX) && <p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed" dir="auto">{text}</p>}
        {images.length ? (
          <img src={images[0]!.url} alt={images[0]!.alt || task.title} className="aspect-square w-full object-cover" />
        ) : (
          !isX && (
            <div className="grid aspect-square w-full place-items-center bg-secondary/60 p-6 text-center text-xs text-muted-foreground">
              بدون صورة مرفقة — سيُنشر نصاً فقط
            </div>
          )
        )}
        <div className="flex items-center gap-4 p-3 text-foreground/80">
          {isLinkedIn ? (
            <><ThumbsUp className="size-5" /><MessageCircle className="size-5" /><Repeat2 className="size-5" /><Send className="size-5" /></>
          ) : isX ? (
            <><MessageCircle className="size-5" /><Repeat2 className="size-5" /><Heart className="size-5" /><Share2 className="size-5" /></>
          ) : (
            <><Heart className="size-5" /><MessageCircle className="size-5" /><Send className="size-5" /><Bookmark className="ms-auto size-5" /></>
          )}
        </div>
        {!isLinkedIn && !isX && (
          <p className="whitespace-pre-wrap px-3 pb-4 text-sm leading-relaxed" dir="auto">
            <b className="me-1">{brandName}</b>
            {text}
          </p>
        )}
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">معاينة تقريبية لشكل المنشور على {appLabel(ch)}</p>
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-6">
      <header className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        {member ? (
          <span className="size-10 overflow-hidden rounded-xl" style={{ background: member.tintSoft }}>
            <Portrait memberId={member.id} name={member.name} className="size-full" />
          </span>
        ) : (
          <FileText className="size-6" />
        )}
        <div>
          <p className="font-display text-lg font-black">{task.title}</p>
          <p className="text-xs text-muted-foreground">{member?.name} · {task.kind} · {appLabel(task.channel)}</p>
        </div>
      </header>
      {images.map((img) => (
        <img key={img.url} src={img.url} alt={img.alt} className="mb-4 w-full rounded-xl" />
      ))}
      <div className="whitespace-pre-wrap text-sm leading-loose text-ink-soft" dir="auto">{text}</div>
    </article>
  );
}
