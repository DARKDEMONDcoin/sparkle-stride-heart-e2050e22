import { expect, test } from "bun:test";
import { splitDeliverableItems, askedForPublishableOutput, isFollowUp } from "../../src/lib/post-format";
import { requestedCount } from "../../src/lib/turn-plan";

test("يقسّم ٣ منشورات إلى ٣ عناصر", () => {
  const body = "مقدمة قصيرة.\n## منشور التشويق\nجاهز تفتح باب جديد لمستقبلك؟ قريب جداً هنعرف إزاي. #لغات\n## منشور القيمة\nليه تعلم لغات جديدة بيغير مسار حياتك المهنية؟ ابدأ الآن. #تعلم\n## منشور طلبات حقيقية\nالباب فتح! انضم للبرنامج دلوقتي والمقاعد محدودة جداً. #تسجيل";
  const parts = splitDeliverableItems(body);
  expect(parts.length).toBe(3);
  expect(parts[0]!.title).toBe("منشور التشويق");
});
test("العدد المطلوب", () => {
  expect(requestedCount("اكتبلي ٣ منشورات")?.count).toBe(3);
  expect(requestedCount("عايز خمس مقالات")?.count).toBe(5);
});
test("المتابعة ترث طلب الحملة", () => {
  expect(isFollowUp("مراجعة")).toBe(true);
  expect(askedForPublishableOutput("أطلق منتجي الجديد بحملة تبدأ بالتشويق")).toBe(true);
});
import { auditOutput } from "../../src/lib/output-quality";
test("الناقص في العدد يُكتشف ويُصلَح", () => {
  const r = auditOutput({ text: "## منشور 1\nنص أول طويل بما يكفي للمراجعة هنا.\n## منشور 2\nنص ثاني طويل بما يكفي.", employeeId: "sonny", request: "اكتبلي ٣ منشورات" });
  expect(r.issues.some((i) => i.id === "count")).toBe(true);
});
