import { createHash } from "node:crypto";

import type { AppSpecV1 } from "./types.js";
import { parseAppSpec } from "./validation.js";

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function assertValidUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!Number.isFinite(next) || next < 0xdc00 || next > 0xdfff) {
        throw new TypeError(
          "Canonical JSON cannot contain an unpaired UTF-16 surrogate",
        );
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError(
        "Canonical JSON cannot contain an unpaired UTF-16 surrogate",
      );
    }
  }
}

function serialize(value: JsonValue, ancestors: Set<object>): string {
  if (
    value === undefined ||
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    throw new TypeError("Canonical JSON received a non-JSON value");
  }
  if (value === null || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON only supports finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertValidUnicode(value);
    return JSON.stringify(value);
  }

  if (ancestors.has(value)) {
    throw new TypeError("Canonical JSON cannot contain cyclic values");
  }
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => serialize(item, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Canonical JSON only supports plain objects");
    }

    const entries = Object.keys(value)
      .sort()
      .map((key) => {
        assertValidUnicode(key);
        return `${JSON.stringify(key)}:${serialize(value[key] as JsonValue, ancestors)}`;
      });
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Produces deterministic JSON using the RFC 8785/JCS property ordering and JSON
 * primitive representation. Non-JSON values, cycles, and invalid Unicode fail closed.
 */
export function canonicalizeJson(value: unknown): string {
  if (
    value === undefined ||
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    throw new TypeError("Canonical JSON received a non-JSON value");
  }
  return serialize(value as JsonValue, new Set());
}

export function canonicalizeAppSpec(input: unknown): string {
  return canonicalizeJson(parseAppSpec(input));
}

export function digestAppSpec(input: unknown): string {
  return createHash("sha256")
    .update(canonicalizeAppSpec(input), "utf8")
    .digest("hex");
}

export interface FrozenAppSpecRevision {
  readonly spec: AppSpecV1;
  readonly canonicalJson: string;
  readonly sha256: string;
}

export function freezeAppSpecRevision(input: unknown): FrozenAppSpecRevision {
  const spec = parseAppSpec(input);
  const canonicalJson = canonicalizeJson(spec);
  const sha256 = createHash("sha256")
    .update(canonicalJson, "utf8")
    .digest("hex");
  const snapshot = structuredClone(spec);
  const freeze = (value: object): void => {
    for (const nested of Object.values(value)) {
      if (nested !== null && typeof nested === "object")
        freeze(nested as object);
    }
    Object.freeze(value);
  };
  freeze(snapshot);
  return Object.freeze({ spec: snapshot, canonicalJson, sha256 });
}
