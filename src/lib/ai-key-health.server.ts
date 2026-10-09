/**
 * حالة مفتاح بوابة Lovable AI على الاستضافة الحالية.
 *
 * على Vercel (أو أي استضافة خارجية) قد يكون LOVABLE_API_KEY نسخة قديمة غير مسجّلة،
 * فترفضه البوابة بـ 401/403. أول رفض يوقف استخدامه مؤقتاً على هذه النسخة من الخادم،
 * فتذهب كل الخدمات مباشرة إلى Gemini بدل أن تجرّب مفتاحاً مرفوضاً في كل طلب.
 */

const DEAD_MS = 15 * 60_000;
let deadUntil = 0;

export function lovableKeyAlive(): boolean {
  return Date.now() >= deadUntil;
}

/** يُنادى بعد أي رد غير ناجح من بوابة Lovable. */
export function reportLovableStatus(status: number, where: string): void {
  if (status !== 401 && status !== 403 && status !== 402) return;
  if (lovableKeyAlive()) {
    console.error(
      `[ai] Lovable AI gateway rejected the key (${status}) in ${where}; using Gemini for the next 15 minutes.`,
    );
  }
  deadUntil = Date.now() + DEAD_MS;
}

/** مفتاح البوابة إن كان صالحاً على هذه النسخة، وإلا نص فارغ. */
export async function usableLovableKey(): Promise<string> {
  if (!lovableKeyAlive()) return "";
  const { getSecret } = await import("./secrets.server");
  return getSecret("LOVABLE_API_KEY");
}

/** مفتاح Gemini المباشر (يعمل على أي استضافة). */
export async function geminiKey(): Promise<string> {
  const { getSecret } = await import("./secrets.server");
  return (await getSecret("GEMINI_API_KEY")) || (await getSecret("GOOGLE_API_KEY"));
}
