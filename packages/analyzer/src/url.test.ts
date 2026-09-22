import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import { request, type RequestOptions } from "node:https";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { inspectUrl } from "./url.js";

vi.mock("node:https", () => ({ request: vi.fn() }));

type Reply = {
  status?: number;
  location?: string;
  chunks?: Buffer[];
  error?: Error;
};
const replies: Reply[] = [];
const connections: Array<{ url: URL; options: RequestOptions }> = [];
const publicDns = () =>
  Promise.resolve([{ address: "93.184.216.34", family: 4 }]);
const origin = "https://app.example.com";

beforeEach(() => {
  replies.length = 0;
  connections.length = 0;
  vi.mocked(request).mockImplementation(((
    url: URL,
    options: RequestOptions,
    callback: (response: IncomingMessage) => void,
  ) => {
    connections.push({ url: new URL(url), options });
    const reply = replies.shift();
    if (!reply) throw new Error("Unexpected network request");
    const req = new EventEmitter();
    return Object.assign(req, {
      end() {
        queueMicrotask(() => {
          if (reply.error) {
            req.emit("error", reply.error);
            return;
          }
          const response = Object.assign(
            Readable.from(reply.chunks ?? [Buffer.from("hello")]),
            {
              statusCode: reply.status ?? 200,
              headers: {
                "content-type": "text/html",
                ...(reply.location ? { location: reply.location } : {}),
              },
            },
          );
          callback(response as unknown as IncomingMessage);
        });
      },
    }) as unknown as ClientRequest;
  }) as typeof request);
});

describe("bounded HTTPS inspection", () => {
  it("pins the validated address while retaining the TLS hostname and dropping ambient state", async () => {
    replies.push({});
    await expect(
      inspectUrl(`${origin}/start`, [origin], publicDns),
    ).resolves.toEqual({
      finalUrl: `${origin}/start`,
      status: 200,
      bytes: 5,
      contentType: "text/html",
    });
    const connection = connections[0]!;
    expect(connection.url.hostname).toBe("app.example.com");
    expect(connection.options.agent).toBe(false);
    expect(connection.options.family).toBe(4);
    expect(connection.options.rejectUnauthorized).not.toBe(false);
    expect(connection.options.headers).toEqual({
      "user-agent": "WebToApp-Analyzer/0.1",
      "accept-encoding": "identity",
    });
    const callback = vi.fn();
    connection.options.lookup!("app.example.com", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });

  it("rechecks DNS on same-origin redirects and rejects rebinding before another connection", async () => {
    replies.push({ status: 302, location: "/next" });
    const dns = vi
      .fn()
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(inspectUrl(origin, [origin], dns)).rejects.toThrow(
      "non-public address",
    );
    expect(dns).toHaveBeenCalledTimes(2);
    expect(connections).toHaveLength(1);
  });

  it.each([
    "https://other.example.com",
    "http://app.example.com",
    "https://user:secret@app.example.com",
    "https://app.example.com:8443",
  ])("rejects redirect to %s", async (location) => {
    replies.push({ status: 302, location });
    await expect(inspectUrl(origin, [origin], publicDns)).rejects.toThrow(
      "explicitly allowed HTTPS origin",
    );
    expect(connections).toHaveLength(1);
  });

  it("follows relative redirects and validates every resolved target", async () => {
    replies.push({ status: 307, location: "./next" }, {});
    const dns = vi.fn(publicDns);
    const result = await inspectUrl(`${origin}/path/start`, [origin], dns);
    expect(result.finalUrl).toBe(`${origin}/path/next`);
    expect(dns).toHaveBeenCalledTimes(2);
  });

  it("rejects a fourth redirect", async () => {
    for (let i = 0; i < 4; i++)
      replies.push({ status: 302, location: "/again" });
    await expect(inspectUrl(origin, [origin], publicDns)).rejects.toThrow(
      "excessive redirects",
    );
    expect(connections).toHaveLength(4);
  });

  it("rejects redirects without a location", async () => {
    replies.push({ status: 302 });
    await expect(inspectUrl(origin, [origin], publicDns)).rejects.toThrow(
      "Invalid or excessive redirects",
    );
  });

  it("aborts oversized streamed responses", async () => {
    replies.push({ chunks: [Buffer.alloc(2 * 1024 * 1024), Buffer.from("x")] });
    await expect(inspectUrl(origin, [origin], publicDns)).rejects.toThrow(
      "exceeds 2 MiB",
    );
  });

  it("propagates TLS failure without retry or bypass", async () => {
    replies.push({ error: new Error("CERT_HAS_EXPIRED") });
    await expect(inspectUrl(origin, [origin], publicDns)).rejects.toThrow(
      "CERT_HAS_EXPIRED",
    );
    expect(connections).toHaveLength(1);
  });
});
