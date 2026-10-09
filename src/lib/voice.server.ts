/** تحويل النص إلى صوت: بوابة Lovable أولاً، ثم Gemini TTS على أي استضافة. */
import { geminiKey, reportLovableStatus, usableLovableKey } from "./ai-key-health.server";

export function speakableText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`|~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3500);
}

export type Speech = { bytes: ArrayBuffer; mime: string };

/** يغلّف PCM خام (16-bit mono) في ملف WAV يشغّله أي متصفح. */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24_000): ArrayBuffer {
  const out = new ArrayBuffer(44 + pcm.byteLength);
  const v = new DataView(out);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.byteLength, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(out, 44).set(pcm);
  return out;
}

async function viaGemini(input: string): Promise<Speech | null> {
  const key = await geminiKey();
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `اقرأ بالعربية بنبرة دافئة وواضحة وسرعة طبيعية:\n${input}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!res.ok) {
    console.error(`[voice] gemini tts failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
    if (res.status === 429) throw new Error("ضغط كبير الآن، جرّب بعد دقيقة.");
    return null;
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!part?.data) return null;
  const bin = atob(part.data);
  const pcm = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
  const mime = part.mimeType ?? "";
  if (/mpeg|mp3|wav|ogg/.test(mime)) return { bytes: pcm.buffer, mime };
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24_000);
  return { bytes: pcmToWav(pcm, rate), mime: "audio/wav" };
}

export async function synthesizeSpeech(text: string): Promise<Speech> {
  const input = speakableText(text);
  if (!input) throw new Error("لا يوجد نص قابل للقراءة.");
  const key = await usableLovableKey();
  if (key) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        voice: "alloy",
        input,
        response_format: "mp3",
        instructions: "تحدّث بالعربية بنبرة دافئة وواضحة وسرعة طبيعية.",
      }),
    }).catch(() => null);
    if (res?.ok) return { bytes: await res.arrayBuffer(), mime: "audio/mpeg" };
    if (res) {
      reportLovableStatus(res.status, "voice");
      console.error(`[voice] tts failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
    }
  }
  const fallback = await viaGemini(input);
  if (fallback) return fallback;
  throw new Error(key ? "تعذّر تحويل الرد إلى صوت." : "خدمة الصوت غير مهيّأة.");
}
