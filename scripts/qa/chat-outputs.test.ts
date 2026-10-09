import { describe, expect, test } from "bun:test";
import { composeChatOutputs, readChatOutputs } from "../../src/lib/chat-outputs";

describe("chat-first delivery", () => {
  test("retains every full deliverable for all employee types", () => {
    for (const employee of ["sonny", "eva", "sam", "nour", "dana", "adam"]) {
      const outputs = [1, 2, 3].map((n) => ({
        title: `${employee} ${n}`,
        body: `Complete output ${n} ${employee}`,
      }));
      const reply = composeChatOutputs("Summary", outputs);
      outputs.forEach((output) => expect(reply).toContain(output.body));
      expect(reply).not.toContain("/app/tasks");
    }
  });
  test("does not duplicate complete content", () => {
    expect(composeChatOutputs("first\nsecond", [{ body: "first" }, { body: "second" }])).toBe(
      "first\nsecond",
    );
  });
  test("single output stays unchanged", () =>
    expect(composeChatOutputs("full", [{ body: "full" }])).toBe("full"));
  test("recovers a missing single legacy output", () =>
    expect(composeChatOutputs("summary", [{ body: "complete legacy output" }])).toContain("complete legacy output"));
  test("rejects invalid persisted outputs", () => {
    expect(readChatOutputs(null)).toEqual([]);
    expect(readChatOutputs([{ body: "" }, { body: 12 }, { body: "ready" }])).toHaveLength(1);
  });
});
