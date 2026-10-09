import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { team } from "@/data/team";
import type { Tables } from "@/integrations/supabase/types";

type WorkItem = Tables<"collaboration_tasks">;

const SPECIALTY: Record<string, string> = {
  sonny: "سوشيال ميديا، تفاعل، تقويم نشر",
  eva: "تواصل، بريد إلكتروني، علاقات عملاء",
  sam: "مبيعات، صفقات، متابعة عملاء",
  nour: "كتابة محتوى، سيو، نصوص إعلانية وصفحات هبوط",
  dana: "هوية بصرية، تصاميم، أصول إبداعية",
  adam: "تحليلات، أرقام، مؤشرات أداء وتقارير",
};

/** بطاقات الموظفين الرقميين الستة؛ المحادثة تُفتح داخل المساحة النشطة نفسها. */
export function WorkspaceAiTeam({ tasks, spaceName }: { tasks: WorkItem[]; spaceName: string }) {
  return <section className="mt-10" aria-label="الموظفون الرقميون">
    <h3 className="font-display text-xl font-black">الموظفون الرقميون</h3>
    <p className="mt-1 text-sm text-muted-foreground">ستة متخصصين يعملون داخل «{spaceName}». المحادثة تبدأ بسياق هذه المساحة ومشاريعها.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {team.map((m) => {
        const assigned = tasks.filter((t) => t.ai_employee_id === m.id && t.status !== "done").length;
        return <div key={m.id} className="flex flex-col rounded-md border border-border p-4">
          <div className="flex items-center gap-3">
            <span className="block size-12 shrink-0 overflow-hidden rounded-full" style={{ background: m.tintSoft }}><Portrait memberId={m.id} name={m.name} className="size-full" /></span>
            <div className="min-w-0"><p className="font-display text-base font-black">{m.name}</p><p className="truncate text-xs text-muted-foreground">{m.role}</p></div>
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">{SPECIALTY[m.id]}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="text-xs font-bold text-muted-foreground">{assigned ? `${assigned} مهمة مفتوحة` : "متاح الآن"}</span>
            <Button size="sm" variant="outline" asChild><Link to="/app/chat/$id" params={{ id: m.id }}><MessageCircle className="size-4" /> محادثة</Link></Button>
          </div>
        </div>;
      })}
    </div>
  </section>;
}
