import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  MapPin,
  Users,
  Store,
  Swords,
  Link2,
  ArrowUpLeft,
} from "lucide-react";

import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { getMember } from "@/data/team";
import type { BusinessProfile } from "@/lib/business-profile.server";
import { profileMyWebsite, saveBusinessProfile } from "@/lib/business-profile.functions";
import { cn } from "@/lib/utils";
import { useIntegrations } from "@/lib/data";
import { CheckCircle2 } from "lucide-react";
import { Portrait } from "@/components/site/Portrait";
import { SiteFavicon } from "@/components/app/SiteBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import defaultWorkspace from "@/assets/default-workspace-identity.jpg";

type Props = {
  workspaceId: string;
  website?: string | null | undefined;
  profile?: Partial<BusinessProfile> | null | undefined;
  /** يُستدعى بعد التحليل (الإعداد الأولي يملأ الحقول منه). */
  onProfiled?: (p: BusinessProfile, url: string) => void;
  compact?: boolean;
  className?: string;
  welcomeWebsite?: string;
  onWelcomeSaved?: () => void;
};

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-jade";

/** بطاقة «ملف العلامة»: رابط واحد → نفهم النشاط كاملاً ونقترح أول المهام والتكاملات. */
export function BusinessProfileCard({
  workspaceId,
  website,
  profile,
  onProfiled,
  compact,
  className,
  welcomeWebsite,
  onWelcomeSaved,
}: Props) {
  const qc = useQueryClient();
  const run = useServerFn(profileMyWebsite);
  const save = useServerFn(saveBusinessProfile);
  const { data: connected } = useIntegrations(workspaceId);
  const connectedSet = new Set((connected ?? []).filter((c) => c.status === "connected").map((c) => c.provider));
  const [url, setUrl] = useState(website ?? "");
  const [result, setResult] = useState<BusinessProfile | null>(null);
  const [reviewUrl, setReviewUrl] = useState("");
  const attemptedWelcome = useRef(false);

  const mutation = useMutation({
    mutationFn: (targetUrl: string) => run({ data: { workspaceId, url: targetUrl, save: targetUrl === welcomeWebsite } }),
    onSuccess: (r, targetUrl) => {
      setResult(r.profile);
      setReviewUrl(targetUrl);
      if (r.saved) onProfiled?.(r.profile, targetUrl);
      if (targetUrl === welcomeWebsite) onWelcomeSaved?.();
      void qc.invalidateQueries({ queryKey: ["workspace"] });
      void qc.invalidateQueries({ queryKey: ["brain", workspaceId] });
    },
  });

  const saving = useMutation({
    mutationFn: () => {
      if (!result) throw new Error("حلل الموقع أولاً.");
      return save({ data: { workspaceId, url: reviewUrl, profile: result } });
    },
    onSuccess: () => {
      if (result) onProfiled?.(result, reviewUrl);
      setResult(null);
      void qc.invalidateQueries({ queryKey: ["workspace"] });
      void qc.invalidateQueries({ queryKey: ["brain", workspaceId] });
      toast.success("تم حفظ ملف العلامة بعد مراجعتك.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر حفظ الملف"),
  });

  useEffect(() => {
    if (website?.trim() || !welcomeWebsite?.trim() || attemptedWelcome.current) return;
    const raw = welcomeWebsite.trim();
    try {
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (parsed.protocol !== "https:" || !parsed.hostname.includes(".") || parsed.username || parsed.password || parsed.port) return;
    } catch { return; }
    attemptedWelcome.current = true;
    setUrl(raw);
    mutation.mutate(raw);
  }, [website, welcomeWebsite, mutation.mutate]);

  const p = (result ?? profile) as Partial<BusinessProfile> | null;
  const has = Boolean(p?.summary || p?.products?.length);
  const savedSite = (website ?? "").trim() || (mutation.isSuccess ? url.trim() : "");

  return (
    <section className={cn("rounded-3xl border border-border bg-card p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-jade/12 text-jade-deep">
            {savedSite ? (
              <SiteFavicon website={savedSite} className="size-6" />
            ) : (
              <img
                src={defaultWorkspace}
                alt="صورة مساحة العمل الافتراضية"
                loading="lazy"
                width={1024}
                height={1024}
                className="size-full object-cover"
              />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-black sm:text-lg">ملف العلامة من موقعك</h2>
            {savedSite ? (
              <p className="mt-0.5 truncate text-xs font-bold text-jade-deep" dir="ltr">
                {savedSite.replace(/^https?:\/\//, "").replace(/^www\./, "")}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
              ضع رابط موقعك فقط — نقرأ صفحاته ونفهم منتجاتك وجمهورك ومدنك ولهجتك ومنافسيك، ويعمل
              عليها الموظفون الستة تلقائياً.
            </p>
          </div>
        </div>
        {has && p?.confidence && p.confidence !== "low" ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.7rem] font-bold",
              p.confidence === "high"
                ? "bg-jade/12 text-jade-deep"
                : p.confidence === "medium"
                  ? "bg-amber/15 text-amber"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {p.confidence === "high"
              ? "فهم عالٍ"
              : p.confidence === "medium"
                ? "فهم جيد — راجع التفاصيل"
                : null}
          </span>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim().length > 3 && !mutation.isPending) mutation.mutate(url.trim());
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          dir="ltr"
          inputMode="url"
          placeholder="https://your-site.com"
          className={cn(field, "flex-1 text-start")}
        />
        <Button
          type="submit"
          disabled={mutation.isPending || url.trim().length < 4}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : has ? (
            <RefreshCw className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {mutation.isPending ? "نقرأ موقعك…" : has ? "أعد التحليل" : "افهم نشاطي"}
        </Button>
      </form>
      {mutation.isPending ? (
        <p className="mt-2 text-xs text-muted-foreground">
          جارٍ تحليل الموقع والتحقق من صفحات المنافسين؛ قد يستغرق بضع دقائق.
        </p>
      ) : null}
      {mutation.error ? (
        <p className="mt-3 rounded-2xl bg-coral/12 px-4 py-3 text-sm font-semibold text-coral">
          {mutation.error instanceof Error ? mutation.error.message : "تعذّر تحليل الموقع"}
        </p>
      ) : null}

      {has && p ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed">
            <b>{p.name}</b> · {p.industry}
            {p.country ? ` · ${p.country}` : ""}
            {p.platform ? ` · موقع ${p.platform}` : ""}
            {p.dialect ? ` · لهجة ${p.dialect}` : ""}
            <br />
            {p.summary}
          </p>

          {!compact ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact icon={Store} label="المنتجات/الخدمات" items={p.products} />
              <Fact icon={Users} label="الجمهور" items={p.audience ? [p.audience] : []} />
              <Fact icon={MapPin} label="المدن/الفروع" items={p.locations} />
              <Fact icon={Store} label="التميّز المذكور بالموقع" items={p.usp ? [p.usp] : []} />
            </div>
          ) : null}

          {p.analyzedAt ? <p className="text-xs text-muted-foreground">آخر فحص: {new Date(p.analyzedAt).toLocaleString("ar-EG")}</p> : null}
          <div className="border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Swords className="size-4" /> منافسون من مصادر عامة</h3>
            {p.competitorEvidence?.length ? <ul className="mt-3 divide-y divide-border">{p.competitorEvidence.map((c) => <li key={c.domain} className="py-3 text-sm leading-7">
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="break-all font-bold text-primary underline" dir="ltr">{c.domain}</a>
              <p>{c.reason}</p><blockquote className="mt-1 border-s-2 border-border ps-3 text-muted-foreground">«{c.quote}»</blockquote>
            </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">لم تتوفر أدلة كافية لتأكيد المنافسين في هذا الفحص.</p>}
          </div>
          {p.pagesRead?.length ? <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm font-bold">الصفحات المقروءة ({p.pagesRead.length})</summary><ul className="mt-2 space-y-2">{p.pagesRead.map((page) => <li key={page}><a href={page} target="_blank" rel="noopener noreferrer" dir="ltr" className="block break-all text-xs text-primary underline">{page}</a></li>)}</ul></details> : null}
          {p.gaps?.length ? <div className="border-t border-border pt-3"><h3 className="text-sm font-bold">ما يحتاج تأكيدك</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">{p.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></div> : null}
          {result && reviewUrl !== welcomeWebsite ? <form className="space-y-3 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); saving.mutate(); }}>
            <h3 className="text-sm font-bold">مراجعة ملف العلامة</h3>
            {([['name', 'اسم العلامة'], ['industry', 'المجال'], ['summary', 'وصف النشاط'], ['audience', 'الجمهور'], ['usp', 'التميّز']] as const).map(([key, label]) => <label key={key} className="block text-xs font-bold">{label}<textarea className="mt-1 min-h-16 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm font-normal" maxLength={key === 'summary' ? 800 : key === 'audience' ? 500 : key === 'usp' ? 400 : key === 'name' ? 120 : 80} value={result[key]} onChange={(e) => setResult({ ...result, [key]: e.target.value })} /></label>)}
            <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving.isPending}>{saving.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}حفظ الملف بعد المراجعة</Button><Button type="button" variant="outline" disabled={saving.isPending} onClick={() => setResult(null)}>إلغاء</Button></div>
          </form> : null}

          {p.recommendedIntegrations?.length ? (
            <div>
              <p className="mb-2 text-xs font-bold text-muted-foreground">
                أكثر الحسابات فائدة لنشاطك — مرتبة حسب ما وجدناه فعلاً في موقعك
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {p.recommendedIntegrations.map((i) => {
                  const on = connectedSet.has(i.provider);
                  return (
                    <Link
                      key={i.provider}
                      to="/app/integrations"
                      className="flex items-start gap-2.5 rounded-2xl border border-border p-3 text-start hover:bg-secondary/60"
                    >
                      <AppIcon name={i.provider} className="mt-0.5 size-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-bold">
                          {appLabel(i.provider)}
                          {on ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-jade">
                              <CheckCircle2 className="size-3" /> مربوط
                            </span>
                          ) : (
                            <Link2 className="size-3 text-muted-foreground" />
                          )}
                        </span>
                        <span className="block text-xs leading-relaxed">{i.why}</span>
                        {i.evidence ? (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            الدليل: {i.evidence}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!compact && p.firstTasks?.length ? (
            <div>
              <p className="mb-2 text-xs font-bold text-muted-foreground">
                أول مهمة مقترحة لكل موظف — اضغط لتبدأ فوراً
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {p.firstTasks.map((t) => {
                  const m = getMember(t.employeeId);
                  if (!m) return null;
                  return (
                    <Link
                      key={`${t.employeeId}-${t.title}`}
                      to="/app/chat/$id"
                      params={{ id: t.employeeId }}
                      search={{ prompt: t.prompt }}
                      className="group flex items-center gap-3 rounded-2xl border border-border p-3 text-start transition-colors hover:bg-secondary/60"
                    >
                      <span
                        className="size-9 shrink-0 overflow-hidden rounded-xl"
                        style={{ background: m.tintSoft }}
                      >
                        <Portrait memberId={m.id} name={m.name} className="size-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-muted-foreground">
                          {m.name}
                        </span>
                        <span className="block truncate text-sm font-bold">{t.title}</span>
                      </span>
                      <ArrowUpLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  items,
  ltr,
}: {
  icon: typeof Store;
  label: string;
  items?: string[] | undefined;
  ltr?: boolean | undefined;
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border border-border/70 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 text-sm" dir={ltr ? "ltr" : undefined}>
        {items.join("، ")}
      </p>
    </div>
  );
}
