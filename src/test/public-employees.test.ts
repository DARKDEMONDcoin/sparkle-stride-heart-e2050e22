import { describe, expect, it } from "vitest";
import { getMember, team } from "@/data/team";
import { skillsByCategory } from "@/data/skills";

describe("public employee content", () => {
  it("keeps six complete, uniquely routed employee profiles", () => {
    expect(team).toHaveLength(6);
    expect(new Set(team.map((member) => member.id)).size).toBe(6);

    for (const member of team) {
      expect(getMember(member.id)).toBe(member);
      expect(member.tasks.length).toBeGreaterThanOrEqual(5);
      expect(member.workflow).toHaveLength(4);
      expect(member.comparison).toHaveLength(3);
      expect(member.faqs).toHaveLength(3);
      expect(member.apps.length).toBeGreaterThanOrEqual(9);
    }
  });

  it("returns no employee for an invalid public route id", () => {
    expect(getMember("missing-employee")).toBeUndefined();
  });
  it("provides substantial individual guides rather than repeated summaries", () => {
    for (const member of team) {
      const guide = member.guide;
      expect(guide.introduction).toHaveLength(2);
      expect(guide.responsibilities).toHaveLength(6);
      expect(guide.preparation).toHaveLength(3);
      expect(guide.deliverables).toHaveLength(2);
      expect(guide.review).toHaveLength(4);
      expect(guide.boundaries).toHaveLength(4);
      expect(guide.tools.length).toBeGreaterThan(0);
      for (const responsibility of guide.responsibilities) {
        expect(responsibility.description.length).toBeGreaterThan(220);
        expect(responsibility.input.length).toBeGreaterThan(35);
        expect(responsibility.output.length).toBeGreaterThan(35);
        expect(responsibility.request.length).toBeGreaterThan(55);
      }
      const groups = skillsByCategory(member.id);
      expect(groups.length).toBeGreaterThan(0);
      expect(groups.flatMap(([, skills]) => skills).length).toBeGreaterThan(0);
      const words = JSON.stringify(guide).split(/\s+/).length;
      expect(words).toBeGreaterThan(800);
    }
    expect(new Set(team.map((member) => member.guide.firstRequest)).size).toBe(6);
  });
});