import { describe, expect, it } from "vitest";

import { shouldExpireLease } from "./lease.js";

describe("shouldExpireLease", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  it("expires an active lease at its deadline", () => {
    expect(shouldExpireLease("building", now, now)).toBe(true);
  });

  it("keeps an active lease before its deadline", () => {
    expect(
      shouldExpireLease("signing", new Date("2026-09-05T12:00:01.000Z"), now),
    ).toBe(false);
  });

  it("does not expire terminal states", () => {
    expect(
      shouldExpireLease("completed", new Date("2026-09-05T11:00:00.000Z"), now),
    ).toBe(false);
  });

  it("does not expire a missing lease", () => {
    expect(shouldExpireLease("leased", null, now)).toBe(false);
  });
});
