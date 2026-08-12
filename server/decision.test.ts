import { describe, expect, it } from "vitest";
import { MAX_DECISION_HISTORY, pickOption, type ChoiceOption } from "../shared/decision";

const options: ChoiceOption[] = [
  { id: "a", label: "A", preference: "want" },
  { id: "b", label: "B", preference: "neutral" },
  { id: "c", label: "C", preference: "avoid" },
];

describe("pickOption", () => {
  it("removes the immediately previous result when another option exists", () => {
    const selected = pickOption(options, "fair", "a", () => 0);
    expect(selected.id).toBe("b");
  });

  it("uses equal-probability ordering in fair mode", () => {
    expect(pickOption(options, "fair", undefined, () => 0.99).id).toBe("c");
  });

  it("gives the strongest preference the earliest weighted interval", () => {
    expect(pickOption(options, "weighted", undefined, () => 0.01).id).toBe("a");
  });
});

describe("decision history configuration", () => {
  it("keeps the persisted history product limit at ten records", () => {
    expect(MAX_DECISION_HISTORY).toBe(10);
  });
});
