import { describe, expect, it, vi } from "vitest";
import {
  BridgeAbortError,
  BridgeMessageTooLargeError,
  BridgeProtocolError,
  BridgeRemoteError,
  BridgeTimeoutError,
  BridgeUnavailableError,
  WEB_TO_APP_PROTOCOL_VERSION,
  createWebToAppClient,
  isWebToAppClient,
  type BridgeRequest,
  type WebToAppTransport,
} from "../src/index.js";
import { encodeBridgeMessage } from "../src/codec.js";

class FakeTransport implements WebToAppTransport {
  public readonly protocolVersion = WEB_TO_APP_PROTOCOL_VERSION;
  public readonly channel = "test-native-channel";
  public readonly sent: string[] = [];
  public sendError: unknown;
  #listener: ((message: string) => void) | undefined;

  public send(message: string): void {
    if (this.sendError !== undefined) {
      throw this.sendError;
    }
    this.sent.push(message);
  }

  public subscribe(listener: (message: string) => void): () => void {
    this.#listener = listener;
    return () => {
      this.#listener = undefined;
    };
  }

  public lastRequest(): BridgeRequest {
    const serialized = this.sent.at(-1);
    if (serialized === undefined) {
      throw new Error("No request was sent.");
    }
    return JSON.parse(serialized) as BridgeRequest;
  }

  public reply(value: unknown): void {
    this.#listener?.(JSON.stringify(value));
  }
}

function createFixtureClient(transport: FakeTransport, start = 1) {
  let sequence = start;
  return createWebToAppClient(transport, {
    idFactory: () => `request-${sequence++}`,
  });
}

describe("WebToAppClient", () => {
  it("sends a typed request and resolves a matching native reply", async () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);

    const resultPromise = client.platform.getInfo();
    expect(transport.lastRequest()).toEqual({
      id: "request-1",
      method: "platform.getInfo",
      params: {},
    });

    transport.reply({
      id: "request-1",
      method: "platform.getInfo",
      ok: true,
      result: {
        platform: "android",
        runtimeVersion: "1.0.0",
        appVersion: "2.3.4",
        enabledMethods: ["platform.getInfo", "share.open"],
      },
    });

    await expect(resultPromise).resolves.toMatchObject({ platform: "android" });
  });

  it("maps a native error to BridgeRemoteError", async () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);
    const resultPromise = client.push.getToken();

    transport.reply({
      id: "request-1",
      method: "push.getToken",
      ok: false,
      error: {
        code: "capability_disabled",
        message: "Push is not enabled.",
        details: { capability: "push" },
      },
    });

    await expect(resultPromise).rejects.toMatchObject<
      Partial<BridgeRemoteError>
    >({
      name: "BridgeRemoteError",
      code: "capability_disabled",
      method: "push.getToken",
    });
  });

  it("times out and ignores a late reply", async () => {
    vi.useFakeTimers();
    try {
      const transport = new FakeTransport();
      const client = createFixtureClient(transport);
      const resultPromise = client.badge.set({ count: 3 }, { timeoutMs: 25 });
      const rejection =
        expect(resultPromise).rejects.toBeInstanceOf(BridgeTimeoutError);

      await vi.advanceTimersByTimeAsync(25);
      await rejection;

      transport.reply({
        id: "request-1",
        method: "badge.set",
        ok: true,
        result: { applied: true },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("supports cancellation before and after a request is sent", async () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);
    const preAborted = new AbortController();
    preAborted.abort();

    await expect(
      client.share.open({ text: "hello" }, { signal: preAborted.signal }),
    ).rejects.toBeInstanceOf(BridgeAbortError);
    expect(transport.sent).toHaveLength(0);

    const controller = new AbortController();
    const resultPromise = client.navigation.openExternal(
      { url: "https://example.com/path" },
      { signal: controller.signal },
    );
    expect(transport.sent).toHaveLength(1);
    controller.abort();
    await expect(resultPromise).rejects.toBeInstanceOf(BridgeAbortError);
  });

  it("rejects oversized serialized messages", () => {
    expect(() =>
      encodeBridgeMessage({ value: "x".repeat(256 * 1024) }),
    ).toThrow(BridgeMessageTooLargeError);
  });

  it("rejects an invalid matching reply and reports the protocol error", async () => {
    const transport = new FakeTransport();
    const onProtocolError = vi.fn();
    let sequence = 1;
    const client = createWebToAppClient(transport, {
      idFactory: () => `request-${sequence++}`,
      onProtocolError,
    });
    const resultPromise = client.files.save({
      url: "https://example.com/report.pdf",
      suggestedName: "report.pdf",
    });

    transport.reply({
      id: "request-1",
      method: "files.save",
      ok: true,
      result: { status: "invented" },
    });

    await expect(resultPromise).rejects.toBeInstanceOf(BridgeProtocolError);
    expect(onProtocolError).toHaveBeenCalledOnce();
  });

  it("rejects method-confused replies", async () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);
    const resultPromise = client.badge.set({ count: null });

    transport.reply({
      id: "request-1",
      method: "navigation.openExternal",
      ok: true,
      result: { opened: true },
    });

    await expect(resultPromise).rejects.toThrow("does not match badge.set");
  });

  it("rejects invalid URLs and traversal-like filenames", () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);

    expect(() =>
      client.navigation.openExternal({ url: "http://example.com" }),
    ).toThrow(BridgeProtocolError);
    expect(() =>
      client.files.save({
        url: "https://example.com/file",
        suggestedName: "../outside.txt",
      }),
    ).toThrow(BridgeProtocolError);
    expect(transport.sent).toHaveLength(0);
  });

  it("fails pending and future calls after disposal", async () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);
    const pending = client.push.getToken();
    client.dispose();

    await expect(pending).rejects.toBeInstanceOf(BridgeUnavailableError);
    await expect(client.push.getToken()).rejects.toBeInstanceOf(
      BridgeUnavailableError,
    );
  });

  it("fails closed when detecting structural lookalikes", () => {
    const transport = new FakeTransport();
    const client = createFixtureClient(transport);

    expect(isWebToAppClient(client)).toBe(true);
    expect(isWebToAppClient({ ...client })).toBe(false);
    expect(isWebToAppClient(undefined)).toBe(false);
  });

  it("wraps transport send failures", async () => {
    const transport = new FakeTransport();
    transport.sendError = new Error("disconnected");
    const client = createFixtureClient(transport);

    await expect(client.push.getToken()).rejects.toBeInstanceOf(
      BridgeUnavailableError,
    );
  });
});
