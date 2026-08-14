import { describe, expect, it } from "vitest";
import { appendLocalDecision, type LocalDecisionRecord } from "../shared/localHistory";

const input = {
  question: "今天吃什么？",
  options: [
    { id: "one", label: "重庆小面", preference: "neutral" as const },
    { id: "two", label: "兰州牛肉面", preference: "want" as const },
  ],
  mode: "fair" as const,
  chosenOption: "重庆小面",
  reason: "它和其他选项有同样的机会，今天刚好轮到它。",
};

describe("local decision history", () => {
  it("adds the latest guest decision to the front of the local history", () => {
    const records = appendLocalDecision([], input, "record-1", "2026-08-14T00:00:00.000Z");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: "record-1", chosenOption: "重庆小面" });
  });

  it("keeps only the latest ten local decisions", () => {
    const existing: LocalDecisionRecord[] = Array.from({ length: 10 }, (_, index) => ({
      ...input,
      id: `old-${index}`,
      createdAt: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    }));
    const records = appendLocalDecision(existing, input, "latest", "2026-08-14T00:00:00.000Z");
    expect(records).toHaveLength(10);
    expect(records[0]?.id).toBe("latest");
    expect(records.some((record) => record.id === "old-9")).toBe(false);
  });
});
