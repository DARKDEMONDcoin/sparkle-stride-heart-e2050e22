export type ChatOutput = {
  title: string;
  body: string;
  kind: string;
  channel: string;
  scheduled: string | null;
};

export function readChatOutputs(value: unknown): ChatOutput[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.body !== "string" || !item.body.trim())
      return [];
    return [
      {
        title: typeof item.title === "string" ? item.title : "المخرج",
        body: item.body,
        kind: typeof item.kind === "string" ? item.kind : "مخرج",
        channel: typeof item.channel === "string" ? item.channel : "internal",
        scheduled: typeof item.scheduled === "string" ? item.scheduled : null,
      },
    ];
  });
}

export function composeChatOutputs(
  reply: string,
  outputs: { title?: string; body?: string }[],
): string {
  if (!outputs.length) return reply;
  const missing = outputs.filter(
    (output) => output.body?.trim() && !reply.includes(output.body.trim()),
  );
  return [
    reply.trim(),
    ...missing.map((output) => `### ${output.title || "المخرج"}\n\n${output.body?.trim()}`),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}
