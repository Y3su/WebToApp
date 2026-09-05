# `@webtoapp/policy-engine`

Deterministic policy evaluation for compatibility and store readiness. Rules and
packs are versioned and effective-dated so a build records exactly which policy
was applied.

```ts
import { parseAppSpec } from "@webtoapp/app-spec";
import { evaluatePolicy } from "@webtoapp/policy-engine";

const result = evaluatePolicy(parseAppSpec(input), {
  releaseIntent: "store",
  verifiedDomains: liveVerifiedDomains,
});
```

The result is one of `ready`, `changes_required`, or `unsupported` and includes
actionable findings. The first policy pack checks HTTPS, live ownership, exact
allowed origins, native value, compliance URLs, and Android target API 36.
Callers must validate untrusted input with `@webtoapp/app-spec` before
evaluation.
