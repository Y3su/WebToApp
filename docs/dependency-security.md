# Dependency security follow-up

Reviewed 2026-09-06 after the first public dependency scan.

- Updated the analyzer to yauzl 3.2.1, the patched release identified by GitHub
  for its off-by-one advisory. Archive regression tests remain mandatory.
- Overrode only `@esbuild-kit/core-utils>esbuild` to 0.25.12 to remove the
  legacy development-server vulnerability from Drizzle's loader. The Drizzle
  config check, schema tests and production build validate this compatibility
  override.
- `pnpm audit --audit-level moderate` reports no known vulnerabilities after
  these changes and now runs in CI. This is dependency-database evidence, not a
  proof of security.
- The license gate inspects installed package manifests, including installed
  optional native packages, rather than pnpm store indexes that can be absent on
  a fresh Linux runner. Unrecognized license expressions fail closed. Run on
  each release target; this does not replace distribution notices,
  target-specific SBOMs or Rust/native license review.
- The Next.js image stack includes sharp/libvips. Linux libvips packages declare
  LGPL-3.0-or-later separately from the Apache-2.0 wrapper; the gate records a
  package-scoped exception for `@img/sharp-libvips-*`. Preserve their upstream
  license, copyright and source/relinking materials when distributing binaries.
  The project's Apache-2.0 license does not relicense third-party components.

## Open Linux dependency finding

Tauri 2.11.5's Linux GTK3 dependency graph resolves glib 0.18.5, affected by
[RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html). The
fixed glib series starts at 0.20 and cannot replace 0.18 through a compatible
lockfile-only update. No unreviewed fork or incompatible override is applied.
The GitHub alert remains open, and desktop Cargo dependencies now have their own
Dependabot update configuration.

The Windows preview does not compile glib. Linux binary releases remain blocked
on a compatible upstream fix or a reviewed, tested backport and a Linux native
security assessment. The absence of direct application calls to the affected
iterator is not treated as proof of non-reachability.
