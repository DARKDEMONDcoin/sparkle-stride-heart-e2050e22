import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const MAX_BYTES = 14 * 1024 * 1024;

/**
 * تحويل صوت المستخدم إلى نص داخل مربع الإدخال — يبثّ النص أثناء التفريغ (SSE).
 * يتطلب جلسة مستخدم صالحة.
 */
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
        const key =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return Response.json({ error: "خدمة تحويل الصوت غير مهيّأة." }, { status: 500 });
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token || token.split(".").length !== 3) return Response.json({ error: "سجّل دخولك من جديد." }, { status: 401 });
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data: claims, error } = await supabase.auth.getClaims(token);
        if (error || !claims?.claims?.sub) return Response.json({ error: "سجّل دخولك من جديد." }, { status: 401 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "طلب غير صالح." }, { status: 400 });
        }
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 800) {
          return Response.json({ error: "التسجيل قصير جداً — اتكلم شوية أطول." }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: "التسجيل طويل جداً — قسّمه لأجزاء أقصر." }, { status: 413 });
        }

        const { getSecret } = await import("@/lib/secrets.server");
        const { usableLovableKey, reportLovableStatus } = await import("@/lib/ai-key-health.server");
        const apiKey = await usableLovableKey();
        const geminiKey = (await getSecret("GEMINI_API_KEY")) || (await getSecret("GOOGLE_API_KEY"));
        const mime = (file.type || "audio/webm").replace(/^video\//, "audio/").split(";")[0]!;

        // بديل يعمل على أي استضافة: Gemini مباشرة، بنفس شكل أحداث البث الذي تقرأه الواجهة.
        const viaGemini = async (): Promise<Response | null> => {
          if (!geminiKey) return null;
          const bytes = new Uint8Array(await file.arrayBuffer());
          let bin = "";
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          const b64 = btoa(bin);
          // Gemini لا يعلن دعم webm/mp4 صراحة: نجرب النوع الأصلي ثم بديلاً متوافقاً.
          const types = Array.from(new Set([mime, mime.includes("webm") ? "audio/ogg" : mime.includes("mp4") ? "audio/aac" : mime]));
          for (const t of types) {
            const r = await geminiOnce(b64, t);
            if (r) return r;
          }
          return null;
        };
        const geminiOnce = async (b64: string, mimeType: string): Promise<Response | null> => {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [
                { text: "اكتب نص هذا التسجيل حرفياً بلغته ولهجته كما قيل، بلا أي تعليق أو مقدمة." },
                { inline_data: { mime_type: mimeType, data: b64 } },
              ] }],
            }),
            signal: request.signal,
          });
          if (!res.ok) {
            console.error(`[transcribe] gemini failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
            return null;
          }
          const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = (j.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("").trim();
          if (!text) return null;
          const sse = `data: ${JSON.stringify({ type: "transcript.text.delta", delta: text })}\n\ndata: ${JSON.stringify({ type: "transcript.text.done", text })}\n\ndata: [DONE]\n\n`;
          return new Response(sse, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
        };

        if (!apiKey) {
          const fallback = await viaGemini();
          return fallback ?? Response.json({ error: "خدمة تحويل الصوت غير مهيّأة." }, { status: 500 });
        }
        const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
        const upstreamForm = new FormData();
        upstreamForm.append("model", "google/gemini-3.5-transcribe");
        upstreamForm.append("file", new File([await file.arrayBuffer()], `voice.${ext}`, { type: mime }));
        upstreamForm.append("stream", "true");

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstreamForm,
          signal: request.signal,
        });
        if (!upstream.ok || !upstream.body) {
          const body = await upstream.text().catch(() => "");
          reportLovableStatus(upstream.status, "transcribe");
          console.error(`[transcribe] failed [${upstream.status}]: ${body.slice(0, 300)}`);
          if (upstream.status === 401 || upstream.status === 403 || upstream.status >= 500) {
            const fallback = await viaGemini();
            if (fallback) return fallback;
          }
          const message =
            upstream.status === 402
              ? "رصيد الذكاء الاصطناعي خلص — اشحن الرصيد وجرب تاني."
              : upstream.status === 429
                ? "ضغط كبير دلوقتي — جرب تاني بعد لحظات."
                : upstream.status === 400
                  ? "ماقدرتش أسمع التسجيل — جرب تاني بصوت أوضح."
                  : "تعذّر تحويل الصوت لنص — جرب تاني.";
          return Response.json({ error: message }, { status: upstream.status === 429 || upstream.status === 402 ? upstream.status : 502 });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
