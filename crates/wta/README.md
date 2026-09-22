# `wta` CLI and customer runner

`wta` is the command-line foundation for WebToApp. It creates and validates the
versioned `AppSpecV1` contract, performs offline policy analysis, exports a
deterministic Windows preview project or developer manifest, and verifies
artifact digests.

This alpha is deliberately honest about its boundaries:

- `build --target windows-dev` creates an **unsigned JSON developer manifest**,
  not an executable or installer.
- `build --target windows-project --acknowledge-preview` exports a standalone
  restricted Tauri project with a frozen AppSpec. The CLI never runs dependency
  installation, build commands or signing. The generated project can be compiled
  on a Windows development machine into an unsigned executable, not an
  installer.
- `analyze` is offline. It checks HTTPS, exact-origin, reserved-address,
  ownership, native-value, and compliance invariants without fetching a website
  or resolving DNS. Ownership fields in a file are untrusted claims. The report
  always requires independent ownership/source evidence and cannot approve a
  release, even when the document is structurally valid.
- `runner enroll` and `runner start` validate safe inputs and then fail with an
  explicit unsupported-operation error. They make no network request and write
  no credentials or state until authenticated enrollment, mTLS identity, signed
  jobs, and lease semantics are implemented.
- App Store, Play Store, signing, and notarization acceptance are not
  guaranteed.

## Build and test

The crate has its own manifest and can be checked directly:

```console
cargo test --manifest-path crates/wta/Cargo.toml
cargo clippy --manifest-path crates/wta/Cargo.toml --all-targets -- -D warnings
cargo fmt --manifest-path crates/wta/Cargo.toml -- --check
```

## Quick start

```console
cargo run --manifest-path crates/wta/Cargo.toml -- init \
  --name "Example Portal" \
  --url "https://example.com"

cargo run --manifest-path crates/wta/Cargo.toml -- validate webtoapp.json
cargo run --manifest-path crates/wta/Cargo.toml -- analyze webtoapp.json --json
cargo run --manifest-path crates/wta/Cargo.toml -- build webtoapp.json \
  --target windows-dev \
  --output-dir dist
cargo run --manifest-path crates/wta/Cargo.toml -- artifact verify \
  dist/webtoapp.windows-dev.manifest.json
cargo run --manifest-path crates/wta/Cargo.toml -- doctor
```

`init` never overwrites an existing file unless `--force` is explicit. Its
unverified draft intentionally fails full validation until ownership records are
supplied by the future verification flow. Use the committed example fixtures
only for local development tests; do not fabricate verification records for a
customer release. Security-sensitive inputs and outputs reject symbolic links
and parent-directory traversal. AppSpec input is limited to 1 MiB, and artifact
hashing is streamed in fixed-size chunks.

## Standalone Windows preview

From the repository root, export the development fixture into a new directory:

```powershell
cargo run --locked -p wta -- build packages/app-spec/examples/windows-preview.json --target windows-project --acknowledge-preview --output-dir temp/windows-preview
cd temp/windows-preview
pnpm install --frozen-lockfile
pnpm typecheck
pnpm desktop
```

Requires the pinned Node, pnpm and Rust toolchains, MSVC and WebView2. The
output is
`src-tauri/target/x86_64-pc-windows-msvc/debug/webtoapp-desktop-runtime.exe`,
with its AppSpec resource beside it. Keep the resource directory together with
the executable.

This preview supports only HTTPS URL sources, Windows x64, the internal release
channel, manual updates, blocked external links, no OAuth origins, no native
navigation and no enabled capabilities. Other specifications fail before any
output is written. Branding uses the generic preview icon; custom icon fetching
and the requested installer formats are not implemented. Ownership claims in a
local file do not authorize a release.

The Windows shell denies WebView2 permission requests and downloads before
remote navigation, and uses an in-private session without persistent cookies.
File-input dialogs, subresources and full runtime permission behavior still need
production policy and device testing; there is no general native API bridge.

The output directory must not already exist, even when empty; `--force` is
rejected. Export into a private local directory. A failed write can leave a
partial new project; retry with another directory. Templates are compiled into
the CLI, destination filenames and commands are fixed, and app metadata is JSON
data. `wta.project.json` inventories file hashes and the canonical AppSpec
digest; it is not signed provenance. Files are deterministic for the same spec
and CLI build, but reproducible native binaries are not claimed. Third-party
notices and license obligations must be reviewed before distributing any
binaries.

## Exit codes

| Code | Meaning                               |
| ---: | ------------------------------------- |
|  `0` | Success                               |
|  `2` | Invalid command arguments             |
|  `3` | Invalid AppSpec or validation failure |
|  `4` | Read/write failure                    |
|  `5` | Artifact integrity failure            |
|  `6` | Feature intentionally unavailable     |
|  `7` | Unsafe path rejected                  |

## Security contract

- Production web URLs and origins must use HTTPS and cannot contain credentials.
- Loopback, private, link-local, multicast, reserved IP addresses, and
  local/internal hostname conventions are rejected before future network
  activity.
- The future network analyzer must additionally pin public DNS answers and
  re-check every redirect and subresource; this CLI does not pretend offline
  checks replace that.
- Native capabilities default to disabled and build output records every enabled
  capability plus the exact allowed and OAuth origins.
- Remote website content never receives a generic Tauri API.
