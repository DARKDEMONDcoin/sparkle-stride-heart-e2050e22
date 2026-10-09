import { useMemo, useState } from "react";
import { ShareButton } from "@/components/app/ShareButton";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, CheckCheck, Eye, X, PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApprovalPreview, CATEGORY_LABEL, categoryOf, type ApprovalCategory } from "@/components/app/ApprovalPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { AppShell } from "@/components/app/AppShell";
import { PublishPanel } from "@/components/app/PublishPanel";
import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { getMember } from "@/data/team";
import { useTasks, useUpdateTask, useWorkspace } from "@/lib/data";
import { sanitizePostBody } from "@/lib/post-format";
import { BrandLoader } from "@/components/site/BrandLoader";
import { Portrait } from "@/components/site/Portrait";
import { saveLearningFeedback } from "@/lib/learning.functions";
import { splitReview, STALE_REVIEW_DAYS } from "@/lib/task-freshness";

export const Route = createFileRoute("/app/approvals")({
  head: () => ({
    meta: [
      { title: "الموافقات | زياد" },
      { name: "description", content: "راجع ما أنجزه فريقك واعتمده قبل النشر." },
      { property: "og:title", content: "الموافقات | زياد" },
      { property: "og:description", content: "راجع ما أنجزه فريقك واعتمده قبل النشر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApprovalsPage,
});

/** ينسّق موعد النشر بصيغة عربية مقروءة مهما كانت الصيغة المخزّنة (ISO أو نص جاهز). */
function formatScheduled(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "full", timeStyle: "short" }).format(date);
  } catch {
    return trimmed;
  }
}

/** يستخرج درجة مراجعة الجودة المخزّنة ضمن خطوات المهمة (مثال: «مراجعة الجودة — 88/100»). */
function qualityScoreOf(steps: unknown): number | null {
  if (!Array.isArray(steps)) return null;
  for (const step of steps) {
    const label = (step as { label?: unknown })?.label;
    if (typeof label !== "string") continue;
    const match = label.match(/(\d{1,3})\s*\/\s*100/);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (value > 0 && value <= 100) return value;
    }
  }
  return null;
}

function ApprovalsPage() {
  const { data: workspace } = useWorkspace();
  const { data: tasks, isLoading } = useTasks(workspace?.id);
  const update = useUpdateTask(workspace?.id);
  const saveFeedback = useServerFn(saveLearningFeedback);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<ApprovalCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // الطابور ينقسم: ما ينتظر قرارك فعلاً، وأرشيف تجاوز ثلاثين يوماً بلا قرار.
  const allPending = (tasks ?? []).filter((t) => t.status === "review");
  const { live: pending, stale: archived } = splitReview(allPending);
  const [showArchive, setShowArchive] = useState(false);

  const byEmployee = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of pending) counts.set(t.employee_id, (counts.get(t.employee_id) ?? 0) + 1);
    return counts;
  }, [pending]);
  const employeeScoped = pending.filter((t) => employeeFilter === "all" || t.employee_id === employeeFilter);
  const byCategory = useMemo(() => {
    const c: Record<ApprovalCategory, number> = { post: 0, design: 0, task: 0 };
    for (const t of employeeScoped) c[categoryOf(t)]++;
    return c;
  }, [employeeScoped]);
  const visible = employeeScoped.filter((t) => categoryFilter === "all" || categoryOf(t) === categoryFilter);
  const selectedVisible = visible.filter((t) => selected.has(t.id));
  const allVisibleSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const previewTask = previewId ? pending.find((t) => t.id === previewId) ?? null : null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((t) => next.delete(t.id));
      else visible.forEach((t) => next.add(t.id));
      return next;
    });

  const act = async (id: string, status: "done" | "rejected", silent = false) => {
    if (!silent) setBusyId(id);
    const steps =
      status === "done"
        ? [
            { label: "فهم الطلب", state: "done" },
            { label: "التنفيذ", state: "done" },
            { label: "مراجعتك", state: "done" },
            { label: "النشر", state: "done" },
          ]
        : undefined;
    try {
      await update.mutateAsync({ id, patch: steps ? { status, steps } : { status } });
      if (workspace?.id) {
        const task = allPending.find((item) => item.id === id);
        if (task)
          await saveFeedback({
            data: {
              workspaceId: workspace.id,
              taskId: id,
              employeeId: task.employee_id,
              kind: status === "done" ? "approved" : "rejected",
              reason:
                status === "rejected"
                  ? reason.trim() || "رفض المالك المخرج"
                  : "اعتمد المالك المخرج دون تعديل",
            },
          });
      }
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      if (!silent) setBusyId(null);
    }
  };

  const runBulk = async (ids: string[], status: "done" | "rejected") => {
    if (!ids.length || bulk) return;
    setBulk({ done: 0, total: ids.length });
    let ok = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await act(id, status, true);
        ok++;
      } catch {
        failed++;
      }
      setBulk({ done: ok + failed, total: ids.length });
    }
    setBulk(null);
    if (failed) toast.error(`تعذّر ${failed} عنصراً، حاول مجدداً`);
    else toast.success(status === "done" ? `تم اعتماد ${ok} عنصراً` : `تم رفض ${ok} عنصراً`);
  };

  const chip = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors ${
      active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary"
    }`;

  return (
    <AppShell
      title="طابور الموافقات"
      lead={`${pending.length} عنصراً بانتظارك`}
      actions={
        visible.length ? (
          <button
            onClick={() => void runBulk(visible.map((t) => t.id), "done")}
            disabled={!!bulk}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-3 py-2.5 text-sm font-bold text-background disabled:opacity-60 sm:px-4"
          >
            <CheckCheck className="size-4" />
            <span className="hidden sm:inline">
              {employeeFilter === "all" && categoryFilter === "all" ? "اعتماد الكل" : `اعتماد المعروض (${visible.length})`}
            </span>
            <span className="sm:hidden">الكل</span>
          </button>
        ) : null
      }
    >
      {pending.length ? (
        <div className="mb-5 space-y-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="تصفية حسب الموظف">
            <button type="button" className={chip(employeeFilter === "all")} onClick={() => setEmployeeFilter("all")}>
              الكل <span className="opacity-70">{pending.length}</span>
            </button>
            {[...byEmployee.entries()].map(([id, count]) => {
              const m = getMember(id);
              return (
                <button key={id} type="button" className={chip(employeeFilter === id)} onClick={() => setEmployeeFilter(id)}>
                  {m ? (
                    <span className="size-6 overflow-hidden rounded-full" style={{ background: m.tintSoft }}>
                      <Portrait memberId={m.id} name={m.name} className="size-full" />
                    </span>
                  ) : null}
                  {m?.name ?? id} <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "post", "design", "task"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`min-h-9 rounded-full px-3 text-xs font-bold transition-colors ${
                  categoryFilter === c ? "bg-secondary text-foreground ring-1 ring-foreground/20" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {c === "all" ? `كل الأنواع ${employeeScoped.length}` : `${CATEGORY_LABEL[c]} ${byCategory[c]}`}
              </button>
            ))}
            {visible.length ? (
              <label className="ms-auto inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label="تحديد كل المعروض" />
                تحديد المعروض
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BrandLoader size="sm" />
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-jade/12 text-jade-deep">
            <PartyPopper className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-black">لا شيء ينتظرك</h2>
          <p className="mt-2 text-ink-soft">فريقك يكمل العمل — سنخبرك فور جاهزية عنصر جديد.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-ink-soft">
          لا توجد عناصر بهذا التصنيف.
        </div>
      ) : (
        <div className={`grid gap-5 xl:grid-cols-2 ${selected.size ? "pb-28" : ""}`}>
          {visible.map((a) => {
            const member = getMember(a.employee_id);
            const isSel = selected.has(a.id);
            const cat = categoryOf(a);
            return (
              <article
                key={a.id}
                className={`min-w-0 rounded-3xl border bg-card p-5 transition-shadow sm:p-6 ${
                  isSel ? "border-foreground ring-2 ring-foreground/15" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <Checkbox
                    checked={isSel}
                    onCheckedChange={() => toggle(a.id)}
                    aria-label={`تحديد ${a.title}`}
                    className="size-5"
                  />
                  {member ? (
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <span
                        className="size-7 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: member.tintSoft }}
                      >
                        <Portrait memberId={member.id} name={member.name} className="size-full" />
                      </span>
                      {member.name}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <AppIcon name={a.channel} className="size-3.5 shrink-0" />
                    {appLabel(a.channel)}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-bold">{a.kind}</span>
                  {(() => {
                    const score = qualityScoreOf(a.steps);
                    if (score === null) return null;
                    const good = score >= 82;
                    return (
                      <span
                        title="درجة مراجعة الجودة الداخلية قبل التسليم"
                        className={`rounded-full px-2.5 py-0.5 font-bold ${good ? "bg-jade/15 text-jade-deep" : "bg-amber-500/15 text-amber-700"}`}
                      >
                        جودة {score}/100
                      </span>
                    );
                  })()}
                  <span className="ms-auto text-muted-foreground">{formatScheduled(a.scheduled)}</span>
                </div>

                <h2 className="mt-4 font-display text-lg font-black break-words">{a.title}</h2>
                <p className="mt-3 line-clamp-6 overflow-hidden rounded-2xl bg-secondary/50 p-4 leading-relaxed break-words whitespace-pre-wrap text-ink-soft">
                  {sanitizePostBody(a.output ?? a.detail) || a.detail}
                </p>

                {workspace?.id && cat === "post" ? (
                  <PublishPanel
                    workspaceId={workspace.id}
                    employeeId={a.employee_id}
                    taskId={a.id}
                    channel={a.channel}
                    body={a.output ?? a.detail ?? ""}
                  />
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewId(a.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary/70"
                  >
                    <Eye className="size-4" /> معاينة
                  </button>
                  {workspace?.id ? (
                    <ShareButton workspaceId={workspace.id} employeeId={a.employee_id} title={a.title} body={a.output ?? a.detail ?? ""} />
                  ) : null}
                  <button
                    onClick={() => void act(a.id, "done")}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary disabled:opacity-60"
                  >
                    {busyId === a.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {cat === "post"
                      ? "اعتماد بدون نشر"
                      : /mail|email|gmail|outlook/i.test(`${a.kind} ${a.channel}`)
                        ? "اعتمد البريد"
                        : cat === "design"
                          ? "اعتمد التصميم"
                          : "اعتماد"}
                  </button>
                  <button
                    onClick={() => {
                      if (rejecting === a.id) void act(a.id, "rejected");
                      else setRejecting(a.id);
                    }}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
                  >
                    <X className="size-4" /> رفض
                  </button>
                </div>
                {rejecting === a.id ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="ما الذي تريد أن يتعلمه من هذا الرفض؟"
                      className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => void act(a.id, "rejected")}
                      className="min-h-10 rounded-lg bg-coral px-4 text-sm font-bold text-background"
                    >
                      تأكيد الرفض
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {archived.length ? (
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-black">
                أرشيف {archived.length} مخرجاً قديماً
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                مضى عليها أكثر من {STALE_REVIEW_DAYS} يوماً بلا قرار، فخرجت من العدّاد ومن إحاطة
                أمَل حتى لا يبني الفريق عليها إشارات قديمة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              className="min-h-10 rounded-full border border-border px-4 text-sm font-bold transition-colors hover:bg-secondary"
            >
              {showArchive ? "إخفاء الأرشيف" : "عرض الأرشيف"}
            </button>
          </div>
          {showArchive ? (
            <ul className="mt-4 grid gap-2">
              {archived.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 flex-1 font-bold break-words">{a.title}</span>
                  <span className="text-muted-foreground">
                    {getMember(a.employee_id)?.name ?? a.employee_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => void act(a.id, "done")}
                    disabled={busyId === a.id}
                    className="min-h-9 rounded-full border border-border px-3 font-bold disabled:opacity-60"
                  >
                    اعتماد
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(a.id, "rejected")}
                    disabled={busyId === a.id}
                    className="min-h-9 rounded-full px-3 font-bold text-muted-foreground disabled:opacity-60"
                  >
                    رفض
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {selected.size ? (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur animate-pop-in sm:inset-x-6">
          <span className="px-2 text-sm font-black">
            {bulk ? `جارٍ التنفيذ ${bulk.done}/${bulk.total}` : `${selected.size} محدد`}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={!!bulk}
            className="min-h-10 rounded-full px-3 text-sm font-bold text-muted-foreground hover:bg-secondary"
          >
            إلغاء التحديد
          </button>
          <button
            type="button"
            onClick={() => void runBulk([...selected], "rejected")}
            disabled={!!bulk}
            className="ms-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-coral disabled:opacity-60"
          >
            <X className="size-4" /> رفض المحدد
          </button>
          <button
            type="button"
            onClick={() => void runBulk([...selected], "done")}
            disabled={!!bulk}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background disabled:opacity-60"
          >
            {bulk ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            اعتماد المحدد ({selected.size})
          </button>
        </div>
      ) : null}

      <Dialog open={!!previewTask} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir="rtl">
          {previewTask ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-start">معاينة: {previewTask.title}</DialogTitle>
              </DialogHeader>
              <ApprovalPreview task={previewTask} brandName={workspace?.name ?? "علامتك"} />
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const id = previewTask.id;
                    await act(id, "rejected");
                    setPreviewId(null);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-coral"
                >
                  <X className="size-4" /> رفض
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = previewTask.id;
                    await act(id, "done");
                    setPreviewId(null);
                  }}
                  disabled={busyId === previewTask.id}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background disabled:opacity-60"
                >
                  {busyId === previewTask.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  اعتماد
                </button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
