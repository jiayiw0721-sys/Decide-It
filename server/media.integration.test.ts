import { describe, expect, it } from "vitest";
import { browseMedia } from "./media";

describe("media candidate integration", () => {
  it("returns concrete trending movie candidates from TMDb", async () => {
    const results = await browseMedia("movie");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({ kind: "movie" });
    expect(results[0]?.title).toBeTruthy();
  }, 20_000);
});
