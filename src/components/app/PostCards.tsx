/** بطاقة النشر الموحدة داخل المحادثة لكل الموظفين. */
import { memo, useState } from "react";
import { Send } from "lucide-react";

import { PublishPanel } from "@/components/app/PublishPanel";
import { Button } from "@/components/ui/button";

function PostCardsView({
  workspaceId,
  employeeId,
  taskId,
  request,
  body,
  channel,
  label,
}: {
  label?: string;
  workspaceId: string;
  employeeId: string;
  taskId?: string | null;
  request?: string | null;
  body: string;
  channel?: string | undefined;
}) {
  const [opened, setOpened] = useState(false);
  if (!opened) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 h-auto max-w-full whitespace-normal rounded-full text-xs font-bold"
        onClick={() => setOpened(true)}
      >
        <Send className="size-3.5" /> {label ? `انشر «${label}»` : "انشر هذا المنشور"}
      </Button>
    );
  }
  return (
    <div className="w-full">
    <PublishPanel
      workspaceId={workspaceId}
      employeeId={employeeId}
      taskId={taskId ?? null}
      request={request ?? null}
      body={body}
      channel={channel ?? "instagram"}
      defaultOpen
    />
    </div>
  );
}

/** لوحات النشر القديمة لا يعاد تركيبها أثناء كتابة الرد الحالي. */
export const PostCards = memo(PostCardsView);
