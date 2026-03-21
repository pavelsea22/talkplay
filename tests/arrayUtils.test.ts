import { shuffle } from "../src/arrayUtils";

describe("shuffle", () => {
  it("returns the same array reference", () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr)).toBe(arr);
  });

  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result.sort()).toEqual(arr.sort());
  });

  it("handles an empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces different orderings over many runs", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(shuffle([...original]).join(","));
    }
    // Statistically near-impossible for 50 shuffles of 8 elements to all match
    expect(seen.size).toBeGreaterThan(1);
  });
});
