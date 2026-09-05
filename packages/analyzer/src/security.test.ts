import { describe, expect, it } from "vitest";
import { inspectUrl, isPublicAddress, validateTarget } from "./url.js";
import { inspectZip, validateEntryName } from "./zip.js";

describe("network boundary", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "192.0.2.1",
  ])("rejects %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
  it("allows a public address", () =>
    expect(isPublicAddress("1.1.1.1")).toBe(true));
  it.each([
    "http://example.com",
    "https://example.com@evil.test",
    "https://example.com:8443",
    "https://sub.example.com",
  ])("rejects origin bypass %s", (url) => {
    expect(() => validateTarget(url, ["https://example.com"])).toThrow();
  });
  it("fails closed on mixed DNS answers before connecting", async () => {
    await expect(
      inspectUrl("https://example.com", ["https://example.com"], () =>
        Promise.resolve([
          { address: "1.1.1.1", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ]),
      ),
    ).rejects.toThrow("non-public");
  });
});

describe("archive boundary", () => {
  it.each([
    "../index.html",
    "/index.html",
    "C:/index.html",
    "a\\b",
    "con.txt",
    "a/./b",
    "a//b",
    "a. /b",
  ])("rejects %s", (name) => {
    expect(() => validateEntryName(name)).toThrow();
  });
  it("accepts nested static assets", () =>
    expect(() => validateEntryName("assets/main-1.js")).not.toThrow());
  it("rejects malformed input", async () => {
    await expect(inspectZip(Buffer.from("not a zip"))).rejects.toThrow();
  });
});
