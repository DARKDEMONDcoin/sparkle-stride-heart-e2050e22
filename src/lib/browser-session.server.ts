import { getSecret } from "./secrets.server";

const PAUSE_KEY = "BROWSERBASE_SERVICE_PAUSE";
export const BROWSER_PAYMENT_MESSAGE = "خدمة المتصفح Browserbase أوقفت التشغيل بسبب متطلبات الدفع (402). يحتاج مالك حساب Browserbase مراجعة الخطة والفوترة؛ القراءة المباشرة للمواقع ما زالت متاحة.";

/** Shared persistent stop: no new sessions while the provider account is blocked. */
export async function createBrowserSession(apiKey: string, body: Record<string, unknown>): Promise<{ id: string; connectUrl: string }> {
  const pause = await getSecret(PAUSE_KEY);
  if (pause) throw new Error(pause);
  const response = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST", headers: { "X-BB-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = response.status === 402 ? BROWSER_PAYMENT_MESSAGE
      : response.status === 401 || response.status === 403 ? `خدمة Browserbase رفضت الوصول (${response.status}). يلزم مراجعة إعدادات حساب المتصفح.`
      : response.status === 429 ? "المتصفح السحابي مشغول الآن — أعد المحاولة بعد دقيقة."
      : `تعذر تشغيل المتصفح السحابي (${response.status}).`;
    if ([401, 402, 403, 404].includes(response.status)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("app_secrets").upsert({ name: PAUSE_KEY, value: message }, { onConflict: "name" });
      if (error) throw new Error(`${message} تعذر حفظ إيقاف الخدمة.`);
      const { resetSecretsCache } = await import("./secrets.server");
      resetSecretsCache();
    }
    throw new Error(message);
  }
  const session = await response.json() as { id?: string; connectUrl?: string };
  if (!session.id || !session.connectUrl) throw new Error("خدمة المتصفح لم تُرجع جلسة صالحة.");
  return { id: session.id, connectUrl: session.connectUrl };
}