import { describe, expect, it } from "vitest";
import { matchesAudience } from "@/lib/categories";

describe("matchesAudience", () => {
  it("includes unisex products for Men and Women", () => {
    expect(matchesAudience("men", "men")).toBe(true);
    expect(matchesAudience("unisex", "men")).toBe(true);
    expect(matchesAudience("women", "men")).toBe(false);
    expect(matchesAudience("unisex", "women")).toBe(true);
  });

  it("keeps Kids separate and shows all products with no selection", () => {
    expect(matchesAudience("kids", "kids")).toBe(true);
    expect(matchesAudience("unisex", "kids")).toBe(false);
    expect(matchesAudience("women", "")).toBe(true);
    expect(matchesAudience(null, "")).toBe(true);
  });
});
