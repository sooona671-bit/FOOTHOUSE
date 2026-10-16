import { describe, expect, it } from "vitest";
import { discountPct, filterProducts, npr } from "@/lib/shop";
import { newArrivals } from "@/data/sample-catalog";

const base = { description: "", sizes: ["40", "41"], colors: ["Black"], stock: 3 };
const list = [
  { ...base, name: "Runner", category: "Sneakers", price: 5000 },
  { ...base, name: "Derby", category: "Formal", price: 9000, colors: ["Brown"], stock: 0 },
];

describe("shop rules", () => {
  it("formats prices in NPR", () => expect(npr(12500)).toBe("NPR 12,500"));
  it("preserves fractional amounts without currency conversion", () => expect(npr(12500.75)).toBe("NPR 12,500.75"));
  it("keeps legacy catalog amounts unchanged with NPR currency", () => {
    expect(newArrivals.map((p) => p.price)).toEqual([
      { amount: 220, currency: "NPR" },
      { amount: 180, currency: "NPR" },
      { amount: 290, currency: "NPR" },
    ]);
    expect(newArrivals[0]?.compareAtPrice).toEqual({ amount: 260, currency: "NPR" });
  });
  it("computes discount percent", () => expect(discountPct(7500, 10000)).toBe(25));
  it("filters by category", () => expect(filterProducts(list, { category: "Formal" }).map((p) => p.name)).toEqual(["Derby"]));
  it("filters by colour", () => expect(filterProducts(list, { color: "black" }).map((p) => p.name)).toEqual(["Runner"]));
  it("filters by max price", () => expect(filterProducts(list, { max: 6000 }).map((p) => p.name)).toEqual(["Runner"]));
  it("filters out sold-out items", () => expect(filterProducts(list, { inStock: true }).map((p) => p.name)).toEqual(["Runner"]));
  it("searches by name", () => expect(filterProducts(list, { q: "der" }).map((p) => p.name)).toEqual(["Derby"]));
});
