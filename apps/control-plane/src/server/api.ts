import { Hono } from "hono";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import {
  appSpecV1Schema,
  validateAppSpec,
  freezeAppSpecRevision,
} from "@webtoapp/app-spec";
import { evaluatePolicy } from "@webtoapp/policy-engine";

export type ApiBindings = {
  Variables: {
    requestId: string;
  };
};

export function createApi() {
  const app = new Hono<ApiBindings>();

  app.use("*", requestId());
  app.use("*", secureHeaders());
  app.use("*", logger());
  app.use(
    "*",
    bodyLimit({
      maxSize: 256 * 1024,
      onError: (context) =>
        context.json(
          { code: "body_too_large", requestId: context.get("requestId") },
          413,
        ),
    }),
  );

  app.get("/v1/app-spec/schema", (context) => context.json(appSpecV1Schema));
  app.get("/v1/openapi.json", (context) =>
    context.json({
      openapi: "3.1.0",
      info: { title: "WebToApp Preview API", version: "0.1.0-alpha.1" },
      paths: {
        "/v1/health": {
          get: { responses: { "200": { description: "Service health" } } },
        },
        "/v1/app-spec/schema": {
          get: {
            responses: {
              "200": { description: "Canonical AppSpecV1 JSON Schema" },
            },
          },
        },
        "/v1/app-spec/validate": {
          post: {
            summary:
              "Validate and hash without persistence or network inspection",
            requestBody: {
              required: true,
              content: { "application/json": { schema: appSpecV1Schema } },
            },
            responses: {
              "200": {
                description: "Valid configuration, digest and policy findings",
              },
              "400": { description: "Malformed JSON" },
              "413": { description: "Payload too large" },
              "422": { description: "Invalid AppSpec" },
            },
          },
        },
      },
    }),
  );
  app.post("/v1/app-spec/validate", async (context) => {
    let input: unknown;
    try {
      input = await context.req.json();
    } catch {
      return context.json(
        { code: "invalid_json", requestId: context.get("requestId") },
        400,
      );
    }
    const result = validateAppSpec(input);
    if (!result.success)
      return context.json({ valid: false, issues: result.issues }, 422);
    const revision = freezeAppSpecRevision(result.value);
    return context.json({
      valid: true,
      sha256: revision.sha256,
      // Caller-supplied ownership claims never count as live domain verification.
      policy: evaluatePolicy(result.value, { verifiedDomains: [] }),
      persisted: false,
    });
  });

  app.get("/v1/health", (context) =>
    context.json({
      status: "ok",
      service: "webtoapp-control-plane",
      version: "0.0.0",
      requestId: context.get("requestId"),
    }),
  );

  app.get("/v1/meta", (context) =>
    context.json({
      appSpecVersions: ["1.0"],
      buildTargets: ["android", "ios", "windows", "macos", "linux"],
      sourceKinds: ["url", "static"],
      requestId: context.get("requestId"),
    }),
  );

  app.notFound((context) =>
    context.json(
      {
        code: "not_found",
        message: "The requested resource does not exist.",
        details: {},
        requestId: context.get("requestId"),
      },
      404,
    ),
  );

  app.onError((error, context) => {
    console.error("Unhandled API error", {
      error: error instanceof Error ? error.message : "unknown",
      requestId: context.get("requestId"),
    });
    return context.json(
      {
        code: "internal_error",
        message: "The request could not be completed.",
        details: {},
        requestId: context.get("requestId"),
      },
      500,
    );
  });

  return app;
}

export const api = createApi();
