import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText, Trash2, Pencil, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell, WorkspaceCard } from "@/components/app/AppShell";
import { BrandVoiceExtractor } from "@/components/app/BrandVoiceExtractor";
import { KnowledgeLibrary } from "@/components/app/KnowledgeLibrary";
import { BusinessProfileCard } from "@/components/app/BusinessProfileCard";
import { Switch } from "@/components/ui/switch";
import {
  useBrainItems,
  useDeleteBrainItem,
  useSaveBrandKnowledge,
  useToggleBrainItem,
  useUpdateBrainItem,
  useWorkspace,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { BrandLoader } from "@/components/site/BrandLoader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/brain")({
  head: () => ({
    meta: [
      { title: "عقل العلامة | زياد" },
      { name: "description", content: "صوت علامتك وقواعدها ومستنداتها — يستخدمها فريقك عندما تشغّلها." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "عقل العلامة | زياد" },
      { property: "og:description", content: "مرجع موحد لمعرفة العلامة وصوتها يستخدمه فريق زياد كله." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrainPage,
});

function BrainPage() {
  const { data: workspace } = useWorkspace();
  const ws = workspace as (typeof workspace & { website?: string | null; profile?: unknown }) | undefined;

  return (
    <AppShell title="عقل العلامة" lead="أساس كل ما يكتبه فريقك — كلما اكتمل، صارت المخرجات أدق وأقرب لصوت علامتك.">
      <div className="mx-auto grid w-full min-w-0 max-w-3xl grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5">
        <WorkspaceCard />
        {ws ? (
          <BusinessProfileCard workspaceId={ws.id} website={ws.website} profile={ws.profile as never} />
        ) : null}
        <BrandVoiceExtractor workspaceId={ws?.id} website={ws?.website} />
        <BrandRules workspaceId={ws?.id} />
        <KnowledgeLibrary workspaceId={ws?.id} />
      </div>
    </AppShell>
  );
}

function BrandRules({ workspaceId }: { workspaceId?: string | undefined }) {
  const { data: items, isLoading } = useBrainItems(workspaceId);
  const add = useSaveBrandKnowledge(workspaceId);
  const update = useUpdateBrainItem(workspaceId);
  const toggle = useToggleBrainItem(workspaceId);
  const del = useDeleteBrainItem(workspaceId);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const rules = (items ?? []).filter((i) => i.title !== "دليل صوت العلامة" && i.title !== "ملف العلامة" && i.kind !== "learning" && i.kind !== "employee_guideline");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (text.length < 3) return;
    const firstLine = (text.split("\n")[0] ?? text).slice(0, 120);
    try {
      await add.mutateAsync({ kind: "note", title: firstLine, value: text });
      setDraft("");
      toast.success("أُضيفت القاعدة — الفريق يلتزم بها من الرسالة التالية.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
          <ScrollText className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-black sm:text-lg">قواعد الفريق</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            جمل قصيرة يلتزم بها كل موظف دائمًا، مثل: «لا تذكر الأسعار علنًا» أو «خاطب العميل بصيغة أنتم».
          </p>
        </div>
      </div>

      <form onSubmit={onAdd} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب قاعدة جديدة…"
          aria-label="قاعدة جديدة"
          className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <Button
          type="submit"
          disabled={draft.trim().length < 3 || add.isPending || !workspaceId}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-40"
        >
          {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} أضف
        </Button>
      </form>

      {isLoading ? (
        <div className="mt-4"><BrandLoader size="sm" /></div>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rules.length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">لا توجد قواعد — الفريق يعمل بإعداداته الافتراضية.</li>
          ) : null}
          {rules.map((item) => {
            const active = item.used_by.length > 0;
            if (editingId === item.id) {
              return (
                <li key={item.id} className="py-3">
                  <form
                    className="grid gap-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const body = String(new FormData(event.currentTarget).get("body")).trim();
                      if (body.length < 3) { toast.error("اكتب قاعدة من 3 أحرف على الأقل."); return; }
                      try {
                        await update.mutateAsync({ id: item.id, title: (body.split("\n")[0] ?? body).slice(0, 120), body });
                        setEditingId(null);
                        toast.success("تم التحديث.");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "تعذّر التحديث");
                      }
                    }}
                  >
                    <textarea
                      name="body"
                      required
                      defaultValue={item.body ?? item.title}
                      className="min-h-20 resize-y rounded-2xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={update.isPending} className="rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background">حفظ</Button>
                      <Button variant="ghost" size="icon" type="button" onClick={() => setEditingId(null)} aria-label="إلغاء"><X className="size-4" /></Button>
                    </div>
                  </form>
                </li>
              );
            }
            return (
              <li key={item.id} className="flex items-center gap-2 py-3">
                <p className={cn("min-w-0 flex-1 text-sm leading-relaxed", !active && "text-muted-foreground line-through decoration-border")}>
                  {item.title}
                </p>
                <Switch
                  checked={active}
                  disabled={toggle.isPending}
                  onCheckedChange={(v) => toggle.mutate({ id: item.id, active: v }, { onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر تعديل القاعدة") })}
                  aria-label={active ? "إيقاف القاعدة" : "تشغيل القاعدة"}
                />
                <Button variant="ghost" size="icon" type="button" onClick={() => setEditingId(item.id)} aria-label={`تعديل ${item.title}`}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" type="button" disabled={del.isPending} onClick={() => del.mutate(item.id, { onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر الحذف") })} aria-label={`حذف ${item.title}`}><Trash2 className="size-4" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
