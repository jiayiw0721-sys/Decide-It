import { describe, expect, it } from "vitest";
import { filterableTemplates, getFilteredStarterOptions } from "../shared/templateFilters";

describe("template filter candidate generation", () => {
  it("returns food choices that meet a compatible selection", () => {
    const labels = getFilteredStarterOptions(filterableTemplates.food, ["light", "solo", "easy"]).map((item) => item.label);
    expect(labels).toContain("清爽沙拉");
  });

  it("keeps at least two starter choices when an exact combination is sparse", () => {
    const choices = getFilteredStarterOptions(filterableTemplates.place, ["quiet", "open", "walk"]);
    expect(choices.length).toBeGreaterThanOrEqual(2);
  });
});
