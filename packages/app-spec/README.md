# `@webtoapp/app-spec`

The canonical build contract for WebToApp. The package exports the Draft 2020-12
JSON Schema, TypeScript types, fail-closed runtime validation, deterministic
JSON canonicalization, and SHA-256 revision digests.

```ts
import { digestAppSpec, parseAppSpec } from "@webtoapp/app-spec";

const spec = parseAppSpec(JSON.parse(source));
console.log(digestAppSpec(spec));
```

The JSON Schema is also exported as
`@webtoapp/app-spec/schema/app-spec-v1.json`. Unknown fields are rejected.
Signing credentials are intentionally represented only by opaque references and
must never be put into an AppSpec.
