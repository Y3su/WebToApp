import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop capability boundary", () => {
  it("starts blank and gates remote navigation on OS permission enforcement", () => {
    const source = readFileSync(
      new URL("../src-tauri/src/lib.rs", import.meta.url),
      "utf8",
    );
    const policy = readFileSync(
      new URL("../src-tauri/src/permissions.rs", import.meta.url),
      "utf8",
    );
    expect(source).toContain('url::Url::parse("about:blank")');
    expect(source).toContain("navigation_ready.load(Ordering::Acquire)");
    expect(source).toContain(".incognito(true)");
    expect(source).toContain(".on_download(|_, _| false)");
    expect(source.indexOf("install_preview_policy")).toBeLessThan(
      source.indexOf("ready.store(true"),
    );
    expect(policy).toContain("SetState(COREWEBVIEW2_PERMISSION_STATE_DENY)");
    expect(policy).not.toContain("COREWEBVIEW2_PERMISSION_STATE_ALLOW");
  });

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
