# WebToApp

WebToApp is an open-source platform for turning eligible web applications that
you own or are authorized to operate into secure, configurable applications for
Android, iOS, Windows, macOS, and Linux.

The project is intentionally more than a URL wrapper. It provides a versioned
application specification, compatibility and store-readiness checks,
customer-controlled build and signing runners, native experience modules,
auditable artifacts, and release tooling.

> [!IMPORTANT] WebToApp does not promise that every website can or should be
> distributed as an app. Release builds require ownership verification, and
> app-store approval remains the publisher's responsibility.

## Project status

WebToApp is a developer preview. APIs and generated runtimes are not yet stable.
The first production milestone targets Android, Windows, and Linux; iOS and
macOS follow after the customer-controlled Apple build pipeline is validated.

The current preview includes an interactive AppSpec validator, a Rust CLI,
security inspection libraries, an SDK, database isolation tests, and restricted
native shells. See [implementation status](docs/implementation-status.md) for
the exact working features and remaining milestone gates.

## Repository map

| Path                     | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `apps/control-plane`     | Dashboard and versioned HTTP API                      |
| `apps/jobs`              | Durable background analysis and lifecycle jobs        |
| `packages/app-spec`      | Canonical `AppSpecV1` schema and validation           |
| `packages/sdk-js`        | Origin-scoped web-to-native SDK                       |
| `packages/policy-engine` | Versioned compatibility and store-readiness rules     |
| `crates/wta`             | Rust CLI and customer-controlled runner               |
| `runtimes/android`       | Kotlin Android runtime                                |
| `runtimes/ios`           | Swift iOS runtime                                     |
| `runtimes/desktop`       | Tauri desktop runtime                                 |
| `fixtures`               | Compatibility and security test applications          |
| `docs`                   | Product, architecture, security, and decision records |

## Principles

- Customer-owned content, signing identities, and store accounts.
- Exact HTTPS origin allowlists and least-privilege native capabilities.
- Immutable build specifications and content-addressed artifacts.
- Signing keys remain on customer-controlled machines.
- Honest readiness results: ready, changes required, or unsupported.
- No customer build scripts, Git-source builds, managed signing, or runtime
  plugin execution in v1.

## Local development

Prerequisites:

- Node.js 22.15.1
- pnpm 11.19.0 through Corepack
- Rust 1.89.0
- PostgreSQL 17 for control-plane integration work

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm check
cargo test --workspace
pnpm test:contract
pnpm --filter @webtoapp/control-plane dev
```

Use `docker compose up -d postgres minio` when a feature needs the local data
services. See [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/architecture.md](docs/architecture.md) before making structural changes.

Open [localhost:3000](http://localhost:3000) for the stateless specification
validator. No database or account setup is needed for this preview. Run
`pnpm desktop:preview` to compile the unsigned Windows developer executable on a
Windows host with MSVC and WebView2. Run `pnpm generate` after schema changes.

## Security

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md)
for private reporting. Never commit signing material, customer bundles,
credentials, or generated release artifacts.

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE), [NOTICE](NOTICE),
and [TRADEMARKS.md](TRADEMARKS.md).
