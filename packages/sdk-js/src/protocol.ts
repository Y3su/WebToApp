export const WEB_TO_APP_PROTOCOL_VERSION = 1 as const;
export const MAX_BRIDGE_MESSAGE_BYTES = 256 * 1024;

export const BRIDGE_METHODS = [
  "platform.getInfo",
  "share.open",
  "push.getToken",
  "badge.set",
  "navigation.openExternal",
  "files.save",
] as const;

export type BridgeMethod = (typeof BRIDGE_METHODS)[number];
export type PlatformName = "android" | "ios" | "windows" | "macos" | "linux";

export type EmptyParams = Record<string, never>;

export interface PlatformInfo {
  platform: PlatformName;
  runtimeVersion: string;
  appVersion: string;
  enabledMethods: BridgeMethod[];
}

export interface ShareOpenParams {
  title?: string;
  text?: string;
  url?: string;
}

export interface PushToken {
  token: string | null;
}

export interface BadgeSetParams {
  count: number | null;
}

export interface NavigationOpenExternalParams {
  url: string;
}

export interface FilesSaveParams {
  url: string;
  suggestedName: string;
  mimeType?: string;
}

export interface BridgeMethodMap {
  "platform.getInfo": {
    params: EmptyParams;
    result: PlatformInfo;
  };
  "share.open": {
    params: ShareOpenParams;
    result: { status: "shared" | "cancelled" };
  };
  "push.getToken": {
    params: EmptyParams;
    result: PushToken;
  };
  "badge.set": {
    params: BadgeSetParams;
    result: { applied: boolean };
  };
  "navigation.openExternal": {
    params: NavigationOpenExternalParams;
    result: { opened: boolean };
  };
  "files.save": {
    params: FilesSaveParams;
    result: { status: "saved" | "cancelled"; fileName?: string };
  };
}

export type BridgeParams<M extends BridgeMethod> = BridgeMethodMap[M]["params"];
export type BridgeResult<M extends BridgeMethod> = BridgeMethodMap[M]["result"];

export interface BridgeRequest<M extends BridgeMethod = BridgeMethod> {
  id: string;
  method: M;
  params: BridgeParams<M>;
}

export interface BridgeErrorPayload {
  code: string;
  message: string;
  details?: JsonValue;
}

export interface BridgeSuccessReply<M extends BridgeMethod = BridgeMethod> {
  id: string;
  method: M;
  ok: true;
  result: BridgeResult<M>;
}

export interface BridgeFailureReply<M extends BridgeMethod = BridgeMethod> {
  id: string;
  method: M;
  ok: false;
  error: BridgeErrorPayload;
}

export type BridgeReply<M extends BridgeMethod = BridgeMethod> =
  BridgeSuccessReply<M> | BridgeFailureReply<M>;

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}
