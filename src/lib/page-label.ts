/** اسم الصفحة التي يدخلها المستخدم — لتقول شاشة التحميل بالضبط إلى أين نذهب. */
const EMPLOYEES: Record<string, string> = { sonny: "سراج", nour: "نور", dana: "دانة", eva: "أمل", sam: "سالم", adam: "آدم" };
const PAGES: [RegExp, string][] = [
  [/^\/app\/?$/, "لوحة القيادة"], [/^\/app\/chat\/?$/, "المحادثات"], [/^\/app\/approvals/, "الموافقات"],
  [/^\/app\/automations/, "الأتمتة"], [/^\/app\/autopilot/, "الطيار الآلي"], [/^\/app\/brain/, "العقل"],
  [/^\/app\/browser/, "المتصفح"], [/^\/app\/calendar/, "التقويم"], [/^\/app\/decisions/, "القرارات"],
  [/^\/app\/design-editor/, "محرر التصميم"], [/^\/app\/discovery/, "الاكتشاف"], [/^\/app\/feedback/, "الملاحظات"],
  [/^\/app\/guidelines/, "التعليمات"], [/^\/app\/help/, "المساعدة"], [/^\/app\/inbox-watch/, "مراقبة البريد"],
  [/^\/app\/integrations/, "الربط"], [/^\/app\/proposals/, "المقترحات"], [/^\/app\/queue/, "الطابور"],
  [/^\/app\/rankings/, "الترتيب"], [/^\/app\/referral/, "شارك واربح"], [/^\/app\/reports/, "التقارير"],
  [/^\/app\/settings/, "الإعدادات"], [/^\/app\/team-tasks/, "مهام الفريق"], [/^\/app\/tasks/, "المهام"],
  [/^\/app\/trust/, "الثقة والأمان"], [/^\/app\/workspace/, "مساحة العمل"], [/^\/auth/, "تسجيل الدخول"],
  [/^\/welcome/, "الترحيب"], [/^\/referral-terms/, "شروط الإحالة"], [/^\/?$/, "الصفحة الرئيسية"],
];

export function pageLabel(pathname: string): string | null {
  const chat = pathname.match(/^\/app\/chat\/([^/?#]+)/);
  if (chat) { const n = EMPLOYEES[chat[1]!]; return n ? `محادثة ${n}` : "المحادثة"; }
  const tool = pathname.match(/^\/app\/[a-z-]+\/?.*[?&]employee=([a-z]+)/);
  for (const [re, label] of PAGES) if (re.test(pathname)) return tool && EMPLOYEES[tool[1]!] ? `${label} — ${EMPLOYEES[tool[1]!]}` : label;
  return null;
}

/** نص التحميل: «نفتح صفحة X…» — أو جملة عامة إن لم نعرف الصفحة. */
export function loadingText(pathname?: string): string {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const label = pageLabel(path);
  return label ? `نفتح ${label}…` : "نفتح الصفحة…";
}
