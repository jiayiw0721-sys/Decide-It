import { describe, expect, it } from "vitest";
import { filterableTemplates, getFilteredStarterOptions, getLocalizedTemplate, getFilterLabels, getRefreshedStarterOptions } from "../shared/templateFilters";

describe("template filter candidate generation", () => {
  it("returns food choices that meet a compatible selection", () => {
    const labels = getFilteredStarterOptions(filterableTemplates.food, ["light", "solo", "easy"]).map((item) => item.label);
    expect(labels).toContain("清爽沙拉");
  });

  it("keeps at least two starter choices when an exact combination is sparse", () => {
    const choices = getFilteredStarterOptions(filterableTemplates.place, ["quiet", "open", "walk"]);
    expect(choices.length).toBeGreaterThanOrEqual(2);
  });

  it("returns multiple regional specialties when a cuisine region is selected", () => {
    const labels = getFilteredStarterOptions(filterableTemplates.food, ["sichuan"]).map((item) => item.label);
    expect(labels).toContain("重庆小面");
    expect(labels).toContain("酸菜鱼");
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps regional food candidates within the editable eight-choice limit", () => {
    const choices = getFilteredStarterOptions(filterableTemplates.food, ["warm"]);
    expect(choices.length).toBeLessThanOrEqual(8);
  });

  it("localizes food filters, regional tags, and generated candidates in English", () => {
    const englishFood = getLocalizedTemplate(filterableTemplates.food, "en");
    const labels = getFilteredStarterOptions(englishFood, ["sichuan"]).map((item) => item.label);
    expect(englishFood.question).toBe("What should I eat today?");
    expect(englishFood.filters.find((filter) => filter.id === "region")?.label).toBe("Which regional flavor?");
    expect(getFilterLabels(englishFood, ["sichuan"])).toEqual(["Sichuan & Chongqing"]);
    expect(labels).toContain("Chongqing noodles");
    expect(labels).toContain("Pickled mustard fish");
  });

  it("refreshes a template group without immediately repeating its previous candidates", () => {
    const firstGroup = getFilteredStarterOptions(filterableTemplates.food, []);
    const refreshedGroup = getRefreshedStarterOptions(filterableTemplates.food, [], firstGroup.map((item) => item.label));
    expect(refreshedGroup.length).toBeGreaterThanOrEqual(2);
    expect(refreshedGroup.some((item) => firstGroup.some((previous) => previous.label === item.label))).toBe(false);
  });
});
