import { z } from "zod";
export const MAX_REFERENCE_BYTES = 4 * 1024 * 1024;
export const REFERENCE_ACCEPT = ".pdf,.docx,.xlsx,.xls,.csv,.txt,.md";
export const referenceNameSchema = z.string().trim().min(1).max(180).refine(
  (name) => /\.(pdf|docx|xlsx|xls|csv|txt|md)$/i.test(name) && !/[\u0000-\u001f/\\]/.test(name),
  "الصيغ المدعومة: PDF وDOCX وExcel وCSV وTXT وMD.",
);
export function validateReferenceFile(file: { name: string; size: number }) {
  const result = referenceNameSchema.safeParse(file.name);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "اسم ملف غير صالح.");
  if (!file.size || file.size > MAX_REFERENCE_BYTES) throw new Error("اختر ملفًا غير فارغ بحجم لا يتجاوز 4 MB.");
}