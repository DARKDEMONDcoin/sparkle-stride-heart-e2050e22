export const WORKSPACE_VIEWS = ["today", "projects", "mine", "calendar", "activity", "people", "settings"] as const;
export type WorkspaceView = typeof WORKSPACE_VIEWS[number];

export function workspaceSearch(search: Record<string, unknown>): { workspaceId?: string | undefined; view?: WorkspaceView | undefined; projectId?: string | undefined } {
  const workspaceId = search["workspaceId"];
  const view = search["view"];
  const projectId = search["projectId"];
  return {
    workspaceId: typeof workspaceId === "string" ? workspaceId : undefined,
    view: WORKSPACE_VIEWS.includes(view as WorkspaceView) ? view as WorkspaceView : undefined,
    projectId: typeof projectId === "string" ? projectId : undefined,
  };
}

/** قوالب المشاريع: كل مهمة تُسند للموظف المتخصص فيها فقط (sonny=سِراج، eva=أمَل، sam=سالم، nour=نور، dana=دانة، adam=آدم). */
export const WORKSPACE_TEMPLATES: { id: string; label: string; name: string; tasks: [string, string | null, string][] }[] = [
  { id: "blank", label: "مشروع فارغ", name: "", tasks: [] },
  { id: "launch", label: "إطلاق منتج", name: "إطلاق منتج جديد", tasks: [["استراتيجية الإطلاق والرسالة الأساسية", "nour", "high"], ["كتابة صفحة الهبوط", "nour", "high"], ["منشورات أسبوع الإطلاق", "sonny", "medium"], ["رسالة بريدية للعملاء بالإطلاق", "eva", "medium"], ["تصاميم الإطلاق والصور", "dana", "medium"], ["مراجعة نهائية قبل الإطلاق", null, "urgent"]] },
  { id: "social", label: "حملة سوشيال", name: "حملة سوشيال شهرية", tasks: [["تقويم المحتوى للشهر", "sonny", "high"], ["كتابة منشورات الحملة", "nour", "medium"], ["تصميم صور الحملة", "dana", "medium"], ["قياس أداء الحملة آخر الشهر", "adam", "low"]] },
  { id: "seo", label: "تحسين الظهور في جوجل", name: "تحسين الظهور في جوجل", tasks: [["بحث الكلمات المفتاحية", "nour", "high"], ["تحسين عناوين ووصف الصفحات", "nour", "medium"], ["كتابة مقالين للمدونة", "nour", "medium"], ["تحليل نتائج الظهور أسبوعياً", "adam", "low"]] },
  { id: "sales", label: "المبيعات والتواصل", name: "المبيعات ومتابعة العملاء", tasks: [["تجهيز قائمة العملاء المحتملين", "sam", "high"], ["متابعة الصفقات المفتوحة", "sam", "high"], ["رسائل متابعة للعملاء", "eva", "medium"]] },
];

type FollowUpTask = { id: string; status: string; ai_employee_id: string | null; ai_status: string | null; assignee_id: string | null; due_date: string | null };

/** Mutually exclusive follow-up buckets: one task never inflates two counters. */
export function workspaceFollowUp<T extends FollowUpTask>(tasks: T[], meId: string | null | undefined, soon: string) {
  const open = tasks.filter((task) => task.status !== "done");
  const ready = open.filter((task) => task.ai_employee_id && task.ai_status === "done");
  const failed = open.filter((task) => task.ai_employee_id && task.ai_status === "failed");
  const running = open.filter((task) => task.ai_status === "running");
  const handled = new Set([...ready, ...failed, ...running].map((task) => task.id));
  const upcoming = open.filter((task) => !handled.has(task.id) && Boolean(meId) && task.assignee_id === meId && task.due_date && task.due_date <= soon)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  return { open, ready, failed, running, upcoming };
}