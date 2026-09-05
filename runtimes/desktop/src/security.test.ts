import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop capability boundary", () => {
  it("never grants the remote webapp window local commands", () => {
    const capability = JSON.parse(
      readFileSync(
        new URL("../src-tauri/capabilities/local-shell.json", import.meta.url),
        "utf8",
      ),
    ) as {
      windows: string[];
      remote?: unknown;
      permissions: string[];
    };
    expect(capability.windows).toEqual(["main"]);
    expect(capability.remote).toBeUndefined();
    expect(
      capability.permissions.some((permission) =>
        /shell|fs|http/.test(permission),
      ),
    ).toBe(false);
  });
});
