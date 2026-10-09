import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readChatOutputs } from "./chat-outputs";

/** Save only persisted, accessible message content, never client-supplied output. */
export const saveChatOutputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => z.object({ messageId: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: message, error } = await context.supabase
      .from("messages")
      .select("*")
      .eq("id", data.messageId)
      .single();
    if (error || !message || message.role !== "assistant") throw new Error("تعذّر الوصول للمخرج.");
    if (message.task_id) return { taskId: message.task_id };
    const outputs = readChatOutputs(message.outputs);
    if (!outputs.length) throw new Error("لا توجد مخرجات جاهزة للحفظ.");
    const { data: rows, error: saveError } = await context.supabase
      .from("tasks")
      .insert(
        outputs.map((output) => ({
          workspace_id: message.workspace_id,
          employee_id: message.employee_id,
          title: output.title,
          output: output.body,
          kind: output.kind,
          channel: output.channel,
          detail: message.body.slice(0, 400),
          status: "review",
          scheduled: output.scheduled ?? "بانتظار اعتمادك",
          steps: [
            { label: "التنفيذ", state: "done" },
            { label: "مراجعتك", state: "active" },
          ],
        })),
      )
      .select("id");
    if (saveError || !rows?.[0]) throw new Error(saveError?.message ?? "تعذّر حفظ المخرجات.");
    const taskId = rows[0].id;
    const { error: linkError } = await context.supabase
      .from("messages")
      .update({ task_id: taskId })
      .eq("id", message.id);
    if (linkError) throw new Error(linkError.message);
    return { taskId };
  });
