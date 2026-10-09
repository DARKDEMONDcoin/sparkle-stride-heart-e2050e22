import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronDown, Clock3, Copy, Crown, Download, HelpCircle, Link2, Loader2, MessageCircle, MousePointerClick, RotateCcw, Scale, Share2, TrendingUp, UserCheck, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getReferralDashboard, requestReferralPayout } from "@/lib/referral.functions";
import { SITE_ORIGIN } from "@/lib/site-origin";
import logoUrl from "@/assets/ziad-logo.png";
import "@/components/app/referral-club.css";

export const Route = createFileRoute("/app/referral")({
  head: () => ({ meta: [
    { title: "نادي شركاء زياد | عمولة حتى ٥٠٪" },
    { name: "description", content: "نادي شركاء زياد: شارك رابطك، تابع إحالاتك وأرباحك المؤكدة، وارتقِ بعمولتك من ٢٠٪ إلى ٥٠٪." },
    { property: "og:title", content: "نادي شركاء زياد | عمولة حتى ٥٠٪" },
    { property: "og:description", content: "تابع الإحالات والعمولات وطلبات السحب من مكان واحد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ReferralPage,
});

const levels = [
  { count: 0, rate: 20, name: "البداية" },
  { count: 5, rate: 30, name: "الشريك" },
  { count: 10, rate: 40, name: "المحترف" },
  { count: 25, rate: 50, name: "النخبة" },
] as const;

const referralStatuses: Record<string, { label: string; tone: string }> = {
  signed_up: { label: "قيد الانتظار", tone: "rc-tone-gold" },
  trial: { label: "يجرّب الآن", tone: "rc-tone-gold" },
  active: { label: "مؤكدة", tone: "rc-tone-teal" },
  cancelled: { label: "غير نشط", tone: "rc-tone-terra" },
  held: { label: "قيد المراجعة", tone: "rc-tone-terra" },
};

const faqs = [
  { q: "متى أستلم عمولتي؟", a: "تُحتسب العمولة بعد دفع العميل فعلياً، وتبقى معلّقة ٣٠ يوماً ثم تنتقل إلى رصيدك المتاح. يمكنك طلب السحب عند بلوغ ٥٠ دولاراً." },
  { q: "ما حكم الاسترداد؟", a: "إذا استرد العميل مبلغه أو أُلغي الدفع خلال فترة المراجعة، تُعكس العمولة تلقائياً ويُحفظ السبب في السجل." },
  { q: "كيف أتتبع إحالاتي؟", a: "كل زيارة لرابطك وكل حساب جديد يظهر هنا لحظياً، مع حالة كل إحالة دون أي بيانات شخصية عن العميل." },
];

function money(cents: number) {
  return new Intl.NumberFormat("ar", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100);
}
function dateAr(iso: string) {
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** عدّاد تصاعدي من الصفر عند التحميل وعند تحديث القيمة. */
function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString("ar"), duration = 1100 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); from.current = value; return; }
    const start = performance.now(); const a = from.current; let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(a + (value - a) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration]);
  return <>{format(display)}</>;
}

function WhatsAppIcon() { return <MessageCircle className="size-5" />; }
function XIcon() { return <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" /></svg>; }

function ReferralPage() {
  const load = useServerFn(getReferralDashboard);
  const payout = useServerFn(requestReferralPayout);
  const qc = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [method, setMethod] = useState<"bank" | "paypal" | "wallet">("bank");
  const [destination, setDestination] = useState("");
  const query = useQuery({ queryKey: ["referral-dashboard"], queryFn: () => load() });
  const dashboard = query.data;
  const referralUrl = dashboard ? `${SITE_ORIGIN}/r/${dashboard.code}` : "";
  const currentLevelIndex = dashboard ? levels.reduce((found, level, index) => dashboard.active >= level.count ? index : found, 0) : 0;
  const currentLevel = levels[currentLevelIndex] ?? levels[0];
  const nextLevel = levels[currentLevelIndex + 1];
  const conversionRate = dashboard?.clicks ? Math.round((dashboard.signups / dashboard.clicks) * 100) : 0;
  const shareText = "ترشيحي لك لتجربة زياد وفريقه الذكي. (رابط إحالة: قد أحصل على عمولة إذا اشتركت)";
  const withdrawal = useMutation({
    mutationFn: () => payout({ data: { method, destination } }),
    onSuccess: async () => {
      setWithdrawOpen(false);
      setDestination("");
      toast.success("تم إرسال طلب السحب للمراجعة");
      await qc.invalidateQueries({ queryKey: ["referral-dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر إرسال الطلب"),
  });

  async function copyLink() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("تم نسخ رابطك");
  }
  async function shareLink() {
    if (!referralUrl) return;
    if (navigator.share) await navigator.share({ title: "جرّب زياد", text: shareText, url: referralUrl }).catch(() => undefined);
    else await copyLink();
  }

  const canWithdraw = !!dashboard && dashboard.totals.available >= 5000 && dashboard.totals.reserved === 0;
  const stats = dashboard ? [
    { label: "حسابات جديدة", value: dashboard.signups, icon: Users, tone: "rc-tone-teal" },
    { label: "زيارات الرابط", value: dashboard.clicks, icon: MousePointerClick, tone: "rc-tone-gold" },
    { label: "معدل التحويل", value: conversionRate, icon: TrendingUp, tone: "rc-tone-terra", pct: true },
    { label: "عملاء نشطون", value: dashboard.active, icon: UserCheck, tone: "rc-tone-teal" },
  ] : [];
  const fillPct = (currentLevelIndex / (levels.length - 1)) * 75;

  return <AppShell title="نادي شركاء زياد" lead="رشّح زياد لمن تثق به، واربح من كل دفعة مؤكدة">
    {query.isLoading ? <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : query.isError || !dashboard ? <div className="border-t border-border py-12"><h2 className="font-display text-xl font-black">تعذّر تحميل لوحة الإحالة</h2><Button className="mt-5" onClick={() => void query.refetch()}>حاول مرة أخرى</Button></div> :
    <div className="rc mb-12 space-y-6 sm:space-y-8" dir="rtl">
      <div className="rc-smoke" aria-hidden="true"><i /><i /><i /></div>

      {/* 1) الهيرو + بطاقة الشريك */}
      <section className="grid gap-7 pt-2 lg:grid-cols-[1fr_22rem] lg:items-center">
        <div>
          <p className="rc-eyebrow flex items-center gap-2"><Crown className="size-4" /> نادي شركاء زياد</p>
          <h1 className="mt-3 text-[1.9rem] font-extrabold leading-[1.25] sm:text-5xl">رشّح زياد مرة،<br />واقبض كل شهر يدفع فيه عميلك.</h1>
          <p className="rc-muted mt-4 max-w-xl text-sm leading-7 sm:text-base">عمولة تبدأ من ٢٠٪ من كل دفعة مؤكدة، وترتفع حتى ٥٠٪ كلما زاد عملاؤك النشطون. لا تسجيلات وهمية، ولا أرقام تقديرية.</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="rc-card" aria-label={`بطاقة شريك زياد، مستوى ${currentLevel.name}، عمولة ${dashboard.rate}٪`}>
          <div className="flex items-center justify-between"><span className="rc-gold flex items-center gap-2 text-sm font-extrabold"><Crown className="size-5" /> شريك زياد</span><span className="rc-pill rc-tone-gold">مستوى {currentLevel.name}</span></div>
          <div><p className="rc-num rc-rate">{dashboard.rate.toLocaleString("ar")}٪</p><p className="rc-muted mt-2 text-xs font-bold">عمولتك الحالية من كل دفعة مؤكدة</p></div>
          <p className="rc-code" dir="ltr">ID · {dashboard.code.toUpperCase()}</p>
        </motion.div>
      </section>

      {/* 2) رابط الإحالة */}
      <section className="liquid-glass-sahl p-4 sm:p-6" aria-labelledby="share-title">
        <h2 id="share-title" className="text-lg font-extrabold">رابطك الخاص</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--rc-faint)" }} dir="ltr"><Link2 className="rc-gold size-4 shrink-0" /><code className="min-w-0 flex-1 truncate text-xs font-bold sm:text-sm">{referralUrl}</code></div>
          <div className="flex items-center gap-2">
            <button type="button" className="rc-btn rc-btn-terra flex-1 sm:flex-none" onClick={() => void copyLink()}><Copy className="size-4" /> نسخ</button>
            <a className="rc-icon rc-tone-teal" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}`} target="_blank" rel="noreferrer" aria-label="مشاركة عبر واتساب"><WhatsAppIcon /></a>
            <a className="rc-icon rc-tone-gold" href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`} target="_blank" rel="noreferrer" aria-label="مشاركة عبر إكس"><XIcon /></a>
            <button type="button" className="rc-icon rc-tone-terra" onClick={() => void copyLink()} aria-label="نسخ الرابط"><Copy className="size-[1.1rem]" /></button>
          </div>
        </div>
        <p className="rc-muted mt-3 text-xs leading-6">عمولة {dashboard.rate.toLocaleString("ar")}٪ من كل دفعة مؤكدة · تبقى معلّقة ٣٠ يوماً قبل أن تصبح متاحة · أفصح دائماً أنه رابط إحالة، وراجع <Link to="/referral-terms" className="underline underline-offset-4" style={{ color: "var(--rc-cream)" }}>شروط البرنامج</Link>.</p>
        <button type="button" className="rc-btn rc-btn-grad mt-5 w-full sm:w-auto" onClick={() => void shareLink()}><Share2 className="size-4" /> مشاركة الرابط</button>
      </section>

      {/* 3) الإحصائيات */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="ملخص الإحالات">
        {stats.map((s) => <div key={s.label} className="liquid-glass-sahl p-4 sm:p-5"><span className={`rc-icon ${s.tone} !size-10`}><s.icon className="size-5" /></span><p className="rc-num mt-4 text-3xl font-extrabold sm:text-4xl"><CountUp value={s.value} format={(n) => `${Math.round(n).toLocaleString("ar")}${s.pct ? "٪" : ""}`} /></p><p className="rc-muted mt-1 text-xs font-bold">{s.label}</p></div>)}
      </section>

      {/* 4) المستويات + 5) الرصيد */}
      <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <div className="liquid-glass-sahl p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">طريقك إلى ٥٠٪</h2>
          <p className="rc-muted mt-1 text-xs">المستوى يعتمد على عدد عملائك النشطين.</p>
          <div className="rc-steps mt-7" role="list">
            <span className="rc-steps-fill" style={{ width: `${fillPct}%` }} aria-hidden="true" />
            {levels.map((level, i) => { const state = i < currentLevelIndex ? "is-done" : i === currentLevelIndex ? "is-current" : ""; return <div key={level.rate} className="rc-step" role="listitem" aria-current={i === currentLevelIndex ? "step" : undefined}>
              <span className={`rc-dot ${state}`}>{state === "is-done" ? <Check className="size-4" /> : (i + 1).toLocaleString("ar")}</span>
              <span className={`rc-num text-sm font-extrabold ${i === currentLevelIndex ? "rc-terra" : ""}`}>{level.rate.toLocaleString("ar")}٪</span>
              <span className="rc-muted text-[0.68rem] font-bold">{level.name}</span>
            </div>; })}
          </div>
          <p className="mt-6 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: "var(--rc-faint)" }}>{nextLevel ? <>باقٍ {(nextLevel.count - dashboard.active).toLocaleString("ar")} {nextLevel.count - dashboard.active === 1 ? "عميل نشط" : "عملاء نشطين"} للوصول لنسبة {nextLevel.rate.toLocaleString("ar")}٪</> : <>وصلت لأعلى مستوى — عمولتك ٥٠٪ 🎉</>}</p>
        </div>

        <div className="liquid-glass-sahl flex flex-col p-5 sm:p-6" style={{ borderColor: "color-mix(in oklab, var(--rc-gold) 30%, transparent)" }}>
          <div className="flex items-center gap-2"><WalletCards className="rc-teal size-5" /><h2 className="text-lg font-extrabold">الرصيد المتاح</h2></div>
          <p className="rc-num rc-gold mt-4 text-4xl font-extrabold"><CountUp value={dashboard.totals.available} format={money} /></p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl p-3" style={{ background: "var(--rc-faint)" }}><p className="rc-muted">تم دفعه</p><p className="rc-num mt-1 text-base font-extrabold">{money(dashboard.totals.paid)}</p></div>
            <div className="rounded-xl p-3" style={{ background: "var(--rc-faint)" }}><p className="rc-muted">قيد الانتظار</p><p className="rc-num mt-1 text-base font-extrabold">{money(dashboard.totals.pending)}</p></div>
          </div>
          <p className="rc-muted mt-3 text-xs">إجمالي ما كسبته: <strong style={{ color: "var(--rc-cream)" }}>{money(dashboard.totals.earned)}</strong></p>
          <button type="button" className="rc-btn rc-btn-terra mt-5 w-full" disabled={!canWithdraw} onClick={() => setWithdrawOpen(true)}>طلب سحب الأرباح <ArrowLeft className="size-4" /></button>
          <p className="rc-muted mt-3 text-center text-[0.68rem] leading-5">الحد الأدنى ٥٠ دولاراً · العمولات تصبح متاحة بعد مراجعة ٣٠ يوماً</p>
        </div>
      </section>

      {/* 6) آخر الإحالات */}
      <section className="liquid-glass-sahl p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">آخر الإحالات</h2>
        {dashboard.referrals.length ? <ol className="rc-timeline mt-5 space-y-4">
          {dashboard.referrals.slice(0, 8).map((r) => { const st = referralStatuses[r.status] ?? referralStatuses.signed_up; return <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-sm font-extrabold">عميل جديد</p><p className="rc-muted text-xs">{dateAr(r.attributedAt)}{r.firstPaidAt ? ` · أول دفعة ${dateAr(r.firstPaidAt)}` : ""}</p></div>
            <span className={`rc-pill ${st.tone}`}>{st.label}</span>
          </li>; })}
        </ol> : <div className="mt-5 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--rc-faint)" }}><p className="text-sm font-extrabold">لا إحالات بعد</p><p className="rc-muted mt-1 text-xs">أرسل رابطك لأول شخص تثق أن زياد سيفيده، وستظهر إحالته هنا فوراً.</p></div>}
        <p className="rc-muted mt-5 text-xs">لا نعرض بيانات شخصية لعملائك.</p>
      </section>

      {/* 7) الشفافية */}
      <section aria-labelledby="clear-title">
        <h2 id="clear-title" className="text-lg font-extrabold">أرباح واضحة، بلا مفاجآت</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[{ icon: CheckCircle2, tone: "rc-tone-teal", title: "كيف تُحتسب", text: "نسبة مستواك من كل دفعة يدفعها العميل فعلياً، لا من مجرد التسجيل." },
            { icon: Clock3, tone: "rc-tone-gold", title: "متى تُصرف", text: "بعد ٣٠ يوماً من الدفعة تصبح متاحة، وتسحبها عند بلوغ ٥٠ دولاراً." },
            { icon: RotateCcw, tone: "rc-tone-terra", title: "عند الاسترداد", text: "إذا استُرد المبلغ تُعكس العمولة تلقائياً ويُحفظ السبب في سجلك." }].map((p) => <div key={p.title} className="liquid-glass-sahl flex gap-3 p-4"><span className={`rc-icon ${p.tone} !size-10 shrink-0`}><p.icon className="size-5" /></span><div><h3 className="text-sm font-extrabold">{p.title}</h3><p className="rc-muted mt-1 text-xs leading-6">{p.text}</p></div></div>)}
        </div>
      </section>

      {/* 8) موارد الشريك */}
      <section aria-labelledby="res-title">
        <h2 id="res-title" className="text-lg font-extrabold">موارد الشريك</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="liquid-glass-sahl p-5"><span className="rc-icon rc-tone-teal !size-10"><BookOpen className="size-5" /></span><h3 className="mt-3 text-sm font-extrabold">كيف يعمل البرنامج</h3>
            <ol className="rc-muted mt-2 space-y-1.5 text-xs leading-6">{["انسخ رابطك وشاركه مع من تثق به", "يسجّل ويشترك في زياد", "تُحتسب عمولتك من كل دفعة مؤكدة", "اسحب رصيدك بعد فترة المراجعة"].map((s, i) => <li key={s}><span className="rc-gold font-extrabold">{(i + 1).toLocaleString("ar")}.</span> {s}</li>)}</ol></div>
          <div className="liquid-glass-sahl flex flex-col p-5"><span className="rc-icon rc-tone-gold !size-10"><Download className="size-5" /></span><h3 className="mt-3 text-sm font-extrabold">أصول العلامة</h3><p className="rc-muted mt-2 flex-1 text-xs leading-6">شعار زياد بجودة عالية لاستخدامه في منشوراتك عند مشاركة رابطك.</p>
            <div className="mt-4 flex flex-wrap gap-2"><a href={logoUrl} download="ziad-logo.png" className="rc-btn rc-btn-ghost !min-h-10 text-xs"><Download className="size-4" /> تحميل الشعار</a><Link to="/referral-terms" className="rc-btn rc-btn-ghost !min-h-10 text-xs"><Scale className="size-4" /> الشروط</Link></div></div>
          <div className="liquid-glass-sahl p-5"><span className="rc-icon rc-tone-terra !size-10"><HelpCircle className="size-5" /></span><h3 className="mt-3 text-sm font-extrabold">الأسئلة الشائعة</h3>
            <div className="mt-2 divide-y" style={{ borderColor: "var(--rc-faint)" }}>{faqs.map((f) => <details key={f.q} className="group py-2" style={{ borderColor: "var(--rc-faint)" }}><summary className="flex items-center justify-between gap-2 text-xs font-extrabold">{f.q}<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="rc-muted mt-2 text-xs leading-6">{f.a}</p></details>)}</div></div>
        </div>
      </section>
    </div>}

    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
      <DialogContent className="max-w-md" dir="rtl" aria-describedby="withdraw-description">
        <DialogTitle className="font-display text-xl font-black">سحب الأرباح</DialogTitle>
        <DialogDescription id="withdraw-description">سيُرسل كامل رصيدك المتاح، وقد يستغرق التحقق والتحويل عدة أيام عمل.</DialogDescription>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="طريقة السحب">
          {([{ value: "bank", label: "حساب بنكي" }, { value: "paypal", label: "PayPal" }, { value: "wallet", label: "محفظة" }] as const).map((option) => <Button key={option.value} type="button" variant={method === option.value ? "default" : "outline"} className="h-11 px-2 text-xs" onClick={() => setMethod(option.value)}>{option.label}</Button>)}
        </div>
        <div><label htmlFor="payout-destination" className="mb-2 block text-xs font-black">بيانات الاستلام</label><Input id="payout-destination" value={destination} onChange={(event) => setDestination(event.target.value)} className="h-11" placeholder={method === "bank" ? "رقم الحساب أو IBAN" : method === "paypal" ? "بريد PayPal" : "رقم المحفظة"} /></div>
        <div className="rounded-md bg-secondary px-4 py-3 text-sm"><span className="text-muted-foreground">المبلغ المطلوب: </span><strong>{money(dashboard?.totals.available ?? 0)}</strong></div>
        <Button className="h-11 w-full font-black" disabled={destination.trim().length < 5 || withdrawal.isPending} onClick={() => withdrawal.mutate()}>{withdrawal.isPending ? <Loader2 className="animate-spin" /> : null} تأكيد طلب السحب</Button>
      </DialogContent>
    </Dialog>
  </AppShell>;
}
