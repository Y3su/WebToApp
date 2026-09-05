import {
  WEB_TO_APP_PROTOCOL_VERSION,
  type BridgeMethod,
  type BridgeParams,
  type BridgeReply,
  type BridgeResult,
  type FilesSaveParams,
  type NavigationOpenExternalParams,
  type PlatformInfo,
  type PushToken,
  type RequestOptions,
  type ShareOpenParams,
  type BadgeSetParams,
} from "./protocol.js";
import type { WebToAppTransport } from "./transport.js";
import {
  assertBridgeParams,
  assertRequestIdentifier,
  decodeBridgeMessage,
  encodeBridgeMessage,
  getCandidateReplyId,
  parseBridgeReply,
} from "./codec.js";
import {
  BridgeAbortError,
  BridgeProtocolError,
  BridgeRemoteError,
  BridgeTimeoutError,
  BridgeUnavailableError,
} from "./errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 120_000;
const knownClients = new WeakSet<object>();

export interface WebToAppClientOptions {
  defaultTimeoutMs?: number;
  idFactory?: () => string;
  onProtocolError?: (error: BridgeProtocolError) => void;
}

export interface WebToAppClient {
  readonly platform: {
    getInfo(options?: RequestOptions): Promise<PlatformInfo>;
  };
  readonly share: {
    open(
      params: ShareOpenParams,
      options?: RequestOptions,
    ): Promise<{ status: "shared" | "cancelled" }>;
  };
  readonly push: {
    getToken(options?: RequestOptions): Promise<PushToken>;
  };
  readonly badge: {
    set(
      params: BadgeSetParams,
      options?: RequestOptions,
    ): Promise<{ applied: boolean }>;
  };
  readonly navigation: {
    openExternal(
      params: NavigationOpenExternalParams,
      options?: RequestOptions,
    ): Promise<{ opened: boolean }>;
  };
  readonly files: {
    save(
      params: FilesSaveParams,
      options?: RequestOptions,
    ): Promise<{ status: "saved" | "cancelled"; fileName?: string }>;
  };
  request<M extends BridgeMethod>(
    method: M,
    params: BridgeParams<M>,
    options?: RequestOptions,
  ): Promise<BridgeResult<M>>;
  dispose(): void;
}

interface PendingRequest {
  readonly method: BridgeMethod;
  readonly resolve: (result: never) => void;
  readonly reject: (reason: unknown) => void;
  readonly timer: ReturnType<typeof setTimeout>;
  readonly signal: AbortSignal | undefined;
  readonly abortListener: (() => void) | undefined;
}

function validateTimeout(timeoutMs: number): number {
  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new RangeError(
      `timeoutMs must be greater than 0 and at most ${MAX_TIMEOUT_MS}.`,
    );
  }
  return timeoutMs;
}

function secureRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new BridgeUnavailableError(
      "A cryptographically secure randomUUID implementation is required for bridge requests.",
    );
  }
  return globalThis.crypto.randomUUID();
}

class DefaultWebToAppClient implements WebToAppClient {
  public readonly platform = Object.freeze({
    getInfo: (options?: RequestOptions) =>
      this.request("platform.getInfo", {}, options),
  });

  public readonly share = Object.freeze({
    open: (params: ShareOpenParams, options?: RequestOptions) =>
      this.request("share.open", params, options),
  });

  public readonly push = Object.freeze({
    getToken: (options?: RequestOptions) =>
      this.request("push.getToken", {}, options),
  });

  public readonly badge = Object.freeze({
    set: (params: BadgeSetParams, options?: RequestOptions) =>
      this.request("badge.set", params, options),
  });

  public readonly navigation = Object.freeze({
    openExternal: (
      params: NavigationOpenExternalParams,
      options?: RequestOptions,
    ) => this.request("navigation.openExternal", params, options),
  });

  public readonly files = Object.freeze({
    save: (params: FilesSaveParams, options?: RequestOptions) =>
      this.request("files.save", params, options),
  });

  readonly #transport: WebToAppTransport;
  readonly #defaultTimeoutMs: number;
  readonly #idFactory: () => string;
  readonly #onProtocolError: ((error: BridgeProtocolError) => void) | undefined;
  readonly #pending = new Map<string, PendingRequest>();
  readonly #unsubscribe: () => void;
  #disposed = false;

  public constructor(
    transport: WebToAppTransport,
    options: WebToAppClientOptions,
  ) {
    if (
      typeof transport !== "object" ||
      transport === null ||
      transport.protocolVersion !== WEB_TO_APP_PROTOCOL_VERSION ||
      typeof transport.channel !== "string" ||
      transport.channel.length === 0 ||
      typeof transport.send !== "function" ||
      typeof transport.subscribe !== "function"
    ) {
      throw new BridgeUnavailableError(
        "A valid WebToApp protocol v1 transport is required.",
      );
    }

    this.#transport = transport;
    this.#defaultTimeoutMs = validateTimeout(
      options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    this.#idFactory = options.idFactory ?? secureRequestId;
    this.#onProtocolError = options.onProtocolError;

    const unsubscribe = transport.subscribe((message) => {
      this.#receive(message);
    });
    if (typeof unsubscribe !== "function") {
      throw new BridgeUnavailableError(
        "Transport subscribe() must return an unsubscribe function.",
      );
    }
    this.#unsubscribe = unsubscribe;
  }

  public request<M extends BridgeMethod>(
    method: M,
    params: BridgeParams<M>,
    options: RequestOptions = {},
  ): Promise<BridgeResult<M>> {
    if (this.#disposed) {
      return Promise.reject(
        new BridgeUnavailableError("The WebToApp client is disposed."),
      );
    }

    assertBridgeParams(method, params);
    const timeoutMs = validateTimeout(
      options.timeoutMs ?? this.#defaultTimeoutMs,
    );

    if (options.signal?.aborted === true) {
      return Promise.reject(new BridgeAbortError(method));
    }

    let id = this.#idFactory();
    assertRequestIdentifier(id);
    for (let attempt = 0; this.#pending.has(id) && attempt < 3; attempt += 1) {
      id = this.#idFactory();
      assertRequestIdentifier(id);
    }
    if (this.#pending.has(id)) {
      throw new BridgeProtocolError(
        "Request ID factory produced repeated in-flight IDs.",
      );
    }

    const serialized = encodeBridgeMessage({ id, method, params });

    return new Promise<BridgeResult<M>>((resolve, reject) => {
      const abortListener = options.signal
        ? () => {
            this.#fail(id, new BridgeAbortError(method));
          }
        : undefined;
      const timer = setTimeout(() => {
        this.#fail(id, new BridgeTimeoutError(method, timeoutMs));
      }, timeoutMs);

      this.#pending.set(id, {
        method,
        resolve,
        reject,
        timer,
        signal: options.signal,
        abortListener,
      });
      options.signal?.addEventListener(
        "abort",
        abortListener as EventListener,
        { once: true },
      );

      try {
        const sendResult = this.#transport.send(serialized);
        if (sendResult !== undefined) {
          void Promise.resolve(sendResult).catch((error: unknown) => {
            this.#fail(
              id,
              new BridgeUnavailableError(
                "The native transport rejected the request.",
                {
                  cause: error,
                },
              ),
            );
          });
        }
      } catch (error) {
        this.#fail(
          id,
          new BridgeUnavailableError(
            "The native transport could not send the request.",
            {
              cause: error,
            },
          ),
        );
      }
    });
  }

  public dispose(): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;
    this.#unsubscribe();

    for (const id of [...this.#pending.keys()]) {
      this.#fail(
        id,
        new BridgeUnavailableError("The WebToApp client was disposed."),
      );
    }
  }

  #receive(serialized: string): void {
    let decoded: unknown;
    try {
      decoded = decodeBridgeMessage(serialized);
    } catch (error) {
      this.#reportProtocolError(error);
      return;
    }

    const candidateId = getCandidateReplyId(decoded);
    let reply: BridgeReply;
    try {
      reply = parseBridgeReply(decoded);
    } catch (error) {
      const protocolError =
        error instanceof BridgeProtocolError
          ? error
          : new BridgeProtocolError("Native reply could not be parsed.", {
              cause: error,
            });
      if (candidateId !== undefined && this.#pending.has(candidateId)) {
        this.#fail(candidateId, protocolError);
      }
      this.#reportProtocolError(protocolError);
      return;
    }

    const pending = this.#pending.get(reply.id);
    if (pending === undefined) {
      return;
    }
    if (pending.method !== reply.method) {
      const error = new BridgeProtocolError(
        `Native reply method ${reply.method} does not match ${pending.method}.`,
      );
      this.#fail(reply.id, error);
      this.#reportProtocolError(error);
      return;
    }

    this.#clearPending(reply.id, pending);
    if (reply.ok) {
      pending.resolve(reply.result as never);
      return;
    }
    pending.reject(
      new BridgeRemoteError(
        reply.method,
        reply.error.code,
        reply.error.message,
        reply.error.details,
      ),
    );
  }

  #reportProtocolError(error: unknown): void {
    if (error instanceof BridgeProtocolError) {
      this.#onProtocolError?.(error);
    }
  }

  #fail(id: string, error: unknown): void {
    const pending = this.#pending.get(id);
    if (pending === undefined) {
      return;
    }
    this.#clearPending(id, pending);
    pending.reject(error);
  }

  #clearPending(id: string, pending: PendingRequest): void {
    this.#pending.delete(id);
    clearTimeout(pending.timer);
    if (pending.abortListener !== undefined) {
      pending.signal?.removeEventListener("abort", pending.abortListener);
    }
  }
}

export function createWebToAppClient(
  transport: WebToAppTransport,
  options: WebToAppClientOptions = {},
): WebToAppClient {
  const client = new DefaultWebToAppClient(transport, options);
  knownClients.add(client);
  return client;
}

/**
 * Fail-closed detection for a client created by this SDK instance. Structural
 * lookalikes and page-defined native globals are deliberately not trusted.
 */
export function isWebToAppClient(value: unknown): value is WebToAppClient {
  return typeof value === "object" && value !== null && knownClients.has(value);
}
