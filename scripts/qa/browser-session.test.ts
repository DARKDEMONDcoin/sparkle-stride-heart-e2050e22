import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createBrowserSession, BROWSER_PAYMENT_MESSAGE } from "../../src/lib/browser-session.server";
import { resetSecretsCache } from "../../src/lib/secrets.server";

const originalFetch = globalThis.fetch;
const originalPause = process.env.BROWSERBASE_SERVICE_PAUSE;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalPause === undefined) delete process.env.BROWSERBASE_SERVICE_PAUSE;
  else process.env.BROWSERBASE_SERVICE_PAUSE = originalPause;
  resetSecretsCache();
});

test("persistent payment pause prevents all session requests", async () => {
  process.env.BROWSERBASE_SERVICE_PAUSE = BROWSER_PAYMENT_MESSAGE;
  resetSecretsCache();
  let sessions = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    if (String(input).includes("api.browserbase.com")) sessions++;
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  await expect(createBrowserSession("test-key", { projectId: "test" })).rejects.toThrow("متطلبات الدفع (402)");
  await expect(createBrowserSession("test-key", { projectId: "test" })).rejects.toThrow("متطلبات الدفع (402)");
  expect(sessions).toBe(0);
});

test("all browser entry points share the session stop", () => {
  for (const file of ["src/lib/cloud-browser.server.ts", "src/lib/browser-agent.server.ts"]) {
    const text = readFileSync(file, "utf8");
    expect(text).toContain("createBrowserSession");
    expect(text).not.toContain("fetch(`${BB}/sessions`,");
  }
});