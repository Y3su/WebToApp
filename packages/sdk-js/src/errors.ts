import type { BridgeMethod, JsonValue } from "./protocol.js";

export class WebToAppError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class BridgeProtocolError extends WebToAppError {}

export class BridgeMessageTooLargeError extends BridgeProtocolError {
  public readonly actualBytes: number;
  public readonly maximumBytes: number;

  public constructor(actualBytes: number, maximumBytes: number) {
    super(
      `Bridge message is ${actualBytes} bytes; maximum is ${maximumBytes} bytes.`,
    );
    this.actualBytes = actualBytes;
    this.maximumBytes = maximumBytes;
  }
}

export class BridgeUnavailableError extends WebToAppError {}

export class BridgeTimeoutError extends WebToAppError {
  public readonly method: BridgeMethod;
  public readonly timeoutMs: number;

  public constructor(method: BridgeMethod, timeoutMs: number) {
    super(`Native method ${method} did not reply within ${timeoutMs} ms.`);
    this.method = method;
    this.timeoutMs = timeoutMs;
  }
}

export class BridgeAbortError extends WebToAppError {
  public readonly method: BridgeMethod;

  public constructor(method: BridgeMethod) {
    super(`Native method ${method} was cancelled.`);
    this.name = "AbortError";
    this.method = method;
  }
}

export class BridgeRemoteError extends WebToAppError {
  public readonly code: string;
  public readonly method: BridgeMethod;
  public readonly details: JsonValue | undefined;

  public constructor(
    method: BridgeMethod,
    code: string,
    message: string,
    details?: JsonValue,
  ) {
    super(message);
    this.code = code;
    this.method = method;
    this.details = details;
  }
}
