import { useMemo, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { guidelinesFor } from "@/lib/employee-guidelines";
import { useAddBrainItem, useBrainItems, useDeleteBrainItem, useToggleEmployeeGuideline } from "@/lib/data";

const KIND = "employee_guideline";

export function EmployeeGuidelines({ workspaceId, employeeId, employeeName }: { workspaceId?: string; employeeId: string; employeeName: string }) {
  const { data: items } = useBrainItems(workspaceId);
  const add = useAddBrainItem(workspaceId);
  const toggle = useToggleEmployeeGuideline(workspaceId, employeeId);
  const remove = useDeleteBrainItem(workspaceId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const custom = useMemo(() => (items ?? []).filter((item) => item.kind === KIND && item.meta?.startsWith(`${employeeId}:`)), [employeeId, items]);

  const save = async (sectionId: string, sectionTitle: string) => {
    const text = (drafts[sectionId] ?? "").trim();
    if (text.length < 3 || !workspaceId) return;
    try {
      await add.mutateAsync({ kind: KIND, title: sectionTitle, body: text, meta: `${employeeId}:${sectionId}`, usedBy: [employeeId] });
      setDrafts((current) => ({ ...current, [sectionId]: "" }));
      toast.success(`سيطبق ${employeeName} هذه التعليمات من الرد التالي.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذّر حفظ التعليمات"); }
  };

  return <div className="employee-guidelines" dir="rtl">
    <div className="employee-guidelines-intro"><p>تعليمات {employeeName}</p><span>اكتب تفضيلاتك مرة واحدة، وسيطبقها تلقائياً في كل طلب مناسب.</span></div>
    {guidelinesFor(employeeId).map((section) => {
      const sectionItems = custom.filter((item) => item.meta === `${employeeId}:${section.id}`);
      return <section key={section.id} className="employee-guideline-section">
        <header><strong>{section.title}</strong><span>{section.hint}</span></header>
        <div className="employee-guideline-defaults">{section.defaults.map((rule) => <p key={rule}><Check className="size-3.5" />{rule}</p>)}</div>
        {sectionItems.length ? <ul>{sectionItems.map((item) => {
          const active = item.used_by.includes(employeeId);
          return <li key={item.id}>
            <Switch checked={active} disabled={toggle.isPending} onCheckedChange={(enabled) => toggle.mutate({ id: item.id, active: enabled })} aria-label={active ? "تعطيل التعليمات" : "تشغيل التعليمات"} />
            <span className={active ? "" : "is-paused"}>{item.body ?? item.title}</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove.mutate(item.id)} aria-label="حذف التعليمات"><Trash2 className="size-3.5" /></Button>
          </li>;
        })}</ul> : null}
        <form onSubmit={(event) => { event.preventDefault(); void save(section.id, section.title); }}>
          <input value={drafts[section.id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [section.id]: event.target.value }))} placeholder="أضف تعليمات واضغط Enter" aria-label={`تعليمات جديدة: ${section.title}`} />
          <Button type="submit" variant="ghost" size="icon-sm" disabled={(drafts[section.id] ?? "").trim().length < 3 || add.isPending || !workspaceId} aria-label="إضافة التعليمات">{add.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}</Button>
        </form>
      </section>;
    })}
  </div>;
}