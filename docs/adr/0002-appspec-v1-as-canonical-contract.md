# ADR 0002: Make AppSpecV1 the Canonical Build Contract

- Status: Accepted
- Date: 2026-09-05

## Context

Five builders, a dashboard, a CLI, a runner, compatibility analysis, and release
tooling need one unambiguous description of an application. Independent platform
configuration would drift, make builds difficult to reproduce, and obscure when
a website has acquired new permissions or origins.

## Decision

- Define `AppSpecV1` in a versioned JSON Schema.
- Generate TypeScript, Kotlin, Swift, and Rust models and verify them with
  shared fixtures.
- Cover identity, source, ownership, branding, navigation, capabilities,
  targets, compliance, and release policy in the schema.
- Canonicalize a validated spec before hashing it with SHA-256.
- Allow mutable project drafts, but freeze an immutable revision for each build.
- Put only secret references in a spec; never include secret values.
- Require a binary rebuild when origins, permissions, capabilities, or native
  behavior change.
- Make package identifiers and signing lineage immutable after the first signed
  release.
- Include the spec digest in the signed runner job and artifact provenance.

Schema evolution uses explicit versions. Additive behavior that preserves v1
meaning may remain in the v1 schema; incompatible semantics require `AppSpecV2`
and a documented migration. Builders must reject unknown major versions rather
than guess.

## Consequences

Positive:

- All platforms compile from the same reviewed intent.
- Builds and release evidence are reproducible and auditable.
- Permission and origin changes are visible rather than implicit.
- Cross-language conformance can be tested before platform builds.

Costs:

- Schema changes require code generation and compatibility discipline.
- Platform-only concepts still need explicit target sections.
- Canonicalization rules become a security-sensitive public interface.

## Alternatives considered

- **Separate platform manifests:** rejected because they encourage drift and
  make a release's effective permissions difficult to audit.
- **Database rows as the only contract:** rejected because database state is
  mutable and is not portable to local builds.
- **Unversioned YAML:** rejected because parser differences and implicit scalar
  behavior weaken canonical hashing and cross-language conformance.
