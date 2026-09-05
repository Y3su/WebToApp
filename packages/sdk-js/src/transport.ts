import type { WEB_TO_APP_PROTOCOL_VERSION } from "./protocol.js";

export type BridgeMessageListener = (serializedReply: string) => void;

/**
 * A platform-owned channel that has already authenticated its frame and origin.
 * The SDK intentionally provides no browser-global or wildcard postMessage
 * transport. Implementations must deliver replies only from the bound native
 * channel and return an unsubscribe function for deterministic teardown.
 */
export interface WebToAppTransport {
  readonly protocolVersion: typeof WEB_TO_APP_PROTOCOL_VERSION;
  readonly channel: string;
  send(serializedRequest: string): void | Promise<void>;
  subscribe(listener: BridgeMessageListener): () => void;
}
