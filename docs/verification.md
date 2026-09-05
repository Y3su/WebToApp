# Local preview verification

Verified on Windows on 2026-09-06:

- Frozen pnpm installation, formatting, source lint and strict TypeScript
  checks.
- 76 JavaScript/TypeScript tests across schema, hashing, SDK, policy, API,
  PostgreSQL tenant isolation, analyzer and desktop capability configuration.
- 14 Rust CLI tests, including default relative output, generated contract
  decoding, hostile URL/path rejection, deterministic manifests and integrity
  checks.
- Two native desktop origin-policy tests, Rust formatting and Clippy with
  warnings denied.
- Rust/TypeScript example AppSpec SHA-256 agreement.
- Generated contract drift check and Node dependency license review.
- Production Next.js/workspace builds and unsigned Windows Tauri executable
  build.
- Browser interaction: the example AppSpec returns its digest and an ownership
  finding; submission does not persist data.

The bootstrap GitHub runs also passed Android unit tests, debug APK and release
AAB compilation; iOS simulator compilation; Rust tests/Clippy on Ubuntu, Windows
and macOS; CodeQL; secret scanning; and repository whitespace checks. The first
JavaScript CI run passed format, lint, type, unit, build and contract checks but
exposed a pnpm optional-package index failure in license reporting. The
follow-up replaces that reporting path and adds dependency auditing. See
[dependency findings](dependency-security.md) for the remaining Linux issue.

Emulator, real-device, installer lifecycle, signing/notarization, full WCAG
audit, live PostgreSQL/Graphile restart behavior, and customer pilot acceptance
are not covered by these local checks.
