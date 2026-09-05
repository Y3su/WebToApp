# `wta` CLI and customer runner

`wta` is the command-line foundation for WebToApp. It creates and validates the
versioned `AppSpecV1` contract, performs offline policy analysis, emits an
initial deterministic Windows developer manifest, and verifies artifact digests.

This alpha is deliberately honest about its boundaries:

- `build --target windows-dev` creates an **unsigned JSON developer manifest**,
  not an executable or installer.
- `analyze` is offline. It checks HTTPS, exact-origin, reserved-address,
  ownership, native-value, and compliance invariants without fetching a website
  or resolving DNS.
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

`init` never overwrites an existing file unless `--force` is explicit.
Security-sensitive inputs and outputs reject symbolic links and parent-directory
traversal. AppSpec input is limited to 1 MiB, and artifact hashing is streamed
in fixed-size chunks.

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
