import { initialRules } from "./rules.js";
import type { PolicyPack } from "./types.js";

export const DEFAULT_POLICY_PACK: PolicyPack = Object.freeze({
  id: "webtoapp.store-readiness",
  version: "2026.09.0",
  effectiveFrom: "2026-08-31T00:00:00.000Z",
  rules: initialRules,
});
