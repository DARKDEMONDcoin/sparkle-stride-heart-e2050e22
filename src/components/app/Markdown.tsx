import { memo } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/** يسمح فقط بوسوم نصية بسيطة داخل مخرجات الموظفين (فاصل سطر، تمييز، مرتفع/منخفض). */
const schema = {
  ...defaultSchema,
  tagNames: ["br", "sub", "sup", "mark", "kbd", "abbr", ...(defaultSchema.tagNames ?? [])],
};

const HEX_ONLY = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu;

/** يستخرج ألوان HEX المذكورة في الرد (لوحات دانة وغيرها). */
export function paletteColors(body: string): string[] {
  const found = String(body ?? "").match(/#[0-9a-f]{6}\b/giu) ?? [];
  return [...new Set(found.map((c) => c.toUpperCase()))].slice(0, 10);
}

/** لوحة ألوان حقيقية أسفل أي رد يقترح ٣ ألوان أو أكثر؛ الضغط ينسخ الكود. */
function PaletteStrip({ body }: { body: string }) {
  const colors = paletteColors(body);
  if (colors.length < 3) return null;
  return (
    <div className="not-prose mt-3 rounded-2xl border border-border bg-card p-3" aria-label="لوحة الألوان">
      <div className="flex h-14 overflow-hidden rounded-xl border border-border">
        {colors.map((c) => (
          <span key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" dir="ltr">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title="انسخ اللون"
            onClick={() => void navigator.clipboard?.writeText(c)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 font-mono text-[0.7rem] text-muted-foreground hover:text-foreground"
          >
            <span aria-hidden className="size-3 rounded-full border border-border" style={{ backgroundColor: c }} />
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/** عرض مخرجات الموظفين بتنسيق Markdown كامل (جداول، قوائم، عناوين، أكواد) بشكل احترافي وRTL. */
function MarkdownView({
  body,
  className,
  onOpenApp,
}: {
  body: string;
  className?: string;
  /** يفتح مسار داخلي (/app/...) داخل المحادثة نفسها؛ يرجع true إذا تعامل معه. */
  onOpenApp?: (path: string) => boolean;
}) {
  return (
    <div
      dir="auto"
      className={cn(
        "prose prose-sm min-w-0 max-w-full text-foreground [overflow-wrap:anywhere] prose-headings:font-display prose-headings:font-black",
        "prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-li:my-0.5",
        "prose-a:text-primary prose-a:underline-offset-4 prose-strong:font-bold",
        "prose-table:my-0 prose-table:text-sm prose-th:bg-secondary/60 prose-th:p-2",
        "break-words [&_pre]:max-w-full",
        "prose-td:p-2 prose-th:border prose-td:border prose-th:border-border prose-td:border-border",
        "prose-img:my-3 prose-img:max-h-[22rem] prose-img:w-auto prose-img:max-w-[min(20rem,78vw)] prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:object-contain",
        "prose-hr:my-4 prose-blockquote:border-s-2 prose-blockquote:border-e-0 prose-blockquote:ps-3",
        "prose-blockquote:not-italic prose-blockquote:text-muted-foreground",
        "prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-secondary prose-pre:text-foreground",
        // الأكواد دائماً بالاتجاه اللاتيني حتى لا تتشوّه وسوم HTML داخل واجهة عربية
        "[&_pre]:text-left [&_pre]:[direction:ltr] [&_pre_code]:[unicode-bidi:plaintext]",
        "[&_td>code]:[direction:ltr] [&_td>code]:inline-block",
        // الجداول: أعمدة مقروءة بدل حشر النص
        "[&_table]:w-full [&_th]:align-top [&_td]:align-top [&_td]:leading-6",
        "[&_th]:min-w-[6rem] [&_td]:min-w-[9rem] [&_td]:max-w-[22rem]",
        className,
      )}
    >
      <MessageResponse
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          p: ({ children }) => <p dir="auto">{children}</p>,
          li: ({ children }) => <li dir="auto">{children}</li>,
          h1: ({ children }) => <h1 dir="auto">{children}</h1>,
          h2: ({ children }) => <h2 dir="auto">{children}</h2>,
          h3: ({ children }) => <h3 dir="auto">{children}</h3>,
          h4: ({ children }) => <h4 dir="auto">{children}</h4>,
          h5: ({ children }) => <h5 dir="auto">{children}</h5>,
          h6: ({ children }) => <h6 dir="auto">{children}</h6>,
          pre: ({ children }) => (
            <pre dir="ltr" tabIndex={0}>
              {children}
            </pre>
          ),
          code: ({ children, className: codeClass }) => {
            const text = typeof children === "string" ? children.trim() : "";
            const hex = HEX_ONLY.test(text) ? text : null;
            return (
              <code dir="auto" className={cn("[unicode-bidi:isolate]", hex && "inline-flex items-center gap-1", codeClass)}>
                {hex ? <span aria-hidden className="inline-block size-3 rounded-full border border-border" style={{ backgroundColor: hex }} /> : null}
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div
              className="my-3 w-full min-w-0 overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-ring"
              role="region"
              aria-label="جدول النتائج"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
          ...(onOpenApp
            ? {
                a: ({ href, children, ...rest }) => {
                  const path = typeof href === "string" ? href : "";
                  if (path.startsWith("/app")) {
                    return (
                      <Button
                        type="button"
                        variant="link"
                        className="text-primary underline underline-offset-4"
                        onClick={() => {
                          onOpenApp(path);
                        }}
                      >
                        {children}
                      </Button>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noreferrer" {...rest}>
                      {children}
                    </a>
                  );
                },
              }
            : {}),
        }}
      >
        {body}
      </MessageResponse>
      <PaletteStrip body={body} />
    </div>
  );
}

/** الرسائل القديمة لا يعاد تحليل Markdown الخاص بها مع كل جزء يصل من البث. */
export const Markdown = memo(
  MarkdownView,
  (previous, next) => previous.body === next.body && previous.className === next.className,
);
