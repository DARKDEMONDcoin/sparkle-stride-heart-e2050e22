/** إرسال فوري لرسائل سالم وأمَل: يفتح واتساب أو البريد بالنص جاهزاً — المستخدم يضغط إرسال بنفسه. */
import { memo, useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { stripOwnerNotes } from "@/lib/post-format";

const MESSAGE_REQUEST = /واتس|واتساب|whatsapp|رسال|بريد|إيميل|ايميل|email|رد\s|ردّ|متابعة|عرض\s*سعر|اعتذار/iu;

export function wantsQuickSend(employeeId: string, request: string | null | undefined): boolean {
  return (employeeId === "sam" || employeeId === "eva") && MESSAGE_REQUEST.test(request ?? "");
}

function cleanBody(body: string): string {
  return stripOwnerNotes(body)
    .replace(/^#{1,6}\s+/gmu, "")
    .replace(/^\s*-{3,}\s*$/gmu, "")
    .replace(/^\s*\**\s*(?:افتراضات?ي?|الافتراض|ملاحظة|الموضوع|عنوان\s*الرسالة|سطر\s*الموضوع)\s*\**\s*[:：].*$/gmu, "")
    .replace(/\*\*(.+?)\*\*/gu, "$1")
    .replace(/\n{3,}/gu, "\n\n")
    .trim()
    .slice(0, 3500);
}

const HEADING = /^\s*#{1,6}\s+(.{1,90}?)\s*$/u;
const META_HEADING = /الخطوة|مكمّلات|مكملات|الرسالتان|الرسائل|الرسالة\s*المقترحة\s*$|ملاحظ|خلاصة|الخلاصة|افتراض|لماذا|السبب|ما\s*أنجزته|قرار|نسخ\s*بديلة\s*$|المسودات/u;

/** يستخرج نصوص الرسائل وحدها من رد الموظف: يتخطى المقدمة والملخصات والخطوة التالية. */
export function extractMessages(body: string): { title: string; body: string }[] {
  const lines = String(body ?? "").split("\n");
  const sections: { title: string | null; lines: string[] }[] = [{ title: null, lines: [] }];
  for (const line of lines) {
    const m = line.match(HEADING);
    if (m) sections.push({ title: m[1]!.replace(/\*\*/g, "").trim(), lines: [] });
    else sections[sections.length - 1]!.lines.push(line);
  }
  const headed = sections.filter((s) => s.title && !META_HEADING.test(s.title));
  const items = headed
    .map((s) => ({ title: s.title!, body: cleanBody(s.lines.join("\n")) }))
    .filter((s) => s.body.length >= 20);
  if (items.length) return items;
  const whole = cleanBody(body);
  return whole.length >= 20 ? [{ title: "", body: whole }] : [];
}

function QuickSendView({ body, label, request }: { body: string; label?: string | undefined; request?: string | null }) {
  const [copied, setCopied] = useState(false);
  const text = cleanBody(body);
  if (text.length < 20) return null;
  const subject = text.split("\n").find((l) => l.trim())?.slice(0, 80) ?? "";
  const email = /بريد|إيميل|ايميل|email/iu.test(request ?? "");
  const suffix = label ? ` «${label}»` : "";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline" className="h-auto rounded-full text-xs font-bold whitespace-normal">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-3.5" /> افتح في واتساب{suffix}
        </a>
      </Button>
      {email ? (
        <Button asChild size="sm" variant="outline" className="h-auto rounded-full text-xs font-bold whitespace-normal">
          <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
            <Mail className="size-3.5" /> افتح في البريد{suffix}
          </a>
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="rounded-full text-xs font-bold"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "تم النسخ" : "انسخ النص"}
      </Button>
    </div>
  );
}

export const QuickSend = memo(QuickSendView);
