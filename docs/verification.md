# Local preview verification

Verified on Windows on 2026-09-06, with the build, analyzer, CLI and contract
checks repeated 2026-09-23:

- Frozen pnpm installation, formatting, source lint and strict TypeScript
  checks.
- 88 JavaScript/TypeScript tests across schema, hashing, SDK, policy, API,
  PostgreSQL tenant isolation, analyzer and desktop capability configuration.
- 19 Rust CLI tests on Windows, including default relative output, generated
  contract decoding, hostile URL/path rejection, deterministic manifests and
  integrity checks and rejection of self-asserted offline release evidence.
  Export tests cover deterministic snapshots, per-file hashes, refused
  overwrites, unsupported features and hostile display names. Unix CI also
  exercises symlink ancestors and dangling links (20 CLI tests).
- Two native desktop origin-policy tests, Rust formatting and Clippy with
  warnings denied.
- Rust/TypeScript example AppSpec SHA-256 agreement.
- Generated contract drift check and Node dependency license review.
- Production Next.js/workspace builds and unsigned Windows Tauri executable
  build.
- CLI-exported standalone Windows project: frozen pnpm installation, TypeScript,
  dependency audit and license check, Vite build and Windows x64 Rust
  compilation using the committed Cargo lockfile. The copied AppSpec resource
  digest matches the exported manifest; the executable is unsigned. This is
  compilation and resource verification, not launch or installer acceptance.
- A source guard checks blank-first desktop initialization, permission-gated
  navigation, in-private mode and download/permission denial. It does not test
  real WebView2 permission events; native adversarial tests remain required.
- Browser interaction: the example AppSpec returns its digest and an ownership
  finding; submission does not persist data.

The bootstrap GitHub runs also passed Android unit tests, debug APK and release
AAB compilation; iOS simulator compilation; Rust tests/Clippy on Ubuntu, Windows
and macOS; CodeQL; secret scanning; and repository whitespace checks. The first
JavaScript CI run passed format, lint, type, unit, build and contract checks but
exposed a pnpm optional-package index failure in license reporting. The
follow-up PR #7 replaced that reporting path and added dependency auditing; all
its checks, including the three native shell jobs, passed before merge. PR #16
also passed every check, including the Android SDK setup correction, and its
merge is tagged `v0.1.0-alpha.1`. The Windows CI job now exports and compiles a
standalone preview, not just the repository's demonstration shell. Analyzer test
discovery is restricted to source files so compiled copies in `dist` cannot
inflate test counts or run stale code. See
[dependency findings](dependency-security.md) for the remaining Linux issue.

Emulator, real-device, installer lifecycle, signing/notarization, full WCAG
audit, live PostgreSQL/Graphile restart behavior, and customer pilot acceptance
are not covered by these local checks.
