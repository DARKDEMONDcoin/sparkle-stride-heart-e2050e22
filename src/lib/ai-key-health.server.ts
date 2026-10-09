/**
 * حالة مفتاح بوابة Lovable AI على الاستضافة الحالية.
 *
 * على Vercel (أو أي استضافة خارجية) قد يكون LOVABLE_API_KEY نسخة قديمة غير مسجّلة،
 * فترفضه البوابة بـ 401/403. الرفض يوقف استخدام *هذه القيمة بالذات* مؤقتاً،
 * فإذا حُدِّث المفتاح (في app_secrets أو بيئة التشغيل) يُستخدم الجديد فوراً بلا انتظار.
 */

const DEAD_MS = 15 * 60_000;
let deadKey = "";
let deadUntil = 0;
let lastKey = "";

/** هل المفتاح (أو آخر مفتاح مستخدم) غير موقوف؟ */
export function lovableKeyAlive(key?: string): boolean {
  if (Date.now() >= deadUntil) return true;
  const k = key ?? lastKey;
  return !!k && k !== deadKey;
}

/** يُنادى بعد أي رد غير ناجح من بوابة Lovable. */
export function reportLovableStatus(status: number, where: string): void {
  if (status !== 401 && status !== 403 && status !== 402) return;
  if (lastKey !== deadKey || Date.now() >= deadUntil) {
    console.error(
      `[ai] Lovable AI gateway rejected the key (${status}) in ${where}; using Gemini until the key changes (max 15 minutes).`,
    );
  }
  deadKey = lastKey;
  deadUntil = Date.now() + DEAD_MS;
}

/** يسجّل المفتاح المستخدم فعلياً ليُنسب إليه أي رفض لاحق. */
export function noteLovableKey(key: string): string {
  if (key) lastKey = key;
  return key;
}

/** مفتاح البوابة إن كان صالحاً على هذه النسخة، وإلا نص فارغ. */
export async function usableLovableKey(): Promise<string> {
  const { getSecret } = await import("./secrets.server");
  const key = await getSecret("LOVABLE_API_KEY");
  if (!key || !lovableKeyAlive(key)) return "";
  return noteLovableKey(key);
}

/** مفتاح Gemini المباشر (يعمل على أي استضافة). */
export async function geminiKey(): Promise<string> {
  const { getSecret } = await import("./secrets.server");
  return (await getSecret("GEMINI_API_KEY")) || (await getSecret("GOOGLE_API_KEY"));
}
