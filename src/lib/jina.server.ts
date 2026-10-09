/**
 * مفتاح Jina Reader (اختياري): يرفع حدود القراءة ويقلّل الرفض. يُقرأ على الخادم فقط.
 * بدون مفتاح تعمل القراءة كما كانت بالحدود المجانية.
 */
export function jinaHeaders(url: string): Record<string, string> {
  if (!/^https:\/\/(r|s)\.jina\.ai\//i.test(url)) return {};
  const key = process.env["JINA_API_KEY"];
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export const hasJinaKey = (): boolean => Boolean(process.env["JINA_API_KEY"]);
