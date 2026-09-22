# Implementation status

This file distinguishes implemented behavior from the production roadmap.

## Current developer preview

- Apache-2.0 public monorepo, governance, dependency lockfiles, CI/security
  workflows.
- Next.js page with an interactive AppSpec validator; Hono health, metadata,
  schema, OpenAPI 3.1 and validation endpoints. Validation is stateless.
- AppSpec JSON Schema, strict validation, canonical hashing, deeply frozen
  snapshots and generated TypeScript/Rust/Kotlin/Swift models. Generated data
  models do not replace schema or semantic validation.
- Rust CLI: init (unverified draft), schema validation, offline policy analysis,
  environment checks, deterministic Windows developer manifest, standalone
  restricted Windows preview project export and SHA-256 checks. Project exports
  freeze a validated AppSpec and inventory generated file hashes.
- Cross-language fixture tests verify Rust and TypeScript digests agree.
- SDK request/reply validation, origin-scoped transport, timeout/cancellation,
  and hostile bridge fixtures.
- Library URL inspector with DNS/IP pinning and bounded redirects/responses; ZIP
  streaming inspection with path/type/size/count/ratio/CRC validation.
- PostgreSQL schema and migrations, forced tenant RLS, composite tenant foreign
  keys, immutable revision updates; PGlite executes isolation tests locally.
- Graphile lifecycle task definitions and lease expiry tests.
- Tauri desktop shell with exact-origin navigation, denied popups and no remote
  native commands. Windows WebView2 permission requests and downloads are
  denied; navigation waits for policy installation and uses an in-private
  session. An unsigned Windows developer executable can be built. Other desktop
  OS guards fail closed until their native policies are implemented.
- Kotlin Android and SwiftUI iOS shell sources, native permissions denied. Swift
  consumes generated models. Platform build jobs validate these on GitHub.

## Explicitly unavailable

Better Auth is a selected dependency, not a working authentication service.
Organizations/RBAC, ownership challenge verification, durable revision APIs,
runner enrollment/leases, build orchestration, artifact storage/downloads,
SSE/webhooks, releases, quotas, observability and signing integration remain M4
work. Runner commands return an explicit unsupported error and never claim a
connection. No unauthenticated URL-fetch endpoint is exposed.

The CLI manifest is not an installer. `wta build --target windows-project`
connects restricted AppSpecs to a standalone unsigned Windows x64 project; its
generated `pnpm desktop` command builds the executable locally. Export requires
explicit preview acknowledgement and rejects unsupported capabilities, OAuth,
native navigation, external links and non-internal releases. It does not verify
ownership, customize icons, run builds or produce installers.
`pnpm desktop:preview` still builds the repository's demonstration shell.
Android/iOS are restricted shell previews. Native features, mobile signing,
Linux/macOS installers, updates, notarization and store export remain
unfinished.

## Remaining acceptance gates

| Milestone | Remaining gate                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------ |
| M0        | Bootstrap complete; preview tag `v0.1.0-alpha.1`, PR #16 checks and repository protections verified    |
| M1        | Full supported/hostile analyzer matrix; static-bundle/native-feature generation and runtime acceptance |
| M2        | Android capabilities, signing, bundletool and emulator/device matrix                                   |
| M3        | Windows/Linux installers, native integrations and clean-VM lifecycle                                   |
| M4        | Authenticated control plane and customer runner end-to-end                                             |
| M5        | Signed policy packs, store wizard, three customer pilots and 30-day beta                               |
| M6        | Customer Mac runner, Apple integrations, signed archive/notarized DMG and device pilots                |
| M7        | Fuzzing, independent security review, recovery drills and operational acceptance                       |

No GA readiness or app-store acceptance is claimed. The local Windows host has
Rust/MSVC but only Java 8, no Android SDK/Gradle, and no Xcode or Docker;
Android and Apple compilation require CI or appropriately provisioned customer
hosts.
