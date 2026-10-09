import { describe, expect, test } from "bun:test";

import { lovableKeyAlive, reportLovableStatus } from "../../src/lib/ai-key-health.server";
import { pcmToWav } from "../../src/lib/voice.server";

describe("AI key health on external hosting", () => {
  test("server errors do not disable the gateway key", () => {
    reportLovableStatus(500, "test");
    reportLovableStatus(429, "test");
    expect(lovableKeyAlive()).toBe(true);
  });

  test("a rejected key switches services to Gemini", () => {
    reportLovableStatus(401, "test");
    expect(lovableKeyAlive()).toBe(false);
  });

  test("Gemini speech PCM becomes a playable WAV file", () => {
    const wav = new Uint8Array(pcmToWav(new Uint8Array([1, 2, 3, 4]), 24_000));
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe("WAVE");
    expect(wav.length).toBe(48);
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(24_000);
  });
});
