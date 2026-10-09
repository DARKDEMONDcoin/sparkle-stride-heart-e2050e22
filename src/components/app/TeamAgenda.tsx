import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckSquare, ExternalLink, FileText, Repeat, Users, X } from "lucide-react";

import { Markdown } from "@/components/app/Markdown";
import { Portrait } from "@/components/site/Portrait";
import { getMember } from "@/data/team";
import type { AgendaItem } from "@/lib/team-agenda.functions";
import { cn } from "@/lib/utils";

const KIND: Record<AgendaItem["kind"], { label: string; icon: typeof Users; cls: string }> = {
  meeting: { label: "موعد", icon: Users, cls: "bg-sky/15 text-sky" },
  cadence: { label: "دورة متكررة", icon: Repeat, cls: "bg-amber/15 text-amber" },
  article: { label: "مقال", icon: FileText, cls: "bg-coral/15 text-coral" },
  task: { label: "تسليم", icon: CheckSquare, cls: "bg-jade/12 text-jade-deep" },
};

const EMPTY_BODY: Record<AgendaItem["kind"], string> = {
  meeting: "موعد من تقويم جوجل. اطلب تجهيز ملخص عن الحضور وجدول أعمال ونقاط متابعة.",
  cadence: "دورة متكررة مفعّلة — يُنفَّذ المخرج تلقائياً في هذا الموعد ويصلك للمراجعة.",
  article: "لا يوجد نص محفوظ لهذا المقال بعد.",
  task: "لا يوجد مخرج محفوظ لهذه المهمة بعد — سيظهر هنا فور تسليمها.",
};

const time = (iso: string) =>
  iso.length <= 10
    ? "طوال اليوم"
    : new Date(iso).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });

export function AgendaChip({ item, onOpen }: { item: AgendaItem; onOpen?: (i: AgendaItem) => void }) {
  const k = KIND[item.kind];
  const Icon = k.icon;
  const cls = cn(
    "flex w-full items-center gap-1 truncate rounded-md px-1.5 py-1 text-start text-[0.62rem] font-bold",
    k.cls,
  );
  const inner = (
    <>
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{item.title}</span>
    </>
  );
  if (onOpen)
    return (
      <button type="button" title={item.title} onClick={() => onOpen(item)} className={cls}>
        {inner}
      </button>
    );
  return (
    <Link to="/app/chat/$id" params={{ id: item.employeeId }} title={item.title} className={cls}>
      {inner}
    </Link>
  );
}

/** نافذة تفاصيل مخرج نور داخل التقويم: النص، الحالة، وطرق المتابعة. */
export function AgendaItemDialog({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const m = getMember(item.employeeId);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-3 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      tabIndex={-1}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="flex items-start gap-3 border-b border-border p-5">
          <span className="size-10 shrink-0 overflow-hidden rounded-xl">
            {m ? <Portrait memberId={item.employeeId} name={m.name} className="size-full" /> : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-black leading-snug">{item.title}</p>
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              <span className={cn("rounded-full px-2 py-0.5 font-bold", KIND[item.kind].cls)}>
                {item.detail ?? KIND[item.kind].label}
              </span>
              <span>{m?.name}</span>
              <span>
                · {new Date(item.start.length <= 10 ? `${item.start}T12:00:00` : item.start).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
                {item.start.length > 10 ? ` · ${time(item.start)}` : ""}
              </span>
              {item.status === "review" || item.status === "awaiting_approval" ? (
                <span className="rounded-full bg-sky/15 px-2 py-0.5 font-bold text-sky">بانتظار مراجعتك</span>
              ) : item.status === "done" ? (
                <span className="rounded-full bg-jade/12 px-2 py-0.5 font-bold text-jade-deep">معتمد</span>
              ) : null}
            </p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-lg hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-7">
          {item.body ? (
            <Markdown body={item.body} />
          ) : (
            <p className="text-ink-soft">{EMPTY_BODY[item.kind]}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          {item.link ? (
            <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background">
              <ExternalLink className="size-4" /> افتح في تقويم جوجل
            </a>
          ) : null}
          {item.status === "review" || item.status === "awaiting_approval" ? (
            <Link to="/app/approvals" className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background">
              راجِع واعتمد
            </Link>
          ) : null}
          <Link
            to="/app/chat/$id"
            params={{ id: item.employeeId }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-secondary"
          >
            {item.kind === "meeting" ? `جهّزني لهذا الموعد يا ${m?.name}` : item.kind === "cadence" ? `عدّل هذه الدورة مع ${m?.name}` : `اطلب تعديلاً من ${m?.name}`}
          </Link>
          {item.body ? (
            <button
              onClick={() => void navigator.clipboard?.writeText(item.body ?? "")}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-secondary"
            >
              انسخ النص
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const localKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
/** مفتاح اليوم: التواريخ بلا وقت تُقرأ كيوم تقويمي دون إزاحة منطقة زمنية. */
const itemKey = (iso: string) => {
  if (iso.length <= 10) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}-${(m ?? 1) - 1}-${d}`;
  }
  return localKey(new Date(iso));
};

/** شبكة شهرية لأجندة أمَل/سالم/آدم — نفس منطق تقويم المحتوى بصرياً. */
export function AgendaMonthGrid({
  month,
  items,
  onOpen,
}: {
  month: Date;
  items: AgendaItem[];
  onOpen: (i: AgendaItem) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const byDay = new Map<string, AgendaItem[]>();
  for (const it of items) {
    const k = itemKey(it.start);
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  const today = localKey(new Date());
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border md:grid md:grid-cols-7" aria-label="الشبكة الشهرية">
      {DAYS.map((d) => (
        <div key={d} className="border-b border-border bg-secondary/50 py-2 text-center text-xs font-bold text-muted-foreground">
          {d}
        </div>
      ))}
      {cells.map((d) => {
        const k = localKey(d);
        const list = byDay.get(k) ?? [];
        const inMonth = d.getMonth() === month.getMonth();
        return (
          <div key={k} className={cn("min-h-24 border-b border-s border-border p-1.5", !inMonth && "bg-muted/40 text-muted-foreground")}>
            <span className={cn("inline-grid size-6 place-items-center rounded-full text-xs font-bold", k === today && "bg-primary text-primary-foreground")}>
              {d.getDate()}
            </span>
            <div className="mt-1 space-y-1">
              {list.slice(0, 3).map((it) => (
                <AgendaChip key={it.id} item={it} onOpen={onOpen} />
              ))}
              {list.length > 3 ? (
                <span className="block px-1 text-[0.6rem] text-muted-foreground">+{list.length - 3} أخرى</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TeamAgendaList({
  items,
  loading,
  calendarConnected,
  calendarError,
  needsCalendar = true,
  emptyText,
  onOpen,
}: {
  items: AgendaItem[];
  loading: boolean;
  calendarConnected: boolean;
  calendarError: string | null;
  needsCalendar?: boolean;
  emptyText?: string | undefined;
  onOpen?: (i: AgendaItem) => void;
}) {
  const groups = new Map<string, AgendaItem[]>();
  for (const it of items) {
    const [y, mo, da] = itemKey(it.start).split("-").map(Number);
    const key = new Date(y!, mo!, da!).toDateString();
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(it);
  }

  return (
    <div className="space-y-4">
      {needsCalendar && !calendarConnected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky/30 bg-sky/8 p-4 text-sm">
          <p className="font-bold">
            اربط تقويم جوجل لتظهر هنا مواعيد أمَل واجتماعات مبيعات سالم الحقيقية.
          </p>
          <Link
            to="/app/integrations"
            className="rounded-xl bg-foreground px-3.5 py-2 text-xs font-bold text-background"
          >
            اربط التقويم
          </Link>
        </div>
      ) : null}
      {calendarError ? (
        <p className="rounded-2xl bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {calendarError}
        </p>
      ) : null}

      {loading ? (
        <p className="p-6 text-sm text-muted-foreground">جارٍ تحميل أجندة الفريق…</p>
      ) : groups.size === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <CalendarClock className="mx-auto size-7 text-ink-soft" />
          <p className="mt-3 font-black">لا مواعيد هذا الشهر</p>
          <p className="mt-1 text-sm text-ink-soft">
            {emptyText ??
              "اطلب من أمَل حجز اجتماع، أو من سالم ترتيب مكالمة عرض، أو فعّل تقريراً دورياً لآدم من صفحة الأتمتة."}
          </p>
        </div>
      ) : (
        [...groups.entries()].map(([key, list]) => {
          const d = new Date(key);
          return (
            <section key={key} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
              <div className="pt-1 text-center">
                <p className="font-display text-xl font-black">{d.getDate()}</p>
                <p className="text-[0.62rem] font-bold text-muted-foreground">
                  {d.toLocaleDateString("ar-EG", { weekday: "short" })}
                </p>
              </div>
              <div className="space-y-2">
                {list.map((it) => {
                  const m = getMember(it.employeeId);
                  const k = KIND[it.kind];
                  return (
                    <div
                      key={it.id}
                      className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-3", onOpen && "cursor-pointer hover:bg-secondary/40")}
                      onClick={onOpen ? () => onOpen(it) : undefined}
                    >
                      <span className="size-9 shrink-0 overflow-hidden rounded-xl">
                        {m ? (
                          <Portrait memberId={it.employeeId} name={m.name} className="size-full" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{it.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                          <span className={cn("rounded-full px-2 py-0.5 font-bold", k.cls)}>
                            {k.label}
                          </span>
                          <span>{m?.name}</span>
                          <span>· {time(it.start)}</span>
                          {it.detail ? <span className="truncate">· {it.detail}</span> : null}
                        </p>
                      </div>
                      {it.link ? (
                        <a
                          href={it.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="افتح في تقويم جوجل"
                          className="grid size-9 place-items-center rounded-lg border border-border hover:bg-secondary"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
