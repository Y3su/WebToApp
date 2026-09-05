import { describe, expect, it } from "vitest";

import { createApi } from "./api";
import example from "../../../../packages/app-spec/examples/url-app.json";

describe("control-plane API", () => {
  it("validates a revision without trusting client ownership claims", async () => {
    const response = await createApi().request("/v1/app-spec/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(example),
    });
    expect(response.status).toBe(200);
    const report = (await response.json()) as {
      sha256: string;
      persisted: boolean;
      policy: { classification: string };
    };
    expect(report.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.persisted).toBe(false);
    expect(report.policy.classification).not.toBe("ready");
  });
  it("rejects malformed and oversized input", async () => {
    const app = createApi();
    expect(
      (
        await app.request("/v1/app-spec/validate", {
          method: "POST",
          body: "{",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request("/v1/app-spec/validate", {
          method: "POST",
          body: "{}",
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await app.request("/v1/app-spec/validate", {
          method: "POST",
          body: "x".repeat(262145),
        })
      ).status,
    ).toBe(413);
  });
  it("returns bounded health metadata", async () => {
    const response = await createApi().request("http://localhost/v1/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "webtoapp-control-plane",
    });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("uses the public error envelope", async () => {
    const response = await createApi().request("http://localhost/v1/missing");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(body).toMatchObject({ code: "not_found", details: {} });
    expect(body.requestId).toEqual(expect.any(String));
  });
});
