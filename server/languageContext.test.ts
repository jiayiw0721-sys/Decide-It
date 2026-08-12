import { describe, expect, it } from "vitest";
import { resolveInitialLanguage } from "../client/src/contexts/LanguageContext";

describe("resolveInitialLanguage", () => {
  it("restores the saved English preference when no URL language is requested", () => {
    expect(resolveInitialLanguage("", "en")).toBe("en");
  });

  it("allows an explicit URL language to override the saved preference for previewing", () => {
    expect(resolveInitialLanguage("?lang=zh", "en")).toBe("zh");
  });
});
