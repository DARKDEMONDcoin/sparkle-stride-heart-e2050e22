import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * أجندة الفريق لشهر واحد — تكمل تقويم النشر بما لا يعيش في social_posts:
 * - مقالات نور (مهامها المنجزة/قيد المراجعة) كتقويم تحريري.
 * - مواعيد تقويم جوجل الحقيقية (أمَل وسالم) إن كان التقويم مربوطاً.
 * - الدورات المتكررة المفعّلة (تقارير آدم، تشغيلات نور الآلية…) بموعدها القادم.
 * لا نخترع شيئاً: كل عنصر مصدره صف حقيقي أو حدث حي.
 */
export type AgendaItem = {
  id: string;
  kind: "article" | "meeting" | "cadence" | "task";
  employeeId: string;
  title: string;
  start: string;
  end?: string | null;
  status?: string | null;
  detail?: string | null;
  link?: string | null;
  body?: string | null;
  taskId?: string | null;
  /** موعد بيعي (يظهر في أجندة سالم أيضاً). */
  sales?: boolean;
  /** للمقالات: هل لها موعد نشر مخطط فعلاً؟ */
  planned?: boolean;
};

export type TeamAgenda = {
  items: AgendaItem[];
  calendarConnected: boolean;
  calendarError: string | null;
};

type GEvent = {
  id?: string;
  summary?: string;
  htmlLink?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string }[];
};

/** يقبل «2026-09-16T10:00…» و«2026-09-16 10:00 Africa/Cairo» و«2026-09-16»؛ غير ذلك نص وصفي. */
function parsePlanned(v: string | null): string | null {
  const m = v?.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2] ?? "10:00"}:00${/[+-]\d{2}:\d{2}|Z/.test(v!) ? v!.slice(-6).replace(/^.*Z$/, "Z") : "+03:00"}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const SALES = /demo|عرض سعر|عرض تقديمي|مكالمة|follow.?up|عميل|عملاء|client|customer|sales|مبيعات|صفقة|deal|proposal|عقد|تفاوض|lead|prospect/i;
const DELIVERY_EMPLOYEES = ["eva", "sam", "adam", "dana"];

export const getTeamAgenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        from: z.string().datetime(),
        to: z.string().datetime(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<TeamAgenda> => {
    const sb = context.supabase;
    const { data: owns } = await sb.rpc("owns_workspace", { _workspace_id: data.workspaceId });
    if (owns !== true) throw new Error("غير مصرّح");

    const items: AgendaItem[] = [];

    const fromDay = data.from.slice(0, 10);
    const toDay = data.to.slice(0, 10);
    const [{ data: articles }, { data: autos }, { data: calAcc }, { data: deliveries }, { data: collab }, { data: alerts }] = await Promise.all([
      sb
        .from("tasks")
        .select("id, title, status, updated_at, detail, output, kind, scheduled")
        .eq("workspace_id", data.workspaceId)
        .eq("employee_id", "nour")
        // موعد نشر مخطط (scheduled بصيغة تاريخ) أو يوم الكتابة كاحتياط.
        .or(
          `and(updated_at.gte.${data.from},updated_at.lte.${data.to}),and(scheduled.gte.${data.from},scheduled.lte.${data.to})`,
        )
        .neq("status", "rejected")
        .order("updated_at", { ascending: false })
        .limit(150),
      sb
        .from("automations")
        .select("id, employee_id, label, cadence, next_run_at, last_status")
        .eq("workspace_id", data.workspaceId)
        .eq("active", true)
        .limit(50),
      sb
        .from("pipedream_accounts")
        .select("account_id")
        .eq("workspace_id", data.workspaceId)
        .eq("provider", "calendar")
        .eq("status", "connected")
        .limit(1),
      // مهام/مخرجات بقية الموظفين: موعد مخطط أو يوم التسليم.
      sb
        .from("tasks")
        .select("id, employee_id, title, status, updated_at, scheduled, output, kind")
        .eq("workspace_id", data.workspaceId)
        .in("employee_id", DELIVERY_EMPLOYEES)
        .neq("status", "rejected")
        .or(
          `and(updated_at.gte.${data.from},updated_at.lte.${data.to}),and(scheduled.gte.${data.from},scheduled.lte.${data.to})`,
        )
        .order("updated_at", { ascending: false })
        .limit(200),
      // مهام المشاريع المسندة لموظف رقمي بموعد تسليم.
      sb
        .from("collaboration_tasks")
        .select("id, ai_employee_id, title, status, due_date, project_id, ai_output")
        .eq("workspace_id", data.workspaceId)
        .not("ai_employee_id", "is", null)
        .gte("due_date", fromDay)
        .lt("due_date", toDay)
        .limit(200),
      // رسائل بريد تحتاج متابعة أمَل.
      sb
        .from("inbox_alerts")
        .select("id, kind, subject, sender, summary, created_at")
        .eq("workspace_id", data.workspaceId)
        .gte("created_at", data.from)
        .lte("created_at", data.to)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    const seen = new Set<string>();
    for (const a of articles ?? []) {
      const planned = parsePlanned(a.scheduled);
      const when = planned ?? a.updated_at;
      if (when < data.from || when > data.to) continue;
      // نفس العنوان في نفس اليوم = نسخة مكررة من إعادة توليد؛ نعرض الأحدث مرة واحدة.
      const dedupe = `${a.title.trim()}|${when.slice(0, 10)}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const isArticle = /مقال|دليل|article|blog|صفحة|landing|أفضل|كيف|فوائد/i.test(a.title);
      items.push({
        id: `a-${a.id}`,
        kind: "article",
        employeeId: "nour",
        title: a.title,
        start: when,
        status: a.status,
        detail: `${isArticle ? "مقال" : "مخرج سيو"}${planned ? " · موعد نشر مخطط" : ""}`,
        body: (a.output ?? "").slice(0, 4000) || null,
        taskId: a.id,
        planned: !!planned,
      });
    }

    const DELIVERY_LABEL: Record<string, string> = {
      eva: "مهمة تنفيذية",
      sam: "متابعة بيعية",
      adam: "تقرير",
      dana: "تصميم",
    };
    for (const t of deliveries ?? []) {
      const planned = parsePlanned(t.scheduled);
      // بلا موعد مخطط: نعرض فقط ما سُلّم فعلاً (منجز/للمراجعة) بيوم تسليمه.
      if (!planned && t.status !== "done" && t.status !== "review") continue;
      const when = planned ?? t.updated_at;
      if (when < data.from || when > data.to) continue;
      items.push({
        id: `t-${t.id}`,
        kind: "task",
        employeeId: t.employee_id,
        title: t.title,
        start: when,
        status: t.status,
        detail: `${DELIVERY_LABEL[t.employee_id] ?? "مهمة"}${planned ? " · موعد مخطط" : " · سُلّم"}`,
        body: (t.output ?? "").slice(0, 4000) || null,
        taskId: t.id,
        sales: t.employee_id === "sam",
      });
    }
    for (const t of collab ?? []) {
      if (!t.ai_employee_id || !t.due_date) continue;
      items.push({
        id: `p-${t.id}`,
        kind: "task",
        employeeId: t.ai_employee_id,
        title: t.title,
        start: t.due_date,
        status: t.status,
        detail: t.status === "done" ? "مهمة مشروع · منجزة" : "مهمة مشروع · موعد تسليم",
        body: (t.ai_output ?? "").slice(0, 4000) || null,
        sales: t.ai_employee_id === "sam",
      });
    }
    for (const a of alerts ?? []) {
      const title = a.subject?.trim() || a.summary?.trim() || "رسالة تحتاج متابعة";
      items.push({
        id: `i-${a.id}`,
        kind: "task",
        employeeId: SALES.test(`${title} ${a.summary ?? ""}`) ? "sam" : "eva",
        title,
        start: a.created_at,
        detail: ["متابعة بريد", a.sender ?? ""].filter(Boolean).join(" · "),
        body: a.summary ?? null,
        sales: SALES.test(`${title} ${a.summary ?? ""}`),
      });
    }

    // الدورات المتكررة: نفرد كل تكرار داخل الشهر من موعدها القادم.
    const from = new Date(data.from).getTime();
    const to = new Date(data.to).getTime();
    const step: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
    for (const r of autos ?? []) {
      const days = step[r.cadence] ?? 7;
      let t = new Date(r.next_run_at).getTime();
      let guard = 0;
      while (t <= to && guard < 40) {
        if (t >= from) {
          items.push({
            id: `c-${r.id}-${t}`,
            kind: "cadence",
            employeeId: r.employee_id,
            title: r.label,
            start: new Date(t).toISOString(),
            status: r.last_status,
          });
        }
        t += days * 86_400_000;
        guard += 1;
      }
    }

    let calendarConnected = false;
    let calendarError: string | null = null;
    const accountId = calAcc?.[0]?.account_id;
    if (accountId) {
      calendarConnected = true;
      try {
        const { pipedreamConfig, proxyRequest } = await import("./pipedream.server");
        const config = await pipedreamConfig();
        if (!config) throw new Error("إعداد الربط غير مكتمل");
        const url =
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
          new URLSearchParams({
            timeMin: data.from,
            timeMax: data.to,
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "250",
          }).toString();
        const res = await proxyRequest<{ items?: GEvent[] }>(config, {
          workspaceId: data.workspaceId,
          accountId,
          url,
        });
        for (const e of res.items ?? []) {
          const start = e.start?.dateTime ?? e.start?.date;
          if (!start) continue;
          const title = e.summary ?? "موعد بلا عنوان";
          items.push({
            id: `m-${e.id ?? start}`,
            kind: "meeting",
            // كل المواعيد في أجندة أمَل؛ البيعية منها تظهر لسالم أيضاً.
            employeeId: "eva",
            sales: SALES.test(`${title} ${e.location ?? ""}`),
            title,
            start,
            end: e.end?.dateTime ?? e.end?.date ?? null,
            detail: [
              e.attendees?.length ? `${e.attendees.length} حضور` : "",
              e.location ?? "",
            ]
              .filter(Boolean)
              .join(" · ") || null,
            link: e.htmlLink ?? null,
          });
        }
      } catch (error) {
        console.error("[agenda] calendar read failed:", error);
        calendarError = "تعذّرت قراءة تقويم جوجل الآن — أعد ربطه من صفحة التكاملات إن استمر ذلك.";
      }
    }

    items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return { items, calendarConnected, calendarError };
  });

/** يحدد موعد نشر مخطط لمقال نور (سحب في التقويم). */
export const setArticleDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid(), taskId: z.string().uuid(), date: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ scheduled: data.date })
      .eq("id", data.taskId)
      .eq("workspace_id", data.workspaceId)
      .eq("employee_id", "nour");
    if (error) throw new Error("تعذّر تحديد موعد المقال");
    return { ok: true };
  });
