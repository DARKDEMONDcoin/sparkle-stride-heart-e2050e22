import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  Clock3,
  Link2,
  ListChecks,
  Sparkles,
  ChevronDown,
  Check,
} from "lucide-react";

import { ActivationMap } from "@/components/app/ActivationMap";
import { AdsResultsCard } from "@/components/app/AdsResultsCard";
import { AppShell } from "@/components/app/AppShell";
import { ConnectionHealthBanner } from "@/components/app/ConnectionHealthBanner";
import { BusinessProfileCard } from "@/components/app/BusinessProfileCard";
import { CatchUpNote } from "@/components/app/CatchUpNote";
import { MorningBriefingCard } from "@/components/app/MorningBriefingCard";
import { appLabel } from "@/components/site/AppIcon";
import { getMember, team } from "@/data/team";
import { taskStatusLabel } from "@/data/app";
import { useIntegrations, useProfile, useTasks, useWorkspace } from "@/lib/data";
import { Portrait } from "@/components/site/Portrait";
import { BrandLoader } from "@/components/site/BrandLoader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { splitReview } from "@/lib/task-freshness";
import { useQueryClient } from "@tanstack/react-query";
import { boundWelcomeUser, clearWelcomeBinding, employeeIdFromName, readWelcomeDraft, type StarterAction, type WelcomeDraftData } from "@/lib/welcome-draft";
import { fallbackRecommendation } from "@/lib/welcome-recommendation-fallback";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "مساحة عملك | زياد" },
      { name: "description", content: "نظرة عامة على عمل فريقك الرقمي اليوم." },
      { property: "og:title", content: "مساحة عملك | زياد" },
      { property: "og:description", content: "نظرة عامة على عمل فريقك الرقمي اليوم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppHome,
});

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  return `قبل ${Math.round(hrs / 24)} يوم`;
}

type SavedWelcome = { purpose?: string | undefined; industry?: string | undefined; plan?: WelcomeDraftData["plan"] | undefined };

/** خطة البداية المحفوظة من /welcome: نفس المهام الثلاث، تفتح محادثة الموظف بالنص جاهزاً دون إرسال. */
function StarterPlan({ industry, actions }: { industry?: string | undefined; actions: StarterAction[] }) {
  const items = actions
    .map((a) => ({ ...a, id: employeeIdFromName(a.employee) }))
    .filter((a): a is StarterAction & { id: string } => Boolean(a.id))
    .slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="app-editorial-panel mb-4" aria-labelledby="starter-plan-title">
      <p className="app-editorial-kicker flex items-center gap-1.5">
        <Sparkles className="size-3 text-primary" /> خطة بدايتك
      </p>
      <h2 id="starter-plan-title" className="mt-1.5 font-display text-xl font-black sm:text-2xl">
        {industry ? `بدايتك في ${industry}` : "بدايتك مع فريقك"}
      </h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {items.map((item, i) => {
          const m = getMember(item.id);
          return (
            <li key={`${item.id}-${i}`} className="flex items-center gap-3 py-3">
              <span className="block size-10 shrink-0 overflow-hidden rounded-lg">
                <Portrait memberId={item.id} name={m?.name ?? item.employee} className="size-full" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-muted-foreground">{m?.name ?? item.employee}</span>
                <span className="block break-words text-sm font-semibold leading-relaxed">{item.text}</span>
              </span>
              <Button asChild size="sm" className="shrink-0">
                <Link to="/app/chat/$id" params={{ id: item.id }} search={{ prompt: item.text }}>ابدأ</Link>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">لا يُنشر أو يُرسل شيء دون موافقتك.</p>
    </section>
  );
}

/** شاشة أول يوم: لا أرقام صفرية ولا لوحات فارغة — طلب واحد فقط يبدأ كل شيء. */
function FirstRun({ workspace }: { workspace: { id: string; industry?: string; website?: string | null; profile?: unknown } | null }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [welcomeWebsite, setWelcomeWebsite] = useState("");
  const queryClient = useQueryClient();
  const stored = ((workspace?.profile as { welcome?: SavedWelcome } | null)?.welcome ?? null);
  const [local, setLocal] = useState<SavedWelcome | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user || !workspace) return;
      if (boundWelcomeUser() !== data.user.id) return;
      const draft = readWelcomeDraft();
      if (!draft) return;
      if (typeof draft.website === "string") setWelcomeWebsite(draft.website.trim());
      const industry = typeof draft.industry === "string" && draft.industry !== "أخرى" ? draft.industry.trim() : "";
      const welcome: SavedWelcome = { purpose: draft.purpose, industry, plan: draft.plan ?? null };
      setLocal(welcome);
      // Persist once to the workspace so the plan survives other devices/sessions.
      if (!stored) {
        const profile = { ...((workspace.profile as Record<string, unknown>) ?? {}), welcome };
        const { error } = await supabase
          .from("workspaces")
          .update({ profile: profile as never, ...(industry ? { industry } : {}) })
          .eq("id", workspace.id);
        if (!error) void queryClient.invalidateQueries({ queryKey: ["workspace"] });
      }
    });
    return () => { active = false; };
  }, [workspace?.id]);
  const saved = stored ?? local;
  const planIndustry = saved?.industry || undefined;
  const planActions = saved?.plan?.actions?.length
    ? saved.plan.actions
    : planIndustry
      ? fallbackRecommendation({ industry: planIndustry, purpose: saved?.purpose === "job" || saved?.purpose === "personal" ? saved.purpose : "business" }).actions
      : [];
  return (
    <>
      <StarterPlan industry={planIndustry} actions={planActions} />
      {workspace ? (
        <div className="mb-4">
          <BusinessProfileCard
            workspaceId={workspace.id}
            website={(workspace as { website?: string | null }).website}
            profile={(workspace as { profile?: Record<string, unknown> }).profile as never}
            welcomeWebsite={welcomeWebsite}
            onWelcomeSaved={() => {
              clearWelcomeBinding();
              setWelcomeWebsite("");
            }}
          />
        </div>
      ) : null}
      <section className="app-editorial-panel app-first-run">
        <p className="app-editorial-kicker flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" /> فريقك
        </p>
        <h2 className="mt-1.5 font-display text-xl font-black sm:text-2xl">
          اطلب أي عمل من فريقك
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          اكتب طلبك بالعربية كما تكلّم موظفاً — واختر من يبدأ. لا يُنشر شيء قبل موافقتك.
        </p>


        <div className="app-team-directory">
          {team.map((m) => {
            const open = expanded === m.id;
            return (
              <div key={m.id} className="h-[4.75rem] min-w-0 overflow-hidden border-b border-e border-border">
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={open}
                  aria-controls={`first-run-${m.id}`}
                  onClick={() => setExpanded(open ? null : m.id)}
                  className="app-team-row group h-auto w-full justify-start rounded-none text-start whitespace-normal hover:bg-secondary hover:text-foreground"
                >
                  <span className="block size-11 shrink-0 overflow-hidden rounded-lg grayscale transition-all duration-300 group-hover:grayscale-0">
                    <Portrait memberId={m.id} name={m.name} className="size-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{m.name}</span>
                    <span className="block text-[0.72rem] text-muted-foreground">{m.role}</span>
                  </span>
                  <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </Button>
              </div>
            );
          })}
        </div>
        {expanded ? (() => { const m = getMember(expanded); if (!m) return null; return (
          <div id={`first-run-${m.id}`} className="border-x border-b border-border px-4 pb-4 pt-3">
            <p className="text-sm font-bold">{m.name} · {m.role}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.summary}</p>
            <ul className="mt-3 space-y-2">
              {m.tasks.map((task) => (
                <li key={task} className="flex items-start gap-2 text-xs leading-relaxed">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="link" size="sm" className="mt-4 h-auto max-w-full justify-start whitespace-normal p-0 text-start text-xs">
              <Link to="/app/chat/$id" params={{ id: m.id }}>
                <span>ابدأ مع {m.name}</span> <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ); })() : null}
      </section>

    </>
  );
}

function bestEmployee(text: string): string {
  const t = text;
  if (/صور|تصميم|شعار|بوستر|بانر|لوجو/.test(t)) return "dana";
  if (/مقال|سيو|SEO|بحث|مدونة|كلمات مفتاحية/i.test(t)) return "nour";
  if (/مبيعات|عميل|عملاء|عرض سعر|صفقة|متابعة/.test(t)) return "sam";
  if (/تقرير|أرقام|تحليل|بيانات|إعلان|حملة/.test(t)) return "adam";
  if (/إيميل|بريد|موعد|اجتماع|جدول|تنظيم|مهام/.test(t)) return "eva";
  return "sonny";
}

function RequestBox() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [who, setWho] = useState("auto");
  const target = who === "auto" ? bestEmployee(text) : who;
  return (
    <form
      className="app-editorial-panel mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        void navigate({ to: "/app/chat/$id", params: { id: target }, search: { prompt: text.trim() } });
      }}
    >
      <label htmlFor="home-request" className="font-display text-lg font-black">ماذا تريد من فريقك اليوم؟</label>
      <textarea
        id="home-request"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="اكتب طلبك بالعربية…"
        className="mt-3 w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="home-employee">الموظف</label>
        <select
          id="home-employee"
          value={who}
          onChange={(e) => setWho(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="auto">الأنسب تلقائياً{text.trim() ? ` (${getMember(target)?.name ?? ""})` : ""}</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
        </select>
        <Button type="submit" disabled={!text.trim()} className="ms-auto">أرسل للموظف <ArrowLeft className="size-4" /></Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">لا يُنشر أو يُرسل شيء دون موافقتك.</p>
    </form>
  );
}

function OnboardingChecklist({ workspaceId, hasWebsite, connected, requested, reviewed }: { workspaceId: string; hasWebsite: boolean; connected: boolean; requested: boolean; reviewed: boolean }) {
  const key = `ziad-checklist-dismissed-${workspaceId}`;
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => { try { setDismissed(localStorage.getItem(key) === "1"); } catch { setDismissed(false); } }, [key]);
  const items = [
    { label: "أضف موقعك", done: hasWebsite },
    { label: "اربط منصة", done: connected, to: "/app/integrations" as const },
    { label: "اطلب أول عمل", done: requested },
    { label: "راجع أول مسودة", done: reviewed, to: "/app/approvals" as const },
  ];
  const count = items.filter((i) => i.done).length;
  if (dismissed) return null;
  return (
    <section className="app-editorial-panel mb-4" aria-label="خطوات البداية">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-black">خطوات البداية</h2>
        <span className="text-xs font-bold text-muted-foreground" dir="ltr">{count}/4</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><span className="block h-full bg-primary transition-all" style={{ width: `${(count / 4) * 100}%` }} /></div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.label} className={`flex items-center gap-2 text-sm ${i.done ? "text-muted-foreground line-through" : "font-semibold"}`}>
            {i.done ? <CheckCircle2 className="size-4 shrink-0 text-jade" /> : <span className="size-4 shrink-0 rounded-full border border-border" />}
            {i.to && !i.done ? <Link to={i.to} className="app-text-link">{i.label}</Link> : i.label}
          </li>
        ))}
      </ul>
      {count === 4 ? (
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => { try { localStorage.setItem(key, "1"); } catch { /* optional */ } setDismissed(true); }}>
          أخفِ القائمة
        </Button>
      ) : null}
    </section>
  );
}

function NameWorkspace({ workspace }: { workspace: { id: string; name: string; website?: string | null } }) {
  const key = `ziad-named-${workspace.id}`;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      try { if (localStorage.getItem(key)) return; } catch { return; }
      if (boundWelcomeUser() !== data.user.id) return;
      const site = readWelcomeDraft()?.website || workspace.website || "";
      let guess = "";
      try { if (site) guess = new URL(/^https?:/.test(site) ? site : `https://${site}`).hostname.replace(/^www\./, "").split(".")[0] ?? ""; } catch { /* ignore */ }
      setName(guess ? guess.charAt(0).toUpperCase() + guess.slice(1) : "");
      setOpen(true);
    });
    return () => { active = false; };
  }, [workspace.id]);
  const close = () => { try { localStorage.setItem(key, "1"); } catch { /* optional */ } setOpen(false); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="name-ws-title">
      <form
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          const v = name.trim().slice(0, 60);
          if (v.length < 2) return;
          setSaving(true);
          const initials = v.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const { error } = await supabase.from("workspaces").update({ name: v, initials }).eq("id", workspace.id);
          setSaving(false);
          if (!error) { void queryClient.invalidateQueries(); close(); }
        }}
      >
        <h2 id="name-ws-title" className="font-display text-xl font-black">ما اسم مشروعك؟</h2>
        <p className="mt-1 text-sm text-muted-foreground">يظهر في مساحتك ويستخدمه فريقك في كل عمل.</p>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثال: متجر الورد" className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={saving || name.trim().length < 2} className="flex-1">حفظ</Button>
          <Button type="button" variant="ghost" onClick={close}>تخطي</Button>
        </div>
      </form>
    </div>
  );
}

function AppHome() {
  const { data: profile } = useProfile();
  const { data: workspace } = useWorkspace();
  const { data: tasks, isLoading } = useTasks(workspace?.id);
  const { data: integrations } = useIntegrations(workspace?.id);

  const list = tasks ?? [];
  // الطابور الحيّ فقط: ما مضى عليه شهر بلا قرار صار أرشيفاً، وإبقاؤه في
  // العدّاد كان يخنق الشاشة برقم لا يعبّر عن قرار معلّق فعلاً.
  const review = splitReview(list.filter((t) => t.status === "review")).live;
  const running = list.filter((t) => t.status === "running");
  const done = list.filter((t) => t.status === "done");
  const connected = (integrations ?? []).filter((i) => i.status === "connected").length;
  const broken = (integrations ?? []).filter((i) => i.status === "error");
  const started = list.length > 0;

  // أرقام صفرية لا تُعرض: لوحة نظيفة تعرض ما حدث فعلاً فقط.
  const kpis = [
    { k: "مهام منجزة", n: done.length, d: "منذ انطلاق مساحتك", icon: CheckCircle2 },
    { k: "قيد التنفيذ", n: running.length, d: "فريقك يعمل الآن", icon: Clock3 },
    { k: "بانتظار موافقتك", n: review.length, d: "تحتاج قرارك", urgent: true, icon: ListChecks },
    { k: "حسابات مرتبطة", n: connected, d: `من أصل ${integrations?.length ?? 0}`, icon: Link2 },
  ].filter((k) => k.n > 0);

  const lead = started
    ? `${review.length} بانتظار موافقتك · ${running.length} قيد التنفيذ`
    : "فريقك جاهز — ابدأ بطلب واحد.";

  return (
    <AppShell title={`أهلاً ${profile?.full_name ?? ""}`} lead={workspace?.name ? `${workspace.name} · ${lead}` : lead}>
      {broken.length ? (
        <div className="app-system-alert">
          <span className="app-system-alert-label">تنبيه</span>
          <p className="flex-1 text-sm font-semibold">
            {broken.length} حساب يحتاج إعادة ربط — المهام المرتبطة به متوقفة.
          </p>
          <Link to="/app/integrations" className="app-text-link">
            إصلاح الربط
          </Link>
        </div>
      ) : null}

      {workspace ? <NameWorkspace workspace={workspace as never} /> : null}
      <RequestBox />
      {workspace ? (
        <OnboardingChecklist
          workspaceId={workspace.id}
          hasWebsite={Boolean((workspace as { website?: string | null }).website)}
          connected={connected > 0}
          requested={started}
          reviewed={list.some((t) => t.status === "done")}
        />
      ) : null}
      {isLoading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <BrandLoader size="sm" />
        </div>
      ) : !started ? (
        <FirstRun workspace={(workspace as never) ?? null} />
      ) : (
        <div className="app-command-center space-y-4">
          <CatchUpNote tasks={list as never} />
          {workspace ? <ConnectionHealthBanner workspaceId={workspace.id} /> : null}
          {workspace ? <MorningBriefingCard workspaceId={workspace.id} /> : null}
          <section className="app-command-head">
            <div>
              <p>زياد · لوحة القيادة</p>
              <h2 className="flex items-center gap-2.5">
                {" "}
                <LayoutDashboard className="size-6 text-primary" /> مركز قيادة العمل والنتائج{" "}
              </h2>
            </div>
            <span>
              <i /> تحديث مباشر من حساباتك
            </span>
          </section>
          {kpis.length ? (
            <section className="app-metric-strip" aria-label="ملخص مساحة العمل">
              {kpis.map((k) => (
                <div key={k.k} className={k.urgent ? "app-metric is-urgent" : "app-metric"}>
                  <span className="app-metric-icon" aria-hidden="true">
                    <k.icon />
                  </span>
                  <p className="app-metric-label">{k.k}</p>
                  <p className="app-metric-number">{k.n}</p>
                  <p className="app-metric-note">{k.d}</p>
                </div>
              ))}
            </section>
          ) : null}

          <ActivationMap variant="compact" />

          {workspace ? (
            <AdsResultsCard workspaceId={workspace.id} integrations={integrations ?? []} />
          ) : null}

          <div className="app-operations-grid">
            <section className="app-editorial-panel">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-black sm:text-lg">
                  <CheckCircle2 className="size-5 text-jade" /> آخر ما أنجزه فريقك
                </h2>
                <Link to="/app/tasks" className="app-text-link">
                  كل المهام
                </Link>
              </div>
              <ul className="app-work-list">
                {list.slice(0, 5).map((t) => {
                  const member = getMember(t.employee_id);
                  return (
                    <li key={t.id} className="app-work-row">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {member ? (
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            <span
                              className="size-6 overflow-hidden rounded-lg"
                              style={{ background: member.tintSoft }}
                            >
                              <Portrait
                                memberId={member.id}
                                name={member.name}
                                className="size-full"
                              />
                            </span>
                            {member.name}
                          </span>
                        ) : null}
                        <span className="text-muted-foreground">{appLabel(t.channel)}</span>
                        <span className="app-status-word">
                          {taskStatusLabel[t.status as keyof typeof taskStatusLabel] ?? t.status}
                        </span>
                        <span className="ms-auto text-muted-foreground">
                          {timeAgo(t.created_at)}
                        </span>
                      </div>
                      <p className="mt-2.5 break-words font-bold">{t.title}</p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="app-editorial-panel app-running-panel">
              <h2 className="flex items-center gap-2 font-display text-base font-black sm:text-lg">
                <Activity className="size-5 text-amber" /> مهام جارية
              </h2>
              <ul className="app-running-list">
                {running.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 text-sm">
                    <span className="app-running-index" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{t.title}</span>
                  </li>
                ))}
                {running.length === 0 ? (
                  <li className="text-sm text-muted-foreground">لا توجد مهام جارية.</li>
                ) : null}
              </ul>
              <Link to="/app/chat" className="app-text-link mt-5 inline-flex items-center gap-1.5">
                اطلب مهمة جديدة <ArrowLeft className="size-4" />
              </Link>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
