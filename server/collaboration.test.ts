import { describe, expect, it } from "vitest";
import { getVoteOutcome, resolveVoteOutcome } from "../shared/collaboration";
import type { ChoiceOption } from "../shared/decision";

const options: ChoiceOption[] = [
  { id: "a", label: "选项 A", preference: "neutral" },
  { id: "b", label: "选项 B", preference: "neutral" },
  { id: "c", label: "选项 C", preference: "neutral" },
];

describe("shared decision voting", () => {
  it("returns the single highest-voted option as the winner", () => {
    expect(getVoteOutcome(options, [{ optionId: "a" }, { optionId: "a" }, { optionId: "b" }])).toEqual({ kind: "winner", candidateIds: ["a"] });
  });

  it("returns tied leaders for a fair tiebreak", () => {
    expect(getVoteOutcome(options, [{ optionId: "a" }, { optionId: "b" }])).toEqual({ kind: "tie", candidateIds: ["a", "b"] });
  });

  it("uses the random selector only when a tie remains", () => {
    expect(resolveVoteOutcome(options, [{ optionId: "a" }, { optionId: "b" }], () => 0.9).option.id).toBe("b");
  });
});

