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

GitHub-hosted Android/iOS builds and security workflows must be observed after
the first push. Emulator, real-device, installer lifecycle,
signing/notarization, full WCAG audit, live PostgreSQL/Graphile restart
behavior, and customer pilot acceptance are not covered by these local checks.
