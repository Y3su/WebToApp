# Contributing

Thank you for helping build WebToApp. Start with the product contract, threat
model, architecture document, and applicable decision records in `docs/`.

## Workflow

1. Create a focused branch using `codex/`, `feat/`, `fix/`, or `docs/`.
2. Add or update tests with behavior changes.
3. Run `pnpm check` and `cargo test --workspace` where applicable.
4. Verify staged changes with `git diff --cached --check`.
5. Open a pull request using a conventional-commit title.

Never commit credentials, signing keys, customer bundles, or generated release
artifacts. Treat URLs, archives, manifests, web content, and runner messages as
hostile. Use structured process arguments rather than shell interpolation.

Architectural changes require an ADR. User-visible changes require release
notes. Security-sensitive changes require tests demonstrating the failure mode.
