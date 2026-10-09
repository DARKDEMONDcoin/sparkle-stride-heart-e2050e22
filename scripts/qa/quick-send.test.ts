import { expect, test } from "bun:test";
import { extractMessages, wantsQuickSend } from "../../src/components/app/QuickSend";

test("quick send extracts only message bodies", () => {
  const body = "جهّزت رسالتين.\n\n## الرسالتان\n- ترحيب دافئ\n\n### أهلاً بك\n\nأهلاً بيك معانا، سعداء بانضمامك لينا جداً.\n\n---\n\n### بداية أسهل\n\nنورت! تقدر تبدأ مهامك من مكان واحد بسهولة.\n\n## الخطوة التالية\nاعتمد الأنسب.";
  const out = extractMessages(body);
  expect(out.map((m) => m.title)).toEqual(["أهلاً بك", "بداية أسهل"]);
  expect(out[0]!.body).not.toContain("---");
});

test("quick send strips assumption and subject lines", () => {
  const out = extractMessages("الموضوع: الأسعار\n\nافتراضاتي: العميل صاحب قرار.\n\nمساء الخير، حبيت أتأكد إن تفاصيل الأسعار وصلتك.");
  expect(out[0]!.body).toBe("مساء الخير، حبيت أتأكد إن تفاصيل الأسعار وصلتك.");
});

test("quick send only for sam and eva message requests", () => {
  expect(wantsQuickSend("sam", "اكتب رسالة واتساب")).toBe(true);
  expect(wantsQuickSend("sonny", "اكتب رسالة واتساب")).toBe(false);
});
