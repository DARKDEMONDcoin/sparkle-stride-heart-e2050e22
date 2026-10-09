import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Bot, CheckCircle2, ChevronDown, CircleHelp, CreditCard, LifeBuoy, Loader2, LockKeyhole, Mail, Search, Send, Settings2, Users } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { LuxStage } from "@/components/app/LuxStage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/lib/data";
import { submitSupportRequest } from "@/lib/support.functions";

export const Route = createFileRoute("/app/help")({
  head: () => ({ meta: [
    { title: "المساعدة والدعم | زياد" },
    { name: "description", content: "إجابات الأسئلة الشائعة والتواصل مع فريق دعم زياد." },
    { property: "og:title", content: "المساعدة والدعم | زياد" },
    { property: "og:description", content: "إجابات الأسئلة الشائعة والتواصل مع فريق دعم زياد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: HelpPage,
});

function HelpPage() {
  const send = useServerFn(submitSupportRequest);
  const { data: workspace } = useWorkspace();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const faqs = [
    { q: "كيف أبدأ محادثة جديدة مع موظف؟", a: "اختر الموظف من قائمة المحادثات واكتب النتيجة التي تريدها مباشرة. لكل موظف محادثة مستمرة تحفظ سياق عمله معك." },
    { q: "أي موظف أختار؟", a: "سِراج للتسويق، دانة للتصميم، نور للمحتوى والسيو، سالم للمبيعات، أمَل للتنظيم والبريد والمواعيد، وآدم للتقارير والتحليل. وإذا بدأ الطلب مع موظف آخر ينتقل التخصص داخلياً دون أن تفقد المحادثة." },
    { q: "لماذا يحتاج التنفيذ إلى موافقتي؟", a: "الأفعال الحساسة مثل النشر والإرسال والدفع تتوقف قبل التنفيذ حتى تراجعها. هذا هو الوضع الآمن الافتراضي." },
    { q: "أين أجد العناصر التي تنتظر موافقتي؟", a: "افتح «الموافقات» من التنقل الرئيسي. سترى الإجراء، الحساب المستهدف، وما الذي سيحدث قبل أن تعتمد أو ترفض." },
    { q: "كيف يعمل الفريق داخل مشروع مشترك؟", a: "اختر المشروع من مبدّل المساحات. يرى الأعضاء المصرح لهم محادثات الموظفين والمهام والموافقات داخل ذلك المشروع فقط." },
    { q: "كيف أدعو عضواً وأغيّر صلاحياته؟", a: "من مساحة العمل افتح إدارة الفريق، أرسل الدعوة إلى بريده، ثم اختر دوره. لا يحصل العضو إلا على صلاحيات المشروع الذي انضم إليه." },
    { q: "ما الفرق بين مساحة العمل الشخصية ومساحة المشروع؟", a: "الشخصية خاصة بك. مساحة المشروع تشارك محادثاتها ومهامها وموافقاتها مع أعضاء ذلك المشروع بحسب صلاحياتهم." },
    { q: "أين أربط حساباتي وأدواتي؟", a: "افتح التكاملات من التنقل الرئيسي، ثم اختر الخدمة واتبع خطوات الربط. يمكنك فصل أي خدمة في أي وقت." },
    { q: "لماذا توقف النشر أو انقطع تكامل؟", a: "قد تنتهي جلسة الخدمة أو تتغير صلاحياتها. افتح التكاملات وأعد الربط، ثم أعد محاولة العنصر الفاشل من التقويم أو قائمة النشر." },
    { q: "كيف أستخدم المتصفح المنفّذ؟", a: "اطلب المهمة من الموظف المناسب داخل محادثته. سيستخدم المتصفح عند الحاجة ويتوقف قبل أي إجراء حساس للموافقة." },
    { q: "ما الفرق بين تقويم المحتوى وتقويم المشاريع؟", a: "تقويم المحتوى يعرض المنشورات والتصاميم والمقالات والاجتماعات حسب الموظف. تقويم المشروع يعرض مواعيد مهام أعضاء المساحة فقط." },
    { q: "كيف أغيّر موعد منشور أو مقال؟", a: "على الكمبيوتر اسحب العنصر إلى اليوم الجديد. ويمكنك فتحه على أي شاشة لتعديل التاريخ والوقت؛ المنشور الذي نُشر بالفعل لا يمكن نقله." },
    { q: "كيف أغيّر التنبيهات والمنطقة الزمنية؟", a: "من الإعدادات افتح «التنبيهات»، اختر الأحداث المهمة ووتيرة الملخص والمنطقة الزمنية، ثم احفظ." },
    { q: "كيف أعدّل بيانات العلامة ونبرتها؟", a: "من الإعدادات حدّث نشاطك وموقعك ونبرة العلامة والكلمات الممنوعة. يقرأ الموظفون هذه البيانات قبل المهام المناسبة." },
    { q: "كيف أصدّر بيانات حسابي؟", a: "من الإعدادات ثم الحساب والأمان اختر تنزيل نسخة من بياناتي. لا تشارك الملف لأنه قد يحتوي معلومات خاصة بمساحتك." },
    { q: "كيف أحمي حسابي؟", a: "استخدم كلمة مرور مختلفة، راجع الحسابات المربوطة دورياً، وسجّل الخروج من كل الأجهزة إذا شككت في جلسة غير معروفة." },
    { q: "كيف تعمل الباقات والاستخدام؟", a: "يعرض قسم الاستخدام والباقات حالتك الحالية والمهام المكتملة. راجع صفحة الأسعار قبل الترقية؛ لن نعرض وسيلة دفع غير مرتبطة فعلياً." },
    { q: "متى تصبح عمولة الإحالة قابلة للسحب؟", a: "بعد تأكيد دفع العميل وانتهاء فترة المراجعة البالغة ٣٠ يوماً. الحد الأدنى لطلب السحب هو ٥٠ دولاراً." },
    { q: "كيف أتابع طلب الدعم؟", a: "بعد الإرسال يظهر رقم متابعة فريد. احتفظ به عند مراسلة الدعم؛ ويمكنك فتح طلب جديد إذا كانت المشكلة مختلفة." },
  ];
  const filtered = useMemo(() => faqs.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(search.trim().toLowerCase())), [search]);

  async function submit() {
    if (subject.trim().length < 3 || message.trim().length < 10) return;
    setSending(true); setError("");
    try {
      const result = await send({ data: { workspaceId: workspace?.id ?? null, subject, priority, message, pagePath: window.location.pathname } });
      setReference(result.reference);
    } catch { setError("تعذّر فتح الطلب الآن. تأكد من اتصالك ثم أعد المحاولة."); }
    finally { setSending(false); }
  }

  const paths = [
    { icon: Bot, title: "الموظفون والمحادثات", text: "الطلبات، الموافقات وسجل العمل", to: "/app/chat" },
    { icon: Users, title: "المشاريع والفريق", text: "الدعوات، الصلاحيات والعمل المشترك", to: "/app/workspace" },
    { icon: Settings2, title: "الربط والإعدادات", text: "الحسابات الخارجية وملف العلامة", to: "/app/settings" },
    { icon: CreditCard, title: "الفوترة والإحالة", text: "الباقات، العمولات وطلبات السحب", to: "/app/referral" },
  ];

  return <AppShell title="المساعدة والدعم" lead="إجابة سريعة، أو طلب يصل إلى إنسان">
    <div className="mx-auto max-w-6xl pb-14">
      <section className="relative isolate overflow-hidden rounded-2xl border border-gold/20 bg-ink px-5 py-10 text-center text-primary-foreground sm:px-10 sm:py-14">
        <LuxStage variant="rise" />
        <div className="relative z-10 mx-auto max-w-2xl"><span className="inline-flex items-center gap-2 text-sm font-black text-gold"><LifeBuoy className="size-4" /> مركز مساعدة زياد</span><h2 className="mt-3 font-display text-3xl font-black sm:text-5xl">ما الذي تريد <span className="lux-gold-text">حله اليوم؟</span></h2><p className="mt-3 text-sm leading-7 text-primary-foreground/65">ابحث عن إجابة مباشرة، أو افتح طلباً يصل إلى فريقنا مع تفاصيل مساحة عملك.</p><div className="relative mx-auto mt-7 max-w-xl"><Search className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-14 rounded-md border-primary-foreground/15 bg-card pr-12 text-foreground shadow-lift" placeholder="ابحث: دعوة عضو، نشر، عمولة، تكامل…" /></div></div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{paths.map((path) => <Link key={path.title} to={path.to} className="group rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-card"><path.icon className="size-5 text-primary" /><h3 className="mt-4 text-sm font-black">{path.title}</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">{path.text}</p></Link>)}</section>

      <section className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-black">إجابات سريعة</h2><p className="mt-1 text-sm text-muted-foreground">الأكثر سؤالاً داخل مساحة العمل.</p></div><BookOpen className="size-5 text-primary" /></div>
          {filtered.length ? <Accordion type="single" collapsible className="border-y border-border">{filtered.map((item, index) => <AccordionItem key={item.q} value={`faq-${index}`}><AccordionTrigger className="py-5 text-right font-black hover:no-underline">{item.q}</AccordionTrigger><AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">{item.a}</AccordionContent></AccordionItem>)}</Accordion> : <div className="grid min-h-40 place-items-center border-y border-border text-center"><div><CircleHelp className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-black">لم نجد إجابة مطابقة</p><p className="mt-1 text-xs text-muted-foreground">افتح طلب دعم واكتب ما تحتاجه بالتفصيل.</p></div></div>}
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold"><Link to="/faq" className="text-primary hover:underline">كل الأسئلة العامة</Link><Link to="/security" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><LockKeyhole className="size-3.5" /> الأمان والخصوصية</Link></div>
        </div>

        <aside className="rounded-lg border border-border bg-secondary/40 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Mail className="size-4" /></span><div><h2 className="font-display text-xl font-black">افتح طلب دعم</h2><p className="text-xs text-muted-foreground">يرتبط بمساحة عملك تلقائياً</p></div></div>
          {reference ? <div className="grid min-h-72 place-items-center text-center"><div><CheckCircle2 className="mx-auto size-11 text-jade-deep" /><h3 className="mt-4 text-lg font-black">تم فتح الطلب</h3><p className="mt-2 text-sm text-muted-foreground">رقم المتابعة</p><code className="mt-2 inline-block rounded-md bg-card px-4 py-2 font-black" dir="ltr">#{reference}</code><Button variant="outline" className="mt-5 w-full" onClick={() => { setReference(""); setSubject(""); setMessage(""); }}>طلب آخر</Button></div></div> : <div className="mt-6 space-y-4"><div><label htmlFor="support-subject" className="mb-1.5 block text-xs font-black">عنوان المشكلة</label><Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 bg-card" placeholder="مثال: تعذّر نشر المنشور" maxLength={140} /></div><div><label htmlFor="support-priority" className="mb-1.5 block text-xs font-black">مدى تأثيرها على عملك</label><div className="grid grid-cols-2 gap-2">{([['low','سؤال فقط'],['normal','أحتاج مساعدة'],['high','يعطّل جزءاً'],['urgent','العمل متوقف']] as const).map(([value,label]) => <Button key={value} type="button" variant={priority === value ? "default" : "outline"} className="h-10 px-2 text-xs" onClick={() => setPriority(value)}>{label}</Button>)}</div></div><div><label htmlFor="support-message" className="mb-1.5 block text-xs font-black">التفاصيل</label><Textarea id="support-message" value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-32 bg-card p-3 leading-7" placeholder="ماذا حاولت؟ ماذا ظهر لك؟ ومتى بدأت المشكلة؟" maxLength={5000} /></div>{error ? <p role="alert" className="text-xs font-bold text-destructive">{error}</p> : null}<Button className="h-11 w-full font-black" disabled={subject.trim().length < 3 || message.trim().length < 10 || sending} onClick={() => void submit()}>{sending ? <Loader2 className="animate-spin" /> : <Send />} إرسال إلى فريق الدعم</Button><p className="text-center text-[0.68rem] leading-5 text-muted-foreground">لا ترسل كلمات مرور، رموز دخول أو بيانات بطاقات.</p></div>}
        </aside>
      </section>
    </div>
  </AppShell>;
}