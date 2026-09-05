import {
  BRIDGE_METHODS,
  MAX_BRIDGE_MESSAGE_BYTES,
  type BridgeMethod,
  type BridgeParams,
  type BridgeReply,
  type BridgeResult,
  type JsonValue,
} from "./protocol.js";
import { BridgeMessageTooLargeError, BridgeProtocolError } from "./errors.js";

const textEncoder = new TextEncoder();
const bridgeMethods = new Set<string>(BRIDGE_METHODS);
const identifierPattern = /^[A-Za-z0-9._:-]{1,128}$/u;
const mimeTypePattern =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/iu;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(
  value: UnknownRecord,
  allowedKeys: readonly string[],
): boolean {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNonEmptyString(
  value: unknown,
  maximumLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength
  );
}

function isOptionalString(
  value: UnknownRecord,
  key: string,
  maximumLength: number,
): boolean {
  return !(key in value) || isNonEmptyString(value[key], maximumLength);
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value, 2048)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && url.username === "" && url.password === ""
    );
  } catch {
    return false;
  }
}

function isSafeSuggestedName(value: unknown): value is string {
  return (
    isNonEmptyString(value, 255) &&
    value !== "." &&
    value !== ".." &&
    // Control characters are intentionally rejected in file suggestions.
    // eslint-disable-next-line no-control-regex
    !/[\\/\u0000-\u001f\u007f]/u.test(value) &&
    value.trim() === value
  );
}

function assertEmptyParams(
  params: unknown,
): asserts params is Record<string, never> {
  if (!isRecord(params) || Object.keys(params).length !== 0) {
    throw new BridgeProtocolError("Method requires an empty params object.");
  }
}

export function isBridgeMethod(value: unknown): value is BridgeMethod {
  return typeof value === "string" && bridgeMethods.has(value);
}

export function assertBridgeParams<M extends BridgeMethod>(
  method: M,
  params: unknown,
): asserts params is BridgeParams<M> {
  switch (method) {
    case "platform.getInfo":
    case "push.getToken": {
      assertEmptyParams(params);
      return;
    }
    case "share.open": {
      if (
        !isRecord(params) ||
        !hasOnlyKeys(params, ["title", "text", "url"]) ||
        !isOptionalString(params, "title", 512) ||
        !isOptionalString(params, "text", 16_384) ||
        ("url" in params && !isHttpsUrl(params.url)) ||
        !("title" in params || "text" in params || "url" in params)
      ) {
        throw new BridgeProtocolError(
          "share.open requires at least one valid title, text, or HTTPS URL.",
        );
      }
      return;
    }
    case "badge.set": {
      if (
        !isRecord(params) ||
        !hasOnlyKeys(params, ["count"]) ||
        !("count" in params) ||
        !(
          params.count === null ||
          (typeof params.count === "number" &&
            Number.isSafeInteger(params.count) &&
            params.count >= 0)
        )
      ) {
        throw new BridgeProtocolError(
          "badge.set requires a non-negative integer or null.",
        );
      }
      return;
    }
    case "navigation.openExternal": {
      if (
        !isRecord(params) ||
        !hasOnlyKeys(params, ["url"]) ||
        !isHttpsUrl(params.url)
      ) {
        throw new BridgeProtocolError(
          "navigation.openExternal requires one absolute HTTPS URL without credentials.",
        );
      }
      return;
    }
    case "files.save": {
      if (
        !isRecord(params) ||
        !hasOnlyKeys(params, ["url", "suggestedName", "mimeType"]) ||
        !isHttpsUrl(params.url) ||
        !isSafeSuggestedName(params.suggestedName) ||
        ("mimeType" in params &&
          (!isNonEmptyString(params.mimeType, 127) ||
            !mimeTypePattern.test(params.mimeType)))
      ) {
        throw new BridgeProtocolError(
          "files.save requires an HTTPS URL, a safe basename, and an optional MIME type.",
        );
      }
      return;
    }
  }
}

function isBooleanRecord(value: unknown, key: string): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [key]) &&
    typeof value[key] === "boolean"
  );
}

function assertBridgeResult<M extends BridgeMethod>(
  method: M,
  result: unknown,
): asserts result is BridgeResult<M> {
  let valid = false;

  switch (method) {
    case "platform.getInfo": {
      valid =
        isRecord(result) &&
        hasOnlyKeys(result, [
          "platform",
          "runtimeVersion",
          "appVersion",
          "enabledMethods",
        ]) &&
        ["android", "ios", "windows", "macos", "linux"].includes(
          typeof result.platform === "string" ? result.platform : "",
        ) &&
        isNonEmptyString(result.runtimeVersion, 128) &&
        isNonEmptyString(result.appVersion, 128) &&
        Array.isArray(result.enabledMethods) &&
        result.enabledMethods.every(isBridgeMethod) &&
        new Set(result.enabledMethods).size === result.enabledMethods.length;
      break;
    }
    case "share.open": {
      valid =
        isRecord(result) &&
        hasOnlyKeys(result, ["status"]) &&
        (result.status === "shared" || result.status === "cancelled");
      break;
    }
    case "push.getToken": {
      valid =
        isRecord(result) &&
        hasOnlyKeys(result, ["token"]) &&
        (result.token === null || isNonEmptyString(result.token, 16_384));
      break;
    }
    case "badge.set": {
      valid = isBooleanRecord(result, "applied");
      break;
    }
    case "navigation.openExternal": {
      valid = isBooleanRecord(result, "opened");
      break;
    }
    case "files.save": {
      valid =
        isRecord(result) &&
        hasOnlyKeys(result, ["status", "fileName"]) &&
        (result.status === "saved" || result.status === "cancelled") &&
        (!("fileName" in result) || isSafeSuggestedName(result.fileName));
      break;
    }
  }

  if (!valid) {
    throw new BridgeProtocolError(
      `Native reply for ${method} has an invalid result.`,
    );
  }
}

function assertJsonValue(
  value: unknown,
  seen: WeakSet<object>,
  depth: number,
): asserts value is JsonValue {
  if (depth > 32) {
    throw new BridgeProtocolError(
      "Bridge message exceeds the maximum nesting depth.",
    );
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return;
  }

  if (typeof value !== "object") {
    throw new BridgeProtocolError(
      "Bridge messages may contain JSON values only.",
    );
  }

  if (seen.has(value)) {
    throw new BridgeProtocolError(
      "Bridge messages may not contain circular values.",
    );
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      assertJsonValue(item, seen, depth + 1);
    }
    seen.delete(value);
    return;
  }

  if (!isRecord(value)) {
    throw new BridgeProtocolError(
      "Bridge messages may contain plain objects only.",
    );
  }

  for (const [key, item] of Object.entries(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      throw new BridgeProtocolError(
        "Bridge message contains a reserved object key.",
      );
    }
    assertJsonValue(item, seen, depth + 1);
  }
  seen.delete(value);
}

export function encodeBridgeMessage(message: unknown): string {
  assertJsonValue(message, new WeakSet<object>(), 0);

  const serialized = JSON.stringify(message);
  const byteLength = textEncoder.encode(serialized).byteLength;
  if (byteLength > MAX_BRIDGE_MESSAGE_BYTES) {
    throw new BridgeMessageTooLargeError(byteLength, MAX_BRIDGE_MESSAGE_BYTES);
  }

  return serialized;
}

export function decodeBridgeMessage(serialized: string): unknown {
  if (typeof serialized !== "string") {
    throw new BridgeProtocolError(
      "Native replies must be serialized JSON strings.",
    );
  }

  const byteLength = textEncoder.encode(serialized).byteLength;
  if (byteLength > MAX_BRIDGE_MESSAGE_BYTES) {
    throw new BridgeMessageTooLargeError(byteLength, MAX_BRIDGE_MESSAGE_BYTES);
  }

  try {
    const value: unknown = JSON.parse(serialized);
    assertJsonValue(value, new WeakSet<object>(), 0);
    return value;
  } catch (error) {
    if (error instanceof BridgeProtocolError) {
      throw error;
    }
    throw new BridgeProtocolError("Native reply is not valid JSON.", {
      cause: error,
    });
  }
}

export function getCandidateReplyId(value: unknown): string | undefined {
  return isRecord(value) && typeof value.id === "string" ? value.id : undefined;
}

export function parseBridgeReply(value: unknown): BridgeReply {
  if (
    !isRecord(value) ||
    !identifierPattern.test(typeof value.id === "string" ? value.id : "") ||
    !isBridgeMethod(value.method) ||
    typeof value.ok !== "boolean"
  ) {
    throw new BridgeProtocolError("Native reply envelope is invalid.");
  }

  if (value.ok) {
    if (
      !hasOnlyKeys(value, ["id", "method", "ok", "result"]) ||
      !("result" in value)
    ) {
      throw new BridgeProtocolError(
        "Native success reply envelope is invalid.",
      );
    }
    assertBridgeResult(value.method, value.result);
    return value as unknown as BridgeReply;
  }

  if (
    !hasOnlyKeys(value, ["id", "method", "ok", "error"]) ||
    !isRecord(value.error) ||
    !hasOnlyKeys(value.error, ["code", "message", "details"]) ||
    !isNonEmptyString(value.error.code, 128) ||
    !isNonEmptyString(value.error.message, 2048)
  ) {
    throw new BridgeProtocolError("Native failure reply envelope is invalid.");
  }

  return value as unknown as BridgeReply;
}

export function assertRequestIdentifier(id: string): void {
  if (!identifierPattern.test(id)) {
    throw new BridgeProtocolError(
      "Request IDs must contain 1-128 ASCII letters, numbers, dots, underscores, colons, or hyphens.",
    );
  }
}
