import { describe, expect, it } from "vitest";

describe("TMDb integration", () => {
  it("accepts the configured server-side token", async () => {
    const token = process.env.TMDB_API_TOKEN;
    expect(token).toBeTruthy();

    const response = await fetch("https://api.themoviedb.org/3/configuration", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok).toBe(true);
  }, 15_000);
});
