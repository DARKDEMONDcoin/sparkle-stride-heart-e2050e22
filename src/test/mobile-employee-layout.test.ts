import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const rule = (selector: string) => {
  const start = css.lastIndexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start) + 1);
};

describe("Employee mobile layout regressions", () => {
  it("lets employee tool pages scroll without changing transcript scroll ownership", () => {
    const tools = rule(".is-chat-shell main:not(:has(.chat-command-layout))");
    expect(tools).toContain("overflow-y: auto");
    expect(tools).toContain("touch-action: pan-y");
    expect(tools).toContain("padding-top: 5rem");
    expect(rule(".is-chat-shell main")).toContain("overflow: hidden");
    expect(rule(".is-chat-shell .chat-message-column")).toContain("scroll-padding-top");
  });

  it("reserves portrait and text space rather than compressing welcome children", () => {
    expect(rule(".is-chat-shell .chat-welcome > *")).toContain("flex-shrink: 0");
    expect(rule(".is-chat-shell .chat-welcome-portraits")).toContain("height: 5.5rem");
    expect(rule(".is-chat-shell .chat-welcome-eyebrow")).toContain("overflow-wrap: anywhere");
  });
});