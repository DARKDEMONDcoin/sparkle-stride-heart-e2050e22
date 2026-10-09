import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, FileText, Link2, Loader2, Trash2, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

import { addKnowledge, deleteKnowledge, listKnowledge, uploadKnowledgeFile, previewKnowledge } from "@/lib/knowledge.functions";

import { Button } from "@/components/ui/button";
import { REFERENCE_ACCEPT, validateReferenceFile } from "@/lib/reference-files";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim()) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v.trim());

/** Reference library: employees pull only the relevant passage when a question needs it. */
export function KnowledgeLibrary({ workspaceId }: { workspaceId?: string | undefined }) {
  const qc = useQueryClient();
  const list = useServerFn(listKnowledge);
  const add = useServerFn(addKnowledge);
  const del = useServerFn(deleteKnowledge);
  const [value, setValue] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useServerFn(uploadKnowledgeFile);
  const preview = useServerFn(previewKnowledge);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activeFile, setActiveFile] = useState("");
  const [document, setDocument] = useState<{ title: string; text: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  async function uploadFiles(files: File[]) {
    if (!workspaceId || uploading) return;
    setUploadError("");
    if (files.length > 5) { setUploadError("اختر حتى 5 ملفات في المرة الواحدة."); return; }
    try { files.forEach(validateReferenceFile); }
    catch (e) { setUploadError(e instanceof Error ? e.message : "ملف غير صالح."); return; }
    setUploading(true);
    try {
      for (const file of files) {
        setActiveFile(file.name);
        const form = new FormData();
        form.set("workspaceId", workspaceId); form.set("file", file);
        const result = await upload({ data: form });
        toast.success(`حُفظ «${result.title}»`);
        await qc.invalidateQueries({ queryKey: ["knowledge", workspaceId] });
      }
    } catch (e) { setUploadError(e instanceof Error ? e.message : "تعذّر رفع الملف."); }
    finally { setUploading(false); setActiveFile(""); if (fileInput.current) fileInput.current.value = ""; }
  }
  const key = ["knowledge", workspaceId];
  const asUrl = isUrl(value);

  const { data: items = [], isLoading } = useQuery({
    queryKey: key,
    enabled: Boolean(workspaceId),
    queryFn: () => list({ data: { workspaceId: workspaceId ?? "" } }),
  });

  const save = useMutation({
    mutationFn: () => {
      const v = value.trim();
      const input = asUrl ? { url: v.startsWith("http") ? v : `https://${v}` } : { text: v };
      return add({ data: { workspaceId: workspaceId ?? "", ...input } });
    },
    onSuccess: (r) => {
      toast.success(`حُفظ «${r.title}» — الفريق يرجع إليه عند الحاجة`);
      setValue("");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (source: string) => del({ data: { workspaceId: workspaceId ?? "", source } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = asUrl || value.trim().length >= 20;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-black sm:text-lg">مستندات مرجعية</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            أسعار، سياسات، كتيّب منتجات… يرجع إليها الموظف فقط عندما يحتاجها السؤال.
          </p>
        </div>
      </div>

      <div className="mt-4 border border-dashed border-border rounded-lg p-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void uploadFiles(Array.from(e.dataTransfer.files)); }}>
        <input ref={fileInput} type="file" multiple accept={REFERENCE_ACCEPT} className="hidden" aria-label="رفع مستندات الشركة" onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []))} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-sm font-bold">ملف الشركة، دليل الهوية، قائمة الأسعار أو المنيو</p><p className="mt-1 text-xs text-muted-foreground" dir="ltr">PDF · DOCX · XLSX · XLS · CSV · TXT · MD — 4 MB</p></div>
          <Button type="button" variant="outline" disabled={!workspaceId || uploading} onClick={() => fileInput.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />}رفع ملفات</Button>
        </div>
        {uploading ? <p role="status" className="mt-3 break-all text-sm text-muted-foreground">جارٍ قراءة وحفظ {activeFile}…</p> : null}
        {uploadError ? <p role="alert" className="mt-3 text-sm text-destructive">{uploadError}</p> : null}
      </div>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) save.mutate();
        }}
      >
        <textarea
          aria-label="رابط أو نص مستند مرجعي"
          maxLength={300000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="الصق رابط صفحة، أو نص المستند (أول سطر يصبح العنوان)"
          className="min-h-20 w-full resize-y rounded-2xl border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {value.trim() ? (asUrl ? "سنقرأ هذه الصفحة" : `${value.trim().length} حرف`) : ""}
          </span>
          <Button
            type="submit"
            disabled={!canSave || save.isPending || !workspaceId}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {asUrl ? "أضف الرابط" : "احفظ المستند"}
          </Button>
        </div>
      </form>

      <ul className="mt-3 divide-y divide-border">
        {isLoading ? <li className="py-3 text-sm text-muted-foreground">جارٍ التحميل…</li> : null}
        {!isLoading && !items.length ? (
          <li className="py-3 text-sm text-muted-foreground">لا توجد مستندات بعد.</li>
        ) : null}
        {items.map((it) => {
          const file = it.source.startsWith("file:");
          const text = it.source.startsWith("text:") || file;
          const Icon = text ? FileText : Link2;
          return (
            <li key={it.source} className="flex items-center gap-3 py-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{it.title}</p>
                <p className="truncate text-xs text-muted-foreground" dir={text ? undefined : "ltr"}>
                  {text ? `${file ? "ملف خاص" : "نص"} · ${it.chunks} مقطع` : it.source}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={previewing} aria-label={`معاينة ${it.title}`} onClick={async () => {
                if (!workspaceId) return;
                setPreviewing(true);
                try { const result = await preview({ data: { workspaceId, source: it.source } }); setDocument({ title: it.title, text: result.text }); }
                catch (e) { toast.error(e instanceof Error ? e.message : "تعذّرت المعاينة"); }
                finally { setPreviewing(false); }
              }}><Eye /></Button>
              <Button
                variant="ghost"
                type="button"
                aria-label={`حذف ${it.title}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(it.source)}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
      <Dialog open={Boolean(document)} onOpenChange={(open) => { if (!open) setDocument(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto" dir="rtl"><DialogHeader><DialogTitle className="break-all">{document?.title}</DialogTitle></DialogHeader><p className="whitespace-pre-wrap break-words text-sm leading-7">{document?.text}</p></DialogContent>
      </Dialog>
    </section>
  );
}
