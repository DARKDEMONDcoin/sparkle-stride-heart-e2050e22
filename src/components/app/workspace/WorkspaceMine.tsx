import { useState } from "react";
import { CalendarClock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type WorkItem = Tables<"collaboration_tasks">;
type Project = Tables<"collaboration_projects">;
type Filter = "open" | "late" | "in_progress" | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "المفتوحة" },
  { id: "late", label: "المتأخرة" },
  { id: "in_progress", label: "قيد التنفيذ" },
  { id: "done", label: "المنجزة" },
];

/** «مهامي»: كل ما أُسند للمستخدم في مشاريع المساحة الحالية، مع فلترة وإنجاز مباشر. */
export function WorkspaceMine({ tasks, projects, meId, onOpenProject, onChanged }: {
  tasks: WorkItem[];
  projects: Project[];
  meId: string | null | undefined;
  onOpenProject: (id: string) => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const mine = tasks.filter((t) => Boolean(meId) && t.assignee_id === meId);
  const pick = (f: Filter) => mine.filter((t) => f === "done" ? t.status === "done" : t.status !== "done" && (f === "open" || (f === "late" ? Boolean(t.due_date && t.due_date < today) : t.status === "in_progress")));
  const list = pick(filter).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));

  async function toggle(task: WorkItem) {
    setBusy(task.id); setError("");
    const { error: updateError } = await supabase.from("collaboration_tasks").update({ status: task.status === "done" ? "todo" : "done" }).eq("id", task.id);
    setBusy(null);
    if (updateError) setError("تعذّر تحديث المهمة. حاول مرة أخرى.");
    else onChanged();
  }

  return <section className="mt-7" aria-label="مهامي">
    <h3 className="font-display text-xl font-black">مهامي</h3>
    <p className="mt-1 text-sm text-muted-foreground">كل ما أُسند إليك في مشاريع هذه المساحة، مرتباً حسب الموعد.</p>
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="فلترة المهام">
      {FILTERS.map((f) => <Button key={f.id} type="button" size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="rounded-full">{f.label}<span className="text-xs opacity-70">{pick(f.id).length}</span></Button>)}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {!list.length ? <p className="mt-6 border-y border-border py-12 text-center text-sm text-muted-foreground">{filter === "done" ? "لم تُنجز مهام بعد." : "لا مهام هنا. يوم هادئ!"}</p> : <ul className="mt-5 divide-y divide-border border-y border-border">
      {list.map((t) => {
        const project = projects.find((p) => p.id === t.project_id);
        const late = t.status !== "done" && t.due_date && t.due_date < today;
        const done = t.status === "done";
        return <li key={t.id} className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" disabled={busy === t.id} aria-label={done ? `إعادة فتح «${t.title}»` : `إنجاز «${t.title}»`} onClick={() => void toggle(t)} className={cn("size-8 shrink-0 rounded-full", done && "border-primary bg-primary text-primary-foreground")}>{done && <Check className="size-4" />}</Button>
          <Button variant="ghost" type="button" onClick={() => onOpenProject(t.project_id)} className="h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal px-1 py-3.5 text-start hover:text-primary">
            <span className="min-w-0 flex-1"><span className={cn("block break-words text-sm font-bold", done && "text-muted-foreground line-through")}>{t.title}</span><span className="text-xs text-muted-foreground">{project?.name}{t.status === "in_progress" ? " · قيد التنفيذ" : ""}</span></span>
            {t.due_date && <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-bold", late ? "text-destructive" : "text-muted-foreground")}><CalendarClock className="size-3.5" />{late ? "متأخرة · " : ""}{new Date(`${t.due_date}T00:00:00`).toLocaleDateString("ar", { day: "numeric", month: "short" })}</span>}
          </Button>
        </li>;
      })}
    </ul>}
  </section>;
}
