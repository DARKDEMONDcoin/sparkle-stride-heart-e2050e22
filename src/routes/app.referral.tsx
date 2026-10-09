import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "motion/react";
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

function PartnerCard({ rate, level }: { rate: number; level: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || event.pointerType === "touch" || reducedMotion) return;
    const r = el.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width;
    const y = (event.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - .5) * 12}deg`);
    el.style.setProperty("--rx", `${(.5 - y) * 10}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }
  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
  }
  return <div className="ziad-card-scene">
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="ziad-partner-card" role="img" aria-label={`بطاقة شريك زياد، مستوى ${level}، عمولة ${rate}٪`}>
      <div className="ziad-card-top"><div className="ziad-card-brand"><LogoMark size={52} /><div><strong>زياد</strong><span dir="ltr">ZIAD PARTNERS</span></div></div><Crown className="size-6" aria-hidden="true" /></div>
      <div className="ziad-card-middle"><div><span className="ziad-card-caption">عمولتك المتكررة</span><strong className="ziad-card-rate">{rate.toLocaleString("ar")}<small>٪</small></strong></div><div className="ref-chip" aria-hidden="true" /></div>
      <div className="ziad-card-bottom"><span>عضوية الشركاء <b>· {level}</b></span><span dir="ltr">ZIAD / {String(rate).padStart(2, "0")}</span></div>
    </div>
    <p className="ziad-card-note"><span /> شريك زياد · مستوى {level}</p>
  </div>;
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


  return <AppShell title="نادي شركاء زياد" lead="شراكة تنمو مع كل توصية">
    {query.isLoading ? <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : query.isError || !dashboard ? <div className="border-t border-border py-12"><h2 className="font-display text-xl font-black">تعذّر تحميل لوحة الإحالة</h2><Button className="mt-5" onClick={() => void query.refetch()}>حاول مرة أخرى</Button></div> : <div className="ziad-referral">
      <section className="ziad-referral-hero" aria-labelledby="partner-heading">
        <div className="ziad-referral-heading"><span className="ziad-partner-eyebrow"><Crown className="size-4" /> ZIAD PARTNERS</span><Link to="/referral-terms">شروط الشراكة <ArrowLeft className="size-3.5" /></Link></div>
        <div className="ziad-referral-hero-grid">
          <div className="ziad-referral-pitch">
            <p className="ziad-referral-kicker">توصية منك. فرصة أكبر لك.</p>
            <h2 id="partner-heading">نادي شركاء <span>زياد.</span></h2>
            <p className="ziad-referral-promise">شارك الفريق الذكي.<br />واكسب مع كل اشتراك.</p>
            <p className="ziad-referral-description">عمولة متكررة من مدفوعات عملائك المؤكدة، تبدأ من ٢٠٪ وتصل إلى ٥٠٪ مع ارتقائك.</p>
            <Button className="ziad-gold-button" onClick={() => void shareLink()}><Share2 /> شارك رابطك <ArrowLeft /></Button>
            <div className="ziad-referral-trust"><span><CheckCircle2 /> مدفوعات مؤكدة</span><span><Scale /> شروط واضحة</span></div>
          </div>
          <div className="ziad-referral-card-area"><PartnerCard rate={dashboard.rate} level={currentLevel.name} /></div>
        </div>
        <div className="ziad-referral-hero-footer"><span>طموحك يستحق شراكة.</span><span>حتى <strong>٥٠٪</strong> عمولة متكررة <TrendingUp className="size-4" /></span></div>
      </section>

      <section className="ziad-referral-link" aria-labelledby="referral-link-heading">
        <div className="ziad-referral-section-title"><div><p className="ziad-section-number" dir="ltr">01 / YOUR INVITATION</p><h3 id="referral-link-heading">رابطك. بداية كل فرصة.</h3></div><Link2 className="size-6 text-gold-deep" /></div>
        <div className="ziad-link-row"><div className="ziad-link-field" dir="ltr"><Link2 className="size-4 shrink-0" /><code>{referralUrl}</code></div><Button className="ziad-copy-button" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />} {copied ? "تم النسخ" : "نسخ الرابط"}</Button></div>
        <div className="ziad-link-footer"><p>كل تسجيل عبر رابطك يُنسب إليك تلقائياً.</p><div><Button variant="ghost" onClick={() => void shareLink()}><Share2 /> مشاركة</Button><Button asChild variant="ghost"><a href={`https://wa.me/?text=${encodeURIComponent(`جرّب زياد وفريقه الذكي (رابط إحالة: قد أحصل على عمولة إذا اشتركت): ${referralUrl}`)}`} target="_blank" rel="noreferrer"><Send /> واتساب</a></Button></div></div>
      </section>

      <section className="ziad-referral-overview" aria-label="أداء الإحالات والأرباح">
        <div className="ziad-referral-metrics">{stats.map((stat) => <div key={stat.label} className="ziad-referral-metric"><stat.icon className="size-4" /><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
        <div className="ziad-referral-balance"><div className="ziad-balance-heading"><span><WalletCards className="size-4" /> رصيد شراكتك</span><Button variant="ghost" size="sm" onClick={() => setTab("earnings")}>التفاصيل <ArrowLeft /></Button></div><strong className="ziad-balance-total" dir="ltr">{money(dashboard.totals.available)}</strong><p>متاح للسحب</p><dl><div><dt>قيد الانتظار</dt><dd dir="ltr">{money(dashboard.totals.pending)}</dd></div><div><dt>تم دفعه</dt><dd dir="ltr">{money(dashboard.totals.paid)}</dd></div></dl></div>
      </section>

      <section className="ziad-referral-next" aria-label="المستوى التالي"><div className="ziad-next-icon"><Crown /></div><div className="min-w-0 flex-1"><h3>{nextLevel ? `خطوتك التالية: مستوى ${nextLevel.name}` : "وصلت إلى مستوى النخبة"}</h3><p>{nextLevel ? `باقي ${(nextLevel.count - dashboard.active).toLocaleString("ar")} عملاء نشطين للوصول إلى عمولة ${nextLevel.rate.toLocaleString("ar")}٪` : "عمولتك الحالية ٥٠٪ من المدفوعات المؤكدة"}</p><Progress value={Math.max(0, Math.min(100, progress))} className="mt-3 h-1.5" /></div><Button variant="ghost" size="icon" aria-label="عرض مستويات الشراكة" onClick={() => setTab("levels")}><ArrowLeft /></Button></section>

      <Tabs value={tab} onValueChange={setTab} dir="rtl" className="ziad-referral-tabs">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {([["start", "البداية"], ["earnings", "الأرباح"], ["referrals", "الإحالات"], ["levels", "المستويات"], ["faq", "الأسئلة"]] as const).map(([v, l]) => <TabsTrigger key={v} value={v} className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-bold data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">{l}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="start" className="mt-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Link2, title: "شارك رابطك", text: "أرسله لأصحاب أعمال تثق أنهم سيستفيدون، وتابع كل زيارة وتسجيل.", action: <Button className="w-full rounded-lg bg-foreground font-black text-background hover:bg-foreground/90" onClick={() => void copyLink()}><Copy /> نسخ الرابط</Button> },
              { icon: Gift, title: "رشّح بصدق", text: "أفصح أنه رابط إحالة ولا تَعِد بنتائج مضمونة.", action: <Button asChild className="w-full rounded-lg bg-foreground font-black text-background hover:bg-foreground/90"><Link to="/referral-terms"><Scale /> قواعد الترويج</Link></Button> },
              { icon: WalletCards, title: "استلم أرباحك", text: "بعد ٣٠ يوماً تصبح العمولة متاحة، واسحبها لحسابك البنكي أو PayPal.", action: <Button variant="outline" className="w-full rounded-lg font-black" disabled={dashboard.totals.available < 5000 || dashboard.totals.reserved > 0} onClick={() => setWithdrawOpen(true)}>طلب سحب</Button> },
            ].map((c, i) => <motion.article key={c.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }} className="ziad-referral-step flex flex-col">
              <div className="ziad-step-icon"><c.icon className="size-6 text-gold-deep" /></div>
              <h3 className="mt-4 font-display text-base font-black">{c.title}</h3>
              <p className="mt-2 flex-1 text-xs leading-6 text-muted-foreground">{c.text}</p>
              <div className="mt-4">{c.action}</div>
            </motion.article>)}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-5">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            <div className="bg-card p-5"><p className="text-xs font-black text-muted-foreground">عمولتك الآن</p><p className="mt-2 font-display text-4xl font-black text-primary">{dashboard.rate.toLocaleString("ar")}٪</p><p className="mt-1 text-xs text-muted-foreground">مستوى {currentLevel.name}</p></div>
            <div className="bg-card p-5"><p className="text-xs font-black text-muted-foreground">إجمالي ما كسبته</p><p className="mt-2 font-display text-4xl font-black">{money(dashboard.totals.earned)}</p><p className="mt-1 text-xs text-muted-foreground">من مدفوعات مؤكدة فقط</p></div>
            <div className="bg-gold-soft p-5"><p className="text-xs font-black text-gold-deep">الجاهز للسحب</p><p className="mt-2 font-display text-4xl font-black text-gold-deep">{money(dashboard.totals.available)}</p><Button size="sm" className="mt-3 font-black" disabled={dashboard.totals.available < 5000 || dashboard.totals.reserved > 0} onClick={() => setWithdrawOpen(true)}>طلب سحب <ArrowLeft /></Button></div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-5">
          {dashboard.referrals.length ? <Table><TableHeader><TableRow><TableHead className="text-right">الإحالة</TableHead><TableHead className="text-right">الحالة</TableHead><TableHead className="text-right">تاريخ التسجيل</TableHead><TableHead className="text-right">أول دفعة</TableHead></TableRow></TableHeader><TableBody>{dashboard.referrals.slice(0, 20).map((referral) => { const status = referralStatuses[referral.status] ?? { label: "سجّل", className: "bg-secondary text-secondary-foreground" }; return <TableRow key={referral.id}><TableCell className="font-bold">{referral.label}</TableCell><TableCell><span className={`inline-flex rounded-full px-2 py-1 text-[0.68rem] font-black ${status.className}`}>{status.label}</span></TableCell><TableCell className="text-muted-foreground">{new Date(referral.attributedAt).toLocaleDateString("ar")}</TableCell><TableCell className="text-muted-foreground">{referral.firstPaidAt ? new Date(referral.firstPaidAt).toLocaleDateString("ar") : "—"}</TableCell></TableRow>; })}</TableBody></Table> : <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-muted/30 px-6 text-center"><div><Users className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-black">أول إحالة تبدأ من مشاركة واحدة</p><p className="mt-1 text-xs text-muted-foreground">لا نعرض بيانات شخصية لعملائك.</p></div></div>}
        </TabsContent>

        <TabsContent value="levels" className="mt-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-lg font-black">طريقك إلى ٥٠٪</h3><p className="mt-1 text-sm text-muted-foreground">المستوى يعتمد على عدد العملاء النشطين.</p></div>{nextLevel ? <span className="shrink-0 text-xs font-black text-primary">باقي {(nextLevel.count - dashboard.active).toLocaleString("ar")}</span> : <span className="shrink-0 text-xs font-black text-jade">أعلى مستوى</span>}</div>
            <Progress value={Math.max(0, Math.min(100, progress))} className="mt-6 h-2" />
            <div className="mt-5 grid grid-cols-4 gap-2">{levels.map((level) => { const reached = dashboard.active >= level.count; return <div key={level.rate} className="text-center"><span className={`mx-auto grid size-8 place-items-center rounded-full border text-xs font-black ${reached ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{reached ? <Check className="size-4" /> : level.count.toLocaleString("ar")}</span><p className="mt-2 text-sm font-black">{level.rate.toLocaleString("ar")}٪</p><p className="text-[0.65rem] text-muted-foreground">{level.name}</p></div>; })}</div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-5">
          <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-5">
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