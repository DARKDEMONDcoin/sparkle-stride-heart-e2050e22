import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowLeft, Check, CheckCircle2, Clock3, Coins, Copy, Crown, DollarSign, Gift, Link2, Loader2, MousePointerClick, Scale, Send, Share2, Sparkles, TrendingUp, UserCheck, Users, WalletCards, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { LogoMark } from "@/components/site/LogoMark";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReferralDashboard, requestReferralPayout } from "@/lib/referral.functions";
import { SITE_ORIGIN } from "@/lib/site-origin";

export const Route = createFileRoute("/app/referral")({
  head: () => ({ meta: [
    { title: "شارك واربح حتى ٥٠٪ | زياد" },
    { name: "description", content: "لوحة إحالات زياد: شارك رابطك، تابع عملاءك وأرباحك، وارتقِ بعمولتك حتى ٥٠٪." },
    { property: "og:title", content: "شارك واربح حتى ٥٠٪ | زياد" },
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

const referralStatuses: Record<string, { label: string; className: string }> = {
  signed_up: { label: "سجّل", className: "bg-secondary text-secondary-foreground" },
  trial: { label: "يجرب الآن", className: "bg-gold-soft text-gold-deep" },
  active: { label: "عميل نشط", className: "bg-jade/10 text-jade-deep" },
  cancelled: { label: "غير نشط", className: "bg-muted text-muted-foreground" },
  held: { label: "قيد المراجعة", className: "bg-coral/10 text-coral" },
};

function money(cents: number) {
  return new Intl.NumberFormat("ar", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100);
}

function PartnerCard({ rate, level, code }: { rate: number; level: string; code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current; if (!el || event.pointerType === "touch") return;
    const r = el.getBoundingClientRect(); const x = (event.clientX - r.left) / r.width; const y = (event.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - .5) * 18}deg`); el.style.setProperty("--rx", `${(.5 - y) * 14}deg`);
    el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`);
  }
  function leave() { const el = ref.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
  return <motion.div initial={{ opacity: 0, y: 24, rotateX: 25 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: .9, ease: [.2, .8, .2, 1] }} className="w-full" style={{ display: "grid", placeItems: "center" }}>
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="ref-card" role="img" aria-label={`بطاقة شريك زياد، مستوى ${level}، عمولة ${rate}٪`}>
      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="ref-card-logo"><LogoMark size={52} /></div>
          <div className="text-left" dir="ltr"><p className="text-[0.6rem] font-black tracking-[0.3em] text-gold">ZIAD PARTNER</p><p className="mt-1 text-[0.7rem] font-bold text-gold-soft/70" dir="rtl">نادي الشركاء · {level}</p></div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="ref-chip" aria-hidden="true" />
          <div className="text-left"><strong className="ref-gold-text block font-display text-5xl font-black leading-none">{rate.toLocaleString("ar")}٪</strong><span className="text-[0.65rem] font-bold text-gold-soft/65">عمولتك الحالية</span></div>
        </div>
        <div className="flex items-end justify-between text-[0.68rem]" dir="ltr">
          <code className="font-black tracking-[0.28em] text-gold-soft">{code.toUpperCase().replace(/(.{4})/g, "$1 ").trim()}</code>
          <span className="font-display text-sm font-black tracking-widest text-gold">ZIAD</span>
        </div>
      </div>
    </div>
  </motion.div>;
}

const faqs = [
  { q: "متى تُحتسب العمولة؟", a: "فقط بعد دفع العميل فعلياً. مجرد التسجيل لا يُحتسب، والعمولة تتكرر مع كل دفعة مؤكدة." },
  { q: "متى أستطيع سحب أرباحي؟", a: "تبقى العمولة معلّقة ٣٠ يوماً (فترة الاسترداد)، ثم تنتقل للرصيد المتاح. الحد الأدنى للسحب ٥٠ دولاراً." },
  { q: "كيف أرتقي لعمولة أعلى؟", a: "المستوى يعتمد على عدد عملائك النشطين: ٥ عملاء = ٣٠٪، ١٠ = ٤٠٪، ٢٥ = ٥٠٪." },
  { q: "ماذا يحدث عند الاسترداد؟", a: "يُعكس مبلغ العمولة المرتبط تلقائياً ويُحفظ السبب في السجل، فتبقى أرقامك دقيقة." },
];

function ReferralPage() {
  const load = useServerFn(getReferralDashboard);
  const payout = useServerFn(requestReferralPayout);
  const qc = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [tab, setTab] = useState("start");
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState<"bank" | "paypal" | "wallet">("bank");
  const [destination, setDestination] = useState("");
  const query = useQuery({ queryKey: ["referral-dashboard"], queryFn: () => load() });
  const dashboard = query.data;
  const referralUrl = dashboard ? `${SITE_ORIGIN}/r/${dashboard.code}` : "";
  const currentLevelIndex = dashboard ? levels.reduce((found, level, index) => dashboard.active >= level.count ? index : found, 0) : 0;
  const currentLevel = levels[Math.max(0, currentLevelIndex)] ?? levels[0];
  const nextLevel = levels[currentLevelIndex + 1];
  const progress = nextLevel ? ((dashboard?.active ?? 0) - currentLevel.count) / (nextLevel.count - currentLevel.count) * 100 : 100;
  const conversionRate = dashboard?.clicks ? Math.round((dashboard.signups / dashboard.clicks) * 100) : 0;
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
  const stats = useMemo(() => dashboard ? [
    { label: "زيارات الرابط", value: dashboard.clicks.toLocaleString("ar"), icon: MousePointerClick },
    { label: "حسابات جديدة", value: dashboard.signups.toLocaleString("ar"), icon: Users },
    { label: "عملاء نشطون", value: dashboard.active.toLocaleString("ar"), icon: UserCheck },
    { label: "معدل التحويل", value: `${conversionRate.toLocaleString("ar")}٪`, icon: TrendingUp },
  ] : [], [dashboard, conversionRate]);

  async function copyLink() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
    toast.success("تم نسخ رابطك");
  }

  async function shareLink() {
    if (!referralUrl) return;
    if (navigator.share) await navigator.share({ title: "جرّب زياد", text: "ترشيحي لك لتجربة زياد وفريقه الذكي. (رابط إحالة: قد أحصل على عمولة إذا اشتركت)", url: referralUrl }).catch(() => undefined);
    else await copyLink();
  }

  const hasActivity = !!dashboard && (dashboard.clicks > 0 || dashboard.signups > 0);

  return <AppShell title="شارك واربح" lead="حوّل توصيتك إلى دخل واضح ومستمر">
    {query.isLoading ? <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : query.isError || !dashboard ? <div className="border-t border-border py-12"><h2 className="font-display text-xl font-black">تعذّر تحميل لوحة الإحالة</h2><Button className="mt-5" onClick={() => void query.refetch()}>حاول مرة أخرى</Button></div> : <div className="space-y-5 pb-12">

      {bannerOpen && <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border-2 border-foreground bg-gold-soft p-5 shadow-[6px_6px_0_0_var(--foreground)] sm:p-7">
        <button type="button" onClick={() => setBannerOpen(false)} aria-label="إخفاء" className="absolute left-3 top-3 z-20 grid size-8 place-items-center rounded-full border-2 border-foreground bg-background transition hover:scale-105"><X className="size-4" /></button>
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-black text-gold-deep"><Sparkles className="size-4" /> نادي شركاء زياد</p>
            <h2 className="mt-2 max-w-2xl font-display text-2xl font-black leading-tight sm:text-4xl">ساعد أصحاب الأعمال على توظيف أول فريق ذكي — واربح حتى ٥٠٪ مدى الحياة.</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-foreground/70">عمولة متكررة على كل دفعة مؤكدة من عملائك، تبدأ من ٢٠٪ وترتفع مع كل عميل نشط.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[{ icon: Zap, t: "تتبع لحظي" }, { icon: CheckCircle2, t: "مدفوعات موثقة" }, { icon: Scale, t: "شروط شفافة" }].map((c) => <span key={c.t} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-foreground bg-background px-3 py-1.5 text-xs font-black"><c.icon className="size-3.5 text-gold-deep" /> {c.t}</span>)}
            </div>
            <Button onClick={() => void shareLink()} className="mt-5 h-12 rounded-xl border-2 border-foreground px-6 font-black shadow-[4px_4px_0_0_var(--foreground)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--foreground)]"><Share2 /> شارك رابطك الآن <ArrowLeft /></Button>
          </div>
          <div className="relative hidden h-44 w-60 md:block" aria-hidden="true">
            <div className="absolute inset-0 rotate-6 rounded-2xl border-2 border-foreground bg-gold" />
            <div className="absolute inset-0 -rotate-3 rounded-2xl border-2 border-foreground bg-background p-4">
              <div className="flex items-center gap-2"><LogoMark size={36} /><div><p className="text-xs font-black">زياد</p><p className="text-[0.6rem] text-muted-foreground">فريقك الذكي</p></div></div>
              <div className="mt-4 space-y-2">{[90, 70, 82].map((w) => <div key={w} className="h-2 rounded-full bg-gold-soft" style={{ width: `${w}%` }} />)}</div>
              <div className="mt-4 flex items-center justify-between"><span className="text-[0.65rem] font-black text-gold-deep">+ {dashboard.rate.toLocaleString("ar")}٪</span><Coins className="size-5 text-gold" /></div>
            </div>
          </div>
        </div>
      </motion.section>}

      <section className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-sm font-black">رابط الإحالة الخاص بك</h3><Link to="/referral-terms" className="text-[0.7rem] font-bold text-muted-foreground underline-offset-4 hover:underline">الشروط ↗</Link></div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3" dir="ltr"><Link2 className="size-4 shrink-0 text-gold-deep" /><code className="min-w-0 flex-1 truncate py-3 text-xs font-bold sm:text-sm">{referralUrl}</code></div>
              <Button onClick={() => void copyLink()} className="h-12 rounded-xl bg-foreground px-4 font-black text-background hover:bg-foreground/90">{copied ? <Check /> : <Copy />} {copied ? "تم" : "نسخ"}</Button>
            </div>
            <p className="mt-2 text-[0.7rem] text-muted-foreground">رابطك يحمل رمزك <code dir="ltr" className="rounded bg-muted px-1 font-black text-foreground">{dashboard.code}</code> تلقائياً — أي شخص يسجّل منه يُنسب إليك.</p>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            <li className="flex items-center gap-3 px-4 py-3 text-sm"><Coins className="size-4 shrink-0 text-gold-deep" /> <span><b>{dashboard.rate.toLocaleString("ar")}٪</b> من كل دفعة لعميلك طوال اشتراكه</span></li>
            <li className="flex items-center gap-3 px-4 py-3 text-sm"><Crown className="size-4 shrink-0 text-gold-deep" /> <span>ارتقِ حتى <b>٥٠٪</b> مع ٢٥ عميلاً نشطاً</span></li>
            <li className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-muted/50 px-4 py-2 text-[0.7rem] text-muted-foreground"><span><b className="text-foreground">٥٠$</b> حد أدنى للسحب</span><span>•</span><span><b className="text-foreground">٣٠ يوماً</b> فترة مراجعة</span></li>
          </ul>
          <div className="flex gap-2"><Button variant="outline" className="h-11 flex-1 rounded-xl font-black" onClick={() => void shareLink()}><Share2 /> مشاركة</Button><Button asChild variant="outline" className="h-11 flex-1 rounded-xl font-black"><a href={`https://wa.me/?text=${encodeURIComponent(`جرّب زياد وفريقه الذكي (رابط إحالة): ${referralUrl}`)}`} target="_blank" rel="noreferrer"><Send /> واتساب</a></Button></div>
        </div>
        <div className="ref-stage min-h-72 border-t border-border lg:border-r lg:border-t-0">
          <PartnerCard rate={dashboard.rate} level={currentLevel.name} code={dashboard.code} />
          <div className="ref-shadow" aria-hidden="true" />
          <span className="absolute bottom-3 left-3 rounded-md border border-border bg-background/80 px-2 py-1 text-[0.6rem] font-black text-muted-foreground backdrop-blur">بطاقة شريك رسمية</span>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
          {hasActivity ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{stats.map((stat, i) => <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}><stat.icon className="size-4 text-gold-deep" /><p className="mt-3 font-display text-2xl font-black">{stat.value}</p><p className="text-xs font-bold text-muted-foreground">{stat.label}</p></motion.div>)}</div>
            : <div className="relative grid min-h-32 place-items-center text-center"><svg className="absolute inset-0 h-full w-full text-gold/30" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 80 C60 40 100 90 160 55 S260 70 300 40 S380 30 400 20" fill="none" stroke="currentColor" strokeWidth="2" /></svg><div className="relative"><MousePointerClick className="mx-auto size-5 text-gold-deep" /><p className="mt-2 text-sm font-black">لا يوجد نشاط بعد</p><p className="text-xs text-muted-foreground">بعد أول زيارة لرابطك ستظهر إحصاءاتك هنا</p></div></div>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><p className="flex items-center gap-1.5 text-xs font-black text-muted-foreground"><WalletCards className="size-4" /> الأرباح</p><button type="button" onClick={() => setTab("earnings")} className="rounded-md border border-border px-2 py-1 text-[0.65rem] font-black hover:bg-muted">التفاصيل</button></div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">قيد الانتظار</dt><dd className="font-black" dir="ltr">{money(dashboard.totals.pending)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">متاح للسحب</dt><dd className="font-black text-gold-deep" dir="ltr">{money(dashboard.totals.available)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">تم دفعه</dt><dd className="font-black" dir="ltr">{money(dashboard.totals.paid)}</dd></div>
          </dl>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {([["start", "البداية"], ["earnings", "الأرباح"], ["referrals", "الإحالات"], ["levels", "المستويات"], ["faq", "الأسئلة"]] as const).map(([v, l]) => <TabsTrigger key={v} value={v} className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-bold data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">{l}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="start" className="mt-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Link2, title: "شارك رابطك", text: "أرسله لأصحاب أعمال تثق أنهم سيستفيدون، وتابع كل زيارة وتسجيل.", action: <Button className="w-full rounded-xl bg-foreground font-black text-background hover:bg-foreground/90" onClick={() => void copyLink()}><Copy /> نسخ الرابط</Button> },
              { icon: Gift, title: "رشّح بصدق", text: "أفصح أنه رابط إحالة ولا تَعِد بنتائج مضمونة — الثقة تحوّل أكثر.", action: <Button asChild className="w-full rounded-xl bg-foreground font-black text-background hover:bg-foreground/90"><Link to="/referral-terms"><Scale /> قواعد الترويج</Link></Button> },
              { icon: WalletCards, title: "استلم أرباحك", text: "بعد ٣٠ يوماً تصبح العمولة متاحة، واسحبها لحسابك البنكي أو PayPal.", action: <Button variant="outline" className="w-full rounded-xl font-black" disabled={dashboard.totals.available < 5000 || dashboard.totals.reserved > 0} onClick={() => setWithdrawOpen(true)}>طلب سحب</Button> },
            ].map((c, i) => <motion.article key={c.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }} className="flex flex-col rounded-2xl border border-border bg-muted/40 p-5 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-border bg-background"><c.icon className="size-6 text-gold-deep" /></div>
              <h3 className="mt-4 font-display text-base font-black">{c.title}</h3>
              <p className="mt-2 flex-1 text-xs leading-6 text-muted-foreground">{c.text}</p>
              <div className="mt-4">{c.action}</div>
            </motion.article>)}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-5">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            <div className="bg-card p-5"><p className="text-xs font-black text-muted-foreground">عمولتك الآن</p><p className="mt-2 font-display text-4xl font-black text-primary">{dashboard.rate.toLocaleString("ar")}٪</p><p className="mt-1 text-xs text-muted-foreground">مستوى {currentLevel.name}</p></div>
            <div className="bg-card p-5"><p className="text-xs font-black text-muted-foreground">إجمالي ما كسبته</p><p className="mt-2 font-display text-4xl font-black">{money(dashboard.totals.earned)}</p><p className="mt-1 text-xs text-muted-foreground">من مدفوعات مؤكدة فقط</p></div>
            <div className="bg-gold-soft p-5"><p className="text-xs font-black text-gold-deep">الجاهز للسحب</p><p className="mt-2 font-display text-4xl font-black text-gold-deep">{money(dashboard.totals.available)}</p><Button size="sm" className="mt-3 font-black" disabled={dashboard.totals.available < 5000 || dashboard.totals.reserved > 0} onClick={() => setWithdrawOpen(true)}>طلب سحب <ArrowLeft /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-5">
          {dashboard.referrals.length ? <Table><TableHeader><TableRow><TableHead className="text-right">الإحالة</TableHead><TableHead className="text-right">الحالة</TableHead><TableHead className="text-right">تاريخ التسجيل</TableHead><TableHead className="text-right">أول دفعة</TableHead></TableRow></TableHeader><TableBody>{dashboard.referrals.slice(0, 20).map((referral) => { const status = referralStatuses[referral.status] ?? { label: "سجّل", className: "bg-secondary text-secondary-foreground" }; return <TableRow key={referral.id}><TableCell className="font-bold">{referral.label}</TableCell><TableCell><span className={`inline-flex rounded-full px-2 py-1 text-[0.68rem] font-black ${status.className}`}>{status.label}</span></TableCell><TableCell className="text-muted-foreground">{new Date(referral.attributedAt).toLocaleDateString("ar")}</TableCell><TableCell className="text-muted-foreground">{referral.firstPaidAt ? new Date(referral.firstPaidAt).toLocaleDateString("ar") : "—"}</TableCell></TableRow>; })}</TableBody></Table> : <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center"><div><Users className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-black">أول إحالة تبدأ من مشاركة واحدة</p><p className="mt-1 text-xs text-muted-foreground">لا نعرض بيانات شخصية لعملائك.</p></div></div>}
        </TabsContent>

        <TabsContent value="levels" className="mt-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-lg font-black">طريقك إلى ٥٠٪</h3><p className="mt-1 text-sm text-muted-foreground">المستوى يعتمد على عدد العملاء النشطين.</p></div>{nextLevel ? <span className="shrink-0 text-xs font-black text-primary">باقي {(nextLevel.count - dashboard.active).toLocaleString("ar")}</span> : <span className="shrink-0 text-xs font-black text-jade">أعلى مستوى</span>}</div>
            <Progress value={Math.max(0, Math.min(100, progress))} className="mt-6 h-2" />
            <div className="mt-5 grid grid-cols-4 gap-2">{levels.map((level) => { const reached = dashboard.active >= level.count; return <div key={level.rate} className="text-center"><span className={`mx-auto grid size-8 place-items-center rounded-full border text-xs font-black ${reached ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{reached ? <Check className="size-4" /> : level.count.toLocaleString("ar")}</span><p className="mt-2 text-sm font-black">{level.rate.toLocaleString("ar")}٪</p><p className="text-[0.65rem] text-muted-foreground">{level.name}</p></div>; })}</div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-5">
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
            {faqs.map((f) => <AccordionItem key={f.q} value={f.q}><AccordionTrigger className="text-right font-black">{f.q}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </TabsContent>
      </Tabs>
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