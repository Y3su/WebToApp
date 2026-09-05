# Agent instructions

These instructions apply to the entire repository.

## Product invariants

- Build only customer-owned or explicitly authorized web applications.
- Production navigation is HTTPS-only and exact-origin allowlisted.
- Native capabilities default to disabled and require explicit declarations.
- Customer signing keys never enter the SaaS control plane or build logs.
- AppSpec revisions and release artifacts are immutable.
- Never promise app-store acceptance.

## Engineering rules

- Prefer small vertical slices with tests over placeholder scaffolding.
- Use strict TypeScript and deny Rust warnings in CI.
- Validate untrusted data at every boundary.
- Never build a path from an unvalidated user-controlled identifier.
- Never interpolate user data into a shell command; pass argument arrays.
- Do not introduce Redis, Kubernetes, Temporal, Git-source builds, managed
  signing, or runtime-loaded native plugins in v1.
- Update architecture or threat-model documentation with boundary changes.
- Use `apply_patch` for manual source edits.

## Quality gate

Run relevant format, lint, type, unit, contract, and security tests. Review the
staged diff and run `git diff --cached --check` before committing.
