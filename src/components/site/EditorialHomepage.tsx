import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Instagram,
  Loader2,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  SearchCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow,
} from "lucide-react";
import { faqs } from "@/components/site/Faq";
import { Portrait } from "@/components/site/Portrait";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LogoMark } from "@/components/site/LogoMark";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { plans, priceOf, currencyOf, yearlyDiscount } from "@/data/pricing";
import { useRegion } from "@/hooks/use-region";
import ecommerceSector from "@/assets/sectors/ecommerce.jpg";
import restaurantsSector from "@/assets/sectors/restaurants.jpg";
import clinicsSector from "@/assets/sectors/clinics.jpg";
import realestateSector from "@/assets/sectors/realestate.jpg";
const sonnyDesktopAsset = { url: "/chat-captures/sonny-desktop.webp" };
const sonnyMobileAsset = { url: "/chat-captures/sonny-mobile.webp" };
const evaDesktopAsset = { url: "/chat-captures/eva-desktop.webp" };
const evaMobileAsset = { url: "/chat-captures/eva-mobile.webp" };
const samDesktopAsset = { url: "/chat-captures/sam-desktop.webp" };
const samMobileAsset = { url: "/chat-captures/sam-mobile.webp" };
const nourDesktopAsset = { url: "/chat-captures/nour-desktop.webp" };
const nourMobileAsset = { url: "/chat-captures/nour-mobile.webp" };
const danaDesktopAsset = { url: "/chat-captures/dana-desktop.webp" };
const danaMobileAsset = { url: "/chat-captures/dana-mobile.webp" };
const adamDesktopAsset = { url: "/chat-captures/adam-desktop.webp" };
const adamMobileAsset = { url: "/chat-captures/adam-mobile.webp" };
import planFlowWide from "@/assets/product/plan-flow-wide.png";
import planFlowTall from "@/assets/product/plan-flow-tall.png";
import adsVisual from "@/assets/product/ads-visual.png";
import proofVisual from "@/assets/product/proof-visual.png";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import danaStory from "@/assets/sample/dana-cold-coffee-story.jpg";
import { SampleChatShot } from "@/components/site/SampleChatShot";

type DemoPhase = "idle" | "thinking" | "draft" | "approved";

/**
 * الموكاب واحد في الأصل — شاشة بداية المحادثة نفسها. نكرره في كل بطاقة
 * يخنق الصفحة، لذلك نُبقيه للبطاقتين العريضتين فقط (سِراج ونور).
 */
const capabilities = [
  {
    icon: MessageSquareText,
    kicker: "سِراج · السوشيال والإعلانات المموّلة",
    title: "من طلب واحد إلى حملة جاهزة للاعتماد.",
    body: "يبني خطة 30 يومًا، يكتب كل نسخة، ينسّق التصميم والنشر، ثم يعيد أفضل الأفكار إلى التقويم.",
    image: sonnyDesktopAsset.url,
    mobileImage: sonnyMobileAsset.url,
    frame: true,
    tone: "terracotta",
    span: "wide",
  },
  {
    icon: CalendarCheck2,
    kicker: "أمَل · المساعدة التنفيذية",
    title: "ساعتك القادمة واضحة قبل أن تبدأ.",
    body: "تفرز البريد، ترتب الاجتماعات، وتضع القرارات المعلّقة في ملخص صباحي واحد.",
    image: evaDesktopAsset.url,
    mobileImage: evaMobileAsset.url,
    frame: false,
    tone: "gold",
    span: "standard",
  },
  {
    icon: BarChart3,
    kicker: "سالم · المبيعات",
    title: "لكل فرصة رسالة وخطوة تالية.",
    body: "يبحث عن العميل المناسب، يخصص التواصل، ويسلمك الفرص الجاهزة للمكالمة.",
    image: samDesktopAsset.url,
    mobileImage: samMobileAsset.url,
    frame: false,
    tone: "teal",
    span: "standard",
  },
  {
    icon: SearchCheck,
    kicker: "نور · المحتوى والسيو",
    title: "إجابة عربية يجدها عميلك لحظة البحث.",
    body: "ترصد السؤال، تبني خطة موضوعات، وتكتب صفحات أصلية مرتبطة بما يطلبه السوق.",
    image: nourDesktopAsset.url,
    mobileImage: nourMobileAsset.url,
    frame: true,
    tone: "terracotta",
    span: "wide",
  },
  {
    icon: Sparkles,
    kicker: "دانة · التصميم",
    title: "فكرة واحدة، وكل المقاسات جاهزة.",
    body: "تحول المسودة إلى نظام بصري متسق، ثم تجهز نسخ كل منصة للمراجعة.",
    image: danaDesktopAsset.url,
    mobileImage: danaMobileAsset.url,
    frame: false,
    tone: "teal",
    span: "standard",
  },
  {
    icon: BrainCircuit,
    kicker: "آدم · تحليل البيانات",
    title: "تقرير ينتهي بقرار، لا برقم فقط.",
    body: "يجمع أداء القنوات، يرصد التغير، ويحدد أين تتحرك الميزانية والجهد بعد ذلك.",
    image: adamDesktopAsset.url,
    mobileImage: adamMobileAsset.url,
    frame: false,
    tone: "gold",
    span: "standard",
  },
] as const;

const sectors = [
  {
    id: "ecommerce",
    label: "المتاجر",
    title: "الحملة تبدأ بالمحتوى وتنتهي بقرار شراء.",
    body: "سِراج يطلق القصة، دانة تجهز المقاسات، سالم يتابع المهتمين، وآدم يوضح ما يستحق التكرار.",
    stat: "6 أدوار متصلة",
    image: ecommerceSector,
    task: "إطلاق مجموعة الخريف",
    result: "12 مادة للمراجعة",
    signal: "4 قنوات جاهزة",
    icon: "◫",
  },
  {
    id: "restaurants",
    label: "المطاعم",
    title: "عرض اليوم لا ينتظر اجتماع الأسبوع.",
    body: "أمَل ترتب الموعد، سِراج يجهز النشر، دانة تصمم العرض، والفريق يتابع الرسائل في مسار واحد.",
    stat: "من الطلب للنشر",
    image: restaurantsSector,
    task: "قائمة نهاية الأسبوع",
    result: "موعد النشر 6:30",
    signal: "3 مواد جاهزة",
    icon: "✦",
  },
  {
    id: "clinics",
    label: "العيادات",
    title: "معلومة دقيقة تمر بالمراجعة قبل جمهورك.",
    body: "نور تكتب المادة، دانة توضحها بصريًا، وأمَل توقف أي مادة حساسة حتى تصل موافقتك.",
    stat: "مراجعة بشرية",
    image: clinicsSector,
    task: "سلسلة التوعية الشهرية",
    result: "بانتظار موافقتك",
    signal: "6 موضوعات",
    icon: "+",
  },
  {
    id: "realestate",
    label: "العقار",
    title: "الإعلان والمتابعة والتقرير في سياق واحد.",
    body: "سِراج يقدم العقار، سالم يتابع المهتمين، وآدم يلخص القنوات التي جلبت فرصًا جادة.",
    stat: "فريق واحد",
    image: realestateSector,
    task: "إطلاق عقار جديد",
    result: "قائمة المتابعة جاهزة",
    signal: "5 مواعيد",
    icon: "⌂",
  },
] as const;

/** وعود تشغيلية يراها المستخدم داخل المنتج، وليست أرقامًا تسويقية مجردة. */
const stats = [
  { value: "ينفّذ", label: "داخل الأدوات التي تستخدمها", tone: "terracotta" },
  { value: "يتذكّر", label: "سياق مشروعك وقراراتك", tone: "gold" },
  { value: "يستأذن", label: "قبل النشر والإرسال والدفع", tone: "teal" },
  { value: "يتعاون", label: "ويسلّم كل نتيجة للدور التالي", tone: "fusion" },
];

/** إثباتات قابلة للتحقق داخل الحساب — لا ادعاءات عملاء. */
const proofs = [
  {
    kicker: "تحقق بنفسك",
    title: "القدرة تبدأ من طلبك، لا من قائمة أزرار",
    body: "اكتب المطلوب كما تكلّم موظفًا؛ يختار زياد المهارة والأداة المناسبة، ثم يعرض النتيجة والإجراء التالي داخل المحادثة نفسها.",
  },
  {
    kicker: "بيانات حقيقية",
    title: "أرقامك من مصادرها الرسمية",
    body: "تقارير Search Console وGA4 تُقرأ من حسابك مباشرة بعد الربط. لا نعرض رقمًا مُولّدًا مكان رقم حقيقي، والمصدر مكتوب أسفل كل تقرير.",
  },
  {
    kicker: "سجل كامل",
    title: "كل خطوة مكتوبة ومراجَعة",
    body: "كل مخرج يُحفظ كمهمة «بانتظار اعتمادك» في صفحة الموافقات، ولا يخرج إجراء إلى منصة قبل ضغطك على الاعتماد.",
  },
] as const;

/** منهج سِراج في الإعلانات الممولة — معايير سوق معلنة، لا نتائج عميل مزعومة. */
const adsProof = [
  { k: "نسبة نقر مستهدفة", v: "1%–2%", note: "معيار Meta لتصميم إعلاني جيد" },
  { k: "إيقاف التمرير 3 ثوانٍ", v: "25%–40%", note: "معيار فيديو قوي" },
  { k: "نقطة التعادل", v: "1 ÷ الهامش", note: "هامش 40% ⇒ 2.5× عائد الإنفاق الإعلاني (ROAS)" },
  { k: "سقف تكلفة العميل المحتمل", v: "القيمة × الإغلاق", note: "يُحسب من أرقامك أنت" },
] as const;

/** مخرجات حقيقية التُقطت من مساحات عمل فعلية داخل المنصة — منسوخة كما سُلِّمت. */
const sampleBoards = [
  {
    business: "قهوة رواق · مقهى مختص · جدة",
    prompt:
      "اكتب لي منشور إنستجرام قصير عن عرض قهوة مختصة في جدة: كل مشروب بارد بـ 19 ريال من 4 العصر لـ 7 المغرب طوال الأسبوع",
    cards: [
      {
        employeeId: "sonny",
        employee: "سِراج",
        role: "مدير السوشيال ميديا",
        quality: 82,
        image: null as string | null,
        publish: { connect: "إنستجرام" },
        body: "### المنشور\nلعشاق القهوة الباردة في جدة… من 4 إلى 7، أي مشروب بارد من قهوتنا المختصة بـ19 ريال.\n\nخلّ حرارة جدة برا، وبرّد يومك بخيارك المفضل يوميًا طوال الأسبوع.\n\nشاهد الخيارات في الصورة، ومرّ علينا قبل 7 واطلب مشروبك.\n\n### الهاشتاقات\n\\#قهوة\\_مختصة \\#قهوة\\_باردة \\#جدة\n\n### التوقيت والقياس\n- النشر: 3:30 عصرًا بتوقيت جدة؛ قبل بداية العرض بنصف ساعة.\n- القياس بعد 48 ساعة: نسبة المشاركات إلى الوصول.",
      },
      {
        employeeId: "dana",
        employee: "دانة",
        role: "مديرة التصميم",
        quality: 82,
        image: danaStory as string | null,
        publish: { connect: "إنستجرام" },
        body: "### الاتجاه البصري\n- كوب قهوة باردة مكثّف القطرات يحتل 40% من الإطار، بإضاءة مسائية دافئة وخلفية بنية هادئة.\n- السعر 19 ريال هو العنصر الأكبر، ثم الوقت، ثم الموقع والدعوة.\n\n### المواصفات\n- ستوري إنستجرام 1080×1920 بكسل؛ خالٍ من النص أول 250 بكسل وآخر 320 بكسل.\n- الألوان: بني داكن #2B1D17، كريمي #FFF4DF، كراميل #D6A15C بنسبة 60/30/10.\n- التباين المحسوب 14.9:1 — يحقق WCAG AA.",
      },
    ],
  },
  {
    business: "متجر لمار · متجر إلكتروني على سلة · الرياض",
    prompt:
      "اكتب لي فقرة افتتاحية لمقال في مدونة متجرنا عن كيف يختار العميل هدية عملية بأقل من 200 ريال",
    cards: [
      {
        employeeId: "nour",
        employee: "نور",
        role: "مديرة المحتوى والسيو",
        quality: 72,
        image: null as string | null,
        publish: null,
        body: "# كيف تختار هدية عملية بأقل من 200 ريال تترك أثرًا حقيقيًا؟\n\nاختيار هدية عملية بميزانية اقتصادية لا يعني أبدًا التنازل عن القيمة أو الذوق. ركّز على ثلاثة معايير: أن تخدم روتينًا يوميًا للمتلقي، وتأتي بجودة تصنيع مناسبة للاستعمال المتكرر، وتُقدَّم بأسلوب أنيق يرفع قيمتها البصرية.\n\n### حزمة السيو المرافقة\n- عنوان الميتا: كيف تختار هدية عملية بأقل من 200 ريال؟ دليل خطوة بخطوة\n- الرابط اللطيف: practical-gifts-under-200-sar\n- البيانات المنظمة: Article مدمجة مع FAQPage",
      },
    ],
  },
  {
    business: "عيادة صفا · عيادة أسنان · دبي",
    prompt: "اكتب لي رد واتساب على عميل يسأل عن سعر تنظيف الأسنان وموعد متاح هذا الأسبوع",
    cards: [
      {
        employeeId: "sam",
        employee: "سالم",
        role: "مدير المبيعات",
        quality: 82,
        image: null as string | null,
        publish: null,
        body: "الموضوع: استفسار موعد تنظيف الأسنان\n\nحياك الله، سعر تنظيف الأسنان يعتمد على نوع التنظيف المطلوب، ونوضح لك السعر المعتمد قبل تثبيت الحجز، وفي حال احتاجت اللثة تنظيفًا عميقًا يحدد الطبيب التكلفة بعد الفحص. بخصوص حجز موعد، يحتاج التوافر إلى مراجعة الجدول؛ لتحديد أقرب موعد متاح لك، هل تفضل الفترة الصباحية أم المسائية؟",
      },
    ],
  },
  {
    business: "مكتب دار الخليج · عقارات · الكويت",
    prompt: "ابي رسالة واتساب قصيرة لعميل سأل عن شقة 3 غرف في السالمية، الإيجار 650 دينار، والمعاينة متاحة الخميس 4 عصرًا",
    cards: [
      {
        employeeId: "sam",
        employee: "سالم",
        role: "مدير المبيعات",
        quality: 84,
        image: null as string | null,
        publish: null,
        body: "### رسالة المتابعة\nأهلًا بك، شكرًا لاهتمامك بشقة السالمية.\n\n- 3 غرف · الإيجار 650 دينارًا شهريًا\n- المعاينة متاحة الخميس 4 عصرًا\n\nهل يناسبك الموعد لنثبّته لك؟ وإن كان وقت آخر أنسب فأخبرني وأرتّبه.\n\n### الخطوة التالية\nتذكير تلقائي بالموعد قبل المعاينة بساعتين بعد موافقتك.",
      },
    ],
  },
] as const;

/** الفرق بين زياد ومحادثة ذكاء اصطناعي عامة. */
const versus = [
  {
    q: "الذاكرة",
    chat: "تشرح مشروعك من جديد كل مرة",
    sahl: "يعرف نشاطك ونبرتك وعروضك ويبني عليها",
  },
  { q: "التخصص", chat: "صوت واحد لكل المهام", sahl: "ستة تخصصات، كل واحد بأدواته ومعاييره" },
  { q: "التنفيذ", chat: "تنسخ النص وتنشره بنفسك", sahl: "ينشر ويجدول ويردّ عبر حساباتك بعد الربط" },
  {
    q: "الاعتماد",
    chat: "لا توجد مرحلة مراجعة",
    sahl: "كل إجراء يقف في صفحة الموافقات حتى تعتمده",
  },
  { q: "الأرقام", chat: "تقديرات عامة", sahl: "يقرأ Search Console وGA4 من حسابك مباشرة" },
  { q: "السجل", chat: "محادثة تضيع", sahl: "سجل مكتوب: من فعل ماذا ومتى" },
  {
    q: "الإعلانات الممولة",
    chat: "تنسخ النص وتدير الحملة بنفسك",
    sahl: "موظف متخصص يبني الإعلانات ويجهّزها للاعتماد، ويدير الحملة بعد الربط وبموافقتك",
  },
  {
    q: "المحتوى البصري",
    chat: "تكتب نصًا ثم تصمّم بنفسك",
    sahl: "يولّد الصور والفيديوهات القصيرة والريلز بتصاميم متسقة مع علامتك",
  },
  {
    q: "حل مشكلة المشروع",
    chat: "نصائح عامة لا تخص حالتك",
    sahl: "يشخّص أين يتعثر مشروعك ويقترح خطوات مبنية على بياناتك",
  },
] as const;


/** مقارنة نوعية بالبدائل الشائعة — بلا أرقام أو أسماء منافسين. */
const hireCompare = [
  { q: "وقت البدء", staff: "أسابيع من الإعلان والمقابلات", agency: "أيام من العروض والعقود", ziad: "دقائق بعد إدخال رابط موقعك" },
  { q: "ساعات العمل", staff: "دوام رسمي وإجازات", agency: "مواعيد الوكالة وجدولها", ziad: "متاح طوال اليوم، كل يوم" },
  { q: "نطاق التخصصات", staff: "تخصص أو اثنان لكل موظف", agency: "حسب الباقة المتعاقد عليها", ziad: "ستة تخصصات في فريق واحد" },
  { q: "التحكم والاعتماد", staff: "متابعة يومية منك", agency: "مراجعات دورية واجتماعات", ziad: "لا شيء يُنفَّذ قبل موافقتك" },
  { q: "التوسع", staff: "توظيف جديد لكل حمل إضافي", agency: "تكلفة إضافية لكل خدمة", ziad: "ترقية الخطة بنقرة" },
] as const;

/** ضمانات التشغيل — مفصّلة في صفحة الأمان. */
const guards = [
  {
    icon: LockKeyhole,
    t: "صلاحيات دنيا قابلة للسحب",
    d: "كل ربط يبدأ بأقل صلاحية ممكنة، وتسحبها من صفحة التكاملات في ثانية.",
  },
  {
    icon: CheckCircle2,
    t: "لا إجراء بدون اعتمادك",
    d: "النشر والردود والميزانيات كلها تقف عند صفحة الموافقات أولًا.",
  },
  {
    icon: ShieldCheck,
    t: "لا تدريب على بياناتك",
    d: "محتوى مشروعك لا يُستخدم لتدريب نماذج عامة، وتُحذف بياناتك عند الطلب.",
  },
  {
    icon: Code2,
    t: "سجل تدقيق لكل خطوة",
    d: "كل إجراء مسجَّل باسمه ووقته والحساب الذي نُفّذ عليه.",
  },
] as const;

const trustPoints = [
  "يفهم العربية ولهجاتها",
  "ذاكرة تعرف مشروعك",
  "ستة تخصصات تعمل معًا",
  "لا تنفيذ دون موافقتك",
  "أدواتك في مكان واحد",
  "سجل واضح لكل خطوة",
] as const;

const statHorizonPaths = Array.from({ length: 36 }, (_, index) => {
  const startY = 382 + index * 0.25;
  const firstY = 320 - index * 3.8;
  const secondY = 34 + index * 4.6;
  const endY = 362 + index * 1.7;
  return `M 1480 ${startY.toFixed(1)} C 1240 ${firstY.toFixed(1)}, 690 ${secondY.toFixed(1)}, -80 ${endY.toFixed(1)}`;
});

const statHorizonSignals = [4, 13, 22, 31];

const statHorizonNodes = [
  { cx: 1304, cy: 315, r: 2.2, delay: "-1s" },
  { cx: 1186, cy: 266, r: 1.5, delay: "-4.4s" },
  { cx: 1072, cy: 221, r: 2.8, delay: "-2.6s" },
  { cx: 936, cy: 178, r: 1.7, delay: "-6.1s" },
  { cx: 790, cy: 154, r: 2.1, delay: "-3.2s" },
  { cx: 651, cy: 149, r: 1.4, delay: "-7.3s" },
  { cx: 516, cy: 169, r: 2.5, delay: "-5.2s" },
  { cx: 382, cy: 211, r: 1.6, delay: "-.4s" },
  { cx: 236, cy: 272, r: 2.2, delay: "-6.8s" },
  { cx: 92, cy: 342, r: 1.5, delay: "-2s" },
];

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sahl-reveal ${className}`}>
      {children}
    </div>
  );
}

/** هبوط الأجهزة من الأعلى إلى مكانها عند ظهورها — بأسلوب Stripe. */
function useDeviceLanding<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const land = () => node.classList.add("is-landed");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.requestAnimationFrame(land);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function ProductFrame({
  src,
  mobileSrc,
  alt,
  hero = false,
}: {
  src: string;
  mobileSrc?: string;
  alt: string;
  hero?: boolean;
}) {
  const ref = useDeviceLanding<HTMLElement>();
  return (
    <figure
      ref={ref}
      className={`sahl-device-frame sahl-device-drop${hero ? " is-hero" : ""}${mobileSrc ? " is-responsive-device" : ""}`}
    >
      <div className="sahl-device-lid">
        <span className="sahl-device-camera" aria-hidden="true" />
        <span className="sahl-phone-button is-volume-up" aria-hidden="true" />
        <span className="sahl-phone-button is-volume-down" aria-hidden="true" />
        <span className="sahl-phone-button is-power" aria-hidden="true" />
        <div className="sahl-device-screen">
          <picture>
            {mobileSrc && <source media="(max-width: 720px)" srcSet={mobileSrc} />}
            <img
              src={src}
              alt={alt}
              width={2560}
              height={1640}
              loading="eager"
              fetchPriority={hero ? "high" : "auto"}
              decoding="async"
            />
          </picture>
        </div>
      </div>
      <div className="sahl-laptop-base" aria-hidden="true">
        <i />
      </div>
    </figure>
  );
}

function ToolConnections() {
  return (
    <div
      className="sahl-tool-connections"
      aria-label="إنستجرام وواتساب وجوجل وفيسبوك وشوبيفاي متصلة بزياد"
    >
      <svg className="sahl-tool-wires" viewBox="0 0 560 136" aria-hidden="true">
        <path id="sahl-tool-wire-1" d="M74 28 C164 28 194 68 280 68" />
        <path id="sahl-tool-wire-2" d="M74 68 C166 68 200 68 280 68" />
        <path id="sahl-tool-wire-3" d="M74 108 C164 108 194 68 280 68" />
        <path id="sahl-tool-wire-4" d="M486 42 C394 42 368 68 280 68" />
        <path id="sahl-tool-wire-5" d="M486 94 C394 94 368 68 280 68" />
        <g className="sahl-tool-pulses">
          <use href="#sahl-tool-wire-1" />
          <use href="#sahl-tool-wire-2" />
          <use href="#sahl-tool-wire-3" />
          <use href="#sahl-tool-wire-4" />
          <use href="#sahl-tool-wire-5" />
        </g>
      </svg>
      <div className="sahl-tool-icon is-instagram" title="إنستجرام">
        <Instagram />
        <span>إنستجرام</span>
      </div>
      <div className="sahl-tool-icon is-whatsapp" title="واتساب">
        <MessageCircle />
        <span>واتساب</span>
      </div>
      <div className="sahl-tool-icon is-google" title="جوجل">
        <b>G</b>
        <span>جوجل</span>
      </div>
      <div className="sahl-tool-icon is-facebook" title="فيسبوك">
        <b>f</b>
        <span>فيسبوك</span>
      </div>
      <div className="sahl-tool-icon is-shopify" title="شوبيفاي">
        <ShoppingBag />
        <span>شوبيفاي</span>
      </div>
      <div className="sahl-tool-core">
        <LogoMark size={34} />
        <span>زياد</span>
      </div>
    </div>
  );
}

function SirajDemo() {
  const [prompt, setPrompt] = useState("أطلق المنتج الجديد خلال أسبوعين ونسّق الفريق كله");
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const run = () => {
    if (!prompt.trim() || phase === "thinking") return;
    setPhase("thinking");
    timer.current = window.setTimeout(() => setPhase("draft"), 850);
  };
  return (
    <div className="sahl-demo" id="siraj-demo">
      <header>
        <span>
          <i /> غرفة عمل الفريق
        </span>
        <strong>سِراج ينسّق المهمة</strong>
        <small>6 موظفين جاهزون</small>
      </header>
      <div className="sahl-demo-grid">
        <aside>
          <Portrait memberId="sonny" name="سِراج" eager />
          <strong>سِراج</strong>
          <small>يقود الإطلاق</small>
          <nav>
            <b>المحادثة</b>
            <span>خطة الفريق</span>
            <span>الموافقات</span>
            <span>النتائج</span>
          </nav>
        </aside>
        <div className="sahl-chat">
          <div className="sahl-user-message">
            <small>طلبك</small>
            <p>{prompt}</p>
          </div>
          {phase === "thinking" && (
            <div className="sahl-thinking">
              <Loader2 className="animate-spin" /> سِراج يقسم الإطلاق ويوزع العمل على الفريق...
            </div>
          )}
          {(phase === "draft" || phase === "approved") && (
            <div className="sahl-agent-message">
              <span>
                <Portrait memberId="sonny" name="سِراج" />
                <b>سِراج</b>
              </span>
              <p>
                بنيت خطة 14 يومًا: 8 منشورات و6 قصص. دانة تجهز المقاسات، نور تكتب صفحة الإطلاق، أمَل
                ترتب الجدول، سالم يتابع المهتمين، وآدم يقيس القنوات.
              </p>
              <div>
                <span>14 مادة منظمة</span>
                <span>5 زملاء مرتبطون بالمهمة</span>
              </div>
            </div>
          )}
          {phase === "approved" && (
            <div className="sahl-success">
              <CheckCircle2 />
              <span>
                <b>اعتمدت خطة الفريق</b>
                <small>انتقلت المهام إلى مساحات الموظفين</small>
              </span>
            </div>
          )}
          <div className="sahl-composer">
            <label htmlFor="sahl-prompt">اكتب النتيجة التي تريدها</label>
            <textarea
              id="sahl-prompt"
              rows={2}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setPhase("idle");
              }}
            />
            <Button
              type="button"
              size="icon"
              onClick={run}
              disabled={!prompt.trim() || phase === "thinking"}
              aria-label="إرسال الطلب للفريق"
            >
              {phase === "thinking" ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          {(phase === "draft" || phase === "approved") && (
            <div className="sahl-demo-actions">
              <Button variant="outline" onClick={() => setPhase("idle")}>
                عدّل الخطة
              </Button>
              <Button onClick={() => setPhase("approved")} disabled={phase === "approved"}>
                <Check />
                {phase === "approved" ? "تم الاعتماد" : "اعتمد ووزّع"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EditorialHomepage() {
  const [sector, setSector] = useState(0);
  const [sample, setSample] = useState(0);
  const [sampleExpanded, setSampleExpanded] = useState(false);
  const [pricingYearly, setPricingYearly] = useState(true);
  const { country } = useRegion();
  const pricingCurrency = currencyOf(country);
  const currentSector = sectors[sector] ?? sectors[0];
  const currentSample = sampleBoards[sample] ?? sampleBoards[0];
  /** إيقاف حركات المشاهد خارج الشاشة حتى يبقى التمرير سلسًا تمامًا. */
  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>(".sahl-scene"));
    if (!scenes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          entry.target.classList.toggle("is-onscreen", entry.isIntersecting);
      },
      { rootMargin: "20% 0px" },
    );
    for (const scene of scenes) observer.observe(scene);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="sahl-white-home" dir="rtl">
      <section className="sahl-hero" aria-labelledby="home-title">
        <div className="sahl-shell sahl-hero-layout">
          <Reveal className="sahl-hero-copy">
            <div
              className="sahl-live-metric"
              aria-label="فريق ينفذ داخل أدواتك، يتذكر سياقك، ويطلب موافقتك قبل الإجراءات الحساسة"
            >
              <span>
                <b>ينفّذ</b> داخل أدواتك
              </span>
              <i aria-hidden="true">•</i>
              <span>
                <b>يتذكّر</b> سياق عملك
              </span>
              <i aria-hidden="true">•</i>
              <span>
                <b>يستأذنك</b> قبل أي إجراء
              </span>
            </div>
            <h1 id="home-title">
              ما يستغرق شهرًا من العمل،
              <br />
              ينتهي <em>قبل أن تُكمل قهوتك.</em>
            </h1>
            <p className="sahl-lead">يكتبون ويصمّمون ويبيعون نيابةً عنك، وأنت تتابع نمو النتائج.</p>
            <div className="sahl-actions">
              <Button asChild size="lg">
                <Link to="/welcome">
                  كوّن فريقك مجانًا <ArrowLeft />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">
                  الخطط والأسعار <ArrowLeft />
                </Link>
              </Button>
            </div>
            <small>
              <CheckCircle2 /> تجربة مجانية 14 يومًا · بدون بطاقة بنكية
            </small>
          </Reveal>
          <div className="sahl-hero-product">
            <span className="sahl-hero-wash" aria-hidden="true" />
            <ProductFrame
              src={sonnyDesktopAsset.url}
              mobileSrc={sonnyMobileAsset.url}


              alt="مساحة عمل زياد: محادثة سِراج داخل المنصة"
              hero
            />
            <div className="sahl-float-note liquid-glass-sahl" role="status">
              <span className="sahl-float-note-icon is-verified">
                <VerifiedBadge title="مخرجات موثّقة بانتظار اعتمادك" />
              </span>
              <div>
                <b>بانتظار اعتمادك</b>
              </div>
              <i className="sahl-float-note-dot" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="sahl-trust" aria-label="مزايا تشغيل فريق زياد">
        <div className="sahl-shell">
          <strong className="sahl-arabic-first">مصمم للعمل بالعربية، من أول طلب حتى آخر قرار</strong>
          <div className="sahl-trust-row">
            {trustPoints.map((point, index) => (
              <span key={point}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <b>{point}</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="sahl-section sahl-sample sahl-dark sahl-scene">
        <div className="sahl-dark-veil" aria-hidden="true" />
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <div>
                <span>نتائج حقيقية، دون تجميل</span>
                <h2>
                  اطلبها بكلماتك،
                  <br />
                  <em>واستلمها جاهزة لقرارك.</em>
                </h2>
              </div>
            </header>
          </Reveal>
          <Reveal className="sahl-sample-showcase">
            <div className="sahl-sample-tabs" role="tablist" aria-label="اختر نوع النشاط">
              {sampleBoards.map((board, index) => (
                <Button
                  key={board.business}
                  type="button"
                  variant="ghost"
                  role="tab"
                  aria-selected={sample === index}
                  className={sample === index ? "is-active" : undefined}
                  onClick={() => {
                    setSample(index);
                    setSampleExpanded(false);
                  }}
                >
                  <span aria-hidden="true">{["☕", "◫", "+", "⌂"][index]}</span>
                  {["مطعم ومقهى", "متجر إلكتروني", "عيادة", "عقارات"][index]}
                </Button>
              ))}
            </div>
            <div
              className={`sahl-sample-viewport${sampleExpanded ? " is-expanded" : ""}`}
              role="tabpanel"
            >
              <SampleChatShot
                business={currentSample.business}
                prompt={currentSample.prompt}
                cards={currentSample.cards}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="sahl-sample-expand"
              aria-expanded={sampleExpanded}
              onClick={() => setSampleExpanded((value) => !value)}
            >
              {sampleExpanded ? "عرض مختصر" : "عرض المحادثة كاملة"}
              <ChevronDown aria-hidden="true" />
            </Button>
          </Reveal>
          <Reveal>
            <p className="sahl-sample-note">
              <CheckCircle2 aria-hidden="true" /> مثال توضيحي · الأرقام والعروض في الأمثلة من طلب المستخدم نفسه؛
              الفريق لا يخترع سعرًا ولا وعدًا من عنده.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-capabilities">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>ستة تخصصات بسياق واحد</span>
              <h2>
                كل موظف ينجز دوره،
                <br />
                <em>وكل نتيجة تُسلَّم إلى الدور التالي.</em>
              </h2>
              <p>
                سِراج يبدأ الحملة، دانة تجهز صورتها، نور توسع قصتها، سالم يحول الاهتمام إلى فرصة،
                أمَل ترتب الوقت، وآدم يقرأ ما حدث.
              </p>
            </header>
          </Reveal>
          <div className="sahl-cap-grid">
            {capabilities.map((item) => (
              <Reveal key={item.kicker} className={`sahl-cap-card is-${item.span} is-${item.tone}`}>
                <div>
                  <item.icon />
                  <span>{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.kicker.startsWith("سِراج") && (
                    <aside className="sahl-coming-ads">
                      <Megaphone aria-hidden="true" />
                      <div>
                        <span>تخصص إضافي</span>
                        <strong>سِراج يبني حملاتك المموّلة</strong>
                        <p>
                          يحسب هامشك وسقف تكلفة التحويل، يضع هيكل الحساب ومصفوفة خمس زوايا كرييتف
                          وخطة القياس. الإطلاق المباشر على المنصات يتم بعد ربطها وبموافقتك.
                        </p>
                      </div>
                    </aside>
                  )}
                  <Link to="/features">
                    استعرض مهامه <ArrowLeft />
                  </Link>
                </div>
                {item.frame ? (
                  <ProductFrame
                    src={item.image}
                    mobileSrc={item.mobileImage}
                    alt={`واجهة ${item.kicker} داخل زياد`}
                  />
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sahl-stats sahl-scene">
        <div className="sahl-stats-wave" aria-hidden="true">
          <svg viewBox="0 0 1400 520" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sahlStatsWave" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--home-terracotta)" />
                <stop offset="48%" stopColor="var(--home-gold)" />
                <stop offset="100%" stopColor="var(--home-teal)" />
              </linearGradient>
            </defs>
            <g className="sahl-stats-wave-lines">
              <path d="M-80 388 C 190 310 338 435 572 342 S 918 126 1510 184" />
              <path d="M-80 424 C 204 342 358 466 590 374 S 940 158 1510 216" />
              <path d="M-80 460 C 220 380 378 498 616 410 S 968 192 1510 250" />
              <path d="M-80 352 C 176 278 322 398 548 308 S 886 96 1510 150" />
            </g>
            <path
              className="sahl-stats-wave-light"
              d="M-80 388 C 190 310 338 435 572 342 S 918 126 1510 184"
            />
          </svg>
        </div>
        <div className="sahl-shell">
          <Reveal>
            <header>
              <span>طريقة عمل مختلفة</span>
              <h2>
                <strong>فريق لا يكتفي بالإجابة.</strong>
                <em> يتابع العمل حتى قرارك.</em>
              </h2>
            </header>
          </Reveal>
          <div className="sahl-stat-grid">
            {stats.map((item, index) => (
              <Reveal key={item.label} className={`sahl-stat is-${item.tone}`}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sahl-section sahl-demo-section">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head is-split">
              <div>
                <span>جرّب تسليم المهمة</span>
                <h2>
                  قل ما تريد مرة.
                  <br />
                  <em>واستلم خطة الفريق.</em>
                </h2>
              </div>
              <p>
                طلب واحد من عندك، يتحول إلى ست مهام موزعة على سِراج ودانة ونور وأمَل وسالم وآدم.
              </p>
            </header>
          </Reveal>
          <Reveal>
            <figure className="sahl-plan-flow">
              <picture>
                <source media="(max-width: 720px)" srcSet={planFlowTall} />
                <img
                  src={planFlowWide}
                  alt="طلب واحد يتفرع إلى ست مهام ملونة يتسلمها موظفو زياد"
                  loading="lazy"
                  width={1536}
                  height={864}
                />
              </picture>
              <figcaption>من طلب واحد إلى خطة موزعة على الفريق</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-versus sahl-dark sahl-scene">
        <div className="sahl-dark-veil" aria-hidden="true" />
        <div className="sahl-versus-beam" aria-hidden="true" />
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>السؤال الأول دائمًا</span>
              <h2>
                ولماذا لا أستخدم محادثة ذكاء اصطناعي عادية؟
                <br />
                <em>لأن المحادثة تكتب، وزياد يشتغل.</em>
              </h2>
            </header>
          </Reveal>
          <Reveal className="sahl-versus-table">
            <div className="sahl-versus-head">
              <span>الفرق</span>
              <span>محادثة عامة</span>
              <span>
                <LogoMark size={18} /> زياد
              </span>
            </div>
            {versus.map((row) => (
              <div key={row.q} className="sahl-versus-row">
                <span>{row.q}</span>
                <span className="is-plain">{row.chat}</span>
                <span className="is-sahl">
                  <Check aria-hidden="true" />
                  {row.sahl}
                </span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-hire" aria-labelledby="home-hire-title">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>مقارنة البدائل</span>
              <h2 id="home-hire-title">
                موظف جديد، أو وكالة، أو فريق زياد؟
              </h2>
            </header>
          </Reveal>
          <Reveal className="sahl-hire-grid">
            {(
              [
                ["staff", "توظيف موظف"],
                ["agency", "التعاقد مع وكالة"],
                ["ziad", "فريق زياد"],
              ] as const
            ).map(([key, title]) => (
              <article key={key} className={`sahl-hire-card${key === "ziad" ? " is-ziad" : ""}`}>
                <h3>
                  {key === "ziad" && <LogoMark size={20} />}
                  {title}
                </h3>
                <dl>
                  {hireCompare.map((row) => (
                    <div key={row.q}>
                      <dt>{row.q}</dt>
                      <dd>
                        {key === "ziad" && <Check aria-hidden="true" />}
                        {row[key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-sectors">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>فريق يتعلم طبيعة نشاطك</span>
              <h2>
                الأدوار نفسها.
                <br />
                <em>والسياق يتغير مع مشروعك.</em>
              </h2>
              <p>اختر نشاطًا لترى كيف تتغير المهمة، ترتيب الموظفين، ونقطة موافقتك.</p>
            </header>
          </Reveal>
          <div className="sahl-sector-tabs" role="tablist" aria-label="اختر نوع النشاط">
            {sectors.map((item, index) => (
              <Button
                key={item.id}
                variant="ghost"
                role="tab"
                aria-selected={sector === index}
                aria-controls="sahl-sector-content"
                className={sector === index ? "is-active" : ""}
                onClick={() => setSector(index)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Reveal className="sahl-sector-panel">
            <div>
              <span>{currentSector.label}</span>
              <h3>{currentSector.title}</h3>
              <p>{currentSector.body}</p>
              <strong>{currentSector.stat}</strong>
              <Link to="/use-cases/$id" params={{ id: currentSector.id }}>
                استكشف هذا المسار <ArrowLeft />
              </Link>
            </div>
            <figure id="sahl-sector-content" role="tabpanel" key={currentSector.id}>
              <img
                src={currentSector.image}
                alt={`مشهد يوضح عمل فريق زياد في قطاع ${currentSector.label}`}
                loading="lazy"
                width={1280}
                height={900}
              />
              <div className="sahl-sector-brand">
                <i>{currentSector.icon}</i>
                <span>
                  <small>غرفة عمل الفريق</small>
                  <b>{currentSector.label}</b>
                </span>
                <em>المثال يعمل</em>
              </div>
              <div className="sahl-sector-task">
                <small>المهمة الجارية</small>
                <b>{currentSector.task}</b>
                <span>
                  <i /> {currentSector.result}
                </span>
              </div>
              <div className="sahl-sector-signal">
                <small>مؤشر المتابعة</small>
                <strong>{currentSector.signal}</strong>
                <span>مثال توضيحي</span>
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-infrastructure sahl-scene">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head is-split">
              <div>
                <span>حساباتك وقواعدك</span>
                <h2>
                  الفريق يصل لأدواتك.
                  <br />
                  <em>والقرار يبقى عندك.</em>
                </h2>
              </div>
              <p>
                سِراج ينشر، سالم يتابع، نور تقرأ البحث، وآدم يجمع الأداء. لا يخرج إجراء حساس قبل
                قاعدة الاعتماد التي تحددها.
              </p>
            </header>
          </Reveal>
          <Reveal className="sahl-system-board">
            <ToolConnections />
            <div className="sahl-system-points">
              <span>
                <Workflow />
                <b>سياق ينتقل بين الستة</b>
              </span>
              <span>
                <LockKeyhole />
                <b>موافقة قبل التنفيذ</b>
              </span>
              <span>
                <Code2 />
                <b>سجل واضح لكل خطوة</b>
              </span>
            </div>
            <div className="sahl-system-horizon" aria-hidden="true">
              <svg viewBox="0 0 1440 440" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sahlSystemHorizonLine" x1="100%" y1="72%" x2="0%" y2="28%">
                    <stop offset="0%" stopColor="var(--home-terracotta)" />
                    <stop offset="42%" stopColor="var(--home-gold)" stopOpacity=".46" />
                    <stop offset="100%" stopColor="var(--home-teal)" />
                  </linearGradient>
                  <linearGradient id="sahlSystemHorizonSignal" x1="100%" y1="70%" x2="0%" y2="30%">
                    <stop offset="0%" stopColor="var(--home-gold)" stopOpacity="0" />
                    <stop offset="45%" stopColor="var(--home-gold)" />
                    <stop offset="100%" stopColor="var(--home-bg)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="sahl-horizon-lines">
                  {statHorizonPaths.map((path, index) => (
                    <path
                      key={path}
                      d={path}
                      style={{ "--line-opacity": 0.52 - index * 0.009 } as CSSProperties}
                    />
                  ))}
                </g>
                <g className="sahl-horizon-signals">
                  {statHorizonSignals.map((pathIndex, index) => (
                    <path
                      key={pathIndex}
                      d={statHorizonPaths[pathIndex]}
                      style={{ "--signal-delay": `${index * -3.7}s` } as CSSProperties}
                    />
                  ))}
                </g>
                <g className="sahl-horizon-nodes">
                  {statHorizonNodes.map((node) => (
                    <circle
                      key={`${node.cx}-${node.cy}`}
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r}
                      style={{ "--node-delay": node.delay } as CSSProperties}
                    />
                  ))}
                </g>
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-proof sahl-dark sahl-scene">
        <div className="sahl-dark-veil" aria-hidden="true" />
        <div className="sahl-proof-ledger" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>إثبات بدل الوعد</span>
              <h2>
                لا نعرض شهادات مجهولة.
                <br />
                <em>نعرض ما يمكنك التحقق منه.</em>
              </h2>
              <p>
                كل رقم في هذه الصفحة إما موجود داخل المنصة، أو معيار سوق معلن مصدره. ولا نضع اسم
                عميل لم يوافق على ذكره.
              </p>
            </header>
          </Reveal>
          <Reveal className="sahl-proof-visual">
            <figure>
              <img
                src={proofVisual}
                alt="طبقات من السجلات والموافقات المتسلسلة داخل زياد"
                loading="lazy"
                width={1280}
                height={960}
              />
              <span className="sahl-visual-sweep" aria-hidden="true" />
              <span className="sahl-visual-ring" aria-hidden="true" />
            </figure>
            <figcaption>
              كل مخرج له بطاقة، ولكل بطاقة أثر مكتوب: من طلبها، ومن اعتمدها، ومتى.
            </figcaption>
          </Reveal>
          <div className="sahl-proof-grid">
            {proofs.map((item) => (
              <Reveal key={item.title}>
                <article>
                  <span>{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sahl-section sahl-ads sahl-scene">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head is-split">
              <div>
                <span>سِراج · الإعلانات المموّلة</span>
                <h2>
                  حملة تُبنى من أرقام مشروعك.
                  <br />
                  <em>لا من تخمين.</em>
                </h2>
              </div>
              <p>
                سِراج يحسب هامشك وقيمة عميلك أولًا، ثم يبني هيكل الحساب ومصفوفة التصاميم والنصوص الإعلانية وخطة القياس
                ليوم واحد حتى اليوم الرابع عشر — ولا تُعتمد ميزانية ولا تُطلق حملة قبل موافقتك.
              </p>
            </header>
          </Reveal>
          <Reveal className="sahl-ads-visual">
            <figure>
              <img
                src={adsVisual}
                alt="قمع إعلاني ومنحنى أداء ودوائر استهداف بألوان زياد"
                loading="lazy"
                width={1280}
                height={960}
              />
              <span className="sahl-visual-orbit" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sahl-visual-sweep" aria-hidden="true" />
            </figure>
            <div>
              <span>منهج سِراج</span>
              <h3>من الوحدات الاقتصادية إلى التصاميم الإعلانية إلى القياس.</h3>
              <p>
                قبل أي ريال إنفاق: نعرف هامشك، وقيمة عميلك، والسقف الذي لا تتجاوزه تكلفة التحويل. ثم
                يُبنى الحساب والتصاميم الإعلانية والقياس على هذه الأرقام وحدها.
              </p>
            </div>
          </Reveal>
          <Reveal className="sahl-ads-board">
            <div className="sahl-ads-metrics">
              {adsProof.map((item) => (
                <span key={item.k}>
                  <small>{item.k}</small>
                  <strong>{item.v}</strong>
                  <em>{item.note}</em>
                </span>
              ))}
            </div>
            <ol className="sahl-ads-steps">
              <li>
                <b>الوحدات الاقتصادية</b>
                <span>هامشك وقيمة عميلك يحددان سقف تكلفة التحويل قبل أي إنفاق.</span>
              </li>
              <li>
                <b>هيكل الحساب</b>
                <span>حملة تحويل واحدة، مجموعات محدودة، وتوزيع 70/20/10 على القمع.</span>
              </li>
              <li>
                <b>خمس زوايا كرييتف</b>
                <span>
                  ألم، نتيجة، اعتراض، دليل، مقارنة — بنصوص بلهجة جمهورك وبريف تصميم لدانة.
                </span>
              </li>
              <li>
                <b>القياس والتشخيص</b>
                <span>بيكسل وأحداث وUTM، ثم شجرة تشخيص تحدد أين يضيع الإنفاق بالضبط.</span>
              </li>
            </ol>
            <p className="sahl-ads-note">
              <LockKeyhole aria-hidden="true" /> الأرقام أعلاه نطاقات معيارية للسوق تُستخدم
              للمقارنة، وليست نتائج حساب بعينه. الإطلاق المباشر على منصات الإعلانات يتم عبر الربط
              الرسمي وبعد اعتمادك.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sahl-section sahl-guard sahl-dark sahl-scene">
        <div className="sahl-dark-veil" aria-hidden="true" />
        <div className="sahl-guard-radar" aria-hidden="true">
          <b />
          <i />
          <i />
          <i />
        </div>
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head is-split">
              <div>
                <span>قبل أن تربط حساباتك</span>
                <h2>
                  نعمل داخل أدواتك.
                  <br />
                  <em>فهذه قواعدنا الأربع.</em>
                </h2>
              </div>
              <p>
                لا نطلب ثقتك دون شرح ما نفعله ببياناتك وصلاحياتك — والتفاصيل كاملة في{" "}
                <Link to="/security">صفحة الأمان</Link>.
              </p>
            </header>
          </Reveal>
          <div className="sahl-guard-grid">
            {guards.map((item) => (
              <Reveal key={item.t}>
                <article>
                  <item.icon aria-hidden="true" />
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sahl-section sahl-pricing" aria-labelledby="home-pricing-title">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>عدد الموظفين يتبع حجم العمل</span>
              <h2 id="home-pricing-title">
                ابدأ بدور واحد.
                <br />
                <em>وأضف الفريق حين تحتاجه.</em>
              </h2>
              <p>
                لا تدفع مقابل مقاعد لا تعمل. اختر البداية، أو فعّل تعاون الموظفين الستة في خطة
                النمو. الاشتراك شهري ويُلغى في أي وقت — <Link to="/refunds">سياسة الاسترداد</Link>.
              </p>
            </header>
          </Reveal>
          <Reveal>
            <div className="sahl-home-billing" role="radiogroup" aria-label="دورة الفوترة">
              <Button
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={!pricingYearly}
                className={!pricingYearly ? "is-active" : undefined}
                onClick={() => setPricingYearly(false)}
              >
                شهري
              </Button>
              <Button
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={pricingYearly}
                className={pricingYearly ? "is-active" : undefined}
                onClick={() => setPricingYearly(true)}
              >
                سنوي <small>وفّر {yearlyDiscount * 100}%</small>
              </Button>
            </div>
          </Reveal>
          <div className="sahl-plan-grid">
            {plans.map((plan, planIndex) => {
              const displayPrice = priceOf(plan, pricingYearly, country);
              const numericPrice = Number(displayPrice.replace(/,/g, ""));
              return (
              <Reveal key={plan.id} className="sahl-plan-reveal">
                <article
                  className={`liquid-glass-sahl sahl-home-plan ${plan.highlight ? "is-featured" : ""}`}
                  style={{ "--plan-order": planIndex } as CSSProperties}
                >
                  {plan.highlight && <span className="sahl-plan-tag">الأكثر اختيارًا</span>}
                  <header className="sahl-home-plan-head">
                    <h3>{plan.name}</h3>
                    <p>{plan.desc}</p>
                  </header>
                  <div className="sahl-price">
                    {Number.isFinite(numericPrice) ? (
                      <>
                        <strong><AnimatedNumber value={numericPrice} duration={450} /></strong>
                        <span>{pricingCurrency.label} / شهريًا</span>
                      </>
                    ) : (
                      <strong className="is-custom">حسب الطلب</strong>
                    )}
                  </div>
                  <div className="sahl-plan-divider" aria-hidden="true" />
                  <ul>
                    {plan.perks.map((perk, perkIndex) => (
                      <li
                        key={perk}
                        style={{ "--perk-order": perkIndex } as CSSProperties}
                      >
                        <span className="sahl-home-perk-icon" data-tone={perkIndex % 3}>
                          <Check aria-hidden="true" />
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="sahl-home-plan-cta">
                    {plan.id !== "scale" ? (
                      <Link to="/welcome" search={{ plan: plan.id }}>
                        {plan.cta}
                        <ArrowLeft />
                      </Link>
                    ) : (
                      <Link to="/contact">
                        {plan.cta}
                        <ArrowLeft />
                      </Link>
                    )}
                  </Button>
                </article>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sahl-section sahl-faq">
        <div className="sahl-shell">
          <Reveal>
            <header className="sahl-section-head">
              <span>قرارات واضحة قبل التشغيل</span>
              <h2>
                ما الذي يفعله الفريق؟
                <br />
                وما الذي يبقى بيدك؟
              </h2>
            </header>
          </Reveal>
          <Accordion type="single" collapsible>
            {faqs.slice(0, 6).map((item, index) => (
              <AccordionItem key={item.q} value={`faq-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="sahl-final">
        <div className="sahl-shell">
          <Reveal>
            <span>اكتب أول نتيجة تريدها</span>
            <h2>
              الفريق يوزّع العمل،
              <br />
              وأنت تعتمد القرار.
            </h2>
            <p>كوّن فريقك، أرسل هدفك مرة واحدة، وراجع الخطة قبل أن يبدأ التنفيذ.</p>
            <div className="sahl-actions">
              <Button asChild size="lg">
                <Link to="/welcome">
                  ابدأ تجربتك المجانية <ArrowLeft />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/pricing">شاهد الأسعار</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
