import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ListPlus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveChatOutputs } from "@/lib/chat-outputs.functions";

export function SaveChatOutputs({ messageId, count }: { messageId: string; count: number }) {
  const save = useServerFn(saveChatOutputs);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || saved}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await save({ data: { messageId } });
            setSaved(true);
            await Promise.all([
              qc.invalidateQueries({ queryKey: ["tasks"] }),
              qc.invalidateQueries({ queryKey: ["messages"] }),
            ]);
          } catch {
            setError("تعذّر الحفظ؛ المخرجات ما زالت محفوظة هنا. حاول مجدداً.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <Check className="size-4" />
        ) : (
          <ListPlus className="size-4" />
        )}
        {saved
          ? "أُضيفت للموافقات"
          : `أضف ${count > 1 ? `المخرجات (${count})` : "المخرج"} للمهام والموافقات`}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
