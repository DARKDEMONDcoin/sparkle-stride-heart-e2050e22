import { chatIntent, type ChatIntent } from "./chat-intent";
import { researchIntent, type ResearchIntent } from "./research-intent";

export type TurnComplexity = "light" | "standard" | "deep";
export type TurnRisk = "low" | "approval";
export type TurnPlan = {
  intent: ChatIntent;
  complexity: TurnComplexity;
  risk: TurnRisk;
  research: ResearchIntent & { depth: "none" | "live" | "deep" };
  useTools: boolean;
  readLinks: boolean;
  verifyOutput: boolean;
  reasoningEffort: "low" | "medium" | "high";
  successChecks: string[];
};

const DEEP =
  /بحث\s*(عميق|شامل|موسّع)|deep\s*research|تقرير\s*(شامل|مفصل)|دراسة\s*(كاملة|شاملة)|استراتيجية|خطة\s*(كاملة|شاملة)|قارن|مقارنة|بالأرقام|منافس/iu;
const ACTION =
  /انشر|أرسل|ارسل|ابعت|احجز|اشتري|اشترِ|ادفع|سجّل|سجل|املأ|نفّذ|نفذ|publish|send|book|buy|pay|submit|register/iu;
const TOOL =
  /افحص|تدقيق|حلّل|حلل|ترتيب|كلمات مفتاحية|تقويم|أداء|ميزانية|تقرير|منافس|قارن|انشر|أرسل|احجز|اشتري|رابط|https?:\/\//iu;

export function planTurn(message: string, longForm = false): TurnPlan {
  const text = (message ?? "").trim();
  const intent = chatIntent(text);
  const research = researchIntent(text);
  const readLinks = /https?:\/\//iu.test(text);
  const deep = longForm || DEEP.test(text) || text.length > 500;
  const complexity: TurnComplexity =
    intent === "smalltalk" ? "light" : deep ? "deep" : intent === "work" ? "standard" : "light";
  const depth = research.wanted ? (deep ? "deep" : "live") : "none";
  const risk: TurnRisk = ACTION.test(text) ? "approval" : "low";
  const useTools = intent === "work" && TOOL.test(text);
  const verifyOutput = intent === "work";
  const reasoningEffort =
    complexity === "deep" ? "high" : intent === "smalltalk" || intent === "question" ? "low" : "medium";
  const successChecks = [
    "تلبية المطلوب كاملاً دون فراغات",
    research.wanted ? "إسناد الحقائق المتغيرة إلى أدلة حيّة" : "عدم اختلاق حقائق أو أرقام",
    ...countChecks(text),
    risk === "approval" ? "عدم ادعاء التنفيذ قبل تحقق النتيجة واعتماد المالك" : "خطوة تالية واحدة قابلة للتنفيذ",
  ];
  return {
    intent,
    complexity,
    risk,
    research: { ...research, depth },
    useTools,
    readLinks,
    verifyOutput,
    reasoningEffort,
    successChecks,
  };
}

export function turnPlanBlock(plan: TurnPlan): string {
  return [
    "## خطة التنفيذ الداخلية لهذه الرسالة",
    `التعقيد: ${plan.complexity} · البحث: ${plan.research.depth} · المخاطر: ${plan.risk}`,
    `معايير النجاح:\n- ${plan.successChecks.join("\n- ")}`,
    "نفّذ بهذا الترتيب داخلياً: افهم النتيجة ← اجمع الأدلة/شغّل الأدوات اللازمة ← أنشئ المخرج ← راجعه ← سلّم النسخة النهائية فقط.",
  ].join("\n");
}
const AR_NUM: Record<string, number> = {
  واحد: 1, اثنين: 2, اتنين: 2, اثنان: 2, ثلاث: 3, ثلاثة: 3, تلات: 3, تلاتة: 3, أربع: 4, اربع: 4, أربعة: 4, اربعة: 4,
  خمس: 5, خمسة: 5, ست: 6, ستة: 6, سبع: 7, سبعة: 7, ثمان: 8, ثماني: 8, تمن: 8, تسع: 9, تسعة: 9, عشر: 10, عشرة: 10,
};
const ITEM =
  "(منشورات?|منشور|بوستات|بوست|مقالات|مقال|تغريدات|تغريدة|أفكار|افكار|فكرة|إيميلات|رسائل|رسالة|عناوين|عنوان|سكريبتات|سكريبت|ريلز|تصاميم|تصميم|إعلانات|اعلانات|إعلان|بدائل|نسخ|أسئلة|خطط|عروض|ستوريز|كابشن)";

/** يستخرج العدد المطلوب ونوع العنصر من الطلب («اكتبلي ٣ منشورات»، «خمس مقالات»). */
export function requestedCount(message: string): { count: number; item: string } | null {
  const text = (message ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const digit = text.match(new RegExp(`(\\d{1,2})\\s*${ITEM}`, "u"));
  if (digit) return { count: Number(digit[1]), item: digit[2]! };
  const word = text.match(new RegExp(`(?:^|\\s)(${Object.keys(AR_NUM).join("|")})\\s+${ITEM}`, "u"));
  if (word) return { count: AR_NUM[word[1]!]!, item: word[2]! };
  return null;
}

function countChecks(text: string): string[] {
  const c = requestedCount(text);
  if (!c || c.count < 2 || c.count > 30) return [];
  return [
    `سلّم ${c.count} ${c.item} بالضبط — لا أقل ولا أكثر، وكل عنصر مختلف فعلاً في الزاوية والفكرة لا مجرد إعادة صياغة`,
    `ضع كل عنصر تحت عنوان مستقل مرقّم بالشكل «## ${c.item.replace(/ات$/u, "")} 1: <عنوان قصير>» حتى ينشر/يعتمد كل عنصر وحده`,
  ];
}
