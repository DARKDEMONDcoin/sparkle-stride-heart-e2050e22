/** المخرج يحمل النص المطلوب وحده — لا كلام الموظف للمالك. */
import { expect, test } from "bun:test";
import { sanitizePostBody } from "../../src/lib/post-format";

test("رد البريد بدون سطر القرار المطلوب من المالك", () => {
  const raw = "القرار المطلوب من المالك: اعتماد الحل المقابل وإغلاق الشكوى.\n\nنعتذر بشدة عن التجربة غير الموفقة. هل تفضلون أن نتواصل معكم عبر الهاتف غداً؟";
  const out = sanitizePostBody(raw);
  expect(out).not.toContain("القرار المطلوب");
  expect(out).toContain("نعتذر بشدة");
});

test("أقسام الخلاصة وما أنجزته تُحذف وتبقى المسودة", () => {
  const raw = "**الخلاصة**: رد مهذب\n\n### ما أنجزته\nفرزت البريد\n\n### المسودات\nمرحباً أستاذ خالد، يسعدنا تأكيد موعد الأربعاء.\n\n### الخطوة التالية\nاعتمد الرد";
  const out = sanitizePostBody(raw);
  expect(out).toContain("مرحباً أستاذ خالد");
  expect(out).not.toMatch(/الخلاصة|فرزت|اعتمد الرد|المسودات/);
});
